-- Condiments that ran out during a party and the global amount per pizza for the shopping list.
-- Run once on an existing database after 001, e.g. in phpMyAdmin. schema.sql already contains this.

CREATE TABLE IF NOT EXISTS PartyCondimentSoldOut (
    partyId VARCHAR(255) NOT NULL,
    condimentId INT NOT NULL,
    PRIMARY KEY (partyId, condimentId)
);

-- Set by admins on the party page, without a value the statistic of past parties is used
ALTER TABLE Condiment ADD COLUMN amountPerPizza DOUBLE NULL;
