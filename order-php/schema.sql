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
    -- Role: 4 admin, 3 kitchen, 2 service, lower values can't log in
    degree INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE Link (
    id INT NOT NULL,
    identifier VARCHAR(255),
    eventId VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE UserSession (
    -- SHA-256 of the token, the token itself is only known to the browser
    tokenHash CHAR(64) NOT NULL,
    userId INT NOT NULL,
    created INT NOT NULL,
    lastUsed INT NOT NULL,
    PRIMARY KEY (tokenHash)
);

CREATE TABLE UserTotp (
    userId INT NOT NULL,
    -- base32, as shown to the authenticator app
    secret VARCHAR(64) NOT NULL,
    -- 0 while the user sets it up, logins only ask for codes once confirmed
    confirmed INT NOT NULL DEFAULT 0,
    -- time step of the last accepted code, each code is only accepted once
    lastStep INT NOT NULL DEFAULT 0,
    PRIMARY KEY (userId)
);

CREATE TABLE RateLimit (
    -- SHA-256 of e.g. "login-user:<name>"
    bucket CHAR(64) NOT NULL,
    time INT NOT NULL
);

CREATE INDEX RateLimitBucket ON RateLimit (bucket, time);
