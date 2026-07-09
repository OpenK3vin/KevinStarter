import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import { setTimeout } from 'node:timers/promises';
import color from 'picocolors';
import { exec } from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories and files to ignore when copying the template
const IGNORE = [
  '.git',
  'node_modules',
  'dist',
  '.tanstack',
  'sqlite.db',
  'sqlite.db-shm',
  'sqlite.db-wal',
  'init.js' // don't copy the setup script itself
];

async function main() {
  console.clear();

  p.intro(`${color.bgCyan(color.black(' CREATE NEW PROJECT '))}`);

  const project = await p.group(
    {
      dir: () =>
        p.text({
          message: 'Where should we create your project?',
          placeholder: './my-new-app',
          validate: (value) => {
            if (!value) return 'Please enter a path.';
          },
        }),
      name: ({ results }) =>
        p.text({
          message: 'What is your project named?',
          initialValue: path.basename(path.resolve(results.dir)).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          validate: (value) => {
            if (!value) return 'Please enter a name.';
            if (value.match(/[^a-zA-Z0-9-]/)) return 'Name can only contain letters, numbers, and hyphens.';
          },
        }),
      description: () =>
        p.text({
          message: 'Short description of your project:',
          placeholder: 'A beautiful starter template',
        }),
      author: () =>
        p.text({
          message: 'Author name:',
          placeholder: 'Jane Doe',
        }),
      install: () =>
        p.confirm({
          message: 'Install dependencies and initialize SQLite database?',
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  const s = p.spinner();
  
  const destPath = path.resolve(process.cwd(), project.dir);
  s.start(`Scaffolding project in ${destPath}...`);
  
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  // Copy template files to the destination
  await fs.promises.cp(__dirname, destPath, {
    recursive: true,
    filter: (source) => {
      const name = path.basename(source);
      return !IGNORE.includes(name);
    }
  });

  s.message('Updating package.json...');
  
  const pkgPath = path.join(destPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  
  pkg.name = project.name.toLowerCase();
  if (project.description) pkg.description = project.description;
  if (project.author) pkg.author = project.author;
  
  // Remove the create script from the new project
  if (pkg.scripts && pkg.scripts.create) {
    delete pkg.scripts.create;
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  
  if (project.install) {
    s.message('Installing dependencies and initializing SQLite...');
    try {
      await execAsync('pnpm install', { cwd: destPath });
      await execAsync('pnpm run db:push', { cwd: destPath });
      s.stop(`Project successfully created and database initialized at ${project.dir}`);
    } catch (e) {
      s.stop('Finished with errors during installation.');
      p.log.error(e.message || String(e));
    }
  } else {
    await setTimeout(1000);
    s.stop(`Project successfully created at ${project.dir}`);
  }

  p.note(`Next steps:\n1. cd ${project.dir}\n${project.install ? '' : '2. pnpm install\n3. pnpm run db:push\n'}4. pnpm dev`, 'Ready to go!');

  p.outro(`Done! Have fun building.`);
}

main().catch(console.error);
