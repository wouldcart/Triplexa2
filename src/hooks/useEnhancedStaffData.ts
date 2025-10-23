
import { useMemo } from 'react';
import { StaffMember } from '@/types/assignment';
import { staffMembers } from '@/data/staffData';

export const useEnhancedStaffData = () => {
  // Convert EnhancedStaffMember to StaffMember format for assignment system
  const enhancedStaffMembers = useMemo(() => {
    return staffMembers.map(staff => ({
      id: parseInt(staff.id), // Convert string id to number
      name: staff.name,
      role: staff.role,
      email: staff.email,
      active: staff.status === 'active', // Convert status to active boolean
      assigned: Math.floor(Math.random() * 8), // Mock assignment count
      avatar: staff.avatar || '',
      expertise: staff.skills || [], // Use skills as expertise
      workloadCapacity: staff.department === 'Sales' ? 12 : 10,
      availability: [
        { day: 'Monday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
        { day: 'Tuesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
        { day: 'Wednesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
        { day: 'Thursday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
        { day: 'Friday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
        { day: 'Saturday', isAvailable: false },
        { day: 'Sunday', isAvailable: false },
      ],
      autoAssignEnabled: true,
      sequenceOrder: parseInt(staff.id),
      department: staff.department,
      experience: Math.floor(Math.random() * 5) + 2, // 2-7 years
      specializations: staff.skills || []
    }));
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
    enhancedStaffMembers, // Add this property that other hooks are looking for
    getBestStaffForQuery,
    getStaffByDepartment,
    getAvailableStaff,
    totalActiveStaff: activeStaff.length,
    totalAvailableCapacity: activeStaff.reduce((sum, staff) => 
      sum + (staff.workloadCapacity - staff.assigned), 0
    )
  };
};
