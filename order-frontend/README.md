# order-frontend

Angular frontend of the pizza order system, successor of the former Angular 2.4 frontend with the
same URLs and look (Bootstrap 3 styles). It talks to the REST API of `order-php`.

## Development

```
npm ci
npm start
```

`npm start` serves the app on http://localhost:4200 and proxies `/api` to the PHP backend on
http://127.0.0.1:8090 (`php -S 127.0.0.1:8090 -t order-php/public order-php/dev-router.php`).

## Tests and build

```
npm test -- --watch=false
npm run build
```

The build lands in `dist/order-frontend/browser/` and is copied into `order-php/public/`.

## Structure

- `api/` – types and HTTP calls of the REST API
- `auth/` – HTTP Basic login, interceptor and route guard
- `shared/` – notifications, condiment catalog, order form
- `general/`, `event/`, `kitchen/`, `login.ts`, `order.ts`, `links.ts` – pages
- `styles/` – global styles taken over from the old frontend

Routes use hash URLs (`#/l/...`), because these links were handed out to guests.
