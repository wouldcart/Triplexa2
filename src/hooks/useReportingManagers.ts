
import { useState, useEffect } from 'react';
import { EnhancedStaffMember } from '@/types/staff';
import { enhancedStaffMembers } from '@/data/departmentData';
import { getStoredStaff } from '@/services/staffStorageService';

export interface ReportingManager {
  id: string;
  name: string;
  role: string;
  department: string;
}

export const useReportingManagers = (excludeId?: string) => {
  const [reportingManagers, setReportingManagers] = useState<ReportingManager[]>([]);

  useEffect(() => {
    const loadReportingManagers = () => {
      // Get stored staff from localStorage
      const storedStaff = getStoredStaff();
      
      // Combine existing staff with stored staff
      const allStaff = [...enhancedStaffMembers, ...storedStaff];
      
      // Filter to get only managers, admins, and senior roles
      const managers = allStaff
        .filter(staff => {
          // Exclude current staff member if editing
          if (excludeId && staff.id === excludeId) return false;
          
          // Only include active staff
          if (staff.status !== 'active') return false;
          
          // Include staff with manager/admin roles
          const role = staff.role.toLowerCase();
          return (
            role.includes('manager') ||
            role.includes('admin') ||
            role.includes('director') ||
            role.includes('head') ||
            role.includes('lead') ||
            role.includes('supervisor')
          );
        })
        .map(staff => ({
          id: staff.id,
          name: staff.name,
          role: staff.role,
          department: staff.department
        }))
        // Remove duplicates based on ID
        .filter((manager, index, self) => 
          index === self.findIndex(m => m.id === manager.id)
        )
        // Sort by name
        .sort((a, b) => a.name.localeCompare(b.name));

      setReportingManagers(managers);
    };

    loadReportingManagers();
  }, [excludeId]);

  return reportingManagers;
};
