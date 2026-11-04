<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Domain\Role;
use OrderSystem\Domain\Rating;
use OrderSystem\Domain\Status;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;

final class CondimentController
{
    private const ORDERS_PER_PIZZA = 2;

    public function __construct(private readonly Database $db, private readonly Auth $auth)
    {
    }

    public function findAll(Request $request): Response
    {
        $condiments = $this->db->all(
            'SELECT c.id, c.name, c.unit, cc.name AS category
             FROM Condiment c JOIN CondimentCategory cc ON cc.id = c.parent_id
             ORDER BY cc.sorting ASC, c.sorting ASC'
        );
        return Response::json(array_map(static fn(array $condiment): array => [
            'id' => ['value' => (int) $condiment['id']],
            'category' => $condiment['category'],
            'name' => $condiment['name'],
            'unit' => $condiment['unit'],
        ], $condiments));
    }

    public function findCondimentStatistic(Request $request): Response
    {
        $this->auth->requireRole(Role::KITCHEN);

        $numOrders = (int) $this->db->one('SELECT COUNT(*) AS count FROM PizzaOrder')['count'];
        $condimentOrderCount = $this->getOrderCountForEachCondiment();
        $statisticForCondiments = $this->getStatisticForCondiments();

        $result = [];
        foreach ($this->db->all('SELECT id FROM Condiment ORDER BY id') as $condiment) {
            $condimentId = (int) $condiment['id'];
            $percentageOfOrders = 0.0;
            if (isset($condimentOrderCount[$condimentId])) {
                $percentageOfOrders = $condimentOrderCount[$condimentId] / $numOrders * 100;
            }
            $result[] = [
                'id' => ['value' => $condimentId],
                'percentageOfOrders' => $percentageOfOrders,
                'statistic' => $statisticForCondiments[$condimentId] ?? ['greater' => null, 'match' => null, 'less' => null],
            ];
        }
        return Response::json($result);
    }

    /**
     * @return array<int, int> condiment id => number of orders with this condiment, including deleted orders
     */
    private function getOrderCountForEachCondiment(): array
    {
        $rows = $this->db->all(
            'SELECT m.condimentId, COUNT(*) AS count
             FROM PizzaOrderCondiment_mm m JOIN PizzaOrder o ON o.id = m.orderId
             GROUP BY m.condimentId'
        );
        $counts = [];
        foreach ($rows as $row) {
            $counts[(int) $row['condimentId']] = (int) $row['count'];
        }
        return $counts;
    }

    /**
     * Amount per pizza that was used on each party, grouped by condiment and the rating given afterwards.
     */
    private function getStatisticForCondiments(): array
    {
        $orderedCondiments = [];
        $rows = $this->db->all(
            'SELECT o.party, m.condimentId, COUNT(*) AS count
             FROM PizzaOrderCondiment_mm m JOIN PizzaOrder o ON o.id = m.orderId
             WHERE o.status <> ?
             GROUP BY o.party, m.condimentId',
            [Status::DELETED->value]
        );
        foreach ($rows as $row) {
            $orderedCondiments[$row['party']][(int) $row['condimentId']] = (int) $row['count'];
        }

        $amountsPerPizza = [];
        $partyCondiments = $this->db->all(
            'SELECT pc.' . PartyController::PARTY_CONDIMENT_PARTY_COLUMN . ' AS party, pc.condiment_id, pc.amount, pc.rating
             FROM PartyCondiment_mm pc JOIN Party p ON p.id = pc.' . PartyController::PARTY_CONDIMENT_PARTY_COLUMN . '
             WHERE pc.amount IS NOT NULL AND pc.rating IS NOT NULL AND pc.condiment_id IS NOT NULL'
        );
        foreach ($partyCondiments as $partyCondiment) {
            $condimentId = (int) $partyCondiment['condiment_id'];
            $numberOfOrders = $orderedCondiments[$partyCondiment['party']][$condimentId] ?? null;
            $rating = Rating::tryFrom((int) $partyCondiment['rating']);
            if ($numberOfOrders === null || $rating === null) {
                continue;
            }
            $amountsPerPizza[$condimentId][$rating->name][] = (float) $partyCondiment['amount'] / $numberOfOrders * self::ORDERS_PER_PIZZA;
        }

        $statistics = [];
        foreach ($amountsPerPizza as $condimentId => $amountsByRating) {
            $statistics[$condimentId] = [
                'greater' => self::toArithmeticValues($amountsByRating[Rating::TO_MUCH->name] ?? null),
                'match' => self::toArithmeticValues($amountsByRating[Rating::ENOUGH->name] ?? null),
                'less' => self::toArithmeticValues($amountsByRating[Rating::NOT_ENOUGH->name] ?? null),
            ];
        }
        return $statistics;
    }

    /**
     * @return array{float, float, float}|null minimum, average and maximum
     */
    private static function toArithmeticValues(?array $amounts): ?array
    {
        if ($amounts === null) {
            return null;
        }
        return [min($amounts), array_sum($amounts) / count($amounts), max($amounts)];
    }
}
