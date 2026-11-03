<?php
declare(strict_types=1);

namespace OrderSystem;

use OrderSystem\Http\HttpException;

/**
 * The database stores unix timestamps, the API speaks ISO local dates in the configured time zone.
 */
final class Time
{
    public static function toLocalDateTime(mixed $epoch): ?string
    {
        if ($epoch === null || (int) $epoch === 0) {
            return null;
        }
        return date('Y-m-d\TH:i:s', (int) $epoch);
    }

    public static function toLocalDate(mixed $epoch): string
    {
        return date('Y-m-d', (int) $epoch);
    }

    /**
     * A party date is stored as 07:00 local time of that day, like Party.setDate() in the Java version.
     */
    public static function fromLocalDate(mixed $value): int
    {
        $date = is_string($value) ? \DateTimeImmutable::createFromFormat('!Y-m-d H:i', $value . ' 07:00') : false;
        if ($date === false || $date->format('Y-m-d') !== $value) {
            throw new HttpException(400, 'Date in format yyyy-MM-dd expected');
        }
        return $date->getTimestamp();
    }
}
