<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Auth;
use OrderSystem\Database;
use OrderSystem\Domain\Status;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Json;
use OrderSystem\Time;
use OrderSystem\Uuid;

final class OrderController
{
    private const SECONDS_TO_BAKE = 4 * 60;

    public function __construct(
        private readonly Database $db,
        private readonly Auth $auth,
        private readonly \Closure $now,
    ) {
    }

    /**
     * The Java version ran this every second with @Scheduled. Shared hosting has no background
     * processes, so it runs at the beginning of every API request instead.
     */
    public static function stopBakingOfFinishedOrders(Database $db, int $now): void
    {
        $db->execute(
            'UPDATE PizzaOrder SET status = ?
             WHERE status = ? AND (timeStove IS NULL OR timeStove = 0 OR timeStove + ? < ?)',
            [Status::EATING->value, Status::BAKING->value, self::SECONDS_TO_BAKE, $now]
        );
    }

    public function findOrdersForParty(Request $request, string $partyId): Response
    {
        $this->auth->requireAdmin();

        $orders = $this->db->all(
            'SELECT id, party, name, comment, status, time, timeTopping, timeStove
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
                'status' => $status->name,
                'condiments' => $condiments[$order['id']] ?? [],
            ];
        }
        return Response::json($result);
    }

    public function createOrder(Request $request, string $partyId): Response
    {
        $this->auth->requireAdmin();
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
        $this->buildAndSaveOrder($partyId, $request->json());
        return Response::noContent();
    }

    public function changeStatus(Request $request, string $partyId): Response
    {
        $this->auth->requireAdmin();
        $body = Json::object($request->json());

        $orderIds = array_map(
            static fn(mixed $orderId): string => Json::requiredStringId($orderId, 'orderIds'),
            Json::list($body['orderIds'] ?? null, 'orderIds')
        );
        $newStatus = Status::fromJson($body['status'] ?? null) ?? throw new HttpException(400, "Field 'status' is required");

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
            if (!Status::from((int) $order['status'])->isValidTransaction($newStatus)) {
                throw new HttpException(400, 'Invalid status transition');
            }
        }

        $now = ($this->now)();
        $this->db->transactional(function () use ($orders, $newStatus, $now): void {
            foreach ($orders as $order) {
                $changes = match ($newStatus) {
                    // An order that comes back from INACTIVE queues up with a new order time
                    Status::WAITING => Status::from((int) $order['status']) === Status::INACTIVE ? ['time' => $now] : [],
                    Status::TOPPING => ['timeTopping' => $now],
                    Status::BAKING => ['timeStove' => $now],
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
     * Like in the Java version this endpoint does not require a login.
     */
    public function delete(Request $request, string $partyId, string $orderId): Response
    {
        $order = $this->db->one('SELECT status FROM PizzaOrder WHERE id = ?', [$orderId])
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
        $name = Json::string($body['name'] ?? null);
        if ($name === null || $name === '') {
            throw new HttpException(400, "Field 'name' is required");
        }
        $comment = Json::string($body['comment'] ?? null);
        $status = Status::fromJson($body['status'] ?? null);
        if ($status !== Status::INACTIVE && $status !== Status::WAITING) {
            throw new HttpException(400, 'Status for new orders must be INACTIVE or WAITING');
        }
        $condimentIds = array_map(
            static fn(mixed $condimentId): ?int => Json::intId($condimentId),
            Json::list($body['condiments'] ?? null, 'condiments')
        );

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
