import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { pruneFeatures } from "../pruner.js"

// ── helpers ────────────────────────────────────────────────────────────────

async function createProject(
  root: string,
  files: Record<string, string>
): Promise<void> {
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel)
    await mkdir(join(abs, ".."), { recursive: true })
    await writeFile(abs, content, "utf8")
  }
}

async function read(root: string, rel: string): Promise<string> {
  return readFile(join(root, rel), "utf8")
}

// ── fixtures ───────────────────────────────────────────────────────────────

const TS_COMMENT_FIXTURE = `\
import { foo } from "foo"
// @feature:google:start
import { google } from "./google"
const googleConfig = { clientId: process.env.GOOGLE_CLIENT_ID }
// @feature:google:end

export function setup() {
  return { foo }
}
`

const TSX_JSX_FIXTURE = `\
export default function Page() {
  return (
    <div>
      {/* @feature:two-factor:start */}
      <TwoFactorCard />
      {/* @feature:two-factor:end */}
      <ProfileCard />
    </div>
  )
}
`

const MULTI_FEATURE_FIXTURE = `\
const a = 1
// @feature:google:start
const googleThing = true
// @feature:google:end
// @feature:two-factor:start
const tfaThing = true
// @feature:two-factor:end
const b = 2
`

// ── tests ──────────────────────────────────────────────────────────────────

describe("pruneFeatures", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = join(tmpdir(), `k3vin-test-${Date.now()}`)
    await mkdir(tmpRoot, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it("removes a TS-comment-style feature block", async () => {
    await createProject(tmpRoot, { "src/lib/auth.ts": TS_COMMENT_FIXTURE })

    await pruneFeatures(tmpRoot, ["google"])

    const result = await read(tmpRoot, "src/lib/auth.ts")
    expect(result).not.toContain("@feature:google")
    expect(result).not.toContain("googleConfig")
    expect(result).not.toContain("import { google }")
    expect(result).toContain('import { foo } from "foo"')
    expect(result).toContain("export function setup()")
  })

  it("removes a JSX-comment-style feature block", async () => {
    await createProject(tmpRoot, { "src/routes/page.tsx": TSX_JSX_FIXTURE })

    await pruneFeatures(tmpRoot, ["two-factor"])

    const result = await read(tmpRoot, "src/routes/page.tsx")
    expect(result).not.toContain("@feature:two-factor")
    expect(result).not.toContain("TwoFactorCard")
    expect(result).toContain("ProfileCard")
  })

  it("removes only the specified feature and leaves others intact", async () => {
    await createProject(tmpRoot, { "src/config.ts": MULTI_FEATURE_FIXTURE })

    await pruneFeatures(tmpRoot, ["google"])

    const result = await read(tmpRoot, "src/config.ts")
    expect(result).not.toContain("googleThing")
    expect(result).toContain("tfaThing")
    expect(result).toContain("const a = 1")
    expect(result).toContain("const b = 2")
  })

  it("removes multiple features in one pass", async () => {
    await createProject(tmpRoot, { "src/config.ts": MULTI_FEATURE_FIXTURE })

    await pruneFeatures(tmpRoot, ["google", "two-factor"])

    const result = await read(tmpRoot, "src/config.ts")
    expect(result).not.toContain("googleThing")
    expect(result).not.toContain("tfaThing")
    expect(result).toContain("const a = 1")
    expect(result).toContain("const b = 2")
  })

  it("deletes feature-specific directories when removing dashboard", async () => {
    const chartPath = join(tmpRoot, "src/components/chart-area-interactive.tsx")
    await createProject(tmpRoot, {
      "src/components/chart-area-interactive.tsx": "export const Chart = () => null",
      "src/components/data-table.tsx": "export const DataTable = () => null",
    })

    await pruneFeatures(tmpRoot, ["dashboard"])

    expect(existsSync(chartPath)).toBe(false)
  })

  it("is a no-op when no files match the feature", async () => {
    await createProject(tmpRoot, {
      "src/simple.ts": "export const x = 1\n",
    })

    await pruneFeatures(tmpRoot, ["google"])

    const result = await read(tmpRoot, "src/simple.ts")
    expect(result.trim()).toBe("export const x = 1")
  })

  it("leaves no triple-blank-lines after pruning", async () => {
    const bloated = `line1\n\n// @feature:google:start\nstuff\n// @feature:google:end\n\n\nline2\n`
    await createProject(tmpRoot, { "src/a.ts": bloated })

    await pruneFeatures(tmpRoot, ["google"])

    const result = await read(tmpRoot, "src/a.ts")
    expect(result).not.toMatch(/\n{3,}/)
  })
})
