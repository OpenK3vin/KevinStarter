/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,

  // Imported directly rather than referenced by string — pnpm's strict
  // node_modules layout is known to sometimes prevent Prettier from
  // resolving this plugin by name. tailwindcss plugin MUST still be
  // listed last, or it silently disables the import-sort plugin's output.
  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],

  // Tailwind v4 config lives in CSS, not a JS config file
  tailwindStylesheet: "./src/styles.css",

  importOrder: [
    "^react$",
    "^react-dom(/.*)?$",
    "",
    "^@tanstack/(.*)$",
    "",
    "^drizzle-orm(/.*)?$",
    "^zod(/.*)?$",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/shared/(.*)$",
    "^@/components/(.*)$",
    "",
    "^@/db(/.*)?$",
    "",
    "^@/features/(.*)$",
    "^@/hooks/(.*)$",
    "^@/integration/(.*)$",
    "^@/lib/(.*)$",
    "^@/modules/(.*)$",
    "^@/routes/(.*)$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx"],
  importOrderCaseSensitive: true,
}
