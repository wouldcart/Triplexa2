import { supabase } from '@/lib/supabaseClient';

export const updateAccountEmail = async (userId: string, newEmail: string) => {
  const { data, error } = await supabase.functions.invoke('update-email', {
    body: { user_id: userId, new_email: newEmail },
  });

  return { data, error };
};
