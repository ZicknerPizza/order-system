<?php
declare(strict_types=1);

namespace OrderSystem\Http;

final class Router
{
    /** @var list<array{string, string, callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): Response
    {
        // Spring matches paths with and without trailing slash
        $path = rtrim($request->path, '/') ?: '/';
        $methodNotAllowed = false;

        foreach ($this->routes as [$method, $regex, $handler]) {
            if (!preg_match($regex, $path, $matches)) {
                continue;
            }
            if ($method !== $request->method) {
                $methodNotAllowed = true;
                continue;
            }
            $params = array_map('rawurldecode', array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY));
            return $handler($request, ...$params);
        }

        throw new HttpException($methodNotAllowed ? 405 : 404, $methodNotAllowed ? 'Method Not Allowed' : 'Not Found');
    }

    private function add(string $method, string $pattern, callable $handler): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler];
    }
}
