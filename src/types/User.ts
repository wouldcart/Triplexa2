
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  phone: string;
  status?: 'active' | 'inactive' | 'suspended';
  position?: string;
  workLocation?: string;
  employeeId?: string;
  joinDate?: string;
  reportingManager?: string;
  lastLogin?: string;
  skills?: string[];
  certifications?: string[];
  permissions?: string[];
  languageAccess?: boolean;
  preferredLanguage?: string;
  personalInfo?: {
    dateOfBirth: string;
    address: string;
    nationality: string;
    languages: string[];
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  workSchedule?: {
    workingDays: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };
  companyInfo?: {
    companyName: string;
    registrationNumber: string;
    businessType: string;
    contractStartDate: string;
    contractEndDate: string;
    commissionStructure?: {
      tiers?: Array<{
        min: number;
        max: number;
        rate: number;
      }>;
    };
  };
}
