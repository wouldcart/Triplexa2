import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface SalesBooking {
  id: string;
  booking_id: string;
  enquiry_id: string | null;
  client_name: string;
  contact_person: string;
  email: string;
  phone: string;
  destination: string;
  travelers: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_date: string;
  travel_date: string | null;
  duration: string | null;
  commission: number;
  payment_status: 'pending' | 'advance' | 'partial' | 'paid';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSalesBookings = () => {
  const [bookings, setBookings] = useState<SalesBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_bookings')
        .select('*')
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as SalesBooking[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings';
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

  const createBooking = async (bookingData: Omit<SalesBooking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sales_bookings')
        .insert([{
          ...bookingData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => [data as SalesBooking, ...prev]);
      
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateBooking = async (id: string, updates: Partial<SalesBooking>) => {
    try {
      const { data, error } = await supabase
        .from('sales_bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => prev.map(booking => 
        booking.id === id ? data as SalesBooking : booking
      ));
      
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBookings(prev => prev.filter(booking => booking.id !== id));
      
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete booking';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking
  };
};