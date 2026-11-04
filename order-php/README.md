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
   the all-inkl KAS via phpMyAdmin. For a fresh installation import `schema.sql` instead.
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
   to `order-php/public`. In the KAS select PHP 8.1 or newer for the domain.
7. **Smoke test**: open the site, log in, open the kitchen view of a party.

Users are taken over from the `SystemUser` table, the bcrypt hashes of Spring Security are compatible.
A new user can be created with:
```
php -r "echo password_hash('PASSWORD', PASSWORD_BCRYPT), PHP_EOL;"
```
and `INSERT INTO SystemUser (id, name, password) VALUES (2, 'name', '<hash>');`

## Tests

```
php tests/run.php
```

## REST API

| Method | Path | Login | Response |
|---|---|---|---|
| GET | `/api/condiments` | – | condiments sorted by category |
| GET | `/api/condiments/statistic` | admin | amount per pizza by rating |
| GET | `/api/current-user` | admin | 200, used by the login form |
| PUT | `/api/current-user/password` | admin | 200, `{oldPassword, newPassword}` |
| GET | `/api/imprint` | – | person and address from `config.php` |
| GET | `/api/links` | admin | all links |
| GET | `/api/links/search?identifier=` | – | link incl. party key |
| PUT | `/api/links/{linkId}` | admin | 200 |
| GET | `/api/orders/{partyId}` | admin | orders in kitchen order with pizza ids |
| POST | `/api/orders/{partyId}` | admin | 204 |
| POST | `/api/orders/{partyId}/{key}` | party key | 204 |
| PUT | `/api/orders/{partyId}/status` | admin | 200 |
| DELETE | `/api/orders/{partyId}/{orderId}` | – | 200 |
| GET | `/api/partys` | admin | party overview, newest first |
| POST | `/api/partys` | admin | 204 |
| GET | `/api/partys/{partyId}` | admin | party details |
| PUT | `/api/partys/{partyId}` | admin | 204 |
| GET | `/api/partys/{partyId}/{partyKey}` | party key | party details |

Login is stateless HTTP Basic like before. Wrong credentials give 401 on every endpoint.

## Differences to the Java version

- **Pizzas leave the oven** after 4 minutes. The Java version did this with a job running every second,
  now the kitchen page does it. Without an open kitchen page pizzas stay in the oven.
- **Oven compartments**: moving pizzas to the oven takes `"stove": "go"` (upper) or `"gu"` (lower), stored in
  the old `PizzaOrder.stove` column, and orders return it as `stove`. Leaving the oven sets `timeFinished`.
- **Statistic** is calculated on every request, the Java version cached it until restart.
- **Error codes**: invalid input (missing name, invalid status transition, ...) answers 400 instead of 500,
  unknown orders and parties on update/delete answer 404 instead of 500. The frontend only distinguishes success and failure.
- **Time zone** comes from `config.php`. The Java version took a fixed UTC offset at startup, which was off by an hour across a DST change.

Taken over unchanged on purpose: deleting an order (`DELETE /api/orders/...`) does not need a login,
exactly like in the Java version.
