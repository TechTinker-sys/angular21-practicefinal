# Project recap

This repository contains an Angular SSR frontend and a standalone Node.js and Express API in `backend/`.

## Folder structure

- `src/server.ts` serves the Angular SSR app independently from the backend API.
- `backend/src/app.ts` composes the Express application; `backend/src/server.ts` connects to MySQL and starts the API server.
- `backend/src/modules/` contains the feature-based `auth`, `users`, and `notes` modules. Services receive repositories through the backend composition root.
- `backend/src/loaders/database/` contains the Sequelize migrations and seeders; feature-owned Sequelize models live within their modules.
- `src/app/features/` contains the Angular auth, notes, home, about, and playground features.
- `src/app/core/` contains app-wide configuration; `src/app/shared/` contains reusable UI components and pages.
- `public/` contains static assets, and `docs/` contains architecture documentation.

## Login and JWT

The auth API supports signup, login, logout, and the current-user endpoint. Signup hashes passwords with bcrypt and defaults accounts to the `viewer` role. Login compares the submitted password with the stored hash and returns a signed JWT. Tokens expire after one hour. Authenticated requests verify the token and load the user from MySQL; logout stores a SHA-256 hash of the token in the revoked-token table.

## Database

The API uses Sequelize with MySQL through `mysql2`. It reads its settings from ignored `backend/.env`; `backend/.env.example` lists the required keys without values. The backend defaults to port `4001`. Run `npm --prefix backend run db:migrate` to create the tables and `npm --prefix backend run db:seed` to add the initial admin account. User accounts, notes, and token revocations persist across server restarts.

## Roles, notes, approval, and notifications

Users have either the `admin` or `viewer` role. Both roles can read notes; only admins can create, update, and delete notes.

There is currently no note approval state or approval endpoint, and the project has no notification implementation. The existing note API is basic CRUD, not an approval workflow.

## Errors and validation

The API returns JSON error messages with HTTP status codes. Missing or invalid login fields return `400`; invalid credentials return `401`; missing, invalid, expired, or revoked tokens return `401`; insufficient role permissions return `403`; missing notes return `404`; duplicate signup emails return `409`. Signup validates name, email format, and password length. Note creation requires a title or content, and pagination parameters are checked for numeric, positive values.

## Testing

Run `npm --prefix backend test` for the API suites, `npm --prefix backend run test:unit` or `npm --prefix backend run test:integration` for an individual suite, and `npm run test:angular` for Angular tests. Integration tests run migrations and the admin seeder against a temporary MySQL Testcontainers instance; they clean up tables and stop the container afterward.
