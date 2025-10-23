import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface SalesEnquiry {
  id: string;
  enquiry_id: string;
  client_name: string;
  contact_person: string;
  email: string;
  phone: string;
  destination: string;
  travelers: number;
  budget: number | null;
  budget_currency: string;
  status: 'new' | 'hot' | 'followup' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  date_received: string;
  follow_up_date: string | null;
  duration: string | null;
  requirements: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSalesEnquiries = () => {
  const [enquiries, setEnquiries] = useState<SalesEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_enquiries')
        .select('*')
        .order('date_received', { ascending: false });

      if (error) throw error;
      setEnquiries((data || []) as SalesEnquiry[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enquiries';
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

  const createEnquiry = async (enquiryData: Omit<SalesEnquiry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sales_enquiries')
        .insert([{
          ...enquiryData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setEnquiries(prev => [data as SalesEnquiry, ...prev]);
      
      toast({
        title: "Success",
        description: "Enquiry created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create enquiry';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEnquiry = async (id: string, updates: Partial<SalesEnquiry>) => {
    try {
      const { data, error } = await supabase
        .from('sales_enquiries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setEnquiries(prev => prev.map(enquiry => 
        enquiry.id === id ? data as SalesEnquiry : enquiry
      ));
      
      toast({
        title: "Success",
        description: "Enquiry updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update enquiry';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteEnquiry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_enquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEnquiries(prev => prev.filter(enquiry => enquiry.id !== id));
      
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete enquiry';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  return {
    enquiries,
    loading,
    error,
    fetchEnquiries,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry
  };
};