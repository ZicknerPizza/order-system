<?php
declare(strict_types=1);

namespace OrderSystem;

use PDO;

final class Database
{
    public function __construct(private readonly PDO $pdo)
    {
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    public function all(string $sql, array $params = []): array
    {
        $statement = $this->prepare($sql, $params);
        return $statement->fetchAll();
    }

    public function one(string $sql, array $params = []): ?array
    {
        $statement = $this->prepare($sql, $params);
        $row = $statement->fetch();
        return $row === false ? null : $row;
    }

    public function execute(string $sql, array $params = []): int
    {
        $statement = $this->prepare($sql, $params);
        return $statement->rowCount();
    }

    /**
     * Binds integers as integers, execute($params) would send everything as string.
     */
    private function prepare(string $sql, array $params): \PDOStatement
    {
        $statement = $this->pdo->prepare($sql);
        foreach (array_values($params) as $index => $value) {
            $type = match (true) {
                is_int($value) => PDO::PARAM_INT,
                $value === null => PDO::PARAM_NULL,
                default => PDO::PARAM_STR,
            };
            $statement->bindValue($index + 1, $value, $type);
        }
        $statement->execute();
        return $statement;
    }

    public function transactional(callable $callback): mixed
    {
        $this->pdo->beginTransaction();
        try {
            $result = $callback();
            $this->pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public static function placeholders(int $count): string
    {
        return implode(', ', array_fill(0, $count, '?'));
    }
}
