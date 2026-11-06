<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Domain\Role;
use OrderSystem\Domain\Status;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Json;
use OrderSystem\RateLimiter;
use OrderSystem\Time;
use OrderSystem\Uuid;

final class OrderController
{
    /** Category of the sauce or cream the pizza is spread with */
    private const BASE_CATEGORY = 'Basis';
    /**
     * Oven compartments, stored in PizzaOrder.stove like in the system before the Java version:
     * upper and lower compartment of the big oven.
     */
    private const STOVES = ['go', 'gu'];

    /**
     * The kitchen page takes the pizzas out of the oven after baking (BAKING to EATING),
     * the Java version did that with a job in the backend.
     */
    private const GUEST_ORDERS_PER_WINDOW = 60;
    private const GUEST_ORDER_WINDOW = 600;

    public function __construct(
        private readonly Database $db,
        private readonly Auth $auth,
        private readonly \Closure $now,
        private readonly RateLimiter $rateLimiter,
    ) {
    }

    public function findOrdersForParty(Request $request, string $partyId): Response
    {
        $this->auth->requireRole(Role::SERVICE);

        $orders = $this->db->all(
            'SELECT id, party, name, comment, status, time, timeTopping, timeStove, stove
             FROM PizzaOrder WHERE party = ? AND status <> ? ORDER BY status ASC, time DESC',
            [$partyId, Status::DELETED->value]
        );
        $condiments = [];
        $rows = $this->db->all(
            'SELECT m.orderId, m.condimentId
             FROM PizzaOrderCondiment_mm m JOIN PizzaOrder o ON o.id = m.orderId
             WHERE o.party = ?',
            [$partyId]
        );
        foreach ($rows as $row) {
            $condiments[$row['orderId']][] = ['value' => (int) $row['condimentId']];
        }

        usort($orders, self::compareOrders(...));

        // Two consecutive orders in the kitchen share one pizza
        $result = [];
        $lastPizzaId = null;
        foreach ($orders as $order) {
            $status = Status::from((int) $order['status']);
            $pizzaId = null;
            if ($status->isAtLeast(Status::TOPPING)) {
                if ($lastPizzaId === null) {
                    $lastPizzaId = Uuid::v4();
                    $pizzaId = $lastPizzaId;
                } else {
                    $pizzaId = $lastPizzaId;
                    $lastPizzaId = null;
                }
            }
            $result[] = [
                'orderId' => ['value' => $order['id']],
                'pizzaId' => $pizzaId === null ? null : ['value' => $pizzaId],
                'partyId' => $order['party'] === null ? null : ['value' => $order['party']],
                'name' => $order['name'],
                'comment' => $order['comment'],
                'date' => Time::toLocalDateTime($order['time']),
                'timeStove' => Time::toLocalDateTime($order['timeStove']),
                'stove' => $order['stove'] === null || $order['stove'] === '' ? null : $order['stove'],
                'status' => $status->name,
                'condiments' => $condiments[$order['id']] ?? [],
            ];
        }
        return Response::json($result);
    }

    public function createOrder(Request $request, string $partyId): Response
    {
        $this->auth->requireRole(Role::SERVICE);
        $this->getParty($partyId);
        $this->buildAndSaveOrder($partyId, $request->json());
        return Response::noContent();
    }

    public function createOrderWithKey(Request $request, string $partyId, string $key): Response
    {
        $party = $this->getParty($partyId);
        if ($party['key'] !== $key) {
            $this->auth->deny();
        }
        // Guests often share the address of the party WLAN, so the limit is generous
        $bucket = 'guest-orders:' . $request->ip;
        if ($this->rateLimiter->exceeded($bucket, self::GUEST_ORDERS_PER_WINDOW, self::GUEST_ORDER_WINDOW)) {
            throw new HttpException(429, 'Zu viele Bestellungen, bitte versuche es in ein paar Minuten noch einmal.');
        }
        $this->buildAndSaveOrder($partyId, $request->json());
        $this->rateLimiter->hit($bucket);
        return Response::noContent();
    }

    public function changeStatus(Request $request, string $partyId): Response
    {
        $this->auth->requireRole(Role::SERVICE);
        $body = Json::object($request->json());

        $orderIds = array_map(
            static fn(mixed $orderId): string => Json::requiredStringId($orderId, 'orderIds'),
            Json::list($body['orderIds'] ?? null, 'orderIds')
        );
        $newStatus = Status::fromJson($body['status'] ?? null) ?? throw new HttpException(400, "Field 'status' is required");
        $stove = Json::string($body['stove'] ?? null);
        if ($stove !== null && !in_array($stove, self::STOVES, true)) {
            throw new HttpException(400, 'Unknown oven compartment');
        }

        $orders = $orderIds === [] ? [] : $this->db->all(
            'SELECT id, party, status FROM PizzaOrder WHERE id IN (' . Database::placeholders(count($orderIds)) . ')',
            $orderIds
        );
        if (count($orders) !== count($orderIds)) {
            throw new HttpException(404, 'Order not found');
        }
        foreach ($orders as $order) {
            if ($order['party'] !== $partyId) {
                throw new HttpException(404, 'Order not found');
            }
            $status = Status::from((int) $order['status']);
            if (!$status->isValidTransaction($newStatus)) {
                throw new HttpException(400, 'Invalid status transition');
            }
            // Service activates and deactivates orders, everything from topping on is baking
            if ($status->isAtLeast(Status::TOPPING) || ($newStatus->isAtLeast(Status::TOPPING) && $newStatus !== Status::DELETED)) {
                $this->auth->requireRole(Role::KITCHEN);
            }
        }

        $now = ($this->now)();
        $this->db->transactional(function () use ($orders, $newStatus, $now, $stove): void {
            foreach ($orders as $order) {
                $changes = match ($newStatus) {
                    // An order that comes back from INACTIVE queues up with a new order time
                    Status::WAITING => Status::from((int) $order['status']) === Status::INACTIVE ? ['time' => $now] : [],
                    Status::TOPPING => ['timeTopping' => $now],
                    Status::BAKING => ['timeStove' => $now, 'stove' => $stove ?? ''],
                    Status::EATING => ['timeFinished' => $now],
                    default => [],
                };
                $changes['status'] = $newStatus->value;
                $assignments = implode(', ', array_map(static fn(string $column): string => "$column = ?", array_keys($changes)));
                $this->db->execute("UPDATE PizzaOrder SET $assignments WHERE id = ?", [...array_values($changes), $order['id']]);
            }
        });
        return Response::ok();
    }

    /**
     * The Java version allowed this without login, only the kitchen deletes orders.
     */
    public function delete(Request $request, string $partyId, string $orderId): Response
    {
        $this->auth->requireRole(Role::SERVICE);
        $order = $this->db->one('SELECT status FROM PizzaOrder WHERE id = ? AND party = ?', [$orderId, $partyId])
            ?? throw new HttpException(404, 'Order not found');
        if (Status::from((int) $order['status'])->isValidTransaction(Status::DELETED)) {
            $this->db->execute('UPDATE PizzaOrder SET status = ? WHERE id = ?', [Status::DELETED->value, $orderId]);
        }
        return Response::ok();
    }

    private function getParty(string $partyId): array
    {
        return $this->db->one('SELECT id, `key` FROM Party WHERE id = ?', [$partyId])
            ?? throw new HttpException(404, 'Party not found');
    }

    private function buildAndSaveOrder(string $partyId, mixed $body): void
    {
        $body = Json::object($body);

        $orderId = Json::requiredStringId($body['orderId'] ?? null, 'orderId');
        $name = Json::text($body['name'] ?? null, 'Der Name', 255);
        if ($name === null || $name === '') {
            throw new HttpException(400, "Field 'name' is required");
        }
        $comment = Json::text($body['comment'] ?? null, 'Der Kommentar', 255);
        $status = Status::fromJson($body['status'] ?? null);
        if ($status !== Status::INACTIVE && $status !== Status::WAITING) {
            throw new HttpException(400, 'Status for new orders must be INACTIVE or WAITING');
        }
        $condimentIds = array_map(
            static fn(mixed $condimentId): ?int => Json::intId($condimentId),
            Json::list($body['condiments'] ?? null, 'condiments')
        );
        // The order form may have been loaded before the condiment ran out
        $soldOut = array_filter($condimentIds, fn(?int $condimentId): bool => $condimentId !== null && $this->db->one(
            'SELECT condimentId FROM PartyCondimentSoldOut WHERE partyId = ? AND condimentId = ?',
            [$partyId, $condimentId]
        ) !== null);
        if ($soldOut !== []) {
            $names = array_column($this->db->all(
                'SELECT name FROM Condiment WHERE id IN (' . Database::placeholders(count($soldOut)) . ') ORDER BY name',
                array_values($soldOut)
            ), 'name');
            throw new HttpException(400, implode(', ', $names) . ' ist leider aus.');
        }
        // The kitchen puts two orders with the same base on one pizza, so there is one base per order
        $ids = array_values(array_filter($condimentIds, static fn(?int $condimentId): bool => $condimentId !== null));
        if (count($ids) > 1 && (int) $this->db->one(
            'SELECT COUNT(*) AS bases FROM Condiment c JOIN CondimentCategory cc ON cc.id = c.parent_id
             WHERE cc.name = ? AND c.id IN (' . Database::placeholders(count($ids)) . ')',
            [self::BASE_CATEGORY, ...$ids]
        )['bases'] > 1) {
            throw new HttpException(400, 'Bitte wähle höchstens eine Basis.');
        }

        $this->db->transactional(function () use ($orderId, $partyId, $name, $comment, $status, $condimentIds): void {
            $this->db->execute(
                'INSERT INTO PizzaOrder (id, party, name, comment, status, time, timeTopping, timeStove)
                 VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)',
                [$orderId, $partyId, $name, $comment, $status->value, ($this->now)()]
            );
            foreach ($condimentIds as $condimentId) {
                $this->db->execute('INSERT INTO PizzaOrderCondiment_mm (orderId, condimentId) VALUES (?, ?)', [$orderId, $condimentId]);
            }
        });
    }

    /**
     * Same order as OrderApplicationService.findOrdersForParty() in the Java version.
     */
    private static function compareOrders(array $order1, array $order2): int
    {
        $status1 = (int) $order1['status'];
        $status2 = (int) $order2['status'];
        if ($status1 !== $status2) {
            return $status1 <=> $status2;
        }
        return match (Status::from($status1)) {
            Status::INACTIVE => strcmp((string) $order1['name'], (string) $order2['name']),
            Status::WAITING => (int) $order2['time'] <=> (int) $order1['time'],
            Status::TOPPING => !$order1['timeTopping'] || !$order2['timeTopping']
                ? 0
                : (int) $order2['timeTopping'] <=> (int) $order1['timeTopping'],
            Status::BAKING, Status::EATING => (int) $order2['timeStove'] <=> (int) $order1['timeStove'],
            default => 0,
        };
    }
}
