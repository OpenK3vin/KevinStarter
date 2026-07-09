# KevinPulse Starter Template

A clean, empty-slate app mirroring the full KevinPulse architecture and tooling.

## Stack Overview

- **Framework**: TanStack Start (Vite 8, React 19)
- **Router**: TanStack Router (file-based)
- **Data Fetching**: TanStack Query v5 + SSR Integration
- **Database**: Drizzle ORM + `better-sqlite3`
- **Styling**: Tailwind CSS v4 + Shadcn UI (OKLCH tokens)
- **Validation**: Zod
- **Agent Infra**: Full TanStack intent skills, OKLCH rules, PR rules, R3F architecture rules

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Environment
```bash
cp .template.env .env
```
*(Toggle `VITE_FF_EXAMPLE=true` to see feature flags in action)*

### 3. Setup Database
The database is local SQLite (`sqlite.db`).
```bash
pnpm db:generate   # Generate schema migrations
pnpm db:migrate    # Apply migrations to create the sqlite.db file
```

### 4. Run Development Server
```bash
pnpm dev
```
Open `http://localhost:3000`

## Database Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate a new SQL migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply all pending migrations to `sqlite.db` |
| `pnpm db:push` | Push schema directly to DB (dev only — skips migration files) |
| `pnpm db:studio` | Open Drizzle Studio GUI to inspect and edit data |

## Shadcn UI

Use the Shadcn CLI to add new components:
```bash
pnpm dlx shadcn@latest add <component-name>
```
The project uses the "New York" style, "zinc" base color, and CSS variables encoded in OKLCH.

## Agent Infrastructure

This template includes all `.agents/` rules and skills from KevinPulse.
- **Skills**: Run `npx @tanstack/intent@latest load <use>` based on the mappings in `AGENTS.md`.
- **Rules**: Enforce OKLCH, architectural choices, and PR styles.

---

## 🤖 Agent Guide: Architecture & Tech Stack Rules

> **Note to Future AI Agents:** You MUST read and follow these rules strictly before modifying this repository. Refer to the `.agents/rules/` directory for full details.

### 1. Technology Boundaries
- **Framework**: TanStack Start with Vite 8 and React 19. Do **NOT** use Next.js, Remix, or generic React-Router-DOM patterns.
- **Styling**: Tailwind CSS v4.
- **Colors**: **Strict OKLCH policy**. All colors in CSS, Tailwind tokens, or inline styles must be in `oklch()`. Do not generate HEX, RGB, or HSL values. See `.agents/rules/oklch-color-rules.md`.
- **Components**: Use Shadcn UI (New York, Zinc). Always check for existing UI components in `src/components/ui/` before building custom ones.

### 2. State & Data Fetching
- **Server State**: Use TanStack Query v5 + `useSuspenseQuery` paired with TanStack Start's `createServerFn` RPCs.
- **Global Client State**: Use **Jotai**. Avoid Context API unless required by libraries. Do not use Redux or Zustand.
- **Database**: Drizzle ORM over a local `better-sqlite3` instance. Schemas must reside in `src/db/schema.ts` and migrations must be generated via `drizzle-kit`.
- **Validation**: Zod schema validation is required for API boundaries, search params, and form inputs.

### 3. File & Module Structure
- **Routing (`src/routes/`)**: File-based routing via TanStack Router. Search params must be validated with `zodValidator`.
- **Feature Folders (`src/features/`)**: Business logic belongs here, separated by domain (e.g., `example/components`, `example/api`, `example/types`).
- **Cross-Cutting Modules (`src/modules/`)**: Infrastructure code (like Feature Flags) that is decoupled from business logic.
- **API (`*.ts` instead of `*.server.ts`)**: TanStack Start RPC functions (using `createServerFn`) must avoid the `.server.ts` extension if they are imported directly into client bundles, preventing import protection errors.

### 4. 3D Graphics (React Three Fiber)
If tasked with modifying or creating 3D interfaces/decorations, you **MUST** strictly follow the architecture outlined in `.agents/rules/threejs-deco-arc-rule.md`:
- Pure Three.js imperative code for Geometry, Materials, and Physics (No R3F imports allowed).
- The orchestrator component (`<Canvas>`, `useFrame`, `<primitive>`) is the only place R3F hooks are permitted.
- Never write random/imperative mutations directly inside a React component's render body.
