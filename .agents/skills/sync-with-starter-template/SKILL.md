---
name: sync-with-starter-template
description: Syncs the current project with the latest updates from the KevinStarter template, handling complex merge conflicts automatically.
---

# Sync with Starter Template Skill

This skill outlines the workflow for syncing a project with the KevinStarter template (`https://github.com/OpenK3vin/KevinStarter`).

Since the project will have diverged from the template, a direct merge will always produce conflicts. You must resolve these conflicts intelligently by following the protocol below.

## Sync Workflow

1. **Initialize Merge**: Run `bash .agents/skills/sync-with-starter-template/scripts/sync.sh` to fetch and initiate the merge from the starter repository.
2. **Resolve Conflicts**: Use the conflict resolution protocol below to fix unmerged paths.
3. **Install Dependencies**: Run `pnpm install` after resolving `package.json` and `pnpm-lock.yaml`.
4. **Finalize**: Add all files to the git index and commit with a message like `"chore: sync with starter template"`.

## Conflict Resolution Protocol

When resolving merge conflicts, do not blindly accept either side. Apply the following rules:

### 1. UI Components (`src/components/ui/`)
**Action**: Accept Starter Template
- Shadcn UI components and base files should generally remain identical to the starter.
- If there are conflicts, always check out the template's version (`git checkout --theirs src/components/ui/*.tsx`).
- This ensures the project receives the latest Shadcn bug fixes and style utility updates (e.g., changes to `@/lib/utils` vs `@/shared/lib/utils`).

### 2. Dependencies (`package.json`)
**Action**: Intelligent Merge
- **Project Identity**: Keep the current project's `"name"`, `"version"`, and `"description"`.
- **Custom Dependencies**: ALWAYS retain any custom dependencies or devDependencies that were installed in the current project but do not exist in the starter template.
- **Starter Dependencies**: Accept new dependencies or version bumps from the starter template.
- **Scripts**: Retain project-specific scripts while adding any new utility scripts from the template.

### 3. Database (`src/db/schema.ts`, `drizzle.config.ts`, `src/db/index.ts`)
**Action**: Intelligent Merge
- **Driver**: Ensure the database dialect matches the starter template (e.g., PostgreSQL). Update `drizzle.config.ts` and `src/db/index.ts` to use the template's driver (like `drizzle-orm/postgres-js`).
- **Domain Tables**: Keep all project-specific tables intact (converting column types to match the new dialect if necessary, e.g., SQLite `integer` to Postgres `bigint` for timestamps).
- **Core Tables**: Append or update the template's core tables (e.g., `user`, `session`, `projects`, `resourceRoles` for auth/RBAC).

### 4. Global Styles (`src/styles.css`)
**Action**: Union Merge
- Keep the project's custom `:root` color tokens (e.g., `--sea-ink`, `--lagoon`) and custom structural CSS (e.g., gradients, background images).
- Append the starter template's Shadcn OKLCH variable definitions inside `:root` and `.dark` blocks.
- Ensure the template's `@layer base` exists at the bottom.

### 5. Application Root (`src/routes/__root.tsx`)
**Action**: Intelligent Merge
- Keep the project's custom `<head>` metadata (titles, descriptions, specific `<link>` tags).
- Inject the template's new Context Providers (e.g., `RbacProvider`, `TooltipProvider`) wrapping the `{children}` element.
- Preserve the template's `notFoundComponent` unless the project has a heavily customized 404 page.

### 6. Environment & Configuration (`.template.env`, `envFlags.ts`)
**Action**: Union Merge
- Combine the flags. Keep the project's existing custom environment variables and feature flags.
- Append any new flags introduced by the starter template (e.g., Auth secrets, `VITE_FF_EXAMPLE`).

### 7. Documentation (`README.md`)
**Action**: Intelligent Merge
- Keep the project's title and domain description.
- Update the "Tech Stack" or "Database" sections to reflect any architectural shifts brought in by the starter (e.g., adopting PostgreSQL or Better Auth).
