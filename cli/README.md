# create-k3vin-start

Scaffold a production-ready [KevinStarter](https://github.com/OpenK3vin/KevinStarter) project in seconds.

## Usage

```bash
npx create-k3vin-start
# or
pnpm create k3vin-start
# or
npm create k3vin-start@latest
```

You can also pass the project directory as a positional argument to skip that prompt:

```bash
npx create-k3vin-start my-app
```

## What you get

KevinStarter is a full-stack TanStack Start template with batteries included:

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) |
| Auth | [better-auth](https://better-auth.com) (email/password, sessions, admin, 2FA, Google OAuth) |
| Database | [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL via Docker |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | TanStack Query |

## Optional features

The CLI lets you pick which optional features to include:

| Feature | What it adds |
|---|---|
| `google` | Google OAuth provider wired into better-auth |
| `two-factor` | TOTP-based 2FA (setup page, QR code, backup codes) |
| `dashboard` | Demo dashboard with charts, data-table, and KPI cards |
| `demo` | Example & Project tables with full RBAC seed data |

Unselected features are cleanly stripped from the source before the project is handed to you — no dead code left behind.

## Options

| Flag | Description |
|---|---|
| `--skip-prompts` | Include all features without asking |
| `--help` | Show usage information |

## After scaffolding

```bash
cd my-app
pnpm install

# Copy and fill in your environment variables
cp .template.env .env   # already done automatically by the CLI

# Start the database
docker compose up -d

# Run migrations & seed
pnpm db:migrate
pnpm db:seed

# Start the dev server
pnpm dev
```

## Requirements

- Node.js ≥ 18
- pnpm (the template uses pnpm workspaces)
- Docker (for the PostgreSQL dev database)

## License

MIT
