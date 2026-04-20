# PinPet Frontend

Frontend part of the `PinPet` project built with React, TypeScript, and Vite.

At the moment this is an early application skeleton with:

- feed page and basic layout
- auth flow foundation with context/provider
- separated project layers close to FSD style
- mock pin feed data for the main page

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- CSS Modules

## Project Structure

```text
frontend/
  public/
  src/
    app/        # app providers, layout, global styles
    pages/      # route-level pages
    widgets/    # large UI blocks like header/footer
    features/   # user scenarios and feature logic
    entities/   # domain entities such as pin
    shared/     # shared api helpers and common logic
```

## Getting Started

Requirements:

- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Run linter:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

## Current Functionality

- Main route `/`
- Header and footer layout
- Feed page with pin cards
- Login/signup modal UI
- Auth context with `login`, `register`, `logout`, `checkAuth`, and token refresh helpers

## Notes About API

The project currently mixes two modes:

- feed data is mocked in `src/entities/pin/pin.api.ts`
- auth requests use a real backend URL from `src/shared/api/apiClient.ts`

Because of that, local development may require backend availability only for auth-related actions.

## Important Technical Notes

- `BASE_URL` for backend requests is hardcoded in `src/shared/api/apiClient.ts`
- some auth and error-handling files are still in progress
- the current `README` replaces the default Vite template and documents the actual project state
- build and lint may require additional cleanup before the project is production-ready

## Recommended Next Steps

- move backend URL to environment variables
- unify API response and error handling
- finish replacing mock feed data with real API integration
- clean up duplicated auth utilities
- update build and lint configuration to a fully green state
