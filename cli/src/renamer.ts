import { replaceInFile } from "replace-in-file"
import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"

/**
 * Converts a kebab-case or snake_case project name to a human-readable display name.
 * e.g. "my-cool-app" -> "My Cool App"
 *      "@scope/my-app" -> "My App"
 */
export function toDisplayName(name: string): string {
  return name
    .replace(/^@[^/]+\//, "")
    .replace(/^[@/]+/, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Replaces default template names ("kevin-starter" and "KevinStarter")
 * with the user's chosen project name and formatted display name.
 */
export async function renameProject(
  projectPath: string,
  projectName: string
): Promise<void> {
  const displayName = toDisplayName(projectName)

  // 1. Update package.json
  const pkgPath = join(projectPath, "package.json")
  if (existsSync(pkgPath)) {
    try {
      const content = await readFile(pkgPath, "utf8")
      const pkg = JSON.parse(content)
      pkg.name = projectName
      if (typeof pkg.scripts?.["codebase:compile"] === "string") {
        pkg.scripts["codebase:compile"] = pkg.scripts[
          "codebase:compile"
        ].replace(/kevin-starter/g, projectName)
      }
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8")
    } catch {
      // ignore parse/write failures
    }
  }

  // 2. Replace "KevinStarter" in source files and README
  try {
    await replaceInFile({
      files: ["src/**/*.ts", "src/**/*.tsx", "README.md"],
      ignore: ["node_modules/**", ".git/**", "dist/**", "cli/**"],
      from: /KevinStarter/g,
      to: displayName,
      allowEmptyPaths: true,
      glob: { cwd: projectPath, absolute: true },
    })
  } catch {
    // ignore
  }

  // 3. Replace any remaining "kevin-starter" in README.md
  try {
    await replaceInFile({
      files: ["README.md"],
      ignore: ["node_modules/**", ".git/**", "dist/**", "cli/**"],
      from: /kevin-starter/g,
      to: projectName,
      allowEmptyPaths: true,
      glob: { cwd: projectPath, absolute: true },
    })
  } catch {
    // ignore
  }
}
