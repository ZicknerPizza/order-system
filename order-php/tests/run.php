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
use OrderSystem\Totp;

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

    /** @var array<string, string> session token per "name:password" */
    private array $sessions = [];

    /**
     * @param string|null $auth "name:password", logs in once and reuses the session
     */
    public function request(string $method, string $path, mixed $body = null, ?string $auth = 'admin:secret', array $query = [], string $ip = ''): Response
    {
        $authorization = null;
        if ($auth !== null) {
            $token = $this->sessions[$auth] ?? null;
            if ($token === null) {
                [$name, $password] = explode(':', $auth, 2);
                $token = $this->login($name, $password)->decoded()['token'] ?? 'invalid';
                if ($token !== 'invalid') {
                    $this->sessions[$auth] = $token;
                }
            }
            $authorization = "Bearer $token";
        }
        $response = $this->app->handle(new Request(
            $method,
            $path,
            $query,
            $body === null ? '' : json_encode($body),
            $authorization,
            $ip,
        ));
        // Tests move the clock forward, a stored session may have expired meanwhile
        if ($auth !== null && isset($this->sessions[$auth]) && ($response->decoded()['message'] ?? null) === 'Session expired') {
            unset($this->sessions[$auth]);
            return $this->request($method, $path, $body, $auth, $query, $ip);
        }
        return $response;
    }

    public function login(string $name, string $password, ?string $code = null, string $ip = ''): Response
    {
        $body = ['name' => $name, 'password' => $password] + ($code === null ? [] : ['code' => $code]);
        return $this->app->handle(new Request('POST', '/api/session', [], json_encode($body), null, $ip));
    }

    public function forgetSessions(): void
    {
        $this->sessions = [];
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
        // Hash as written by Spring's BCryptPasswordEncoder for "secret"
        $hash = str_replace('$2y$', '$2a$', password_hash('secret', PASSWORD_BCRYPT));
        $this->db->execute(
            "INSERT INTO SystemUser (id, name, password, degree) VALUES
                (1, 'admin', ?, 4), (2, 'koch', ?, 3), (3, 'service', ?, 2), (4, 'alt', ?, 0)",
            [$hash, $hash, $hash, $hash]
        );
        $this->db->execute("INSERT INTO CondimentCategory (id, name, sorting) VALUES (1, 'Käse', 2), (2, 'Soße', 1)");
        $this->db->execute("INSERT INTO Condiment (id, name, sorting, unit, parent_id) VALUES
            (1, 'Mozzarella', 2, 'g', 1), (2, 'Gouda', 1, 'g', 1), (3, 'Tomatensoße', 1, 'ml', 2)");
        $this->db->execute("INSERT INTO Link (id, identifier, eventId) VALUES (1, 'weihnachten', NULL)");
    }
}

$t = new TestContext();
$partyId = 'party-1';

// --- Authentication ---------------------------------------------------------------------------

$t->assertEquals(['name' => 'admin', 'role' => 'ADMIN', 'totp' => false], $t->request('GET', '/api/current-user')->decoded(), 'login with correct credentials returns the role');
$t->assertEquals(['name' => 'service', 'role' => 'SERVICE', 'totp' => false], $t->request('GET', '/api/current-user', auth: 'service:secret')->decoded(), 'service role');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: 'alt:secret')->status, 'users without role are deactivated');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: 'admin:wrong')->status, 'login with wrong password');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: null)->status, 'current user without login');
$t->assertEquals(401, $t->request('GET', '/api/condiments', auth: 'nobody:x')->status, 'wrong credentials are rejected on public endpoints');
$t->assertEquals(401, $t->request('GET', '/api/partys', auth: null)->status, 'party list requires login');
$t->assertEquals(404, $t->request('GET', '/api/unknown')->status, 'unknown endpoint');
$t->assertEquals(405, $t->request('DELETE', '/api/partys')->status, 'unsupported method');

// --- Imprint ----------------------------------------------------------------------------------

$t->assertEquals(404, $t->request('GET', '/api/imprint', auth: null)->status, 'imprint without configuration');
$imprintApp = new App($t->db, fn(): int => $t->now, imprint: [
    'name' => 'Max Mustermann',
    'address' => ['Musterstraße 1', '12345 Musterstadt'],
    'email' => 'max@example.com',
    'phone' => '',
]);
$t->assertEquals([
    'name' => 'Max Mustermann',
    'address' => ['Musterstraße 1', '12345 Musterstadt'],
    'email' => 'max@example.com',
    'phone' => null,
], $imprintApp->handle(new Request('GET', '/api/imprint'))->decoded(), 'imprint from configuration without login');
$securityTxt = $imprintApp->handle(new Request('GET', '/.well-known/security.txt'));
$t->assertEquals(
    ['text/plain; charset=utf-8', "Contact: mailto:max@example.com\nExpires: " . gmdate('Y-m-d\\TH:i:s\\Z', $t->now + 365 * 86400) . "\nPreferred-Languages: de, en\n"],
    [$securityTxt->contentType, $securityTxt->body],
    'security.txt with the contact of the imprint'
);
$t->assertEquals(404, $t->request('GET', '/.well-known/security.txt', auth: null)->status, 'no security.txt without contact');

// --- Condiments -------------------------------------------------------------------------------

$t->assertEquals([
    ['id' => ['value' => 3], 'category' => 'Soße', 'name' => 'Tomatensoße', 'unit' => 'ml', 'amountPerPizza' => null],
    ['id' => ['value' => 2], 'category' => 'Käse', 'name' => 'Gouda', 'unit' => 'g', 'amountPerPizza' => null],
    ['id' => ['value' => 1], 'category' => 'Käse', 'name' => 'Mozzarella', 'unit' => 'g', 'amountPerPizza' => null],
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
    'soldOut' => [],
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

$t->assertEquals(401, $t->request('DELETE', "/api/orders/$partyId/o3", auth: null)->status, 'deleting orders requires login');
$t->assertEquals(404, $t->request('DELETE', "/api/orders/party-old/o3")->status, 'order of another party is not deleted');
$t->assertEquals(200, $t->request('DELETE', "/api/orders/$partyId/o3")->status, 'delete order');
$t->assertEquals(200, $t->request('DELETE', "/api/orders/$partyId/o1")->status, 'deleting an eaten order is ignored');
$t->assertEquals(['o2', 'o1'], array_map(static fn(array $o): string => $o['orderId']['value'], $t->request('GET', "/api/orders/$partyId")->decoded()), 'deleted orders are hidden');
$t->assertEquals(404, $t->request('DELETE', "/api/orders/$partyId/missing")->status, 'delete unknown order');

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

// --- Roles ------------------------------------------------------------------------------------

$service = 'service:secret';
$kitchen = 'koch:secret';
$t->assertEquals(200, $t->request('GET', '/api/partys', auth: $service)->status, 'service sees the parties');
$t->assertEquals(200, $t->request('GET', "/api/orders/$partyId", auth: $service)->status, 'service sees the orders');
$t->assertEquals(403, $t->request('POST', '/api/partys', [...$createParty, 'id' => ['value' => 'p-service']], auth: $service)->status, 'service creates no parties');
$t->assertEquals(403, $t->request('GET', '/api/condiments/statistic', auth: $service)->status, 'service sees no statistic');
$t->assertEquals(403, $t->request('GET', '/api/links', auth: $service)->status, 'service manages no links');
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId", $order('o5', 'Svenja', [1]), auth: $service)->status, 'service takes orders');
$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o5'], 'INACTIVE'), auth: $service)->status, 'service deactivates orders');
$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o5'], 'WAITING'), auth: $service)->status, 'service activates orders');
$t->assertEquals(403, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o5'], 'TOPPING'), auth: $service)->status, 'service does not bake');
$t->assertEquals(200, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o5'], 'TOPPING'), auth: $kitchen)->status, 'kitchen bakes');
$t->assertEquals(403, $t->request('PUT', "/api/orders/$partyId/status", $changeStatus(['o5'], 'WAITING'), auth: $service)->status, 'service does not move pizzas back from the kitchen');
$t->assertEquals(200, $t->request('GET', '/api/condiments/statistic', auth: $kitchen)->status, 'kitchen sees the statistic');

// --- User management --------------------------------------------------------------------------

$t->assertEquals(403, $t->request('GET', '/api/users', auth: $kitchen)->status, 'only admins manage users');
$t->assertEquals([
    ['id' => 1, 'name' => 'admin', 'role' => 'ADMIN', 'totp' => false],
    ['id' => 4, 'name' => 'alt', 'role' => null, 'totp' => false],
    ['id' => 2, 'name' => 'koch', 'role' => 'KITCHEN', 'totp' => false],
    ['id' => 3, 'name' => 'service', 'role' => 'SERVICE', 'totp' => false],
], $t->request('GET', '/api/users')->decoded(), 'user list sorted by name');

$newUser = ['name' => 'neu', 'role' => 'KITCHEN', 'password' => 'geheim123'];
$t->assertEquals(403, $t->request('POST', '/api/users', $newUser, auth: $kitchen)->status, 'kitchen creates no users');
$t->assertEquals(400, $t->request('POST', '/api/users', [...$newUser, 'password' => 'kurz'])->status, 'password too short');
$t->assertEquals(400, $t->request('POST', '/api/users', [...$newUser, 'role' => 'CHEF'])->status, 'unknown role');
$t->assertEquals(400, $t->request('POST', '/api/users', [...$newUser, 'name' => ' '])->status, 'user without name');
$t->assertEquals(204, $t->request('POST', '/api/users', $newUser)->status, 'create user');
$t->assertEquals(400, $t->request('POST', '/api/users', $newUser)->status, 'user name already taken');
$t->assertEquals(['name' => 'neu', 'role' => 'KITCHEN', 'totp' => false], $t->request('GET', '/api/current-user', auth: 'neu:geheim123')->decoded(), 'new user can log in');
$t->assertEquals(200, $t->request('PUT', '/api/users/5/password', ['password' => 'anders123'])->status, 'set password of a user');
$t->assertEquals(200, $t->request('GET', '/api/current-user', auth: 'neu:anders123')->status, 'user logs in with the set password');
$t->assertEquals(404, $t->request('PUT', '/api/users/99/password', ['password' => 'anders123'])->status, 'set password of unknown user');
$t->assertEquals(400, $t->request('DELETE', '/api/users/1')->status, 'admins cannot delete themselves');
$t->assertEquals(200, $t->request('DELETE', '/api/users/5')->status, 'delete user');
$t->assertEquals(401, $t->request('GET', '/api/current-user', auth: 'neu:anders123')->status, 'deleted user cannot log in');
$t->assertEquals(404, $t->request('DELETE', '/api/users/5')->status, 'delete unknown user');

// --- Change password, last because it changes the login of all requests above --------------

$changePassword = static fn(string $old, string $new): array => ['oldPassword' => $old, 'newPassword' => $new];
$t->assertEquals(401, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'newsecret1'), auth: null)->status, 'change password requires login');
$response = $t->request('PUT', '/api/current-user/password', $changePassword('wrong', 'newsecret1'));
$t->assertEquals([400, 'Das bisherige Passwort ist falsch.'], [$response->status, $response->decoded()['message']], 'change password with wrong old password');
$t->assertEquals(400, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'short'))->status, 'new password too short');
$t->assertEquals(200, $t->request('PUT', '/api/current-user/password', $changePassword('secret', 'newsecret1'))->status, 'change password');
$t->assertEquals(200, $t->request('GET', '/api/current-user')->status, 'the own session stays after changing the password');
$t->assertEquals(401, $t->login('admin', 'secret')->status, 'old password no longer works');
$t->assertEquals(200, $t->request('GET', '/api/current-user', auth: 'admin:newsecret1')->status, 'new password works');

// --- Sessions -----------------------------------------------------------------------------------

$login = $t->login('koch', 'secret')->decoded();
$t->assertEquals(['KITCHEN', false, 64], [$login['role'], $login['totp'], strlen($login['token'])], 'login returns a session token');
$bearer = static fn(string $token): string => "Bearer $token";
$asToken = static fn(string $token, string $method, string $path, mixed $body = null): Response =>
    $t->app->handle(new Request($method, $path, [], $body === null ? '' : json_encode($body), $bearer($token)));
$t->assertEquals(200, $asToken($login['token'], 'GET', '/api/current-user')->status, 'session works');
$t->assertEquals(200, $asToken($login['token'], 'DELETE', '/api/session')->status, 'logout');
$t->assertEquals(401, $asToken($login['token'], 'GET', '/api/current-user')->status, 'session ends with logout');
$t->assertEquals(401, $t->request('GET', '/api/condiments', auth: 'admin:falsch')->status, 'unknown session token is rejected everywhere');

$idle = $t->login('koch', 'secret')->decoded()['token'];
$t->now += 29 * 86400;
$t->assertEquals(200, $asToken($idle, 'GET', '/api/current-user')->status, 'session used within 30 days');
$t->now += 29 * 86400;
$t->assertEquals(200, $asToken($idle, 'GET', '/api/current-user')->status, 'using a session keeps it alive');
$t->now += 31 * 86400;
$t->assertEquals(401, $asToken($idle, 'GET', '/api/current-user')->status, 'session ends after 30 days without use');

$kochSession = $t->login('koch', 'secret')->decoded()['token'];
$t->request('PUT', '/api/users/2/password', ['password' => 'kochneu123'], auth: 'admin:newsecret1');
$t->assertEquals(401, $asToken($kochSession, 'GET', '/api/current-user')->status, 'setting the password ends the sessions of the user');

// --- Login throttling ---------------------------------------------------------------------------

for ($i = 0; $i < 5; $i++) {
    $t->login('koch', 'falsch', ip: '10.0.0.1');
}
$t->assertEquals(429, $t->login('koch', 'kochneu123', ip: '10.0.0.2')->status, 'user is locked after 5 failures, from every address');
$t->assertEquals(200, $t->login('service', 'secret', ip: '10.0.0.1')->status, 'other users of the address can still log in');
$t->now += 901;
$t->assertEquals(200, $t->login('koch', 'kochneu123')->status, 'lock ends after 15 minutes');
for ($i = 0; $i < 20; $i++) {
    $t->login("gast$i", 'falsch', ip: '10.0.0.3');
}
$t->assertEquals(429, $t->login('service', 'secret', ip: '10.0.0.3')->status, 'address is locked after 20 failures');
$t->assertEquals(200, $t->login('service', 'secret', ip: '10.0.0.4')->status, 'other addresses are not locked');
$t->now += 901;

// --- TOTP ---------------------------------------------------------------------------------------

$koch = 'koch:kochneu123';
$setup = $t->request('POST', '/api/current-user/totp', auth: $koch)->decoded();
$t->assertEquals(true, str_starts_with($setup['uri'], 'otpauth://totp/zickner.pizza:koch?secret=' . $setup['secret']), 'setup returns the otpauth uri');
$t->assertEquals(200, $t->login('koch', 'kochneu123')->status, 'unconfirmed TOTP is not asked for');
$t->assertEquals(400, $t->request('PUT', '/api/current-user/totp', ['code' => '000000'], auth: $koch)->status, 'wrong code does not confirm');
$code = Totp::code($setup['secret'], intdiv($t->now, 30));
$t->assertEquals(200, $t->request('PUT', '/api/current-user/totp', ['code' => $code], auth: $koch)->status, 'confirm TOTP');
$t->assertEquals(true, $t->request('GET', '/api/current-user', auth: $koch)->decoded()['totp'], 'current user has TOTP');
$t->assertEquals(400, $t->request('POST', '/api/current-user/totp', auth: $koch)->status, 'TOTP cannot be set up twice');

$response = $t->login('koch', 'kochneu123');
$t->assertEquals([401, true], [$response->status, $response->decoded()['totpRequired'] ?? false], 'login asks for the code');
$t->assertEquals(401, $t->login('koch', 'kochneu123', '123456')->status, 'wrong code');
$t->assertEquals(401, $t->login('koch', 'falsch', Totp::code($setup['secret'], intdiv($t->now, 30) + 1))->status, 'code does not help with a wrong password');
$t->now += 30;
$code = Totp::code($setup['secret'], intdiv($t->now, 30));
$t->assertEquals(200, $t->login('koch', 'kochneu123', $code)->status, 'login with password and code');
$t->assertEquals(401, $t->login('koch', 'kochneu123', $code)->status, 'a code is only accepted once');
$t->now += 60;
$t->assertEquals(200, $t->login('koch', 'kochneu123', Totp::code($setup['secret'], intdiv($t->now, 30) - 1))->status, 'unused code of the previous step is accepted');

$t->assertEquals(true, $t->request('GET', '/api/users', auth: 'admin:newsecret1')->decoded()[2]['totp'], 'admin sees who uses TOTP');
$t->assertEquals(403, $t->request('DELETE', '/api/users/2/totp', auth: $koch)->status, 'only admins reset TOTP');
$t->assertEquals(200, $t->request('DELETE', '/api/users/2/totp', auth: 'admin:newsecret1')->status, 'admin resets TOTP of a lost phone');
$t->assertEquals(200, $t->login('koch', 'kochneu123')->status, 'after the reset the password is enough');

$setup = $t->request('POST', '/api/current-user/totp', auth: $koch)->decoded();
$t->request('PUT', '/api/current-user/totp', ['code' => Totp::code($setup['secret'], intdiv($t->now, 30))], auth: $koch);
$t->assertEquals(400, $t->request('DELETE', '/api/current-user/totp', ['password' => 'falsch'], auth: $koch)->status, 'disabling TOTP needs the password');
$t->assertEquals(200, $t->request('DELETE', '/api/current-user/totp', ['password' => 'kochneu123'], auth: $koch)->status, 'user disables TOTP');
$t->assertEquals(false, $t->request('GET', '/api/current-user', auth: $koch)->decoded()['totp'], 'TOTP is off');

// --- Guest limits and input lengths -------------------------------------------------------------

for ($i = 0; $i < 60; $i++) {
    $t->request('POST', "/api/orders/$partyId/abcd1234", $order("g$i", "Gast $i", []), auth: null, ip: '10.0.0.5');
}
$t->assertEquals(429, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('g60', 'Gast', []), auth: null, ip: '10.0.0.5')->status, 'guest orders are limited per address');
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('g61', 'Gast', []), auth: null, ip: '10.0.0.6')->status, 'other addresses can still order');
$response = $t->request('POST', "/api/orders/$partyId/abcd1234", $order('g62', str_repeat('x', 256), []), auth: null, ip: '10.0.0.6');
$t->assertEquals([400, 'Der Name darf höchstens 255 Zeichen lang sein.'], [$response->status, $response->decoded()['message']], 'names are limited to the column length');
$t->assertEquals(400, $t->request('POST', '/api/partys', [...$createParty, 'id' => ['value' => 'p-key'], 'key' => '123456789'], auth: 'admin:newsecret1')->status, 'party keys have at most 8 characters');
$t->assertEquals(400, $t->request('POST', '/api/users', ['name' => 'lang', 'role' => 'SERVICE', 'password' => str_repeat('x', 73)], auth: 'admin:newsecret1')->status, 'bcrypt only uses 72 characters');

// --- Sold out condiments and amount per pizza --------------------------------------------------

$soldOut = static fn(bool $value): array => ['soldOut' => $value];
$t->assertEquals(401, $t->request('PUT', "/api/partys/$partyId/sold-out/1", $soldOut(true), auth: null)->status, 'marking sold out requires login');
$t->assertEquals(200, $t->request('PUT', "/api/partys/$partyId/sold-out/1", $soldOut(true), auth: 'service:secret')->status, 'service marks a condiment as sold out');
$t->assertEquals(200, $t->request('PUT', "/api/partys/$partyId/sold-out/1", $soldOut(true), auth: 'service:secret')->status, 'marking twice does not fail');
$t->assertEquals(404, $t->request('PUT', "/api/partys/$partyId/sold-out/99", $soldOut(true), auth: 'service:secret')->status, 'unknown condiment');
$t->assertEquals(400, $t->request('PUT', "/api/partys/$partyId/sold-out/1", ['soldOut' => 'ja'], auth: 'service:secret')->status, 'soldOut must be a boolean');
$t->assertEquals([['value' => 1]], $t->request('GET', "/api/partys/$partyId/abcd1234", auth: null)->decoded()['soldOut'], 'guests see what is sold out');
$response = $t->request('POST', "/api/orders/$partyId/abcd1234", $order('s1', 'Sina', [1, 3]), auth: null, ip: '10.0.0.7');
$t->assertEquals([400, 'Mozzarella ist leider aus.'], [$response->status, $response->decoded()['message']], 'sold out condiments cannot be ordered');
$t->assertEquals(400, $t->request('POST', "/api/orders/$partyId", $order('s2', 'Sina', [1]), auth: 'service:secret')->status, 'also not in the kitchen');
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('s3', 'Sina', [3]), auth: null, ip: '10.0.0.7')->status, 'other condiments can be ordered');
$t->assertEquals(200, $t->request('PUT', "/api/partys/$partyId/sold-out/1", $soldOut(false), auth: 'service:secret')->status, 'condiment is available again');
$t->assertEquals([], $t->request('GET', "/api/partys/$partyId", auth: 'service:secret')->decoded()['soldOut'], 'nothing sold out any more');
$t->assertEquals(204, $t->request('POST', "/api/orders/$partyId/abcd1234", $order('s4', 'Sina', [1]), auth: null, ip: '10.0.0.7')->status, 'available condiment can be ordered again');

$admin = 'admin:newsecret1';
$t->assertEquals(403, $t->request('PUT', '/api/condiments/1', ['amountPerPizza' => 120], auth: 'service:secret')->status, 'only admins set the amount per pizza');
$t->assertEquals(400, $t->request('PUT', '/api/condiments/1', ['amountPerPizza' => -1], auth: $admin)->status, 'no negative amount');
$t->assertEquals(404, $t->request('PUT', '/api/condiments/99', ['amountPerPizza' => 1], auth: $admin)->status, 'unknown condiment');
$t->assertEquals(200, $t->request('PUT', '/api/condiments/1', ['amountPerPizza' => 120.5], auth: $admin)->status, 'admin sets the amount per pizza');
$amounts = array_column($t->request('GET', '/api/condiments', auth: null)->decoded(), 'amountPerPizza', 'name');
$t->assertEquals(['Tomatensoße' => null, 'Gouda' => null, 'Mozzarella' => 120.5], $amounts, 'amount per pizza in the condiment list');
$t->assertEquals(200, $t->request('PUT', '/api/condiments/1', ['amountPerPizza' => null], auth: $admin)->status, 'amount can be removed again');

echo "{$t->assertions} assertions, {$t->failures} failures\n";
exit($t->failures === 0 ? 0 : 1);
