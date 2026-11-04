<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Controller\CondimentController;
use OrderSystem\Controller\ImprintController;
use OrderSystem\Controller\LinkController;
use OrderSystem\Controller\OrderController;
use OrderSystem\Controller\PartyController;
use OrderSystem\Controller\UserController;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Http\Router;

final class App
{
    private readonly \Closure $now;

    /** @param array $imprint 'imprint' section of config.php */
    public function __construct(
        private readonly Database $db,
        ?\Closure $now = null,
        private readonly array $imprint = [],
    ) {
        $this->now = $now ?? static fn(): int => time();
    }

    public function handle(Request $request): Response
    {
        try {
            $auth = Auth::fromHeader($this->db, $request->authorization);
            return $this->createRouter($auth)->dispatch($request);
        } catch (HttpException $e) {
            return Response::error($e->status, $e->getMessage());
        } catch (\Throwable $e) {
            error_log((string) $e);
            return Response::error(500, 'Internal Server Error');
        }
    }

    private function createRouter(Auth $auth): Router
    {
        $condiments = new CondimentController($this->db, $auth);
        $links = new LinkController($this->db, $auth);
        $orders = new OrderController($this->db, $auth, $this->now);
        $parties = new PartyController($this->db, $auth);
        $users = new UserController($this->db, $auth);
        $imprint = new ImprintController($this->imprint);

        $router = new Router();

        $router->get('/api/imprint', $imprint->find(...));

        $router->get('/api/condiments', $condiments->findAll(...));
        $router->get('/api/condiments/statistic', $condiments->findCondimentStatistic(...));

        $router->get('/api/current-user', $users->getCurrentUser(...));
        $router->put('/api/current-user/password', $users->changePassword(...));

        $router->get('/api/links', $links->findAll(...));
        $router->get('/api/links/search', $links->findByIdentifier(...));
        $router->put('/api/links/{linkId}', $links->update(...));

        $router->get('/api/orders/{partyId}', $orders->findOrdersForParty(...));
        $router->post('/api/orders/{partyId}', $orders->createOrder(...));
        $router->put('/api/orders/{partyId}/status', $orders->changeStatus(...));
        $router->post('/api/orders/{partyId}/{key}', $orders->createOrderWithKey(...));
        $router->delete('/api/orders/{partyId}/{orderId}', $orders->delete(...));

        $router->get('/api/partys', $parties->findAll(...));
        $router->post('/api/partys', $parties->create(...));
        $router->get('/api/partys/{partyId}', $parties->findById(...));
        $router->put('/api/partys/{partyId}', $parties->update(...));
        $router->get('/api/partys/{partyId}/{partyKey}', $parties->findByIdAndKey(...));

        return $router;
    }
}
