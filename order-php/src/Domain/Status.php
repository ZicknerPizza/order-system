<?php
declare(strict_types=1);

namespace OrderSystem\Domain;

/**
 * Stored as ordinal in PizzaOrder.status.
 */
enum Status: int
{
    use JsonEnum;

    case INACTIVE = 0;
    case WAITING = 1;
    case TOPPING = 2;
    case BAKING = 3;
    case EATING = 4;
    case DELETED = 5;

    public function isAtLeast(Status $status): bool
    {
        return $this->value >= $status->value;
    }

    public function isValidTransaction(Status $destination): bool
    {
        $destinations = match ($this) {
            self::INACTIVE => [self::WAITING, self::DELETED],
            self::WAITING => [self::INACTIVE, self::TOPPING, self::DELETED],
            self::TOPPING => [self::WAITING, self::BAKING],
            self::BAKING => [self::EATING],
            self::EATING, self::DELETED => [],
        };
        return in_array($destination, $destinations, true);
    }
}
