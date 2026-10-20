import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { renameProject, toDisplayName } from "../renamer.js"

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

// ── tests ──────────────────────────────────────────────────────────────────

describe("toDisplayName", () => {
  it("converts kebab-case to Title Case words", () => {
    expect(toDisplayName("my-project")).toBe("My Project")
    expect(toDisplayName("my-awesome-app")).toBe("My Awesome App")
  })

  it("converts snake_case to Title Case words", () => {
    expect(toDisplayName("my_project")).toBe("My Project")
    expect(toDisplayName("cool_new_tool")).toBe("Cool New Tool")
  })

  it("capitalizes single-word names", () => {
    expect(toDisplayName("myapp")).toBe("Myapp")
  })

  it("handles scoped package names", () => {
    expect(toDisplayName("@scope/my-app")).toBe("My App")
  })
})

describe("renameProject", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = join(tmpdir(), `k3vin-rename-test-${Date.now()}`)
    await mkdir(tmpRoot, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it("updates name and codebase:compile in package.json", async () => {
    const pkg = {
      name: "kevin-starter",
      version: "0.1.0",
      scripts: {
        "codebase:compile": "repomix -o kevin-starter-codebase.xml",
        dev: "vite dev",
      },
    }
    await createProject(tmpRoot, {
      "package.json": JSON.stringify(pkg, null, 2),
    })

    await renameProject(tmpRoot, "super-app")

    const result = JSON.parse(await read(tmpRoot, "package.json"))
    expect(result.name).toBe("super-app")
    expect(result.scripts["codebase:compile"]).toBe(
      "repomix -o super-app-codebase.xml"
    )
    expect(result.scripts.dev).toBe("vite dev")
  })

  it("replaces KevinStarter with display name in source files", async () => {
    await createProject(tmpRoot, {
      "src/routes/__root.tsx": `title: "KevinStarter",`,
      "src/lib/auth.ts": `appName: "KevinStarter",\nissuer: "KevinStarter",`,
      "src/routes/index.tsx": `<h1>Welcome to KevinStarter</h1>`,
      "src/routes/_auth/login.tsx": `content: "Sign in to your KevinStarter account"`,
    })

    await renameProject(tmpRoot, "my-cool-app")

    expect(await read(tmpRoot, "src/routes/__root.tsx")).toBe(
      `title: "My Cool App",`
    )
    expect(await read(tmpRoot, "src/lib/auth.ts")).toBe(
      `appName: "My Cool App",\nissuer: "My Cool App",`
    )
    expect(await read(tmpRoot, "src/routes/index.tsx")).toBe(
      `<h1>Welcome to My Cool App</h1>`
    )
    expect(await read(tmpRoot, "src/routes/_auth/login.tsx")).toBe(
      `content: "Sign in to your My Cool App account"`
    )
  })

  it("does not mutate unrelated occurrences like KevinPulse", async () => {
    await createProject(tmpRoot, {
      "src/db/schema.ts": `// see KevinPulse's fuel_price_entries\nconst app = "KevinStarter";`,
    })

    await renameProject(tmpRoot, "my-app")

    const result = await read(tmpRoot, "src/db/schema.ts")
    expect(result).toContain("// see KevinPulse's fuel_price_entries")
    expect(result).toContain(`const app = "My App";`)
  })

  it("updates README.md references", async () => {
    await createProject(tmpRoot, {
      "README.md": `# KevinStarter Template\nMirroring kevin-starter architecture.`,
    })

    await renameProject(tmpRoot, "super-tool")

    const result = await read(tmpRoot, "README.md")
    expect(result).toContain("# Super Tool Template")
    expect(result).toContain("Mirroring super-tool architecture.")
  })

  it("handles missing package.json or source directory gracefully", async () => {
    await expect(
      renameProject(tmpRoot, "empty-project")
    ).resolves.toBeUndefined()
  })
})
