<?php
declare(strict_types=1);

namespace OrderSystem\Http;

final class Response
{
    private const JSON_FLAGS = JSON_PRESERVE_ZERO_FRACTION | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR;

    public function __construct(
        public readonly int $status,
        public readonly ?string $body = null,
        public readonly string $contentType = 'application/json',
    ) {
    }

    public static function text(string $text): self
    {
        return new self(200, $text, 'text/plain; charset=utf-8');
    }

    public static function json(mixed $data): self
    {
        return new self(200, json_encode($data, self::JSON_FLAGS));
    }

    public static function ok(): self
    {
        return new self(200);
    }

    public static function noContent(): self
    {
        return new self(204);
    }

    public static function error(int $status, string $message, array $data = []): self
    {
        return new self($status, json_encode(['status' => $status, 'message' => $message, ...$data], self::JSON_FLAGS));
    }

    public function decoded(): mixed
    {
        return $this->body === null ? null : json_decode($this->body, true);
    }

    public function send(): void
    {
        http_response_code($this->status);
        // Same defaults as Spring Security, the kitchen view relies on uncached polling
        header('Cache-Control: no-cache, no-store, max-age=0, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        if ($this->body !== null) {
            header('Content-Type: ' . $this->contentType);
            echo $this->body;
        }
    }
}
