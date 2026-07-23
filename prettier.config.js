/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,

  // tailwindcss plugin MUST be listed last, or it silently
  // disables the import-sort plugin's output
  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],

  // Tailwind v4 config lives in CSS, not a JS config file
  tailwindStylesheet: "./src/styles.css",

  importOrder: [
    "^react$",
    "^react-dom(/.*)?$",
    "^@tanstack/(.*)$",
    "",
    "^drizzle-orm(/.*)?$",
    "^zod(/.*)?$",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/db/(.*)$",
    "^@/lib/(.*)$",
    "^@/modules/(.*)$",
    "^@/features/(.*)$",
    "^@/components/(.*)$",
    "^@/routes/(.*)$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx"],
  importOrderCaseSensitive: true,
}
