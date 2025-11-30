# Repository Guidelines

## Project Structure & Module Organization
AnyCam lives in `frontend/`, a Vite + React wizard that starts in `src/App.jsx` and fans into feature components under `src/components/` (e.g., `PhotoUploader.jsx`, `MapSelector.jsx`). Shared primitives stay in `src/components/ui/` and should import `cn` from `src/lib/utils.js` for readable Tailwind composition. Keep new tests co-located next to the component as `ComponentName.test.jsx`. Root-level docs (`PRD.md`, `nano-banana.md`) and visual references in `ui-protfolio/` describe current flows—link to them whenever you touch the wizard. Back-end prototypes live in `api/` and `backend/`; avoid mixing their logic with the front-end bundle.

## Build, Test, and Development Commands
Run commands from `frontend/`.
```bash
npm install            # install dependencies
npm run dev            # Vite dev server + proxy to :3000
npm run build          # production build to dist/
npm run preview        # serve the compiled build locally
npm run lint           # eslint using the React + globals config
npx vitest run         # execute test suites until a package script exists
```

## Coding Style & Naming Conventions
Stick to two-space indentation, ES modules, and functional components with hooks declared at the top level. Components use PascalCase (`ResultDisplay.jsx`), hooks/utilities use camelCase, and environment variables must be prefixed with `VITE_`. Compose Tailwind strings with `cn()` when variants grow, and prefer the `@` alias from `vite.config.js` over brittle relative imports.

## Testing Guidelines
New UI or helper work should introduce Vitest + React Testing Library suites that mock the landing → upload → result flow. File names mirror the component (`PhotoUploader.test.jsx`) and should assert both happy paths and edge timing cases. Run tests with `npx vitest run` before pushing, then sanity-check the wizard via `npm run dev` to ensure mocked API timing still advances steps.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat: add processing step animation`) and keep each commit scoped to a single concern with passing lint/build. PRs must describe the scenario, enumerate visible changes, link to relevant sections in `PRD.md` or `ui-protfolio/*.png`, and include screenshots/GIFs for UI shifts. Call out new environment variables, backend expectations, and manual QA steps so reviewers can reproduce quickly.

## Security & Configuration Tips
Place secrets in `.env` files with `VITE_*` keys and never hardcode them in `src`. Fetch APIs through relative `/api` paths so Vite’s proxy handles `http://localhost:3000`. Exclude temporary uploads or generated assets from version control, and scrub any personal data before sharing debug media.
