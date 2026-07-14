import { db } from './src/db'
import { resourceRoles, projects } from './src/db/schema'

async function run() {
  const roles = await db.select().from(resourceRoles)
  const projs = await db.select().from(projects)
  console.log("ROLES:", roles)
  console.log("PROJECTS:", projs)
  process.exit(0)
}
run()
