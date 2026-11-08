<?php
declare(strict_types=1);

namespace OrderSystem\Domain;

use OrderSystem\Http\HttpException;

/**
 * Jackson accepts an enum either by its name or by its ordinal, the frontend uses both.
 */
trait JsonEnum
{
    public static function fromJson(mixed $value): ?self
    {
        if ($value === null) {
            return null;
        }
        if (is_int($value) || is_string($value) && ctype_digit($value)) {
            return self::cases()[(int) $value] ?? throw new HttpException(400, 'Unknown ordinal ' . $value);
        }
        if (is_string($value)) {
            foreach (self::cases() as $case) {
                if ($case->name === $value) {
                    return $case;
                }
            }
        }
        throw new HttpException(400, 'Unknown value ' . json_encode($value));
    }
}
