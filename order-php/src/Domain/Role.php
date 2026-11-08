<?php
declare(strict_types=1);

namespace OrderSystem\Domain;

/**
 * Stored as SystemUser.degree, a higher role includes the rights of the lower ones.
 */
enum Role: int
{
    /** Takes orders in the kitchen, but does not bake */
    case SERVICE = 2;
    /** Bakes and manages parties, links and the shopping list */
    case KITCHEN = 3;
    /** Additionally manages the users */
    case ADMIN = 4;

    /** Users with a lower degree are deactivated */
    public static function fromDegree(int $degree): ?self
    {
        return match (true) {
            $degree >= self::ADMIN->value => self::ADMIN,
            $degree === self::KITCHEN->value => self::KITCHEN,
            $degree === self::SERVICE->value => self::SERVICE,
            default => null,
        };
    }

    public function includes(Role $role): bool
    {
        return $this->value >= $role->value;
    }
}
