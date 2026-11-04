<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Domain\Role;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Json;
use OrderSystem\RateLimiter;
use OrderSystem\Totp;

/**
 * Login with password and, when the user set it up, a TOTP code. Failed attempts are limited per
 * user name and per address against guessing passwords.
 */
final class SessionController
{
    private const LOCK_SECONDS = 900;
    private const MAX_FAILURES_PER_USER = 5;
    /** Higher, everybody at a party shares the address of the WLAN */
    private const MAX_FAILURES_PER_ADDRESS = 20;
    /** bcrypt hash of a random password nobody knows */
    private const DUMMY_HASH = '$2y$12$kU2p3opM4XCodQKZmKpALeasvaRlnXa/nYtLQBerzOH1K.rqAVloa';

    public function __construct(
        private readonly Database $db,
        private readonly Auth $auth,
        private readonly \Closure $now,
        private readonly RateLimiter $rateLimiter,
    ) {
    }

    public function login(Request $request): Response
    {
        $body = Json::object($request->json());
        $name = Json::string($body['name'] ?? null) ?? '';
        $password = Json::string($body['password'] ?? null) ?? '';
        $code = Json::string($body['code'] ?? null);

        $userBucket = 'login-user:' . mb_strtolower($name);
        $addressBucket = 'login-address:' . $request->ip;
        if ($this->rateLimiter->exceeded($userBucket, self::MAX_FAILURES_PER_USER, self::LOCK_SECONDS)
            || $this->rateLimiter->exceeded($addressBucket, self::MAX_FAILURES_PER_ADDRESS, self::LOCK_SECONDS)) {
            throw new HttpException(429, 'Zu viele Fehlversuche, bitte versuche es in 15 Minuten noch einmal.');
        }
        $fail = function (string $message, array $data = []) use ($userBucket, $addressBucket): never {
            $this->rateLimiter->hit($userBucket);
            $this->rateLimiter->hit($addressBucket);
            throw new HttpException(401, $message, $data);
        };

        $user = $this->db->one('SELECT id, name, password, degree FROM SystemUser WHERE name = ?', [$name]);
        $role = $user === null ? null : Role::fromDegree((int) $user['degree']);
        // Unknown names take as long as wrong passwords, so the answer time doesn't reveal users
        $passwordMatches = password_verify($password, $user === null ? self::DUMMY_HASH : (string) $user['password']);
        if ($user === null || $role === null || !$passwordMatches) {
            $fail('Benutzername oder Passwort falsch.');
        }

        $totp = $this->db->one('SELECT secret, lastStep FROM UserTotp WHERE userId = ? AND confirmed = 1', [(int) $user['id']]);
        $totpEnabled = $totp !== null;
        if ($totpEnabled) {
            if ($code === null || $code === '') {
                // Not a failure, the frontend asks for the code after the password
                throw new HttpException(401, 'Bitte gib den Code aus deiner Authenticator-App ein.', ['totpRequired' => true]);
            }
            $step = Totp::verify($totp['secret'], $code, ($this->now)(), (int) $totp['lastStep']);
            if ($step === null) {
                $fail('Der Code ist falsch.', ['totpRequired' => true]);
            }
            $this->db->execute('UPDATE UserTotp SET lastStep = ? WHERE userId = ?', [$step, (int) $user['id']]);
        }

        $this->rateLimiter->clear($userBucket);
        return Response::json([
            'token' => Auth::createSession($this->db, (int) $user['id'], ($this->now)()),
            'name' => $user['name'],
            'role' => $role->name,
            'totp' => $totpEnabled,
        ]);
    }

    public function logout(Request $request): Response
    {
        if ($this->auth->sessionHash() !== null) {
            $this->db->execute('DELETE FROM UserSession WHERE tokenHash = ?', [$this->auth->sessionHash()]);
        }
        return Response::ok();
    }
}
