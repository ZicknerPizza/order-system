<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Domain\Role;
use OrderSystem\Domain\Rating;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Json;
use OrderSystem\Time;

final class PartyController
{
    /** Join column Hibernate generated for the element collection Party.condiments */
    public const PARTY_CONDIMENT_PARTY_COLUMN = 'Party_id';

    public function __construct(private readonly Database $db, private readonly Auth $auth)
    {
    }

    public function findAll(Request $request): Response
    {
        $this->auth->requireRole(Role::SERVICE);
        $parties = $this->db->all('SELECT id, party, `key`, aktiv FROM Party ORDER BY aktiv DESC');
        return Response::json(array_map(static fn(array $party): array => [
            'id' => ['value' => $party['id']],
            'name' => $party['party'],
            'key' => $party['key'],
            'date' => Time::toLocalDate($party['aktiv']),
        ], $parties));
    }

    public function findById(Request $request, string $partyId): Response
    {
        $this->auth->requireRole(Role::SERVICE);
        return Response::json($this->toPartyDetails($this->getParty($partyId), true));
    }

    public function findByIdAndKey(Request $request, string $partyId, string $partyKey): Response
    {
        $party = $this->getParty($partyId);
        if ($party['key'] !== $partyKey) {
            throw new HttpException(404, 'Party not found');
        }
        return Response::json($this->toPartyDetails($party));
    }

    public function create(Request $request): Response
    {
        $this->auth->requireRole(Role::KITCHEN);
        $body = Json::object($request->json());

        $partyId = Json::requiredStringId($body['id'] ?? null, 'id');
        $name = Json::text($body['name'] ?? null, 'Der Name', 255) ?? throw new HttpException(400, "Field 'name' is required");
        $values = [
            $name,
            Json::text($body['key'] ?? null, 'Der Key', 8),
            Time::fromLocalDate($body['date'] ?? null),
            Json::int($body['estimatedNumberOfPizzas'] ?? null),
            Json::int($body['blendStatistics'] ?? null),
        ];
        $condiments = self::toPartyCondiments($body['condiments'] ?? null);

        $this->db->transactional(function () use ($partyId, $values, $condiments): void {
            // JPA's save() merged an already existing party, so creating twice updates it
            if ($this->db->one('SELECT id FROM Party WHERE id = ?', [$partyId]) === null) {
                $this->db->execute(
                    'INSERT INTO Party (party, `key`, aktiv, countPizza, blendStatistics, id) VALUES (?, ?, ?, ?, ?, ?)',
                    [...$values, $partyId]
                );
            } else {
                $this->db->execute(
                    'UPDATE Party SET party = ?, `key` = ?, aktiv = ?, countPizza = ?, blendStatistics = ? WHERE id = ?',
                    [...$values, $partyId]
                );
            }
            $this->replaceCondiments($partyId, $condiments);
        });
        return Response::noContent();
    }

    public function update(Request $request, string $partyId): Response
    {
        $this->auth->requireRole(Role::KITCHEN);
        $body = Json::object($request->json());

        $values = [
            Json::text($body['name'] ?? null, 'Der Name', 255),
            Time::fromLocalDate($body['date'] ?? null),
            Json::int($body['blendStatistics'] ?? null),
            Json::int($body['estimatedNumberOfPizzas'] ?? null),
        ];
        $condiments = self::toPartyCondiments($body['condiments'] ?? null);
        $this->getParty($partyId);

        $this->db->transactional(function () use ($partyId, $values, $condiments): void {
            $this->db->execute(
                'UPDATE Party SET party = ?, aktiv = ?, blendStatistics = ?, countPizza = ? WHERE id = ?',
                [...$values, $partyId]
            );
            $this->replaceCondiments($partyId, $condiments);
        });
        return Response::noContent();
    }

    private function getParty(string $partyId): array
    {
        return $this->db->one('SELECT id, party, `key`, aktiv, countPizza, blendStatistics FROM Party WHERE id = ?', [$partyId])
            ?? throw new HttpException(404, 'Party not found');
    }

    /**
     * With $withCalculation the amounts and ratings of the shopping list are included, which the
     * Java version left out, so saving the party page again overwrote them with empty values.
     */
    private function toPartyDetails(array $party, bool $withCalculation = false): array
    {
        $condiments = $this->db->all(
            'SELECT condiment_id, amount, rating FROM PartyCondiment_mm WHERE ' . self::PARTY_CONDIMENT_PARTY_COLUMN . ' = ?',
            [$party['id']]
        );
        $details = [
            'id' => ['value' => $party['id']],
            'name' => $party['party'],
            'key' => $party['key'],
            'date' => Time::toLocalDate($party['aktiv']),
            'estimatedNumberOfPizzas' => (int) $party['countPizza'],
            'blendStatistics' => (int) $party['blendStatistics'],
            'condiments' => array_map(
                static fn(array $condiment): ?array => $condiment['condiment_id'] === null ? null : ['value' => (int) $condiment['condiment_id']],
                $condiments
            ),
        ];
        if ($withCalculation) {
            $details['condimentCalculation'] = array_map(static fn(array $condiment): array => [
                'condimentId' => $condiment['condiment_id'] === null ? null : ['value' => (int) $condiment['condiment_id']],
                'amount' => $condiment['amount'] === null ? null : (float) $condiment['amount'],
                'rating' => $condiment['rating'] === null ? null : Rating::tryFrom((int) $condiment['rating'])?->name,
            ], $condiments);
        }
        return $details;
    }

    /**
     * @return list<array{?int, ?float, ?int}> condiment id, amount and stored rating
     */
    private static function toPartyCondiments(mixed $condiments): array
    {
        return array_map(static function (mixed $condiment): array {
            $condiment = Json::object($condiment);
            return [
                Json::intId($condiment['condimentId'] ?? null),
                Json::float($condiment['amount'] ?? null),
                Rating::fromJson($condiment['rating'] ?? null)?->value,
            ];
        }, Json::list($condiments, 'condiments'));
    }

    private function replaceCondiments(string $partyId, array $condiments): void
    {
        $this->db->execute('DELETE FROM PartyCondiment_mm WHERE ' . self::PARTY_CONDIMENT_PARTY_COLUMN . ' = ?', [$partyId]);
        foreach ($condiments as $condiment) {
            $this->db->execute(
                'INSERT INTO PartyCondiment_mm (' . self::PARTY_CONDIMENT_PARTY_COLUMN . ', condiment_id, amount, rating) VALUES (?, ?, ?, ?)',
                [$partyId, ...$condiment]
            );
        }
    }
}
