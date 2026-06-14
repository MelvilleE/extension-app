## Quick orientation

This is a Next.js (app router) TypeScript project using TailwindCSS and a small component library under `components/ui/`. The main interactive app lives in `app/page.tsx` (client component) and global layout/font is in `app/layout.tsx`.

Key files to read first
- `app/page.tsx` — large client-side quotation app, holds state, DnD, and PDF export logic.
- `app/layout.tsx` — root layout (server component) and font usage.
- `components/ui/*.tsx` — UI primitives (Button, Input, Card) use cva, forwardRef patterns and the `cn` helper.
- `lib/utils.ts` — includes `cn(...)` (tw-merge + clsx) used across components.
- `package.json`, `tsconfig.json`, `tailwind.config.ts` — scripts, path alias (`@/*`), and Tailwind content paths.

Architecture & boundaries (what matters for edits)
- App router with a mix of server and client components. Files with "use client" at the top are interactive and can use hooks; files without it are server components. Keep server/client boundaries minimal and intentional.
- UI components under `components/ui` are small, reusable, and accept variant props (see `button.tsx` for cva patterns). Reuse these instead of creating duplicate markup.
- `app/page.tsx` is currently a single, large client component that contains business logic (products, pricing rules, PDF export). When refactoring, preserve public types and initial constants (e.g., `initialProducts`, `initialSections`) to avoid breaking implicit assumptions.

Conventions and idioms
- Import alias: use `@/...` (configured in `tsconfig.json`). Example: `import { Button } from "@/components/ui/button";`
- Styling: Tailwind + `cn(...)` from `lib/utils.ts`. Prefer `cva` for complex component variants (see `button.tsx`).
- Typescript: `strict: true` in `tsconfig.json`. Add or maintain explicit types for props and shared data shapes.
- Components: follow the forwardRef + asChild pattern (see `button.tsx`) for composability.

Third-party integrations and gotchas
- Drag-and-drop: uses `@dnd-kit/*` in `app/page.tsx`. Events and state are client-only.
- PDF export: `jspdf` and `pdf-lib` are both present; `app/page.tsx` currently uses `jspdf` for export.
- Icons: `lucide-react` is used throughout (consistent icon style expected).

How to run, build, and lint
- Development: `npm run dev` (runs `next dev`).
- Build: `npm run build` then `npm run start` to serve production build.
- Lint: `npm run lint` (project uses `eslint`).

When editing `app/page.tsx`
- It's marked `"use client"` and contains local state and business logic. If you split it, keep the public types and initial data in the same shape and export them where consumers expect.
- Avoid moving server-only code (e.g., imports relying on Node-only APIs) into client bundles.

Suggested small improvements (low-risk)
- Extract product/section types and initial data into `lib/data.ts` to make `app/page.tsx` easier to test.
- Add small unit tests around pure helpers (pricing calculations) if adding Jest/Vitest later.

Where to look for related examples
- `components/ui/button.tsx` — cva + forwardRef pattern and `cn(...)` usage.
- `lib/utils.ts` — common helper `cn`.
- `tailwind.config.ts` and `app/globals.css` — Tailwind and global style setup.

Contact for context
- There are no explicit contributor docs beyond `README.md`. If behavior is unclear, prefer small, obvious changes and request a code review mentioning `app/page.tsx` refactors.

If you make changes, keep them minimal and type-safe, and update corresponding imports using `@/` paths.

---
If anything here is unclear or you want more detail about a particular area (state flows, pricing rules, or drag/drop interactions), tell me which file or behavior and I will expand this guidance.
