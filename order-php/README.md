# order-php

PHP backend for the pizza order system, for shared hosting (all-inkl.com). It replaced the former
Spring Boot backend with the same REST API, so the database of the Java version is used as is.
The frontend is `order-frontend`.

No dependencies, no Composer: upload the files and it runs. Requires PHP 8.1 or newer with `pdo_mysql`.

## Layout

```
order-php/
├── config.php          # database credentials (create from config.example.php, not in git)
├── schema.sql          # only for a fresh database
├── src/                # backend code, not reachable from the web
├── tests/run.php       # API tests against SQLite
└── public/             # document root of the domain
    ├── .htaccess       # /api/* → api.php, everything else → Angular app
    ├── api.php
    └── index.html, bundle_*.js, ...   # built frontend, copied in during deployment
```

## Deployment on all-inkl

1. **Database**: export the existing database (`mysqldump pizza > pizza.sql`) and import it in
   the all-inkl KAS via phpMyAdmin, then run the scripts in `migrations/` in their order.
   For a fresh installation import `schema.sql` instead, it already contains the migrations.
2. **Check the schema** once: the column names were derived from the JPA mappings. Compare with
   `SHOW CREATE TABLE PartyCondiment_mm;` – the column referencing the party must be `Party_id`.
   If it is named differently, adjust `PartyController::PARTY_CONDIMENT_PARTY_COLUMN`.
3. **Build the frontend** (`order-frontend`, output lands in `order-frontend/dist/order-frontend/browser/`):
   ```
   cd order-frontend && npm ci && npm run build
   ```
4. **Copy** the build output into `order-php/public/`.
5. **Config**: copy `config.example.php` to `config.php` and enter the database credentials from the KAS
   and the person and address for the imprint (`imprint`). Without it the imprint shows a warning.
6. **Upload** the whole `order-php` folder via FTP and set the document root of the domain in the KAS
   to `order-php/public`. In the KAS select PHP 8.1 or newer for the domain and set up a Let's Encrypt
   certificate: `public/.htaccess` redirects every request to HTTPS.
7. **Smoke test**: open the site, log in, open the kitchen view of a party.

Users are taken over from the `SystemUser` table, the bcrypt hashes of Spring Security are compatible.
The role is the column `degree`:

| degree | Role | Rights |
|---|---|---|
| 4 | Admin | everything, including the user management |
| 3 | Kitchen | parties, links, statistic, kitchen and baking |
| 2 | Service | party list and kitchen, takes and (de)activates orders, does not bake |
| lower | – | deactivated, can't log in |

Admins manage users on the page "Benutzerverwaltung". The first admin of a fresh database is created with
```
php -r "echo password_hash('PASSWORD', PASSWORD_BCRYPT), PHP_EOL;"
```
and `INSERT INTO SystemUser (id, name, password, degree) VALUES (1, 'name', '<hash>', 4);`

## Tests

```
php tests/run.php
```

## REST API

| Method | Path | Role | Response |
|---|---|---|---|
| GET | `/api/condiments` | – | condiments sorted by category |
| GET | `/api/condiments/statistic` | kitchen | amount per pizza by rating |
| PUT | `/api/condiments/{condimentId}` | admin | 200, `{amountPerPizza}` for all parties, `null` uses the statistic |
| POST | `/api/session` | – | login `{name, password, code?}`, returns `{token, name, role, totp}` |
| DELETE | `/api/session` | – | logout, ends the session |
| GET | `/api/current-user` | service | name, role and whether TOTP is on |
| PUT | `/api/current-user/password` | service | 200, `{oldPassword, newPassword}`, ends the other sessions |
| POST | `/api/current-user/totp` | service | starts the TOTP setup, returns `{secret, uri}` |
| PUT | `/api/current-user/totp` | service | 200, `{code}` confirms the setup |
| DELETE | `/api/current-user/totp` | service | 200, `{password}` switches TOTP off |
| GET | `/api/imprint` | – | person and address from `config.php` |
| GET | `/api/links` | kitchen | all links |
| GET | `/api/links/search?identifier=` | – | link incl. party key |
| PUT | `/api/links/{linkId}` | kitchen | 200 |
| GET | `/api/orders/{partyId}` | service | orders in kitchen order with pizza ids |
| POST | `/api/orders/{partyId}` | service | 204 |
| POST | `/api/orders/{partyId}/{key}` | party key | 204 |
| PUT | `/api/orders/{partyId}/status` | service, kitchen from topping on | 200 |
| DELETE | `/api/orders/{partyId}/{orderId}` | service | 200 |
| GET | `/api/partys` | service | party overview, newest first |
| POST | `/api/partys` | kitchen | 204 |
| GET | `/api/partys/{partyId}` | service | party details |
| PUT | `/api/partys/{partyId}` | kitchen | 204 |
| GET | `/api/partys/{partyId}/{partyKey}` | party key | party details |
| PUT | `/api/partys/{partyId}/sold-out/{condimentId}` | service | 200, `{soldOut}`, sold out condiments can't be ordered |
| GET | `/api/users` | admin | users with role |
| POST | `/api/users` | admin | 204, `{name, role, password}` |
| PUT | `/api/users/{userId}/password` | admin | 200, `{password}`, ends the sessions of the user |
| DELETE | `/api/users/{userId}/totp` | admin | 200, resets TOTP of a lost phone |
| DELETE | `/api/users/{userId}` | admin | 200, not the own user |

## Security

- **Sessions**: `POST /api/session` returns a random token, requests send it as
  `Authorization: Bearer <token>`. Only its SHA-256 hash is stored in `UserSession`. Sessions end after
  30 days without use, on logout and when the password changes. An unknown token gives 401 on every
  endpoint, a missing role 403.
- **TOTP**: optional second factor per user (RFC 6238, 6 digits, 30 seconds). Each code is accepted once.
  Admins reset it in the user management when a phone is lost.
- **Rate limits** (table `RateLimit`): login is locked for 15 minutes after 5 failures of a user name or
  20 failures of an address, guests can place 60 orders per address in 10 minutes.
- **Web server**: `public/.htaccess` enforces HTTPS with HSTS and sets a Content Security Policy and
  further security headers. `.htaccess` in this directory denies everything in case the document root
  points here by mistake. PHP errors are only logged.
- **Search engines**: `robots.txt` and `X-Robots-Tag` keep the private system out of search results.
  `/.well-known/security.txt` names the e-mail address of the imprint as security contact.

## Differences to the Java version

- **Pizzas leave the oven** after 4 minutes. The Java version did this with a job running every second,
  now the kitchen page does it. Without an open kitchen page pizzas stay in the oven.
- **Oven compartments**: moving pizzas to the oven takes `"stove": "go"` (upper) or `"gu"` (lower), stored in
  the old `PizzaOrder.stove` column, and orders return it as `stove`. Leaving the oven sets `timeFinished`.
- **Statistic** is calculated on every request, the Java version cached it until restart.
- **Error codes**: invalid input (missing name, invalid status transition, ...) answers 400 instead of 500,
  unknown orders and parties on update/delete answer 404 instead of 500. The frontend only distinguishes success and failure.
- **Time zone** comes from `config.php`. The Java version took a fixed UTC offset at startup, which was off by an hour across a DST change.
- **Login** uses sessions instead of HTTP Basic, deleting an order needs a login, the Java version allowed it
  without.
