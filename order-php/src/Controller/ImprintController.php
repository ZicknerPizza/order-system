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
    public function __construct(private readonly array $imprint, private readonly \Closure $now)
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

    /**
     * Contact for reporting security problems (RFC 9116), generated so the address stays in config.php.
     */
    public function securityTxt(Request $request): Response
    {
        $email = $this->optional('email') ?? throw new HttpException(404, 'Not Found');
        return Response::text(
            "Contact: mailto:$email\n"
            . 'Expires: ' . gmdate('Y-m-d\\TH:i:s\\Z', ($this->now)() + 365 * 86400) . "\n"
            . "Preferred-Languages: de, en\n"
        );
    }

    private function optional(string $key): ?string
    {
        $value = trim((string) ($this->imprint[$key] ?? ''));
        return $value === '' ? null : $value;
    }
}
