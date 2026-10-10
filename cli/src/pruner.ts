import { replaceInFile } from "replace-in-file"
import { join } from "node:path"
import { rm } from "node:fs/promises"
import { existsSync } from "node:fs"

/**
 * Files/folders to delete entirely when a feature is removed.
 */
const filesToDelete: Record<string, string[]> = {
  "two-factor": [
    "src/routes/_authenticated/two-factor",
    "src/features/account/components/TwoFactorCard.tsx",
  ],
  dashboard: [
    "src/app/dashboard",
    "src/components/chart-area-interactive.tsx",
    "src/components/data-table.tsx",
    "src/components/section-cards.tsx",
  ],
  demo: [
    "src/routes/_authenticated/projects",
    "src/features/projects",
  ],
  google: [],
}

/**
 * Glob patterns relative to the project root.
 * replace-in-file resolves these against the `cwd` option.
 */
const SOURCE_GLOBS = [
  "src/**/*.ts",
  "src/**/*.tsx",
  "*.ts",
]

function buildFeatureRegex(feature: string): RegExp {
  // Matches both TS/JS single-line comment style and JSX block comment style:
  //   // @feature:name:start
  //   ...content...
  //   // @feature:name:end
  //
  //   {/* @feature:name:start */}
  //   ...content...
  //   {/* @feature:name:end */}
  return new RegExp(
    `[ \\t]*(?:\\/\\/|\\{\\/\\*) @feature:${feature}:start(?: \\*\\/\\})?[\\r\\n][\\s\\S]*?[ \\t]*(?:\\/\\/|\\{\\/\\*) @feature:${feature}:end(?: \\*\\/\\})?[\\r\\n]?`,
    "gm"
  )
}

export async function pruneFeatures(
  projectPath: string,
  unselectedFeatures: string[]
): Promise<void> {
  for (const feature of unselectedFeatures) {
    const regex = buildFeatureRegex(feature)

    try {
      await replaceInFile({
        files: SOURCE_GLOBS,
        ignore: ["node_modules/**", ".git/**", "dist/**"],
        from: regex,
        to: "",
        allowEmptyPaths: true,
        // Critically: resolve globs relative to the project directory
        glob: { cwd: projectPath, absolute: true },
      })
    } catch {
      // no files matched — fine
    }

    // Delete feature-specific directories / files
    for (const rel of filesToDelete[feature] ?? []) {
      const abs = join(projectPath, rel)
      if (existsSync(abs)) {
        await rm(abs, { recursive: true, force: true })
      }
    }
  }

  // Cosmetic: collapse 3+ blank lines → 2
  try {
    await replaceInFile({
      files: SOURCE_GLOBS,
      ignore: ["node_modules/**", ".git/**", "dist/**"],
      from: /(\r?\n){3,}/g,
      to: "\n\n",
      allowEmptyPaths: true,
      glob: { cwd: projectPath, absolute: true },
    })
  } catch {
    // ignore
  }
}
