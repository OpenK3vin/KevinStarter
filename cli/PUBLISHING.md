# Publishing `create-k3vin-start` to npm

This document covers the full release workflow for the CLI package located in `cli/`.

---

## Prerequisites

- Node.js ≥ 18
- pnpm installed globally
- An npm account with publish access to the `create-k3vin-start` package
- Logged in to npm:

```bash
npm login
# verify with:
npm whoami
```

---

## Step 1 — Bump the Version

Edit `cli/package.json` and increment `"version"` following [semver](https://semver.org/):

| Change type | Example |
|---|---|
| Bug fix | `0.1.1` → `0.1.2` |
| New feature (backwards-compatible) | `0.1.1` → `0.2.0` |
| Breaking change | `0.1.1` → `1.0.0` |

```bash
# or use pnpm's built-in version bump (from cli/ directory):
pnpm version patch   # 0.1.1 → 0.1.2
pnpm version minor   # 0.1.1 → 0.2.0
pnpm version major   # 0.1.1 → 1.0.0
```

---

## Step 2 — Run Tests

```bash
cd cli
pnpm test
```

All tests must pass before publishing. The `prepublishOnly` hook enforces this automatically, but running it manually first surfaces problems early.

---

## Step 3 — Build

Compile the TypeScript source to `cli/dist/`:

```bash
pnpm build
```

This runs `tsup src/index.ts --format esm --clean` and produces `dist/index.js`, which is the entry point declared in `"bin"`.

> **Verify the output** — confirm `dist/index.js` exists and is not empty before proceeding.

---

## Step 4 — Dry Run (Recommended)

Preview exactly what files will be included in the published package without actually publishing:

```bash
pnpm publish --dry-run --access public
```

Check the output against the `"files"` field in `package.json` (currently `["dist"]`). No source files, test files, or config should appear.

---

## Step 5 — Publish

### One-command release (build + test + publish)

```bash
pnpm release
```

This runs `pnpm build && pnpm test && pnpm publish --access public --no-git-checks` in sequence. If any step fails, publishing is aborted.

### Manual publish (if you've already built and tested)

```bash
pnpm publish:npm
```

This runs `pnpm publish --access public --no-git-checks` directly.

---

## Step 6 — Verify on npm

After publishing, confirm the new version is live:

```bash
npm view create-k3vin-start version
```

Test the published package end-to-end:

```bash
npx create-k3vin-start@latest my-smoke-test
```

---

## Step 7 — Tag the Release

```bash
git tag cli-v$(node -p "require('./package.json').version")
git push origin --tags
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `403 Forbidden` on publish | Run `npm login` and confirm you have access to the package |
| `You cannot publish over the previously published versions` | Bump the version in `package.json` |
| `dist/` missing or empty | Run `pnpm build` again and check for TypeScript errors |
| Tests fail | Fix failing tests before publishing — `prepublishOnly` will block the publish |
| Wrong files included | Adjust the `"files"` array in `package.json` and re-run `--dry-run` |
