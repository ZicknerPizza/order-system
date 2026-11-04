<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Controller\CondimentController;
use OrderSystem\Controller\LinkController;
use OrderSystem\Controller\OrderController;
use OrderSystem\Controller\PartyController;
use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;
use OrderSystem\Http\Router;

final class App
{
    private readonly \Closure $now;

    public function __construct(private readonly Database $db, ?\Closure $now = null)
    {
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

        $router = new Router();

        $router->get('/api/condiments', $condiments->findAll(...));
        $router->get('/api/condiments/statistic', $condiments->findCondimentStatistic(...));

        // The login form calls this endpoint to verify the credentials
        $router->get('/api/current-user', static function () use ($auth): Response {
            $auth->requireAdmin();
            return Response::ok();
        });

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
