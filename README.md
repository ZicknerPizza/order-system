# zickner-pizza.de order system

Order system for pizza parties: guests order their pizza online via a link, the kitchen bakes two orders
at a time on one pizza. Runs on plain shared hosting with PHP and MySQL.

- **Guests** choose their condiments on the order page of a party, reached by a short link.
- **Kitchen** sees the open orders, puts two of them together on one pizza, tracks the upper and lower
  compartment of the oven and marks condiments that ran out.
- **Party planning** estimates the shopping list from the orders and the statistic of past parties.
- **Users** have a role (service, kitchen, admin), log in with sessions and optionally TOTP.

## Structure

- [`order-frontend`](order-frontend) – Angular frontend
- [`order-php`](order-php) – PHP backend with REST API and MySQL database, no dependencies

## Getting started

Requirements: PHP 8.1+ with `pdo_mysql`, MySQL or MariaDB, Node.js for the frontend.

1. Create a database from [`order-php/schema.sql`](order-php/schema.sql) and an admin user as described
   in [`order-php/README.md`](order-php/README.md).
2. Copy `order-php/config.example.php` to `order-php/config.php` and enter the database credentials.
3. Start the backend:
   ```
   php -S 127.0.0.1:8090 -t order-php/public order-php/public/api.php
   ```
4. Start the frontend on http://localhost:4200, it forwards `/api` to the backend:
   ```
   cd order-frontend && npm ci && npm start
   ```

Tests: `php order-php/tests/run.php` and `cd order-frontend && npm test -- --watch=false`.

Deployment on shared hosting (all-inkl.com) is described in [`order-php/README.md`](order-php/README.md).

## License

[MIT](LICENSE)
