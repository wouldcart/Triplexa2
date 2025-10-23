import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface DashboardTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardAlert {
  id: string;
  message: string;
  details: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalEnquiries: number;
  totalBookings: number;
  totalRevenue: number;
  pendingFollowUps: number;
  activeTasks: number;
  hotLeads: number;
}

export const useDashboardData = () => {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnquiries: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingFollowUps: 0,
    activeTasks: 0,
    hotLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('dashboard_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('dashboard_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch stats
      const [enquiriesResult, bookingsResult, followUpsResult, leadsResult] = await Promise.all([
        supabase.from('sales_enquiries').select('id, status'),
        supabase.from('sales_bookings').select('id, total_amount'),
        supabase.from('follow_ups').select('id').eq('status', 'pending'),
        supabase.from('sales_leads').select('id').eq('status', 'qualified')
      ]);

      const totalEnquiries = enquiriesResult.data?.length || 0;
      const totalBookings = bookingsResult.data?.length || 0;
      const totalRevenue = bookingsResult.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const pendingFollowUps = followUpsResult.data?.length || 0;
      const activeTasks = tasksData?.filter(task => task.status !== 'completed').length || 0;
      const hotLeads = leadsResult.data?.length || 0;

      setTasks((tasksData || []) as DashboardTask[]);
      setAlerts((alertsData || []) as DashboardAlert[]);
      setStats({
        totalEnquiries,
        totalBookings,
        totalRevenue,
        pendingFollowUps,
        activeTasks,
        hotLeads
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
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

  const createTask = async (taskData: Omit<DashboardTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dashboard_tasks')
        .insert([{
          ...taskData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data as DashboardTask, ...prev]);
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<DashboardTask>) => {
    try {
      const { data, error } = await supabase
        .from('dashboard_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === id ? data as DashboardTask : task
      ));
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const markAlertAsRead = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('dashboard_alerts')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark alert as read';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    tasks,
    alerts,
    stats,
    loading,
    error,
    fetchDashboardData,
    createTask,
    updateTask,
    markAlertAsRead
  };
};