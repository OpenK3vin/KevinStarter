#!/usr/bin/env node
import { execSync } from "node:child_process"

function getLoggedInUser() {
  try {
    const user = execSync("npm whoami", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
    return user || null
  } catch {
    return null
  }
}

let username = getLoggedInUser()

if (!username) {
  console.log("⚠️ You are not logged in to npm. Launching `npm login`…\n")
  try {
    execSync("npm login", { stdio: "inherit" })
  } catch {
    console.error("\n❌ `npm login` failed or was cancelled.\n")
    process.exit(1)
  }

  username = getLoggedInUser()
  if (!username) {
    console.error("\n❌ Could not verify npm authentication after login.\n")
    process.exit(1)
  }
}

console.log(`✔ Authenticated with npm as: ${username}\n`)
