# Project recap

This repository is an Angular SSR app with an Express notes API, rather than a standalone Node.js backend.

## Folder structure

- `src/server.ts` configures Express, mounts API routes, and serves the Angular SSR app.
- `src/api/` contains the authentication and notes routers, Sequelize connection, models, migrations, and seeders.
- `src/app/features/` contains the Angular auth, notes, home, about, and playground features.
- `src/app/core/` contains app-wide configuration; `src/app/shared/` contains reusable UI components and pages.
- `public/` contains static assets, and `docs/` contains architecture documentation.

## Login and JWT

The auth API supports signup, login, logout, and the current-user endpoint. Signup hashes passwords with bcrypt and defaults accounts to the `viewer` role. Login compares the submitted password with the stored hash and returns a signed JWT. Tokens expire after one hour. Authenticated requests verify the token and load the user from MySQL; logout stores a SHA-256 hash of the token in the revoked-token table.

## Database

The API uses Sequelize with MySQL through `mysql2`. It reads `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from the root `.env` file. Run `npm run db:migrate` to create the tables and `npm run db:seed` to add the initial admin account. User accounts, notes, and token revocations persist across server restarts.

## Roles, notes, approval, and notifications

Users have either the `admin` or `viewer` role. Both roles can read notes; only admins can create, update, and delete notes.

There is currently no note approval state or approval endpoint, and the project has no notification implementation. The existing note API is basic CRUD, not an approval workflow.

## Errors and validation

The API returns JSON error messages with HTTP status codes. Missing or invalid login fields return `400`; invalid credentials return `401`; missing, invalid, expired, or revoked tokens return `401`; insufficient role permissions return `403`; missing notes return `404`; duplicate signup emails return `409`. Signup validates name, email format, and password length. Note creation requires a title or content, and pagination parameters are checked for numeric, positive values.

## Testing

Run `npm test` for the notes API unit and integration suites, `npm run test:unit` or `npm run test:integration` for an individual suite, and `npm run test:angular` for Angular tests. Integration tests run migrations against and use only a temporary MySQL Testcontainers instance; they clean up tables and stop the container afterward.
