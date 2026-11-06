import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { rewritePackageJson } from "../rewrite-pkg.js"

// ── helpers ────────────────────────────────────────────────────────────────

function makePackageJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify(
    {
      name: "kevin-starter",
      version: "0.1.0",
      scripts: {
        dev: "vite dev",
        "codebase:compile": "repomix -o kevin-starter-codebase.xml",
      },
      ...overrides,
    },
    null,
    2
  )
}

// ── suite ──────────────────────────────────────────────────────────────────

describe("rewritePackageJson", () => {
  let tmpRoot: string

  beforeEach(async () => {
    // Use a directory whose basename IS the project name the function will read
    tmpRoot = join(tmpdir(), `my-app-${Date.now()}`)
    await mkdir(tmpRoot, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it("replaces the package name with the project directory name", async () => {
    await writeFile(join(tmpRoot, "package.json"), makePackageJson(), "utf8")

    await rewritePackageJson(tmpRoot)

    const result = JSON.parse(
      await readFile(join(tmpRoot, "package.json"), "utf8")
    )
    // basename of tmpRoot starts with "my-app-"
    expect(result.name).toMatch(/^my-app-/)
    expect(result.name).not.toBe("kevin-starter")
  })

  it("replaces kevin-starter-codebase.xml in codebase:compile with <project-name>-codebase.xml", async () => {
    await writeFile(join(tmpRoot, "package.json"), makePackageJson(), "utf8")

    await rewritePackageJson(tmpRoot)

    const result = JSON.parse(
      await readFile(join(tmpRoot, "package.json"), "utf8")
    )
    expect(result.scripts["codebase:compile"]).not.toContain(
      "kevin-starter-codebase.xml"
    )
    expect(result.scripts["codebase:compile"]).toMatch(/-codebase\.xml$/)
  })

  it("uses the same name in both the name field and codebase:compile output", async () => {
    await writeFile(join(tmpRoot, "package.json"), makePackageJson(), "utf8")

    await rewritePackageJson(tmpRoot)

    const result = JSON.parse(
      await readFile(join(tmpRoot, "package.json"), "utf8")
    )
    const projectName = result.name as string
    expect(result.scripts["codebase:compile"]).toBe(
      `repomix -o ${projectName}-codebase.xml`
    )
  })

  it("does not modify other scripts", async () => {
    await writeFile(join(tmpRoot, "package.json"), makePackageJson(), "utf8")

    await rewritePackageJson(tmpRoot)

    const result = JSON.parse(
      await readFile(join(tmpRoot, "package.json"), "utf8")
    )
    expect(result.scripts.dev).toBe("vite dev")
  })

  it("is a no-op when package.json does not exist", async () => {
    // No package.json written — must not throw
    await expect(rewritePackageJson(tmpRoot)).resolves.toBeUndefined()
  })

  it("leaves package.json unchanged when name is already non-kevin-starter", async () => {
    const custom = makePackageJson({ name: "already-renamed" }).replace(
      "kevin-starter-codebase.xml",
      "already-renamed-codebase.xml"
    )
    await writeFile(join(tmpRoot, "package.json"), custom, "utf8")

    await rewritePackageJson(tmpRoot)

    const result = JSON.parse(
      await readFile(join(tmpRoot, "package.json"), "utf8")
    )
    // name field untouched — regex only matches "kevin-starter"
    expect(result.name).toBe("already-renamed")
    expect(result.scripts["codebase:compile"]).toBe(
      "repomix -o already-renamed-codebase.xml"
    )
  })
})
