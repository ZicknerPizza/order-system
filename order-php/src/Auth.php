<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Domain\Role;
use OrderSystem\Http\HttpException;

/**
 * Session of the logged in user, sent as "Authorization: Bearer <token>". Only the SHA-256 hash of
 * the token is stored. An unknown or expired token gives 401 on every endpoint, so the frontend
 * logs out. The role comes from SystemUser.degree, users without a role can't log in.
 */
final class Auth
{
    /** Sessions end after 30 days without use */
    public const SESSION_IDLE_SECONDS = 30 * 86400;

    private function __construct(
        private readonly ?int $userId,
        private readonly ?string $username,
        private readonly ?Role $role,
        private readonly ?string $sessionHash,
    ) {
    }

    public static function fromHeader(Database $db, ?string $authorization, int $now): self
    {
        if ($authorization === null || stripos($authorization, 'bearer ') !== 0) {
            return new self(null, null, null, null);
        }

        $hash = self::hashToken(trim(substr($authorization, 7)));
        $session = $db->one(
            'SELECT s.lastUsed, u.id, u.name, u.degree
             FROM UserSession s JOIN SystemUser u ON u.id = s.userId
             WHERE s.tokenHash = ?',
            [$hash]
        );
        $role = $session === null ? null : Role::fromDegree((int) $session['degree']);
        if ($session === null || $role === null || (int) $session['lastUsed'] < $now - self::SESSION_IDLE_SECONDS) {
            throw new HttpException(401, 'Session expired');
        }
        // Writing once a minute is enough to keep the session alive
        if ((int) $session['lastUsed'] < $now - 60) {
            $db->execute('UPDATE UserSession SET lastUsed = ? WHERE tokenHash = ?', [$now, $hash]);
        }
        return new self((int) $session['id'], $session['name'], $role, $hash);
    }

    /**
     * @return string the token for the client, only its hash is stored
     */
    public static function createSession(Database $db, int $userId, int $now): string
    {
        $token = bin2hex(random_bytes(32));
        $db->execute(
            'INSERT INTO UserSession (tokenHash, userId, created, lastUsed) VALUES (?, ?, ?, ?)',
            [self::hashToken($token), $userId, $now, $now]
        );
        return $token;
    }

    public function isLoggedIn(): bool
    {
        return $this->role !== null;
    }

    public function userId(): int
    {
        $this->requireRole(Role::SERVICE);
        return $this->userId;
    }

    public function username(): string
    {
        $this->requireRole(Role::SERVICE);
        return $this->username;
    }

    public function role(): Role
    {
        $this->requireRole(Role::SERVICE);
        return $this->role;
    }

    public function sessionHash(): ?string
    {
        return $this->sessionHash;
    }

    public function hasRole(Role $role): bool
    {
        return $this->role !== null && $this->role->includes($role);
    }

    /**
     * Anonymous users get 401, logged in users without the role 403, like Spring Security.
     */
    public function requireRole(Role $role): void
    {
        if ($this->role === null) {
            throw new HttpException(401, 'Full authentication is required to access this resource');
        }
        if (!$this->role->includes($role)) {
            throw new HttpException(403, 'Access is denied');
        }
    }

    public function deny(): never
    {
        throw new HttpException($this->isLoggedIn() ? 403 : 401, 'Access is denied');
    }

    private static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
