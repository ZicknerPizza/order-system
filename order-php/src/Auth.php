<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Domain\Role;
use OrderSystem\Http\HttpException;

/**
 * Stateless HTTP Basic authentication like the Spring Security configuration of the Java version:
 * wrong credentials are rejected on every endpoint, missing credentials only on protected endpoints.
 * The role comes from SystemUser.degree, users without a role can't log in.
 */
final class Auth
{
    /**
     * @param int|null $userId logged in user, null for anonymous requests
     */
    private function __construct(
        private readonly ?int $userId,
        private readonly ?string $username,
        private readonly ?Role $role,
    ) {
    }

    public static function fromHeader(Database $db, ?string $authorization): self
    {
        if ($authorization === null || stripos($authorization, 'basic ') !== 0) {
            return new self(null, null, null);
        }

        $credentials = base64_decode(trim(substr($authorization, 6)), true);
        if ($credentials === false || !str_contains($credentials, ':')) {
            throw new HttpException(401, 'Bad credentials');
        }
        [$username, $password] = explode(':', $credentials, 2);

        $user = $db->one('SELECT id, password, degree FROM SystemUser WHERE name = ?', [$username]);
        // Spring's BCryptPasswordEncoder writes $2a$ hashes, which password_verify understands
        if ($user === null || !password_verify($password, (string) $user['password'])) {
            throw new HttpException(401, 'Bad credentials');
        }
        $role = Role::fromDegree((int) $user['degree']);
        if ($role === null) {
            throw new HttpException(401, 'User is deactivated');
        }
        return new self((int) $user['id'], $username, $role);
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
}
