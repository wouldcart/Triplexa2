
import { useEffect, useMemo, useState } from 'react';
import { StaffMember } from '@/types/assignment';
import { fetchEnhancedStaff } from '@/services/staffAssignmentService';

export const useEnhancedStaffData = () => {
  const [enhancedStaffMembers, setEnhancedStaffMembers] = useState<StaffMember[]>([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const staff = await fetchEnhancedStaff();
        if (!ignore) setEnhancedStaffMembers(staff);
      } catch (e) {
        if (!ignore) setEnhancedStaffMembers([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const activeStaff = useMemo(() => {
    return enhancedStaffMembers.filter(staff => staff.active);
  }, [enhancedStaffMembers]);

  const getBestStaffForQuery = (destinations: string[], packageType: string) => {
    // Enhanced matching logic
    const scoredStaff = activeStaff.map(staff => {
      let score = 0;
      
      // Destination expertise match
      const destinationMatch = destinations.some(dest =>
        staff.expertise.some(exp => 
          exp.toLowerCase().includes(dest.toLowerCase()) ||
          dest.toLowerCase().includes(exp.toLowerCase())
        )
      );
      if (destinationMatch) score += 50;
      
      // Package type match
      const packageMatch = staff.specializations?.some(spec =>
        spec.toLowerCase().includes(packageType.toLowerCase())
      );
      if (packageMatch) score += 30;
      
      // Workload factor (lower is better)
      const workloadRatio = staff.assigned / staff.workloadCapacity;
      score += (1 - workloadRatio) * 20;
      
      // Experience bonus
      score += (staff.experience || 0) * 2;
      
      return { ...staff, matchScore: score };
    });

    return scoredStaff
      .filter(staff => staff.assigned < staff.workloadCapacity)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const getStaffByDepartment = (department: string) => {
    return activeStaff.filter(staff => staff.department === department);
  };

  const getAvailableStaff = () => {
    return activeStaff.filter(staff => 
      staff.assigned < staff.workloadCapacity && staff.autoAssignEnabled
    );
  };

  return {
    activeStaff,
    allStaff: enhancedStaffMembers,
    enhancedStaffMembers,
    getBestStaffForQuery,
    getStaffByDepartment,
    getAvailableStaff,
    totalActiveStaff: activeStaff.length,
    totalAvailableCapacity: activeStaff.reduce((sum, staff) =>
      sum + (staff.workloadCapacity - staff.assigned), 0
    )
  };
};
