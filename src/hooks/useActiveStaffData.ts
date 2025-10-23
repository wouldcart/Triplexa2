
import { useMemo } from 'react';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { StaffMember } from '@/types/assignment';

export interface EnhancedStaffWithWorkload extends StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
  assigned: number;
  workloadCapacity: number;
  expertise: string[];
  active: boolean;
  avatar: string;
  availability: any[];
  autoAssignEnabled: boolean;
  sequenceOrder?: number;
}

export const useActiveStaffData = () => {
  const { enhancedStaffMembers } = useEnhancedStaffData();

  const activeStaff = useMemo(() => {
    return enhancedStaffMembers.map((staff): EnhancedStaffWithWorkload => ({
      ...staff,
      status: staff.active ? 'active' : 'inactive'
    }));
  }, [enhancedStaffMembers]);

  const getAvailableStaff = () => {
    return activeStaff.filter(staff => staff.assigned < staff.workloadCapacity && staff.active);
  };

  return {
    activeStaff,
    getAvailableStaff
  };
};
