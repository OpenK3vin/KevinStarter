#!/usr/bin/env node
import { exec } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { setTimeout } from "node:timers/promises"
import { fileURLToPath } from "node:url"
import util from "node:util"

import * as p from "@clack/prompts"
import color from "picocolors"

const execAsync = util.promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directories and files to ignore when copying the template
const IGNORE = [
  ".git",
  "node_modules",
  "dist",
  ".tanstack",
  "sqlite.db",
  "sqlite.db-shm",
  "sqlite.db-wal",
  "init.js", // don't copy the setup script itself
]

async function main() {
  console.clear()

  p.intro(`${color.bgCyan(color.black(" CREATE NEW PROJECT "))}`)

  const project = await p.group(
    {
      name: () =>
        p.text({
          message: "What is your project named? (This will be the folder name)",
          placeholder: "my-new-app",
          validate: (value) => {
            if (!value) return "Please enter a name."
            if (value !== "." && value.match(/[^a-zA-Z0-9-]/))
              return 'Name can only contain letters, numbers, and hyphens (or "." for current directory).'
          },
        }),
      dir: () =>
        p.text({
          message: "Where should we create it? (Enter the parent directory)",
          initialValue: "./",
          validate: (value) => {
            if (!value) return "Please enter a path."
          },
        }),
      description: () =>
        p.text({
          message: "Short description of your project:",
          placeholder: "A beautiful starter template",
        }),
      author: () =>
        p.text({
          message: "Author name:",
          placeholder: "Jane Doe",
        }),
      install: () =>
        p.confirm({
          message: "Install dependencies and initialize SQLite database?",
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.")
        process.exit(0)
      },
    },
  )

  const s = p.spinner()

  const destPath =
    project.name === "."
      ? path.resolve(process.cwd(), project.dir)
      : path.resolve(process.cwd(), project.dir, project.name)

  s.start(`Scaffolding project in ${destPath}...`)

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true })
  }

  // Copy template files to the destination
  await fs.promises.cp(__dirname, destPath, {
    recursive: true,
    filter: (source) => {
      const name = path.basename(source)
      return !IGNORE.includes(name)
    },
  })

  s.message("Updating package.json...")

  const pkgPath = path.join(destPath, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

  const finalProjectName = project.name === "." ? path.basename(destPath) : project.name
  pkg.name = finalProjectName

  if (project.description) pkg.description = project.description
  if (project.author) pkg.author = project.author

  // Clean up template-specific package.json fields
  delete pkg.bin
  pkg.version = "0.0.0"

  if (pkg.scripts && pkg.scripts.create) {
    delete pkg.scripts.create
  }

  if (pkg.devDependencies) {
    delete pkg.devDependencies["@clack/prompts"]
    delete pkg.devDependencies["picocolors"]
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")

  if (project.install) {
    s.message("Installing dependencies and initializing SQLite...")
    try {
      await execAsync("pnpm install", { cwd: destPath })
      await execAsync("pnpm run db:push", { cwd: destPath })
      s.stop(`Project successfully created and database initialized at ${destPath}`)
    } catch (e) {
      s.stop("Finished with errors during installation.")
      p.log.error(e.message || String(e))
    }
  } else {
    await setTimeout(1000)
    s.stop(`Project successfully created at ${destPath}`)
  }

  p.note(
    `Next steps:\n1. cd ${path.relative(process.cwd(), destPath) || "."}\n${project.install ? "" : "2. pnpm install\n3. pnpm run db:push\n"}4. pnpm dev`,
    "Ready to go!",
  )

  p.outro(`Done! Have fun building.`)
}

main().catch(console.error)
