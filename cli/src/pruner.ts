import { replaceInFile } from "replace-in-file"
import { resolve, join } from "node:path"
import { rm } from "node:fs/promises"
import { existsSync, readdirSync } from "node:fs"

/**
 * Files/folders to delete entirely when a feature is removed.
 * These are route files and other feature-specific directories.
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
 * Globs for source files that may contain feature markers.
 * We search TypeScript, TSX, and JSON files.
 */
const SOURCE_GLOBS = [
  "src/**/*.ts",
  "src/**/*.tsx",
  "src/**/*.json",
  "*.ts",
  "*.json",
]

function buildFeatureRegex(feature: string): RegExp {
  // Matches both JS/TS comment style and JSX comment style markers:
  //   // @feature:name:start ... // @feature:name:end
  //   {/* @feature:name:start */} ... {/* @feature:name:end */}
  // The `gm` flags with [\s\S] handle multi-line blocks.
  return new RegExp(
    `[ \\t]*(?:\\/\\/|\\{?\\/\\*) @feature:${feature}:start (?:\\*\\/\\}?)?[\\r\\n][\\s\\S]*?[ \\t]*(?:\\/\\/|\\{?\\/\\*) @feature:${feature}:end (?:\\*\\/\\}?)?[\\r\\n]?`,
    "gm"
  )
}

export async function pruneFeatures(
  projectPath: string,
  unselectedFeatures: string[]
): Promise<void> {
  for (const feature of unselectedFeatures) {
    const regex = buildFeatureRegex(feature)

    const files = SOURCE_GLOBS.map((g) => resolve(projectPath, g))

    try {
      await replaceInFile({
        files,
        ignore: [
          resolve(projectPath, "node_modules/**"),
          resolve(projectPath, ".git/**"),
          resolve(projectPath, "dist/**"),
        ],
        from: regex,
        to: "",
        allowEmptyPaths: true,
      })
    } catch {
      // replaceInFile throws if no files matched — that's fine
    }

    // Delete feature-specific directories / files
    const paths = filesToDelete[feature] ?? []
    for (const rel of paths) {
      const abs = join(projectPath, rel)
      if (existsSync(abs)) {
        await rm(abs, { recursive: true, force: true })
      }
    }
  }

  // Clean up blank lines left over from marker removal (cosmetic)
  // (Three or more consecutive blank lines → two)
  try {
    await replaceInFile({
      files: SOURCE_GLOBS.map((g) => resolve(projectPath, g)),
      ignore: [
        resolve(projectPath, "node_modules/**"),
        resolve(projectPath, ".git/**"),
        resolve(projectPath, "dist/**"),
      ],
      from: /(\r?\n){3,}/g,
      to: "\n\n",
      allowEmptyPaths: true,
    })
  } catch {
    // ignore
  }
}
