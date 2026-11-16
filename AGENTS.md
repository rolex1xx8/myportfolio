# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project

Single-page personal portfolio site (React 18 + TypeScript + Vite 5). Dark, animation-heavy UI built on Tailwind CSS, Framer Motion, and Three.js/Cobe. Project data and contact-form submissions go through Firebase Firestore. Deployed to Firebase Hosting (a Netlify build also exists per git history).

## Commands

| Task | Command |
|---|---|
| Dev server (exposed on LAN) | `npm run dev` |
| Type-check + production build | `npm run build` (`tsc -b && vite build` → `dist/`) |
| Lint (zero warnings allowed) | `npm run lint` |
| Preview built site | `npm run preview` |
| Deploy | `npm run deploy` (runs build via `predeploy`, then `firebase deploy`) |

There is no test suite. Before finishing a change, run `npm run lint` and `npm run build`.

## Architecture

- `src/main.tsx` — entry; wraps `<App />` in `HashRouter` + `StrictMode`.
- `src/App.tsx` — renders sections in order: Navbar → Hero → AboutGrid → Projects → ClientReview → ExperienceCard → ApprochCard → Footer. Also holds `ScrollToSection`, which scrolls to `location.hash` after route changes.
- Navigation is **hash-based** (`#home`, `#about`, `#project`, `#reviews`, `#experience`, `#approach`, `#contact`). Each section component sets the matching `id`; if you rename or add a section, update the Navbar links and the `id` together. Note that the Projects section id is `project` (singular).
- `src/components/*.tsx` — one file per page section (top-level components).
- `src/components/ui/<section>/` — presentational/effect components owned by that section (e.g. `ui/hero/Lampcontainer`, `ui/projects/PinContainer`). These look like Aceternity-style UI primitives; keep them grouped under the section that uses them.
- `src/utils/cn.ts` — `cn()` helper (`clsx` + `tailwind-merge`). Use it for conditional/merged class names.
- `src/utils/firebase.ts` — initializes Firebase app, Analytics, and Firestore; exports `app`, `analytics`, `db`.

## Data (Firestore)

- `MyProjects` collection — read by `Projects.tsx` via `getDocs`; docs carry a tech list that `techIcons()` maps to icons in `public/*.svg`. Adding a new tech key means adding a `case` in `techIcons` and an icon asset.
- `MyRequestData` collection — written by `EmailForm.tsx` (`name`, `email`, `description`).
- `database.rules.json` covers the Realtime Database only (locked down: read/write false). Firestore security rules are not in this repo; manage them in the Firebase console.

## Conventions

- TypeScript is `strict` with `noUnusedLocals` / `noUnusedParameters`; unused imports or variables fail `npm run build`.
- ESLint (`.eslintrc.cjs`) runs with `--max-warnings 0`, including react-hooks and react-refresh rules.
- Styling is Tailwind utility classes. Custom animations (`spotlight`, `shimmer`, `scroll`, `up`, `down`) and the `bg-grid` / `bg-grid-small` / `bg-dot` utilities are defined in `tailwind.config.ts`. Theme colors `primary`/`secondary` come from CSS variables in `src/index.css`.
- Components are function components with default or named exports (mixed today: e.g. `Hero`/`Navbar` are named, most others default). Match the neighbouring file.
- Static assets (images, tech icons, favicons, manifest) live in `public/` and are referenced by absolute path (`/vite-icon.svg`).

## Things to be careful about

- **Secrets / config:** `.env.local` exists and is gitignored (`*.local`). Do not read, print, or commit it. The Firebase web config is hardcoded in `src/utils/firebase.ts`; Firebase web keys are not secret by themselves, but access control depends on Firestore rules, so do not loosen them or add new write paths without considering abuse.
- **Contact form:** `EmailForm.tsx` has no validation, no success/error UI (only `console.log`), and the textarea `id="decription"` does not match its label's `htmlFor="description"`. Fix these if you touch the form.
- **Build output:** `dist/` and `.firebase/` are gitignored but `.firebase/hosting.*.cache` shows as modified in git status; don't stage it.
- **Heavy visuals:** Globe (Cobe), canvas reveal, and three.js effects affect performance, so avoid adding more always-running animations without checking mobile.
- Keep changes small and in the existing style; prefer simple solutions over new dependencies.
