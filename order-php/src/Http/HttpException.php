<?php
declare(strict_types=1);

namespace OrderSystem\Http;

final class HttpException extends \RuntimeException
{
    /**
     * @param array $data additional fields of the error response, e.g. that a TOTP code is required
     */
    public function __construct(public readonly int $status, string $message = '', public readonly array $data = [])
    {
        parent::__construct($message);
    }
}
