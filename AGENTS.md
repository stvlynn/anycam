# Repository Guidelines

## Project Structure & Module Organization
AnyCam lives in `frontend/`, a Vite React app whose wizard logic sits in `src/App.jsx` and delegates to `src/components/` (e.g., `PhotoUploader.jsx`, `MapSelector.jsx`). Shared primitives stay in `src/components/ui/` and reuse `cn` from `src/lib/utils.js` when composing Tailwind classes. Product docs (`PRD.md`, `nano-banana.md`) and visual references (`ui-protfolio/*.png`) remain at the repo root—link to them from PRs whenever you change flows.

## Build, Test, and Development Commands
Run all commands from `frontend/`.
```bash
npm install            # install dependencies
npm run dev            # launch Vite dev server with the API proxy to :3000
npm run build          # create production assets in dist/
npm run preview        # serve the dist build locally
npm run lint           # eslint with the React + globals config
```

## Coding Style & Naming Conventions
Follow the existing two-space indentation, ES modules, and functional React components with hooks at the top level. Name components with PascalCase (e.g., `ResultDisplay`) and props/state variables with camelCase. Keep Tailwind utility strings readable; lean on `cn()` plus `class-variance-authority` when variants explode, and import assets via the `@` alias from `vite.config.js` to avoid brittle relative paths.

## Testing Guidelines
Automated tests have not landed yet, but new work should introduce Vitest + React Testing Library suites stored alongside components as `ComponentName.test.jsx`. Cover the landing→upload→result wizard states and any helper logic; aim for smoke coverage of each step before requesting review. Until a `test` script exists in package.json, run specs with `npx vitest run` and document manual QA steps in the PR. Always exercise the flow in `npm run dev` to ensure mocked API timing still advances steps.

## Commit & Pull Request Guidelines
The repository is just starting, so treat Conventional Commit style (`feat: add processing step animation`) as the source of truth. Commits should be scoped to one concern with passing lint/build. For PRs, describe the scenario, list visible changes, link to relevant PRD sections or UI mock files, and attach screenshots/GIFs for UI diff. Call out new environment variables and provide reproduction steps for reviewers.

## Security & Configuration Tips
Use `.env` files named `VITE_*` for secrets; never hardcode API keys in `src`. Vite already proxies `/api` to `http://localhost:3000`, so prefer relative fetch URLs. Keep any generated assets or temporary uploads out of version control and scrub personal data before sharing screenshots.
