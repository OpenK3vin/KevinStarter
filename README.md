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
