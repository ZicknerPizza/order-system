<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
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
     * The login form calls this endpoint to verify the credentials.
     */
    public function getCurrentUser(Request $request): Response
    {
        $this->auth->requireAdmin();
        return Response::ok();
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
