-- Sessions instead of HTTP Basic, TOTP as second factor and the counters for rate limits.
-- Run once on an existing database, e.g. in phpMyAdmin. schema.sql already contains these tables.

CREATE TABLE IF NOT EXISTS UserSession (
    -- SHA-256 of the token, the token itself is only known to the browser
    tokenHash CHAR(64) NOT NULL,
    userId INT NOT NULL,
    created INT NOT NULL,
    lastUsed INT NOT NULL,
    PRIMARY KEY (tokenHash)
);

CREATE TABLE IF NOT EXISTS UserTotp (
    userId INT NOT NULL,
    -- base32, as shown to the authenticator app
    secret VARCHAR(64) NOT NULL,
    -- 0 while the user sets it up, logins only ask for codes once confirmed
    confirmed INT NOT NULL DEFAULT 0,
    -- time step of the last accepted code, each code is only accepted once
    lastStep INT NOT NULL DEFAULT 0,
    PRIMARY KEY (userId)
);

CREATE TABLE IF NOT EXISTS RateLimit (
    -- SHA-256 of e.g. "login-user:<name>"
    bucket CHAR(64) NOT NULL,
    time INT NOT NULL
);

CREATE INDEX RateLimitBucket ON RateLimit (bucket, time);
