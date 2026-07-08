# OKLCH Color Space Enforcement Rule

All styling, theme configurations, and color specifications in this project must strictly use the OKLCH color space (`oklch()`).

## Rules

1. **No Hex, RGB, or HSL**:
   - Do **NOT** write Hex colors (`#...`), `rgb()`, `rgba()`, `hsl()`, or `hsla()` in CSS files, Tailwind styles, configurations, or component code.
   - All colors must be defined and written using the `oklch(L C H)` or `oklch(L C H / Alpha)` formats.

2. **Strict Conversion Requirement**:
   - If the user or any requirement specifies a color in HEX (e.g., `#3a86ff`), you **MUST** convert it to its equivalent `oklch` value before writing it to the codebase or outputting it.
   - Example Conversion:
     - `#3a86ff` ➡️ `oklch(0.612 0.201 254.36)` or similar accurate OKLCH representation.

3. **Theme & CSS Variables**:
   - CSS variables representing theme tokens (e.g., `--primary`, `--background`, etc.) in `styles.css` must strictly follow the `oklch()` function structure.
