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

final class UserController
{
    public const MINIMUM_PASSWORD_LENGTH = 8;
    /** bcrypt only uses the first 72 bytes */
    private const MAXIMUM_PASSWORD_BYTES = 72;
    /** Any degree below the roles, see Role::fromDegree() */
    private const DEACTIVATED = 0;

    public function __construct(private readonly Database $db, private readonly Auth $auth)
    {
    }

    /**
     * The frontend shows what the role allows.
     */
    public function getCurrentUser(Request $request): Response
    {
        return Response::json([
            'name' => $this->auth->username(),
            'role' => $this->auth->role()->name,
            'totp' => $this->hasTotp($this->auth->userId()),
        ]);
    }

    /**
     * The old password is checked again, so an unattended logged in browser can't change it.
     * Other sessions of the user end, this one stays.
     */
    public function changePassword(Request $request): Response
    {
        $userId = $this->auth->userId();
        $body = Json::object($request->json());
        $oldPassword = Json::string($body['oldPassword'] ?? null) ?? '';

        $user = $this->db->one('SELECT password FROM SystemUser WHERE id = ?', [$userId]);
        if ($user === null || !password_verify($oldPassword, (string) $user['password'])) {
            throw new HttpException(400, 'Das bisherige Passwort ist falsch.');
        }
        $newPassword = self::newPassword($body['newPassword'] ?? null);

        $this->db->transactional(function () use ($userId, $newPassword): void {
            $this->db->execute(
                'UPDATE SystemUser SET password = ? WHERE id = ?',
                [password_hash($newPassword, PASSWORD_BCRYPT), $userId]
            );
            $this->db->execute(
                'DELETE FROM UserSession WHERE userId = ? AND tokenHash <> ?',
                [$userId, $this->auth->sessionHash()]
            );
        });
        return Response::ok();
    }

    public function findAll(Request $request): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $users = $this->db->all(
            'SELECT u.id, u.name, u.degree, t.userId AS totp
             FROM SystemUser u LEFT JOIN UserTotp t ON t.userId = u.id AND t.confirmed = 1
             ORDER BY u.name'
        );
        return Response::json(array_map(static fn(array $user): array => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            // Deactivated users of the old systems have no role
            'role' => Role::fromDegree((int) $user['degree'])?->name,
            'totp' => $user['totp'] !== null,
        ], $users));
    }

    public function create(Request $request): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $body = Json::object($request->json());
        $name = trim(Json::text($body['name'] ?? null, 'Der Benutzername', 255) ?? '');
        $role = self::role($body['role'] ?? null);
        $password = self::newPassword($body['password'] ?? null);
        if ($name === '') {
            throw new HttpException(400, 'Bitte gib einen Benutzernamen ein.');
        }

        $this->db->transactional(function () use ($name, $role, $password): void {
            if ($this->db->one('SELECT id FROM SystemUser WHERE name = ?', [$name]) !== null) {
                throw new HttpException(400, 'Diesen Benutzernamen gibt es schon.');
            }
            // The id has no auto increment in every database, so it is assigned here
            $id = (int) $this->db->one('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM SystemUser')['id'];
            $this->db->execute(
                'INSERT INTO SystemUser (id, name, password, degree) VALUES (?, ?, ?, ?)',
                [$id, $name, password_hash($password, PASSWORD_BCRYPT), $role->value]
            );
        });
        return Response::noContent();
    }

    /**
     * Ends all sessions of the user, e.g. when the password got known.
     */
    public function setPassword(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $password = self::newPassword(Json::object($request->json())['password'] ?? null);
        $id = $this->getUserId($userId);
        $this->db->transactional(function () use ($id, $password): void {
            $this->db->execute(
                'UPDATE SystemUser SET password = ? WHERE id = ?',
                [password_hash($password, PASSWORD_BCRYPT), $id]
            );
            $this->db->execute('DELETE FROM UserSession WHERE userId = ?', [$id]);
        });
        return Response::ok();
    }

    /**
     * Without a role (null) the user is deactivated and logged out. Admins can't change their own role,
     * so there is always one left.
     */
    public function setRole(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $body = Json::object($request->json());
        $role = ($body['role'] ?? null) === null ? null : self::role($body['role']);
        $id = $this->getUserId($userId);
        if ($id === $this->auth->userId()) {
            throw new HttpException(400, 'Du kannst deine eigene Rolle nicht ändern.');
        }
        $this->db->transactional(function () use ($id, $role): void {
            $this->db->execute('UPDATE SystemUser SET degree = ? WHERE id = ?', [$role?->value ?? self::DEACTIVATED, $id]);
            if ($role === null) {
                $this->db->execute('DELETE FROM UserSession WHERE userId = ?', [$id]);
            }
        });
        return Response::ok();
    }

    /**
     * For a lost phone: the user logs in with the password only and can set up TOTP again.
     */
    public function resetTotp(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $this->db->execute('DELETE FROM UserTotp WHERE userId = ?', [$this->getUserId($userId)]);
        return Response::ok();
    }

    /**
     * Admins can't delete themselves, so there is always one left.
     */
    public function delete(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $id = $this->getUserId($userId);
        if ($id === $this->auth->userId()) {
            throw new HttpException(400, 'Du kannst dich nicht selbst löschen.');
        }
        $this->db->transactional(function () use ($id): void {
            $this->db->execute('DELETE FROM UserSession WHERE userId = ?', [$id]);
            $this->db->execute('DELETE FROM UserTotp WHERE userId = ?', [$id]);
            $this->db->execute('DELETE FROM SystemUser WHERE id = ?', [$id]);
        });
        return Response::ok();
    }

    private function hasTotp(int $userId): bool
    {
        return $this->db->one('SELECT userId FROM UserTotp WHERE userId = ? AND confirmed = 1', [$userId]) !== null;
    }

    private function getUserId(string $userId): int
    {
        if (!ctype_digit($userId) || $this->db->one('SELECT id FROM SystemUser WHERE id = ?', [(int) $userId]) === null) {
            throw new HttpException(404, 'User not found');
        }
        return (int) $userId;
    }

    private static function role(mixed $role): Role
    {
        foreach (Role::cases() as $case) {
            if ($case->name === $role) {
                return $case;
            }
        }
        throw new HttpException(400, 'Unknown role');
    }

    private static function newPassword(mixed $password): string
    {
        $password = Json::string($password) ?? '';
        if (mb_strlen($password) < self::MINIMUM_PASSWORD_LENGTH) {
            throw new HttpException(400, 'Das neue Passwort muss mindestens ' . self::MINIMUM_PASSWORD_LENGTH . ' Zeichen lang sein.');
        }
        if (strlen($password) > self::MAXIMUM_PASSWORD_BYTES) {
            throw new HttpException(400, 'Das neue Passwort darf höchstens ' . self::MAXIMUM_PASSWORD_BYTES . ' Zeichen lang sein.');
        }
        return $password;
    }
}
