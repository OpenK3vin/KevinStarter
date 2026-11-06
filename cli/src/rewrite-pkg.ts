import { resolve, basename } from "node:path"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"

/**
 * Rewrites the scaffolded `package.json` so that:
 *  - `"name"` is set to the project directory name
 *  - `codebase:compile` output becomes `<project-name>-codebase.xml`
 *
 * Safe no-op when `package.json` does not exist.
 */
export async function rewritePackageJson(targetPath: string): Promise<void> {
  const pkgPath = resolve(targetPath, "package.json")
  if (!existsSync(pkgPath)) return

  const projectName = basename(targetPath)
  const raw = await readFile(pkgPath, "utf8")

  const updated = raw
    .replace(/"name":\s*"kevin-starter"/, `"name": "${projectName}"`)
    .replace(/kevin-starter-codebase\.xml/g, `${projectName}-codebase.xml`)

  await writeFile(pkgPath, updated, "utf8")
}
