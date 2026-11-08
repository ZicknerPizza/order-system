<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Json;
use OrderSystem\Totp;

/**
 * Users set up TOTP for themselves: a new secret is only used for logins after a code confirmed
 * that the authenticator app has it.
 */
final class TotpController
{
    private const ISSUER = 'zickner.pizza';

    public function __construct(
        private readonly Database $db,
        private readonly Auth $auth,
        private readonly \Closure $now,
    ) {
    }

    public function start(Request $request): Response
    {
        $userId = $this->auth->userId();
        if ($this->isEnabled($userId)) {
            throw new HttpException(400, 'Die Zwei-Faktor-Anmeldung ist bereits eingerichtet.');
        }
        $secret = Totp::generateSecret();
        $this->db->transactional(function () use ($userId, $secret): void {
            $this->db->execute('DELETE FROM UserTotp WHERE userId = ?', [$userId]);
            $this->db->execute(
                'INSERT INTO UserTotp (userId, secret, confirmed, lastStep) VALUES (?, ?, 0, 0)',
                [$userId, $secret]
            );
        });
        return Response::json([
            'secret' => $secret,
            'uri' => Totp::uri($secret, $this->auth->username(), self::ISSUER),
        ]);
    }

    public function confirm(Request $request): Response
    {
        $userId = $this->auth->userId();
        $code = Json::string(Json::object($request->json())['code'] ?? null) ?? '';
        $totp = $this->db->one('SELECT secret FROM UserTotp WHERE userId = ? AND confirmed = 0', [$userId])
            ?? throw new HttpException(400, 'Bitte starte die Einrichtung neu.');
        $step = Totp::verify($totp['secret'], $code, ($this->now)());
        if ($step === null) {
            throw new HttpException(400, 'Der Code ist falsch, bitte prüfe die Uhrzeit deines Handys.');
        }
        $this->db->execute('UPDATE UserTotp SET confirmed = 1, lastStep = ? WHERE userId = ?', [$step, $userId]);
        return Response::ok();
    }

    /**
     * Needs the password, so an unattended logged in browser can't switch it off.
     */
    public function disable(Request $request): Response
    {
        $userId = $this->auth->userId();
        $password = Json::string(Json::object($request->json())['password'] ?? null) ?? '';
        $user = $this->db->one('SELECT password FROM SystemUser WHERE id = ?', [$userId]);
        if ($user === null || !password_verify($password, (string) $user['password'])) {
            throw new HttpException(400, 'Das Passwort ist falsch.');
        }
        $this->db->execute('DELETE FROM UserTotp WHERE userId = ?', [$userId]);
        return Response::ok();
    }

    private function isEnabled(int $userId): bool
    {
        return $this->db->one('SELECT userId FROM UserTotp WHERE userId = ? AND confirmed = 1', [$userId]) !== null;
    }
}
