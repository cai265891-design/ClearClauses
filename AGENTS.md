# Repository Guidelines

## 语言 / Language

- **无论用户使用何种语言提问，一律优先使用「简体中文」回答。**
- 只有在用户明确要求「请用英文回答」时，才使用英文。
- 代码注释，如无特殊说明，也使用简体中文编写。

## Project Structure & Module Organization
- Next.js 15 app router lives in `src/app`; route groups like `(legal)` and `[locale]` hold layouts and pages, with global styles in `src/app/globals.css` and `src/app/theme.css`.
- Shared UI and hooks sit in `src/components`, `src/hooks`, and `src/contexts`; utilities in `src/lib`; service and integration wrappers in `src/services`, `src/aisdk`, and `src/integrations`.
- Data layer resides in `src/db` (Drizzle config, schema, migrations) and `src/models`; translations in `src/i18n`; static assets in `public`; docs and agent design notes in `docs` and `content/docs`.

## Build, Test, and Development Commands
- `pnpm dev` — run Next.js locally with Turbopack.
- `pnpm build` / `pnpm start` — production build and serve.
- `pnpm lint` — Next.js ESLint rules.
- `pnpm analyze` — bundle analyzer on build.
- `pnpm docker:build` — build container image.
- Database: `pnpm db:generate` (SQL from schema), `pnpm db:migrate` (apply migrations), `pnpm db:push` (sync schema), `pnpm db:studio` (Drizzle UI).
Use pnpm (lockfile present) and copy `.env.example` to `.env.development` before running.

## Coding Style & Naming Conventions
- TypeScript/React with server components; prefer functional components and hooks.
- Two-space indent, double quotes, and explicit typing where it aids readability.
- PascalCase for components, camelCase for functions/vars, kebab-case for route folders; co-locate component-specific styles and helpers.
- Keep client-only code behind `"use client"` and use `cn` helper for conditional classNames.

## Testing Guidelines
- No default test runner is wired; at minimum run `pnpm lint` before pushes.
- Add `*.test.ts[x]` near the code when introducing logic-heavy utilities (Vitest/RTL fit well); cover data fetching, auth flows, and DB queries with mockable boundaries.
- Smoke-test key pages via `pnpm dev` (auth, billing, file upload) and include repro steps in PRs.

## Commit & Pull Request Guidelines
- Use clear, present-tense commit subjects (Conventional Commits like `feat:`, `fix:`, `chore:` encouraged).
- PRs should state scope, rationale, and risk; link issues/tasks, list env/migration changes, and attach screenshots for UI tweaks.
- Verify lint/build (and any added tests) before review; mention manual QA steps and affected routes.
