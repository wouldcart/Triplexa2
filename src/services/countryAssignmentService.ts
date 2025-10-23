
import { StaffMember } from '@/types/assignment';
import { Query } from '@/types/query';
import { getCountryByName, getStaffOperationalCountries } from './countryMappingService';

export interface StaffCountryMatch {
  staff: StaffMember;
  matchType: 'perfect' | 'partial' | 'none';
  matchedCountries: string[];
  workloadRatio: number;
  score: number;
}

export const findStaffByCountry = (
  availableStaff: StaffMember[],
  queryDestination: string
): StaffCountryMatch[] => {
  const destinationCountry = getCountryByName(queryDestination);
  
  if (!destinationCountry) {
    return availableStaff.map(staff => ({
      staff,
      matchType: 'none' as const,
      matchedCountries: [],
      workloadRatio: staff.assigned / staff.workloadCapacity,
      score: 0
    }));
  }

  return availableStaff.map(staff => {
    const staffCountries = getStaffOperationalCountries(staff.operationalCountries || []);
    const hasCountryMatch = staffCountries.includes(destinationCountry.name);
    const workloadRatio = staff.assigned / staff.workloadCapacity;
    
    let score = 0;
    let matchType: 'perfect' | 'partial' | 'none' = 'none';
    
    if (hasCountryMatch) {
      matchType = 'perfect';
      score = 100 - (workloadRatio * 50); // Country match + workload consideration
    } else {
      matchType = 'none';
      score = 20 - (workloadRatio * 10); // Only workload consideration
    }
    
    return {
      staff,
      matchType,
      matchedCountries: hasCountryMatch ? [destinationCountry.name] : [],
      workloadRatio,
      score
    };
  }).sort((a, b) => b.score - a.score);
};

export const getBestCountryMatch = (
  availableStaff: StaffMember[],
  query: Query
): StaffMember | null => {
  const matches = findStaffByCountry(availableStaff, query.destination.country);
  
  // First priority: Staff with country match and available capacity
  const perfectMatches = matches.filter(m => 
    m.matchType === 'perfect' && 
    m.staff.assigned < m.staff.workloadCapacity
  );
  
  if (perfectMatches.length > 0) {
    return perfectMatches[0].staff;
  }
  
  // Fallback: Any available staff
  const availableMatches = matches.filter(m => 
    m.staff.assigned < m.staff.workloadCapacity
  );
  
  return availableMatches.length > 0 ? availableMatches[0].staff : null;
};

export const getAssignmentReason = (
  staff: StaffMember,
  query: Query
): string => {
  const staffCountries = getStaffOperationalCountries(staff.operationalCountries || []);
  const hasCountryMatch = staffCountries.includes(query.destination.country);
  
  if (hasCountryMatch) {
    return 'Country Expertise';
  }
  
  const hasGeneralExpertise = staff.expertise.some(exp =>
    query.destination.country.toLowerCase().includes(exp.toLowerCase()) ||
    exp.toLowerCase().includes(query.destination.country.toLowerCase())
  );
  
  if (hasGeneralExpertise) {
    return 'Destination Expertise';
  }
  
  return 'Workload Balance';
};
