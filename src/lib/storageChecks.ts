import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

export interface BucketCheckResult {
  exists: boolean;
  errorMessage?: string;
}

// Lightweight bucket existence check.
// - Uses admin client getBucket when available (service role).
// - Falls back to listing bucket root with anon client.
export async function checkBucketExists(bucket: string): Promise<BucketCheckResult> {
  try {
    // Prefer admin check when configured (works even with private buckets)
    if (isAdminClientConfigured && adminSupabase) {
      const { data, error } = await adminSupabase.storage.getBucket(bucket);
      if (error) {
        // Normalize common error messages
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('does not exist')) {
          return { exists: false, errorMessage: `Bucket "${bucket}" was not found` };
        }
        return { exists: false, errorMessage: error.message };
      }
      return { exists: !!data };
    }

    // Fallback: try listing root with anon client
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('invalid') || msg.includes('bucket')) {
        return { exists: false, errorMessage: `Bucket "${bucket}" is missing or inaccessible` };
      }
      return { exists: false, errorMessage: error.message };
    }
    return { exists: true };
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('not found') || msg.includes('bucket')) {
      return { exists: false, errorMessage: `Bucket "${bucket}" was not found` };
    }
    return { exists: false, errorMessage: err?.message || 'Unknown bucket check error' };
  }
}