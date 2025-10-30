import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

// Local row type for the optional tracking table
type StaffReferralRow = {
  id?: string;
  staff_id: string;
  referral_code: string;
  created_at?: string;
};

const REFERRAL_TABLE = 'staff_referrals';

function getBaseSignupUrl(): string {
  // Prefer an explicit public site URL if provided; otherwise use current origin
  const publicUrl = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL || (import.meta as any)?.env?.VITE_SITE_URL;
  const origin = typeof window !== 'undefined' && window?.location?.origin ? window.location.origin : (publicUrl || '');
  const base = (publicUrl || origin || '').replace(/\/$/, '');
  return `${base}/signup/agent?ref=`;
}

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '').toLowerCase();
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  if (typeof btoa === 'undefined') return '';
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64: string): Uint8Array {
  if (typeof atob === 'undefined') return new Uint8Array();
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function buildReferralCode(staffId: string): string {
  // Short, URL-safe, deterministic code derived from UUID
  try {
    if (typeof btoa === 'undefined') return `staff_${staffId}`;
    const short = bytesToBase64Url(uuidToBytes(staffId));
    return short ? `s_${short}` : `staff_${staffId}`; // ~24 chars
  } catch {
    return `staff_${staffId}`; // Fallback if parsing fails
  }
}

export function decodeReferralCodeToStaffId(code: string): string | null {
  try {
    const raw = code.startsWith('s_') ? code.slice(2) : null;
    if (!raw) return null;
    const bytes = base64UrlToBytes(raw);
    return bytes.length === 16 ? bytesToUuid(bytes) : null;
  } catch {
    return null;
  }
}

function buildReferralLink(code: string) {
  return `${getBaseSignupUrl()}${code}`;
}

export async function ensureReferralExistsForStaff(staffId: string): Promise<string> {
  const code = buildReferralCode(staffId);
  const link = buildReferralLink(code);

  try {
    // Prefer admin client for writes to bypass potential RLS; relax types for flexibility
    const client: any = (isAdminClientConfigured ? adminSupabase : supabase) as any;

    const res = await client
      .from(REFERRAL_TABLE)
      .select('referral_code')
      .eq('staff_id', staffId)
      .limit(1);

    const data = (res?.data as Array<Pick<StaffReferralRow, 'referral_code'>> | null) || null;
    const error = res?.error;

    if (!error && data && data.length > 0 && data[0]?.referral_code) {
      return buildReferralLink(data[0].referral_code);
    }

    // Attempt to insert if not found; ignore type restrictions by casting payload
    const insertRes = await client
      .from(REFERRAL_TABLE)
      .insert({ staff_id: staffId, referral_code: code } as StaffReferralRow);

    if (insertRes?.error) {
      console.warn('Referral insert warning:', insertRes.error?.message);
    }
  } catch (e: any) {
    console.warn('Referral ensure error:', e?.message || e);
  }

  return link;
}

export async function getStaffReferralLink(staffId: string): Promise<string> {
  const code = buildReferralCode(staffId);

  try {
    const client: any = (isAdminClientConfigured ? adminSupabase : supabase) as any;

    const res = await client
      .from(REFERRAL_TABLE)
      .select('referral_code')
      .eq('staff_id', staffId)
      .limit(1);

    const data = (res?.data as Array<Pick<StaffReferralRow, 'referral_code'>> | null) || null;
    const error = res?.error;

    if (!error && data && data.length > 0 && data[0]?.referral_code) {
      return buildReferralLink(data[0].referral_code);
    }

    // If no record exists remotely, ensure creation and return deterministic link
    return await ensureReferralExistsForStaff(staffId);
  } catch (e: any) {
    console.warn('Referral fetch error:', e?.message || e);
    return buildReferralLink(code);
  }
}

export function getDeterministicStaffReferralLink(staffId: string): string {
  return buildReferralLink(buildReferralCode(staffId));
}

export async function recordReferralCodeIfMissing(referralCode: string): Promise<void> {
  try {
    const client: any = (isAdminClientConfigured ? adminSupabase : supabase) as any;
    const possibleStaffId = decodeReferralCodeToStaffId(referralCode);

    const payload: any = { referral_code: referralCode };
    if (possibleStaffId) payload.staff_id = possibleStaffId;

    const { error } = await client
      .from(REFERRAL_TABLE)
      .upsert(payload, { onConflict: 'referral_code' });

    if (error) {
      console.warn('Referral code upsert warning:', error.message);
    }
  } catch (e: any) {
    console.warn('Referral code record error:', e?.message || e);
  }
}