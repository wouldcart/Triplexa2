import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface FollowUp {
  id: string;
  title: string;
  description: string | null;
  type: 'general' | 'call' | 'email' | 'meeting' | 'quote' | 'booking';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  related_enquiry_id: string | null;
  related_booking_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useFollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setFollowUps((data || []) as FollowUp[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch follow-ups';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFollowUp = async (followUpData: Omit<FollowUp, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('follow_ups')
        .insert([{
          ...followUpData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setFollowUps(prev => [data as FollowUp, ...prev]);
      
      toast({
        title: "Success",
        description: "Follow-up created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create follow-up';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateFollowUp = async (id: string, updates: Partial<FollowUp>) => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFollowUps(prev => prev.map(followUp => 
        followUp.id === id ? data as FollowUp : followUp
      ));
      
      toast({
        title: "Success",
        description: "Follow-up updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update follow-up';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const completeFollowUp = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFollowUps(prev => prev.map(followUp => 
        followUp.id === id ? data as FollowUp : followUp
      ));
      
      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete follow-up';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteFollowUp = async (id: string) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFollowUps(prev => prev.filter(followUp => followUp.id !== id));
      
      toast({
        title: "Success",
        description: "Follow-up deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete follow-up';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  return {
    followUps,
    loading,
    error,
    fetchFollowUps,
    createFollowUp,
    updateFollowUp,
    completeFollowUp,
    deleteFollowUp
  };
};