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

final class LinkController
{
    private const SELECT_LINK = 'SELECT l.id, l.identifier, l.eventId, p.`key` AS partyKey
                                 FROM Link l LEFT JOIN Party p ON p.id = l.eventId';

    public function __construct(private readonly Database $db, private readonly Auth $auth)
    {
    }

    public function findAll(Request $request): Response
    {
        $this->auth->requireRole(Role::KITCHEN);
        $links = $this->db->all(self::SELECT_LINK . ' ORDER BY l.id');
        return Response::json(array_map(self::toLinkDetails(...), $links));
    }

    public function findByIdentifier(Request $request): Response
    {
        $identifier = $request->query['identifier'] ?? null;
        if (!is_string($identifier)) {
            throw new HttpException(400, "Required request parameter 'identifier' is not present");
        }
        $link = $this->db->one(self::SELECT_LINK . ' WHERE l.identifier = ?', [$identifier]);
        if ($link === null) {
            throw new HttpException(404, 'Link not found');
        }
        return Response::json(self::toLinkDetails($link));
    }

    public function update(Request $request, string $linkId): Response
    {
        $this->auth->requireRole(Role::KITCHEN);
        if (!ctype_digit($linkId)) {
            throw new HttpException(400, 'Invalid link id');
        }
        $body = Json::object($request->json());

        if ($this->db->one('SELECT id FROM Link WHERE id = ?', [(int) $linkId]) === null) {
            throw new HttpException(404, 'Link not found');
        }
        $this->db->execute(
            'UPDATE Link SET identifier = ?, eventId = ? WHERE id = ?',
            [Json::text($body['identifier'] ?? null, 'Der Link', 255), Json::stringId($body['partyId'] ?? null), (int) $linkId]
        );
        return Response::ok();
    }

    private static function toLinkDetails(array $link): array
    {
        return [
            'id' => ['value' => (int) $link['id']],
            'identifier' => $link['identifier'],
            'partyId' => $link['eventId'] === null ? null : ['value' => $link['eventId']],
            'partyKey' => $link['partyKey'],
        ];
    }
}
