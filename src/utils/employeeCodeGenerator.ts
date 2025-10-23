
import { staffMembers } from '@/data/staffData';

export const generateEmployeeCode = (): string => {
  // Get all existing employee IDs and extract the numeric parts
  const existingCodes = staffMembers
    .map(staff => staff.employeeId)
    .filter(id => id && /^\d{4}$/.test(id)) // Only 4-digit numeric codes
    .map(id => parseInt(id))
    .filter(num => !isNaN(num));

  // Start from 1001 and find the next available code
  let nextCode = 1001;
  while (existingCodes.includes(nextCode)) {
    nextCode++;
    // Prevent infinite loop, max 4-digit number is 9999
    if (nextCode > 9999) {
      throw new Error('No available employee codes remaining');
    }
  }

  return nextCode.toString().padStart(4, '0');
};

export const validateEmployeeCode = (code: string): boolean => {
  return /^\d{4}$/.test(code);
};

export const isEmployeeCodeUnique = (code: string, excludeId?: string): boolean => {
  return !staffMembers.some(staff => 
    staff.employeeId === code && staff.id !== excludeId
  );
};
