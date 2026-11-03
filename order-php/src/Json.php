<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Http\HttpException;

/**
 * Reads request values the way Jackson did in the Java version.
 * Ids are serialized as {"value": ...}, a plain scalar is accepted as well.
 */
final class Json
{
    public static function object(mixed $value): array
    {
        if (!is_array($value) || array_is_list($value) && $value !== []) {
            throw new HttpException(400, 'JSON object expected');
        }
        return $value;
    }

    public static function list(mixed $value, string $field): array
    {
        if (!is_array($value) || !array_is_list($value)) {
            throw new HttpException(400, "Field '$field' must be a list");
        }
        return $value;
    }

    public static function stringId(mixed $id): ?string
    {
        $value = self::idValue($id);
        if ($value !== null && !is_scalar($value)) {
            throw new HttpException(400, 'Invalid id');
        }
        return $value === null ? null : (string) $value;
    }

    public static function intId(mixed $id): ?int
    {
        $value = self::idValue($id);
        return $value === null ? null : self::int($value);
    }

    public static function requiredStringId(mixed $id, string $field): string
    {
        return self::stringId($id) ?? throw new HttpException(400, "Field '$field' is required");
    }

    public static function int(mixed $value): int
    {
        return match (true) {
            $value === null => 0,
            is_int($value) => $value,
            is_float($value) => (int) $value,
            is_string($value) && is_numeric($value) => (int) $value,
            default => throw new HttpException(400, 'Number expected'),
        };
    }

    public static function float(mixed $value): ?float
    {
        return match (true) {
            $value === null => null,
            is_int($value), is_float($value) => (float) $value,
            is_string($value) && is_numeric($value) => (float) $value,
            default => throw new HttpException(400, 'Number expected'),
        };
    }

    public static function string(mixed $value): ?string
    {
        if ($value !== null && !is_scalar($value)) {
            throw new HttpException(400, 'String expected');
        }
        return $value === null ? null : (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);
    }

    private static function idValue(mixed $id): mixed
    {
        if (is_array($id)) {
            return $id['value'] ?? null;
        }
        return $id;
    }
}
