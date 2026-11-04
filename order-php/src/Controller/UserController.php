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

    public function __construct(private readonly Database $db, private readonly Auth $auth)
    {
    }

    /**
     * The login form calls this endpoint to verify the credentials, the frontend shows what the role allows.
     */
    public function getCurrentUser(Request $request): Response
    {
        return Response::json(['name' => $this->auth->username(), 'role' => $this->auth->role()->name]);
    }

    public function findAll(Request $request): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $users = $this->db->all('SELECT id, name, degree FROM SystemUser ORDER BY name');
        return Response::json(array_map(static fn(array $user): array => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            // Deactivated users of the old systems have no role
            'role' => Role::fromDegree((int) $user['degree'])?->name,
        ], $users));
    }

    public function create(Request $request): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $body = Json::object($request->json());
        $name = trim(Json::string($body['name'] ?? null) ?? '');
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

    public function setPassword(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $password = self::newPassword(Json::object($request->json())['password'] ?? null);
        $this->getUser($userId);
        $this->db->execute(
            'UPDATE SystemUser SET password = ? WHERE id = ?',
            [password_hash($password, PASSWORD_BCRYPT), (int) $userId]
        );
        return Response::ok();
    }

    /**
     * Admins can't delete themselves, so there is always one left.
     */
    public function delete(Request $request, string $userId): Response
    {
        $this->auth->requireRole(Role::ADMIN);
        $this->getUser($userId);
        if ((int) $userId === $this->auth->userId()) {
            throw new HttpException(400, 'Du kannst dich nicht selbst löschen.');
        }
        $this->db->execute('DELETE FROM SystemUser WHERE id = ?', [(int) $userId]);
        return Response::ok();
    }

    private function getUser(string $userId): array
    {
        if (!ctype_digit($userId)) {
            throw new HttpException(404, 'User not found');
        }
        return $this->db->one('SELECT id FROM SystemUser WHERE id = ?', [(int) $userId])
            ?? throw new HttpException(404, 'User not found');
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
            throw new HttpException(400, 'Das Passwort muss mindestens ' . self::MINIMUM_PASSWORD_LENGTH . ' Zeichen lang sein.');
        }
        return $password;
    }

    /**
     * The old password is checked again, so an unattended logged in browser can't change it.
     */
    public function changePassword(Request $request): Response
    {
        $userId = $this->auth->userId();
        $body = Json::object($request->json());
        $oldPassword = Json::string($body['oldPassword'] ?? null) ?? '';
        $newPassword = Json::string($body['newPassword'] ?? null) ?? '';

        $user = $this->db->one('SELECT password FROM SystemUser WHERE id = ?', [$userId]);
        if ($user === null || !password_verify($oldPassword, (string) $user['password'])) {
            throw new HttpException(400, 'Das bisherige Passwort ist falsch.');
        }
        if (mb_strlen($newPassword) < self::MINIMUM_PASSWORD_LENGTH) {
            throw new HttpException(400, 'Das neue Passwort muss mindestens ' . self::MINIMUM_PASSWORD_LENGTH . ' Zeichen lang sein.');
        }

        $this->db->execute(
            'UPDATE SystemUser SET password = ? WHERE id = ?',
            [password_hash($newPassword, PASSWORD_BCRYPT), $userId]
        );
        return Response::ok();
    }
}
