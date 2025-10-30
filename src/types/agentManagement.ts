export type AgentStatus = 'pending' | 'active' | 'inactive' | 'approved' | 'rejected' | 'suspended';
export type AgentRole = 'agent';

export interface LoginCredentials {
  username?: string;
  passwordHash?: string;
  temporaryPassword?: string;
}

export interface ManagedAgent {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  // Profile extras
  profile_image?: string;
  preferred_language?: string;
  country?: string;
  city?: string;
  status: AgentStatus;
  role: AgentRole;
  // Agent table extras
  type?: 'individual' | 'company';
  commission_type?: 'flat' | 'percentage';
  commission_value?: string | number;
  source_type?: 'event' | 'lead' | 'referral' | 'website' | 'other';
  source_details?: string;
  created_by?: string;
  // Suspension metadata
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  assigned_staff: string[];
  login_credentials: LoginCredentials;
  created_at: string;
  updated_at: string;
  // Extended business and contact fields
  business_phone?: string;
  business_address?: string;
  license_number?: string;
  iata_number?: string;
  specializations?: string[];
  alternate_email?: string;
  website?: string;
  partnership?: string;
  mobile_numbers?: string[];
}

export interface CreateAgentRequest {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  status?: AgentStatus;
  assigned_staff?: string[];
  login_credentials?: LoginCredentials;
}

export interface UpdateAgentRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  profile_image?: string;
  preferred_language?: string;
  country?: string;
  city?: string;
  status?: AgentStatus;
  type?: 'individual' | 'company';
  commission_type?: 'flat' | 'percentage';
  commission_value?: string | number;
  source_type?: 'event' | 'lead' | 'referral' | 'website' | 'other';
  source_details?: string;
  assigned_staff?: string[];
  login_credentials?: LoginCredentials;
  // Extended fields
  business_phone?: string;
  business_address?: string;
  license_number?: string;
  iata_number?: string;
  specializations?: string[];
  alternate_email?: string;
  website?: string;
  partnership?: string;
  mobile_numbers?: string[];
}

export interface AgentSignupRequest {
  name: string;                    // maps to 'name' column
  email: string;                   // maps to 'email' column
  phone?: string;                  // maps to 'business_phone' column
  company_name?: string;           // maps to 'agency_name' column
  desired_username?: string;
  password?: string;
  // Additional fields for complete agent registration
  business_address?: string;       // maps to 'business_address' column
  city?: string;                   // maps to 'city' column
  country?: string;                // maps to 'country' column
  type?: string;                   // maps to 'type' column
  specializations?: string[];      // maps to 'specializations' column
  // Source tracking (captured from URL params on signup page)
  source_type?: string;
  source_details?: string;
}

export interface AgentFilters {
  status?: AgentStatus;
  search?: string;
  assigned_staff?: string;
}

export interface AgentApprovalRequest {
  id: string;
  status: 'active' | 'inactive';
  assigned_staff?: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}