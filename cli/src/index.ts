#!/usr/bin/env node
import { defineCommand, runMain } from "citty"
import {
  intro,
  outro,
  text,
  spinner,
  confirm,
  multiselect,
  isCancel,
  cancel,
  log as clackLog,
} from "@clack/prompts"
import pc from "picocolors"
import { downloadTemplate } from "giget"
import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { rename } from "node:fs/promises"
import { pruneFeatures } from "./pruner.js"

const FEATURES = [
  {
    value: "google",
    label: "Google OAuth",
    hint: "better-auth Google provider",
  },
  {
    value: "two-factor",
    label: "Two-Factor Authentication (2FA)",
    hint: "TOTP via better-auth",
  },
  {
    value: "dashboard",
    label: "Dashboard Demo",
    hint: "Demo charts, data-table, and section cards",
  },
  {
    value: "demo",
    label: "Demo Content",
    hint: "Examples & Projects tables with RBAC",
  },
] as const

const ALL_FEATURE_VALUES = FEATURES.map((f) => f.value)

const main = defineCommand({
  meta: {
    name: "create-k3vin-start",
    version: "0.1.0",
    description: "Scaffold a new KevinStarter project",
  },
  args: {
    dir: {
      type: "positional",
      description: "Project directory (optional)",
      required: false,
    },
    "skip-prompts": {
      type: "boolean",
      description: "Skip all prompts and include all features",
      default: false,
    },
  },
  async run({ args }) {
    intro(pc.bgCyan(pc.black(" create-k3vin-start ")))

    // ── 1. Project directory ─────────────────────────────────────────────────
    let projectDir = args.dir

    if (!projectDir) {
      const answer = await text({
        message: "Where should we create your project?",
        placeholder: "./my-project",
        defaultValue: "./my-project",
        validate(value) {
          if (!value.trim()) return "Please enter a directory name."
          if (/[A-Z]/.test(value))
            return "Project name must be lowercase (no uppercase letters)."
        },
      })
      if (isCancel(answer)) {
        cancel("Operation cancelled.")
        process.exit(0)
      }
      projectDir = answer
    }

    // Enforce lowercase
    if (/[A-Z]/.test(projectDir)) {
      cancel("Project directory must be lowercase.")
      process.exit(1)
    }

    const targetPath = resolve(process.cwd(), projectDir)

    if (existsSync(targetPath)) {
      cancel(
        `Directory "${projectDir}" already exists. Choose a different name or delete it first.`
      )
      process.exit(1)
    }

    // ── 2. Feature selection ─────────────────────────────────────────────────
    let selectedFeatures: string[]

    if (args["skip-prompts"]) {
      selectedFeatures = [...ALL_FEATURE_VALUES]
      clackLog.info("Skipping prompts — including all features.")
    } else {
      const answer = await multiselect({
        message: "Which optional features would you like to include?",
        options: FEATURES as unknown as Array<{
          value: string
          label: string
          hint?: string
        }>,
        required: false,
      })
      if (isCancel(answer)) {
        cancel("Operation cancelled.")
        process.exit(0)
      }
      selectedFeatures = answer as string[]
    }

    // ── 3. Download template ─────────────────────────────────────────────────
    const s = spinner()
    s.start("Downloading template from GitHub…")

    try {
      await downloadTemplate("github:OpenK3vin/KevinStarter", {
        dir: targetPath,
        force: true,
        preferOffline: false,
      })
      s.stop("Template downloaded.")
    } catch (error) {
      s.stop(pc.red("Download failed."))
      clackLog.error(String(error))
      process.exit(1)
    }

    // ── 4. Copy .template.env → .env ─────────────────────────────────────────
    const templateEnv = resolve(targetPath, ".template.env")
    const dotEnv = resolve(targetPath, ".env")
    if (existsSync(templateEnv) && !existsSync(dotEnv)) {
      await rename(templateEnv, dotEnv)
    }

    // ── 5. Prune unselected features ─────────────────────────────────────────
    const unselected = ALL_FEATURE_VALUES.filter(
      (f) => !selectedFeatures.includes(f)
    )

    if (unselected.length > 0) {
      s.start(`Pruning ${unselected.join(", ")}…`)
      try {
        await pruneFeatures(targetPath, unselected)
        s.stop("Features pruned.")
      } catch (error) {
        s.stop(pc.red("Pruning failed."))
        clackLog.error(String(error))
        process.exit(1)
      }
    }

    // ── 6. Done ──────────────────────────────────────────────────────────────
    outro(
      [
        pc.green(`✔ Project created at ${pc.bold(projectDir)}`),
        "",
        "Next steps:",
        `  ${pc.cyan(`cd ${projectDir}`)}`,
        `  ${pc.cyan("pnpm install")}`,
        `  ${pc.cyan("pnpm dev")}`,
        "",
        "Don't forget to fill in your ${pc.dim('.env')} before starting the server.",
      ].join("\n")
    )
  },
})

runMain(main)
