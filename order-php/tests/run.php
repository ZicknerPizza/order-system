<?php
declare(strict_types=1);

/**
 * API tests against an in-memory SQLite database, run with: php tests/run.php
 * The scenarios follow the behaviour of the Spring controllers of the Java version.
 */

use OrderSystem\App;
use OrderSystem\Database;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;

require __DIR__ . '/../src/bootstrap.php';

date_default_timezone_set('Europe/Berlin');

final class TestContext
{
    public int $now;
    public App $app;
    public Database $db;
    public int $failures = 0;
    public int $assertions = 0;

    public function __construct()
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->exec(file_get_contents(__DIR__ . '/../schema.sql'));
        $this->db = new Database($pdo);
        $this->now = strtotime('2021-12-04 19:00:00');
        $this->app = new App($this->db, fn(): int => $this->now);
        $this->seed();
    }

    public function request(string $method, string $path, mixed $body = null, ?string $auth = 'admin:secret', array $query = []): Response
    {
        return $this->app->handle(new Request(
            $method,
            $path,
            $query,
            $body === null ? '' : json_encode($body),
            $auth === null ? null : 'Basic ' . base64_encode($auth),
        ));
    }

    public function assertEquals(mixed $expected, mixed $actual, string $message): void
    {
        $this->assertions++;
        if ($expected !== $actual) {
            $this->failures++;
            echo "FAIL: $message\n  expected: " . json_encode($expected) . "\n  actual:   " . json_encode($actual) . "\n";
        }
    }

    private function seed(): void
    {
        $this->db->execute("INSERT INTO SystemUser (id, name, password) VALUES (1, 'admin', ?)", [
            // Hash as written by Spring's BCryptPasswordEncoder for "secret"
            str_replace('$2y$', '$2a$', password_hash('secret', PASSWORD_BCRYPT)),
        ]);
        $this->db->execute("INSERT INTO CondimentCategory (id, name, sorting) VALUES (1, 'Käse', 2), (2, 'Soße', 1)");
        $this->db->execute("INSERT INTO Condiment (id, name, sorting, unit, parent_id) VALUES
            (1, 'Mozzarella', 2, 'g', 1), (2, 'Gouda', 1, 'g', 1), (3, 'Tomatensoße', 1, 'ml', 2)");
        $this->db->execute("INSERT INTO Link (id, identifier, eventId) VALUES (1, 'weihnachten', NULL)");
    }
}

$t = new TestContext();
$partyId = 'party-1';

// --- Authentication ---------------------------------------------------------------------------

$t->assertEquals(200, $t->request('GET', '/api/current-user')->status, 'login with correct credentials');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: 'admin:wrong')->status, 'login with wrong password');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: null)->status, 'current user without login');
$t->assertEquals(401, $t->request('GET', '/api/condiments', auth: 'nobody:x')->status, 'wrong credentials are rejected on public endpoints');
$t->assertEquals(401, $t->request('GET', '/api/partys', auth: null)->status, 'party list requires login');
$t->assertEquals(404, $t->request('GET', '/api/unknown')->status, 'unknown endpoint');
$t->assertEquals(405, $t->request('DELETE', '/api/partys')->status, 'unsupported method');

// --- Condiments -------------------------------------------------------------------------------

$t->assertEquals([
    ['id' => ['value' => 3], 'category' => 'Soße', 'name' => 'Tomatensoße', 'unit' => 'ml'],
    ['id' => ['value' => 2], 'category' => 'Käse', 'name' => 'Gouda', 'unit' => 'g'],
    ['id' => ['value' => 1], 'category' => 'Käse', 'name' => 'Mozzarella', 'unit' => 'g'],
], $t->request('GET', '/api/condiments/', auth: null)->decoded(), 'condiments sorted by category and condiment, trailing slash allowed');

// --- Parties ----------------------------------------------------------------------------------

$createParty = [
    'id' => ['value' => $partyId],
    'name' => 'Weihnachtsfeier',
    'key' => 'abcd1234',
    'date' => '2021-12-04',
    'estimatedNumberOfPizzas' => 10,
    'blendStatistics' => 50,
    'condiments' => [
        ['condimentId' => ['value' => 1], 'amount' => 1000, 'rating' => 1],
        ['condimentId' => ['value' => 3], 'amount' => null, 'rating' => null],
    ],
];
$t->assertEquals(401, $t->request('POST', '/api/partys', $createParty, auth: null)->status, 'create party requires login');
$t->assertEquals(204, $t->request('POST', '/api/partys', $createParty)->status, 'create party');
$t->assertEquals(400, $t->request('POST', '/api/partys', [...$createParty, 'date' => '04.12.2021'])->status, 'invalid date');

$expectedParty = [
    'id' => ['value' => $partyId],
    'name' => 'Weihnachtsfeier',
    'key' => 'abcd1234',
    'date' => '2021-12-04',
    'estimatedNumberOfPizzas' => 10,
    'blendStatistics' => 50,
    'condiments' => [['value' => 1], ['value' => 3]],
];
$t->assertEquals([...$expectedParty, 'condimentCalculation' => [
    ['condimentId' => ['value' => 1], 'amount' => 1000.0, 'rating' => 'ENOUGH'],
    ['condimentId' => ['value' => 3], 'amount' => null, 'rating' => null],
]], $t->request('GET', "/api/partys/$partyId")->decoded(), 'find party by id includes amounts and ratings for the party page');
$t->assertEquals(
    (int) strtotime('2021-12-04 07:00:00'),
    (int) $t->db->one('SELECT aktiv FROM Party WHERE id = ?', [$partyId])['aktiv'],
    'party date is stored as 07:00 local time'
);
$t->assertEquals(1, (int) $t->db->one('SELECT rating FROM PartyCondiment_mm WHERE condiment_id = 1')['rating'] + 1, 'rating ordinal 1 (ENOUGH) is stored as 0');
$t->assertEquals($expectedParty, $t->request('GET', "/api/partys/$partyId/abcd1234", auth: null)->decoded(), 'find party by key without login');
$t->assertEquals(404, $t->request('GET', "/api/partys/$partyId/wrong", auth: null)->status, 'wrong party key');
$t->assertEquals(404, $t->request('GET', '/api/partys/unknown')->status, 'unknown party');

$t->request('POST', '/api/partys', [...$createParty, 'id' => ['value' => 'party-old'], 'name' => 'Alt', 'date' => '2020-12-04', 'condiments' => []]);
$t->assertEquals(
    [
        ['id' => ['value' => $partyId], 'name' => 'Weihnachtsfeier', 'key' => 'abcd1234', 'date' => '2021-12-04'],
        ['id' => ['value' => 'party-old'], 'name' => 'Alt', 'key' => 'abcd1234', 'date' => '2020-12-04'],
    ],
    $t->request('GET', '/api/partys')->decoded(),
    'party overview, newest first'
);

// --- Links ------------------------------------------------------------------------------------

$t->assertEquals(200, $t->request('PUT', '/api/links/1', ['id' => ['value' => 1], 'identifier' => 'xmas', 'partyId' => ['value' => $partyId]])->status, 'update link');
$t->assertEquals(
    ['id' => ['value' => 1], 'identifier' => 'xmas', 'partyId' => ['value' => $partyId], 'partyKey' => 'abcd1234'],
    $t->request('GET', '/api/links/search', auth: null, query: ['identifier' => 'xmas'])->decoded(),
    'search link without login'
);
$t->assertEquals(404, $t->request('GET', '/api/links/search', auth: null, query: ['identifier' => 'weihnachten'])->status, 'unknown link');
$t->assertEquals(400, $t->request('GET', '/api/links/search', auth: null)->status, 'link search without identifier');
$t->assertEquals(1, count($t->request('GET', '/api/links')->decoded()), 'list links');
$t->assertEquals(404, $t->request('PUT', '/api/links/99', ['identifier' => 'x'])->status, 'update unknown link');

// --- Orders -----------------------------------------------------------------------------------

$order = static fn(string $id, string $name, array $condiments, mixed $status = 'WAITING'): array => [
    'orderId' => ['value' => $id],
    'name' => $name,
    'comment' => null,
    'condiments' => array_map(static fn(int $c): array => ['value' => $c], $condiments),
    'status' => $status,
];

$t->assertEquals(401, $t->request('POST', "/api/orders/$partyId/wrong", $order('o0', 'X', []), auth: null)->status, 'order with wrong key');
$t->assertEquals(404, $t->request('POST', '/api/orders/unknown/abcd1234', $order('o0', 'X', []), auth: null)->status, 'order for unknown party');
$t->assertEquals(400, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('o0', '', []), auth: null)->status, 'order without name');
$t->assertEquals(400, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('o0', 'X', [], 'BAKING'), auth: null)->status, 'order must start INACTIVE or WAITING');

$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('o1', 'Anna', [1, 3]), auth: null)->status, 'order with key');
$t->now += 60;
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('o2', 'Ben', [1]), auth: null)->status, 'second order');
$t->now += 60;
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId", $order('o3', 'Carla', [2], 0))->status, 'order as admin with status ordinal');
$t->assertEquals(401, $t->request('POST', "/api/orders/$partyId", $order('o4', 'X', []), auth: null)->status, 'order without key requires login');

$orders = $t->request('GET', "/api/orders/$partyId")->decoded();
$t->assertEquals(['o3', 'o2', 'o1'], array_map(static fn(array $o): string => $o['orderId']['value'], $orders), 'INACTIVE first, then WAITING newest first');
$t->assertEquals([
    'orderId' => ['value' => 'o1'],
    'pizzaId' => null,
    'partyId' => ['value' => $partyId],
    'name' => 'Anna',
    'comment' => null,
    'date' => '2021-12-04T19:00:00',
    'timeStove' => null,
    'stove' => null,
    'status' => 'WAITING',
    'condiments' => [['value' => 1], ['value' => 3]],
], $orders[2], 'order details');
$t->assertEquals(401, $t->request('GET', "/api/orders/$partyId", auth: null)->status, 'order list requires login');

$changeStatus = static fn(array $ids, mixed $status): array => [
    'status' => $status,
    'orderIds' => array_map(static fn(string $id): array => ['value' => $id], $ids),
];
$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o1', 'o2'], 2))->status, 'start topping two orders');
$t->assertEquals(400, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o3'], 'BAKING'))->status, 'invalid status transition');
$t->assertEquals(404, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o1', 'missing'], 'BAKING'))->status, 'unknown order in status change');
$t->assertEquals(404, $t->request('PUT', "/api/orders/party-old/status", $changeStatus(['o1'], 'BAKING'))->status, 'order of another party');

$orders = $t->request('GET', "/api/orders/$partyId")->decoded();
$t->assertEquals(['INACTIVE', 'TOPPING', 'TOPPING'], array_column($orders, 'status'), 'orders after topping');
$t->assertEquals(true, $orders[1]['pizzaId'] !== null && $orders[1]['pizzaId'] === $orders[2]['pizzaId'], 'two topping orders share one pizza');

$t->now += 10;
$t->assertEquals(400, $t->request('PUT', "/api/orders/$partyId/status", [...$changeStatus(['o1', 'o2'], 'BAKING'), 'stove' => 'k2'])->status, 'unknown oven compartment');
$t->request('PUT', "/api/orders/$partyId/status", [...$changeStatus(['o1', 'o2'], 'BAKING'), 'stove' => 'gu']);
$orders = $t->request('GET', "/api/orders/$partyId")->decoded();
$t->assertEquals(['INACTIVE', 'BAKING', 'BAKING'], array_column($orders, 'status'), 'orders in the oven');
$t->assertEquals('2021-12-04T19:02:10', $orders[1]['timeStove'], 'stove time');
$t->assertEquals(['gu', 'gu'], [$orders[1]['stove'], $orders[2]['stove']], 'lower oven compartment');

// The kitchen page takes pizzas out of the oven, the backend leaves them there
$t->now += 10 * 60;
$t->assertEquals(['INACTIVE', 'BAKING', 'BAKING'], array_column($t->request('GET', "/api/orders/$partyId")->decoded(), 'status'), 'backend does not finish baking by itself');
$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o1', 'o2'], 'EATING'))->status, 'kitchen takes the pizza out');
$t->assertEquals(['INACTIVE', 'EATING', 'EATING'], array_column($t->request('GET', "/api/orders/$partyId")->decoded(), 'status'), 'pizza is finished');
$t->assertEquals($t->now, (int) $t->db->one("SELECT timeFinished FROM PizzaOrder WHERE id = 'o1'")['timeFinished'], 'finish time is stored');
$t->assertEquals(400, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o1', 'o2'], 'EATING'))->status, 'a second kitchen taking it out gets an error');

$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o3'], 'WAITING'))->status, 'reactivate order');
$t->assertEquals($t->now, (int) $t->db->one("SELECT time FROM PizzaOrder WHERE id = 'o3'")['time'], 'reactivated order gets a new order time');

$t->assertEquals(200, $t->request('DELETE', "/api/orders/$partyId/o3", auth: null)->status, 'delete order');
$t->assertEquals(200, $t->request('DELETE', "/api/orders/$partyId/o1", auth: null)->status, 'deleting an eaten order is ignored');
$t->assertEquals(['o2', 'o1'], array_map(static fn(array $o): string => $o['orderId']['value'], $t->request('GET', "/api/orders/$partyId")->decoded()), 'deleted orders are hidden');
$t->assertEquals(404, $t->request('DELETE', "/api/orders/$partyId/missing", auth: null)->status, 'delete unknown order');

// --- Party update -----------------------------------------------------------------------------

$t->assertEquals(204, $t->request('PUT', "/api/partys/$partyId", [
    'name' => 'Weihnachtsfeier 2021',
    'date' => '2021-12-05',
    'estimatedNumberOfPizzas' => 12,
    'blendStatistics' => 30,
    'condiments' => [
        ['condimentId' => ['value' => 1], 'amount' => 500, 'rating' => 0],
        ['condimentId' => ['value' => 3], 'amount' => 300, 'rating' => 2],
    ],
])->status, 'update party');
$party = $t->request('GET', "/api/partys/$partyId")->decoded();
$t->assertEquals(['Weihnachtsfeier 2021', '2021-12-05', 12, 30, 'abcd1234'], [$party['name'], $party['date'], $party['estimatedNumberOfPizzas'], $party['blendStatistics'], $party['key']], 'updated party keeps its key');
$t->assertEquals([
    ['condimentId' => ['value' => 1], 'amount' => 500.0, 'rating' => 'NOT_ENOUGH'],
    ['condimentId' => ['value' => 3], 'amount' => 300.0, 'rating' => 'TO_MUCH'],
], $party['condimentCalculation'], 'updated amounts and ratings are loaded again');
// Saving what was loaded must not lose anything, the old frontend sent the values back empty
$t->request('PUT', "/api/partys/$partyId", [
    'name' => $party['name'],
    'date' => $party['date'],
    'estimatedNumberOfPizzas' => $party['estimatedNumberOfPizzas'],
    'blendStatistics' => $party['blendStatistics'],
    'condiments' => $party['condimentCalculation'],
]);
$t->assertEquals($party['condimentCalculation'], $t->request('GET', "/api/partys/$partyId")->decoded()['condimentCalculation'], 'saving the loaded party keeps amounts and ratings');
$t->assertEquals(404, $t->request('PUT', '/api/partys/unknown', ['date' => '2021-12-05', 'condiments' => []])->status, 'update unknown party');

// --- Statistic --------------------------------------------------------------------------------

$statistic = [];
foreach ($t->request('GET', '/api/condiments/statistic')->decoded() as $condimentStatistic) {
    $statistic[$condimentStatistic['id']['value']] = $condimentStatistic;
}
// 3 orders in total (deleted ones count), Mozzarella on o1 and o2, Tomatensoße on o1, Gouda on deleted o3
$t->assertEquals(2 / 3 * 100, $statistic[1]['percentageOfOrders'], 'percentage of orders with Mozzarella');
$t->assertEquals(['greater' => null, 'match' => null, 'less' => [500.0, 500.0, 500.0]], $statistic[1]['statistic'], 'Mozzarella: 500g for 2 orders = 1 pizza, rated not enough');
$t->assertEquals(['greater' => [600.0, 600.0, 600.0], 'match' => null, 'less' => null], $statistic[3]['statistic'], 'Tomatensoße: 300ml for 1 order, rated too much');
$t->assertEquals(['greater' => null, 'match' => null, 'less' => null], $statistic[2]['statistic'], 'Gouda only on a deleted order');
$t->assertEquals(401, $t->request('GET', '/api/condiments/statistic', auth: null)->status, 'statistic requires login');

// --- Change password, last because it changes the login of all requests above --------------

$changePassword = static fn(string $old, string $new): array => ['oldPassword' => $old, 'newPassword' => $new];
$t->assertEquals(401, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'newsecret1'), auth: null)->status, 'change password requires login');
$response = $t->request('PUT', '/api/current-user/password', $changePassword('wrong', 'newsecret1'));
$t->assertEquals([400, 'Das bisherige Passwort ist falsch.'], [$response->status, $response->decoded()['message']], 'change password with wrong old password');
$t->assertEquals(400, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'short'))->status, 'new password too short');
$t->assertEquals(200, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'newsecret1'))->status, 'change password');
$t->assertEquals(401, $t->request('GET', '/api/current-user')->status, 'old password no longer works');
$t->assertEquals(200, $t->request('GET', '/api/current-user', auth: 'admin:newsecret1')->status, 'new password works');

echo "{$t->assertions} assertions, {$t->failures} failures\n";
exit($t->failures === 0 ? 0 : 1);
