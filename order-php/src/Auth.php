<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Http\HttpException;

/**
 * Stateless HTTP Basic authentication like the Spring Security configuration of the Java version:
 * wrong credentials are rejected on every endpoint, missing credentials only on admin endpoints.
 */
final class Auth
{
    private function __construct(private readonly bool $admin)
    {
    }

    public static function fromHeader(Database $db, ?string $authorization): self
    {
        if ($authorization === null || stripos($authorization, 'basic ') !== 0) {
            return new self(false);
        }

        $credentials = base64_decode(trim(substr($authorization, 6)), true);
        if ($credentials === false || !str_contains($credentials, ':')) {
            throw new HttpException(401, 'Bad credentials');
        }
        [$username, $password] = explode(':', $credentials, 2);

        $user = $db->one('SELECT password FROM SystemUser WHERE name = ?', [$username]);
        // Spring's BCryptPasswordEncoder writes $2a$ hashes, which password_verify understands
        if ($user === null || !password_verify($password, (string) $user['password'])) {
            throw new HttpException(401, 'Bad credentials');
        }
        return new self(true);
    }

    public function isAdmin(): bool
    {
        return $this->admin;
    }

    public function requireAdmin(): void
    {
        if (!$this->admin) {
            throw new HttpException(401, 'Full authentication is required to access this resource');
        }
    }

    public function deny(): never
    {
        // Anonymous users get 401, authenticated users 403, like Spring Security
        throw new HttpException($this->admin ? 403 : 401, 'Access is denied');
    }
}
