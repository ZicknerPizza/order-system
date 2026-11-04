-- Schema as mapped by the JPA entities of the Java version (CompatibilityNamingStrategy keeps the names as is).
-- Only needed for a fresh database, an existing database is used unchanged.
-- Kept free of MySQL specific syntax so the tests can load it into SQLite.

CREATE TABLE CondimentCategory (
    id INT NOT NULL,
    name VARCHAR(255),
    sorting INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE Condiment (
    id INT NOT NULL,
    name VARCHAR(255),
    sorting INT NOT NULL,
    unit VARCHAR(255),
    parent_id INT,
    PRIMARY KEY (id)
);

CREATE TABLE Party (
    id VARCHAR(255) NOT NULL,
    party VARCHAR(255),
    `key` VARCHAR(255),
    aktiv INT NOT NULL,
    countPizza INT NOT NULL,
    blendStatistics INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE PartyCondiment_mm (
    Party_id VARCHAR(255) NOT NULL,
    condiment_id INT,
    amount DOUBLE,
    rating INT
);

CREATE TABLE PizzaOrder (
    id VARCHAR(255) NOT NULL,
    party VARCHAR(255),
    name VARCHAR(255),
    comment VARCHAR(255),
    status INT,
    time INT NOT NULL,
    timeTopping INT,
    timeStove INT,
    -- Oven compartment: go = upper, gu = lower
    stove VARCHAR(255) NOT NULL DEFAULT '',
    timeFinished INT,
    PRIMARY KEY (id)
);

CREATE TABLE PizzaOrderCondiment_mm (
    orderId VARCHAR(255) NOT NULL,
    condimentId INT
);

CREATE TABLE SystemUser (
    id INT NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE Link (
    id INT NOT NULL,
    identifier VARCHAR(255),
    eventId VARCHAR(255),
    PRIMARY KEY (id)
);
