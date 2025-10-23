
import { EnhancedStaffMember } from '@/types/staff';

const STAFF_STORAGE_KEY = 'staff_members';

export const getStoredStaff = (): EnhancedStaffMember[] => {
  try {
    const stored = localStorage.getItem(STAFF_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading staff from localStorage:', error);
    return [];
  }
};

export const saveStaffMember = (staffMember: EnhancedStaffMember): void => {
  try {
    const existingStaff = getStoredStaff();
    const updatedStaff = [...existingStaff, staffMember];
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));
  } catch (error) {
    console.error('Error saving staff to localStorage:', error);
  }
};

export const getStaffById = (id: string): EnhancedStaffMember | null => {
  try {
    const staff = getStoredStaff();
    return staff.find(member => member.id === id) || null;
  } catch (error) {
    console.error('Error getting staff by ID:', error);
    return null;
  }
};

export const updateStaffMember = (id: string, updates: Partial<EnhancedStaffMember>): void => {
  try {
    const staff = getStoredStaff();
    const index = staff.findIndex(member => member.id === id);
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updates };
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
    }
  } catch (error) {
    console.error('Error updating staff member:', error);
  }
};

export const deleteStaffMember = (id: string): void => {
  try {
    const staff = getStoredStaff();
    const filteredStaff = staff.filter(member => member.id !== id);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(filteredStaff));
  } catch (error) {
    console.error('Error deleting staff member:', error);
  }
};
