<?php
declare(strict_types=1);

namespace OrderSystem\Domain;

/**
 * The backing value is what PartyCondiment_mm.rating stores (ordinal - 1).
 */
enum Rating: int
{
    use JsonEnum;

    case NOT_ENOUGH = -1;
    case ENOUGH = 0;
    case TO_MUCH = 1;
}
