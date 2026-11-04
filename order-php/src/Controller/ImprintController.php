<?php
declare(strict_types=1);

namespace OrderSystem\Controller;

use OrderSystem\Http\HttpException;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;

/**
 * Person and address of the imprint come from config.php, so they are not part of the code.
 */
final class ImprintController
{
    public function __construct(private readonly array $imprint)
    {
    }

    public function find(Request $request): Response
    {
        $name = $this->optional('name');
        if ($name === null) {
            throw new HttpException(404, 'Imprint is not configured');
        }
        return Response::json([
            'name' => $name,
            'address' => array_values(array_map(
                static fn(mixed $line): string => trim((string) $line),
                (array) ($this->imprint['address'] ?? [])
            )),
            'email' => $this->optional('email'),
            'phone' => $this->optional('phone'),
        ]);
    }

    private function optional(string $key): ?string
    {
        $value = trim((string) ($this->imprint[$key] ?? ''));
        return $value === '' ? null : $value;
    }
}
