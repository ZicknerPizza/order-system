<?php
declare(strict_types=1);

namespace OrderSystem\Http;

final class Request
{
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query = [],
        private readonly string $body = '',
        public readonly ?string $authorization = null,
    ) {
    }

    public static function fromGlobals(): self
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        // Allows the application to live in a sub directory of the web space
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
        if ($base !== '' && str_starts_with($path, $base . '/')) {
            $path = substr($path, strlen($base));
        }

        // PHP running as FastCGI only sees the header if .htaccess passes it on
        $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if (($authorization === null || $authorization === '') && isset($_SERVER['PHP_AUTH_USER'])) {
            $authorization = 'Basic ' . base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . ($_SERVER['PHP_AUTH_PW'] ?? ''));
        }

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $path,
            $_GET,
            (string) file_get_contents('php://input'),
            $authorization === '' ? null : $authorization,
        );
    }

    public function json(): mixed
    {
        if (trim($this->body) === '') {
            throw new HttpException(400, 'Required request body is missing');
        }
        try {
            return json_decode($this->body, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new HttpException(400, 'Malformed JSON');
        }
    }
}
