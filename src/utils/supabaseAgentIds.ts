// Utility for mapping Supabase UUID agent IDs to deterministic numeric IDs
// This keeps compatibility with existing UI and Query types expecting numbers.

/**
 * Derive a deterministic numeric ID from a UUID string.
 * Uses the first 8 hex characters of the UUID and maps into 100000..899999.
 * This is deterministic and avoids collisions with typical local mock IDs.
 */
export function toNumericAgentId(uuid: string): number {
  if (!uuid) return 0;
  const hex = uuid.replace(/-/g, '').slice(0, 8);
  const n = Number.parseInt(hex || '0', 16);
  // Map into a safe range to avoid overlapping with existing mock IDs (~101..)
  return 100000 + (n % 800000);
}

/**
 * Helper to find a Supabase agent option by the numeric ID produced above.
 * Keeps logic centralized so both the selector and wrapper use the same mapping.
 */
export function findSupabaseAgentByNumericId<T extends { id: string }>(list: T[], numericId: number): T | null {
  for (const item of list) {
    if (toNumericAgentId(item.id) === numericId) return item;
  }
  return null;
}