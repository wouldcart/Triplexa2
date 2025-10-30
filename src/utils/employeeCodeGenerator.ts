
import { staffMembers } from '@/data/staffData';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

export const generateEmployeeCode = (): string => {
  // Get all existing employee IDs and extract the numeric parts
  const existingCodes = staffMembers
    .map(staff => staff.employeeId)
    .filter(id => id && /^\d{4}$/.test(id)) // Only 4-digit numeric codes
    .map(id => parseInt(id))
    .filter(num => !isNaN(num));

  // Start from 1001 and find the next available code
  let nextCode = 1001;
  while (existingCodes.includes(nextCode)) {
    nextCode++;
    // Prevent infinite loop, max 4-digit number is 9999
    if (nextCode > 9999) {
      throw new Error('No available employee codes remaining');
    }
  }

  return nextCode.toString().padStart(4, '0');
};

export const validateEmployeeCode = (code: string): boolean => {
  // Allow 1 to 10 digits, including leading zeros when typed (e.g., "0001")
  return /^\d{1,10}$/.test(code);
};

export const isEmployeeCodeUnique = (code: string, excludeId?: string): boolean => {
  return !staffMembers.some(staff => 
    staff.employeeId === code && staff.id !== excludeId
  );
};

const fetchEmployeeIdsFromTable = async (client: any, table: 'profiles' | 'staff'): Promise<string[]> => {
  const { data, error } = await client
    .from(table)
    .select('employee_id')
    .not('employee_id', 'is', null);
  if (error || !Array.isArray(data)) return [];
  return (data as any[])
    .map((row) => String((row as any).employee_id))
    .filter((v) => /^\d{1,10}$/.test(v));
};

export const generateEmployeeCodeFromDB = async (): Promise<string> => {
  let ids: string[] = [];
  try {
    const profiles = await fetchEmployeeIdsFromTable(supabase, 'profiles');
    const staff = await fetchEmployeeIdsFromTable(supabase, 'staff');
    ids = [...profiles, ...staff];
  } catch {
    ids = [];
  }

  if (!ids.length && isAdminClientConfigured && adminSupabase) {
    try {
      const profiles = await fetchEmployeeIdsFromTable(adminSupabase, 'profiles');
      const staff = await fetchEmployeeIdsFromTable(adminSupabase, 'staff');
      ids = [...profiles, ...staff];
    } catch {
      ids = [];
    }
  }

  // Convert to numeric values ignoring leading zeros, permit 1..10 digits
  const nums = ids
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 9_999_999_999);

  // Start from 1 if none, otherwise next sequential
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  if (next > 9_999_999_999) {
    throw new Error('No available employee codes remaining up to 10 digits');
  }
  // Return as unpadded string so it naturally grows from 1 digit to 10
  return String(next);
};

export const isEmployeeCodeUniqueDb = async (code: string): Promise<boolean> => {
  if (!/^\d{1,10}$/.test(code)) return false;
  const check = async (client: any, table: 'profiles' | 'staff') => {
    const { data, error } = await client
      .from(table)
      .select('employee_id')
      .eq('employee_id', code)
      .limit(1);
    if (error) return false;
    return Array.isArray(data) ? data.length === 0 : true;
  };

  try {
    const a = await check(supabase, 'profiles');
    const b = await check(supabase, 'staff');
    if (a && b) return true;
  } catch {}

  if (isAdminClientConfigured && adminSupabase) {
    try {
      const a2 = await check(adminSupabase, 'profiles');
      const b2 = await check(adminSupabase, 'staff');
      return a2 && b2;
    } catch {}
  }
  return false;
};
