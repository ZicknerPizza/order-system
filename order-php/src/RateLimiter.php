<?php
declare(strict_types=1);

namespace OrderSystem;

/**
 * Counts events per bucket in the table RateLimit, e.g. failed logins of an IP address.
 */
final class RateLimiter
{
    private const KEEP_SECONDS = 86400;

    public function __construct(private readonly Database $db, private readonly \Closure $now)
    {
    }

    public function exceeded(string $bucket, int $max, int $seconds): bool
    {
        $count = $this->db->one(
            'SELECT COUNT(*) AS count FROM RateLimit WHERE bucket = ? AND time > ?',
            [self::key($bucket), ($this->now)() - $seconds]
        )['count'];
        return (int) $count >= $max;
    }

    public function hit(string $bucket): void
    {
        $now = ($this->now)();
        $this->db->execute('INSERT INTO RateLimit (bucket, time) VALUES (?, ?)', [self::key($bucket), $now]);
        // Old events are cleaned up now and then instead of by a cron job
        if (random_int(1, 100) === 1) {
            $this->db->execute('DELETE FROM RateLimit WHERE time < ?', [$now - self::KEEP_SECONDS]);
        }
    }

    public function clear(string $bucket): void
    {
        $this->db->execute('DELETE FROM RateLimit WHERE bucket = ?', [self::key($bucket)]);
    }

    /** User names and addresses are not stored in plain text */
    private static function key(string $bucket): string
    {
        return hash('sha256', $bucket);
    }
}
