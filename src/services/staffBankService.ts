import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { StaffBankAccount, BankVerificationStatus } from '@/types/staff';

function toBank(row: any): StaffBankAccount {
  return {
    id: row.id,
    staffId: row.staff_id,
    bankName: row.bank_name,
    accountHolderName: row.account_holder_name,
    accountNumberLast4: row.account_number_last4,
    country: row.country || undefined,
    ifscOrSwift: row.ifsc_or_swift || undefined,
    branch: row.branch || undefined,
    verifiedStatus: row.verified_status,
    verifiedBy: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface BankAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string; // plaintext for encryption in RPC
  country?: string;
  ifscOrSwift?: string;
  branch?: string;
}

export async function getBankAccount(staffId: string): Promise<StaffBankAccount | null> {
  const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
  const { data, error } = await client
    .from('staff_bank_accounts' as any)
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toBank(data);
}

export async function upsertBankAccount(staffId: string, input: BankAccountInput): Promise<StaffBankAccount> {
  const { data, error } = await (supabase as any).rpc('upsert_staff_bank_account', {
    p_staff_id: staffId,
    p_bank_name: input.bankName,
    p_account_holder_name: input.accountHolderName,
    p_account_number_plain: input.accountNumber,
    p_ifsc_or_swift: input.ifscOrSwift || null,
    p_country: input.country || null,
    p_branch: input.branch || null,
  });
  if (error) throw new Error(error.message);
  return toBank(data);
}

export async function updateBankVerificationStatus(accountId: string, status: BankVerificationStatus): Promise<void> {
  const { error } = await supabase
    .from('staff_bank_accounts' as any)
    .update({ verified_status: status })
    .eq('id', accountId);
  if (error) throw new Error(error.message);
}

export async function deleteBankAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_bank_accounts' as any)
    .delete()
    .eq('id', accountId);
  if (error) throw new Error(error.message);
}