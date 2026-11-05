# Angular21Practice Architecture

## Backend architecture

The standalone Node.js and Express API is a feature-based modular monolith in
`backend/`. `backend/src/modules/auth`, `users`, and `notes` each own their
routes, controllers, services, repositories, Sequelize models, and Zod schemas.
`backend/src/app.ts` is the composition root: it creates repository adapters,
injects them into services, mounts routers, and registers the central error
handler. Express middleware and database connection setup, validated
environment configuration, logger, and shared middleware live in loaders,
config, and common.

The backend runs independently from Angular SSR on port `4001` by default.
Angular's API services address that backend directly; CORS allows only the
configured origins (the local Angular ports by default). Migrations and seeders
are under `backend/src/loaders/database`. The backend reads `backend/.env`,
which is ignored; `backend/.env.example` contains empty keys only.

This structure separates HTTP, use-case, and persistence responsibilities
without introducing independently deployed services. It follows the
Twelve-Factor recommendation to keep deploy-specific configuration out of code
and Express's guidance for centralized error propagation.

### Why this pattern

Express does not prescribe one production directory layout. This structure
applies feature ownership and clear dependency boundaries without imposing
microservices or a heavyweight DDD framework on a small application. It follows
the Twelve-Factor recommendation to keep deploy-specific configuration outside
the codebase and Express's production guidance for centralized error
propagation. Relevant references:

- [Express production performance and reliability](https://expressjs.com/en/advanced/best-practice-performance/)
- [Express production security](https://expressjs.com/en/advanced/best-practice-security/)
- [Twelve-Factor App: Config](https://12factor.net/config)
- [Node.js environment variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

## Overview

This project has been reorganized to follow a modern Angular app structure with a clear separation between:

- `core` for system providers and singleton services
- `shared` for reusable UI primitives and small shared pages
- `features` for vertical slices and routed business capabilities
- `environments` for environment-specific configuration

The goal is to make the app easier to maintain, extend, and reason about as it grows.

## Folder structure

```
src/
  app/
    core/
      auth/            # Authentication guards and services
      http/            # API client wrappers and interceptors
      config/          # Global providers and app configuration
        app.config.ts
    shared/
      components/      # Reusable UI components without business logic
        child/         # Standalone child component used by Playground
        card/          # Shared card wrapper component
      pages/           # Shared page-level components
        not-found.ts
    features/          # Vertical slices (feature areas)
      home/
        pages/
          home.ts
      playground/
        pages/
          playground.ts
          playground.html
      about/
        pages/
          about.ts
    app.routes.ts      # Root routes, lazy load feature pages
    app.ts             # Root application component
    app.config.ts      # Entrypoint re-export for application config
  environments/        # Environment files for dev/prod configuration
```

## Why this structure

### Core

The `core` folder is the application foundation. It is designed for:

- application-wide providers
- singleton services
- interceptors and auth guards

Example: `src/app/core/config/app.config.ts` now contains `provideRouter`, `provideHttpClient`, and hydration providers.

### Shared

The `shared` folder contains reusable UI building blocks without feature-specific business logic.

- `shared/components` for standalone UI primitives like `Child` and `Card`
- `shared/pages` for pages used globally, such as the 404 page

This keeps the app DRY and makes it easy to reuse components across features.

### Features

The `features` folder groups pages by business capability.

- `features/home` contains the home page
- `features/playground` contains the interactive playground page
- `features/about` contains the about page

Feature folders are intentionally shallow and self-contained. Each feature page is lazy-loaded from `src/app/app.routes.ts`.

### Routes and lazy loading

Root routing is defined in `src/app/app.routes.ts`. It dynamically loads page components from feature folders, which improves initial load time and keeps routes aligned with feature boundaries.

### Environments

The `src/environments/` folder is kept for environment-specific settings, such as API endpoints or feature flags. This is the standard Angular convention for separating build-time configuration.

## What changed

- Moved top-level page components into `src/app/features/...`
- Moved reusable UI components into `src/app/shared/components/...`
- Added `src/app/core/config/app.config.ts` for app-wide providers
- Updated `src/app/app.routes.ts` to lazy-load new feature paths
- Created `src/environments/` for future environment files
- Removed duplicate legacy files from `src/app/`

## Verification

The application was verified by running:

```bash
npm run build
```

The build completed successfully, and the app structure now compiles cleanly.

## Recommended next steps

- Add environment files under `src/environments/` such as `environment.ts` and `environment.prod.ts`
- Add feature-specific services under `core/http/` or `features/<feature>/services/`
- Keep shared UI primitives isolated from feature logic
