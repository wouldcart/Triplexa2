import { supabase } from '@/lib/supabaseClient';

export const sendOtp = async (phone: string) => {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { phone },
  });

  return { data, error };
};

export const verifyOtp = async (phone: string, otp: string) => {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { phone, otp },
  });

  return { data, error };
};

export const upsertAgentWithPhone = async (phone: string) => {
  const { data, error } = await supabase.functions.invoke('upsert-agent-phone', {
    body: { phone },
  });

  return { data, error };
};

export const getSmsConfigStatus = async () => {
  const { data, error } = await supabase.functions.invoke('sms-config-status', {
    body: {},
  });

  return { ok: !error, data, error };
};

export const updateAccountEmail = async (userId: string, newEmail: string) => {
  const { data, error } = await supabase.functions.invoke('update-email', {
    body: { user_id: userId, new_email: newEmail },
  });

  return { data, error };
};
