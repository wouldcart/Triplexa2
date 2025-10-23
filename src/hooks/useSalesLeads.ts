import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface SalesLead {
  id: string;
  lead_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high';
  estimated_value: number | null;
  estimated_currency: string;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSalesLeads = () => {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as SalesLead[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leads';
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

  const createLead = async (leadData: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sales_leads')
        .insert([{
          ...leadData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => [data as SalesLead, ...prev]);
      
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lead';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateLead = async (id: string, updates: Partial<SalesLead>) => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === id ? data as SalesLead : lead
      ));
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lead';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lead';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead
  };
};