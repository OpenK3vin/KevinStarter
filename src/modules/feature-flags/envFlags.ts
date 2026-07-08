/**
 * Environment variable-based feature flags
 *
 * In Vite, environment variables must be prefixed with VITE_ to be exposed to the client.
 * Feature flags should follow the naming convention: VITE_FF_<FLAG_NAME>
 *
 * Note: Vite statically replaces `import.meta.env` references during the build.
 * We must read them statically instead of iterating over the `import.meta.env` object.
 *
 * --- HOW TO ADD A NEW FLAG ---
 * 1. Add VITE_FF_MY_FLAG=false to .template.env (and .env)
 * 2. Add `myFlag` to the returned object in `getEnvFlags()` below
 * 3. Add the raw value to `rawValues` in `getEnvFlagDebugInfo()` below
 */

export type EnvFlagOptions = {
  env?: Record<string, string | boolean | undefined>;
};

/**
 * Parse a string value to boolean
 */
function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === "") return false;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get all feature flags from environment variables.
 * Explicit references are used so Vite can statically replace them.
 */
export function getEnvFlags(
  options: EnvFlagOptions = {},
): Record<string, boolean> {
  return {
    // ── Add new flags here ──────────────────────────────────────────
    example: parseBoolean(
      options.env
        ? options.env.VITE_FF_EXAMPLE
        : import.meta.env.VITE_FF_EXAMPLE,
    ),
    // ───────────────────────────────────────────────────────────────
  };
}

/**
 * Check if a specific feature flag is enabled via environment variable
 */
export function isEnvFlagEnabled(
  flagName: string,
  options: EnvFlagOptions = {},
): boolean {
  const flags = getEnvFlags(options);
  return flags[flagName] ?? false;
}

/**
 * Get raw environment variable information for debugging
 */
export function getEnvFlagDebugInfo(options: EnvFlagOptions = {}): {
  rawValues: Record<string, string | boolean | undefined>;
  parsedFlags: Record<string, boolean>;
} {
  const env = options.env ?? import.meta.env;
  const rawValues = {
    VITE_FF_EXAMPLE: env.VITE_FF_EXAMPLE,
  };

  return {
    rawValues,
    parsedFlags: getEnvFlags(options),
  };
}
