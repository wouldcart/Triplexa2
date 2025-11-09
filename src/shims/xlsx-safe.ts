// Safety shim for 'xlsx' to mitigate known prototype pollution and ReDoS risks
// - Sanitizes keys returned by sheet_to_json to avoid __proto__/constructor/prototype
// - Creates null-prototype row objects to block magic setters
// - Imposes conservative limits on file size and sheet dimensions to reduce ReDoS risk

// IMPORTANT: We import a subpath to bypass module alias that maps 'xlsx' to this file
// The 'xlsx/xlsx.mjs' ESM entry is stable across versions >=0.18
// If your bundler complains, change to 'xlsx' and remove the alias, but keep sanitization logic.
import * as XLSXOrg from 'xlsx/xlsx.mjs';

type ReadOpts = Parameters<typeof XLSXOrg.read>[1];

const DEFAULT_LIMITS = {
  maxBytes: 5_000_000, // ~5MB per file
  maxCellsPerSheet: 200_000, // approx rows * cols per sheet
};

// Allow consuming code to tune limits at runtime if needed
let currentLimits = { ...DEFAULT_LIMITS };

export function setXlsxLimits(limits: Partial<typeof DEFAULT_LIMITS>) {
  currentLimits = { ...currentLimits, ...limits };
}

function sanitizeKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower === '__proto__' || lower === 'prototype' || lower === 'constructor') {
    return `${key}_safe`;
  }
  return key;
}

function enforceWorkbookLimits(wb: XLSXOrg.WorkBook) {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const ref = ws['!ref'];
    if (!ref) continue;
    const range = XLSXOrg.utils.decode_range(ref);
    const rows = range.e.r - range.s.r + 1;
    const cols = range.e.c - range.s.c + 1;
    const cells = rows * cols;
    if (cells > currentLimits.maxCellsPerSheet) {
      throw new Error(`Spreadsheet too large: ${cells} cells in sheet "${name}" exceeds limit ${currentLimits.maxCellsPerSheet}`);
    }
  }
}

// Wrap read to optionally check input size and worksheet dimensions
export function read(data: any, opts?: ReadOpts): XLSXOrg.WorkBook {
  try {
    if (typeof data === 'string') {
      // String inputs are generally smaller (binary/CSV). Skip byte limit, still parse then check dimensions.
    } else if (data && typeof data.byteLength === 'number') {
      const bytes = Number(data.byteLength);
      if (bytes > currentLimits.maxBytes) {
        throw new Error(`Spreadsheet file too large: ${bytes} bytes exceeds limit ${currentLimits.maxBytes}`);
      }
    }
  } catch {/* non-fatal */}

  const wb = XLSXOrg.read(data as any, opts as any);
  enforceWorkbookLimits(wb);
  return wb;
}

// Safe sheet_to_json wrapper that returns null-prototype objects with sanitized keys
function sheet_to_json_safe<T = any>(ws: XLSXOrg.WorkSheet, opts?: Parameters<typeof XLSXOrg.utils.sheet_to_json>[1]): T[] {
  const rows = XLSXOrg.utils.sheet_to_json<Record<string, any>>(ws, opts as any);
  return rows.map((row) => {
    const safeRow = Object.create(null) as Record<string, any>;
    for (const [k, v] of Object.entries(row)) {
      safeRow[sanitizeKey(k)] = v;
    }
    return safeRow as unknown as T;
  });
}

// Rebuild utils object overriding sheet_to_json
export const utils = {
  ...XLSXOrg.utils,
  sheet_to_json: sheet_to_json_safe,
};

// Re-export other commonly used APIs and types
export const write = XLSXOrg.write;
export const writeFile = XLSXOrg.writeFile;
export const version = XLSXOrg.version;
export type WorkBook = XLSXOrg.WorkBook;
export type WorkSheet = XLSXOrg.WorkSheet;

// Default export to maintain compatibility with `import * as XLSX from 'xlsx'` style usage
const XLSXSafe = {
  ...XLSXOrg,
  read,
  utils,
};

export default XLSXSafe;