
import { useState, useEffect } from 'react';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import type { Tables } from '@/integrations/supabase/types';

export interface ReportingManager {
  id: string;
  name: string;
  role: string;
  department: string;
}

export const useReportingManagers = (excludeId?: string) => {
  const [reportingManagers, setReportingManagers] = useState<ReportingManager[]>([]);

  useEffect(() => {
    const loadReportingManagers = async () => {
      try {
        // Try fetching from Supabase with role filter
        const { data, error } = await supabase
          .from('profiles')
          .select('id,name,role,department,status')
          .in('role', ['staff', 'manager', 'super_admin']);

        let rows: any[] = Array.isArray(data) ? data : [];

        // Fallback to admin client if RLS blocks
        if ((!rows || rows.length === 0) && (error || !data) && isAdminClientConfigured && adminSupabase) {
          try {
            const { data: adminData } = await (adminSupabase as any)
              .from('profiles')
              .select('id,name,role,department,status')
              .in('role', ['staff', 'manager', 'super_admin']);
            rows = Array.isArray(adminData) ? adminData : [];
          } catch {}
        }

        const managers = (rows as Tables<'profiles'>[])
          .filter((row) => {
            // Exclude the provided ID if present
            if (excludeId && row.id === excludeId) return false;
            // Only include active profiles by default
            const status = (row as any)?.status ?? 'active';
            return String(status).toLowerCase() === 'active';
          })
          .map((row) => ({
            id: row.id as string,
            name: (row as any).name || 'Unknown',
            role: (row as any).role || 'staff',
            department: (row as any).department || ''
          }))
          // Remove duplicates based on ID (defensive)
          .filter((manager, index, self) => index === self.findIndex(m => m.id === manager.id))
          // Sort by name
          .sort((a, b) => a.name.localeCompare(b.name));

        setReportingManagers(managers);
      } catch (err) {
        console.warn('Failed to load reporting managers from Supabase', err);
        setReportingManagers([]);
      }
    };

    loadReportingManagers();
  }, [excludeId]);

  return reportingManagers;
};
