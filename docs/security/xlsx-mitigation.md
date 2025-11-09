XLSX safety shim and import limits

Context
- The `xlsx` package currently has known advisories (prototype pollution and ReDoS) without an upstream fix.
- We rely on `xlsx` for multiple import/export flows (countries, cities, hotels, transport, etc.).

What we changed
- Introduced a safety shim at `src/shims/xlsx-safe.ts` and aliased bare `xlsx` imports to it.
- The shim:
  - Sanitizes keys returned from `utils.sheet_to_json` to avoid `__proto__`/`constructor`/`prototype` pitfalls.
  - Creates null-prototype row objects to block magic setters.
  - Imposes conservative limits on file size and worksheet dimensions to reduce ReDoS risk.

Runtime limits
- Defaults: `maxBytes = 5 MB`, `maxCellsPerSheet = 200,000`.
- You can tune at runtime:
  ```ts
  import { setXlsxLimits } from 'xlsx';
  setXlsxLimits({ maxBytes: 10_000_000, maxCellsPerSheet: 500_000 });
  ```

Build configuration
- Vite alias (regex) ensures only bare `xlsx` is remapped; subpath imports like `xlsx/xlsx.mjs` still resolve to the real package.
- TS path mapping mirrors the alias for IDE type resolution.

Notes
- This does not remove the advisory from `npm audit` because the upstream package remains, but it mitigates practical risk across our import UI.
- If/when `xlsx` ships a fix, remove the shim + aliases and upgrade upstream.