# Study Buddy

A study tracker for uni students.

**Live app:** https://the-study-buddy.lovable.app

---

## Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** (with shadcn/ui + Radix UI components)
- **Supabase** (`@supabase/supabase-js`) for backend services
- **Testing**
  - Unit tests: **Vitest**
  - E2E tests: **Playwright**
- **Tooling**: ESLint

---

## Getting started

### Prerequisites
- **Node.js** (latest LTS recommended)
- **npm** (a `package-lock.json` is included)

### Install
```bash
npm install
```

### Run the app locally
```bash
npm run dev
```

Vite is configured to run on **port `8080`**.

### Build
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

---

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run build:dev` — build using development mode
- `npm run lint` — run ESLint
- `npm run test` — run unit tests (Vitest)
- `npm run test:watch` — watch mode for unit tests
- `npx playwright test` — run Playwright tests

---

## Environment variables

This project uses environment variables for configuration (for example, Supabase credentials).

1. Create a local env file:
   ```bash
   cp .env .env.local
   ```
2. Update values in `.env.local` as needed.

> Note: Don’t commit real secrets. Prefer keeping local overrides in `.env.local` and adding it to `.gitignore` if you use it.

---

## Project structure (high level)

- `src/` — application source code
- `public/` — static assets
- `supabase/` — Supabase project/config (if used for local development or migrations)
- `vite.config.ts` — Vite configuration (includes `@` alias -> `src`)

---

## Contributing

PRs/issues are welcome. If you’re making bigger changes, open an issue first to discuss scope.

---

## License

No license file is currently included. If you want this to be open source, consider adding a `LICENSE` (MIT, Apache-2.0, etc.).
