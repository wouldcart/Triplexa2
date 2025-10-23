
import { Query } from "./query";

export interface AgentContact {
  email: string;
  phone: string;
  website?: string;
  address?: string;
}

export interface AgentStats {
  totalQueries: number;
  totalBookings: number;
  conversionRate: number;
  revenueGenerated: number;
  averageBookingValue: number;
  activeCustomers: number;
}

export interface AgentActivity {
  date: string;
  action: string;
  details: string;
  entityId?: string;
  entityType?: 'query' | 'booking' | 'customer' | 'proposal';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bookingsCount: number;
  totalSpent: number;
  lastBookingDate?: string;
}

export interface StaffAssignment {
  staffId: number;
  staffName: string;
  role: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedBy?: string;
  notes?: string;
}

export interface AgentSource {
  type: 'event' | 'lead' | 'referral' | 'website' | 'other';
  details: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  country: string;
  city: string;
  type: 'company' | 'individual';
  status: 'active' | 'inactive';
  commissionType: 'percentage' | 'flat';
  commissionValue: string;
  profileImage?: string;
  contact: AgentContact;
  joinDate: string;
  createdBy?: {
    staffId: number;
    staffName: string;
  };
  createdAt: string;
  source?: AgentSource;
  stats: AgentStats;
  recentActivity: AgentActivity[];
  topCustomers?: Customer[];
  staffAssignments?: StaffAssignment[];
}
