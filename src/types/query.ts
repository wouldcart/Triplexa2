
export interface Query {
  id: string;
  agentId: number;
  agentName: string;
  agentUuid?: string;
  agentCompany?: string;
  destination: {
    country: string;
    cities: string[];
  };
  paxDetails: {
    adults: number;
    children: number;
    infants: number;
  };
  travelDates: {
    from: string;
    to: string;
    isEstimated?: boolean;
  };
  tripDuration: {
    nights: number;
    days: number;
  };
  packageType: string;
  specialRequests: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  priority: string;
  notes: string;
  communicationPreference: string;
  hotelDetails?: {
    rooms: number;
    category: string;
  };
  inclusions?: {
    sightseeing: boolean;
    transfers: string;
    mealPlan: string;
  };
  cityAllocations?: Array<{
    id: string;
    city: string;
    nights: number;
    isOptional: boolean;
    estimatedCost: number;
  }>;
  optionalSightseeingOptions?: Array<{
    id: string;
    title: string;
    description: string;
    activities: Array<{
      name: string;
      duration: string;
      cost: number;
      description?: string;
    }>;
    isOptional: boolean;
  }>;
  optionalTransportOptions?: Array<{
    id: string;
    type: 'private' | 'shared' | 'flight' | 'cruise';
    description: string;
    cost: number;
    isOptional: boolean;
    details?: {
      from: string;
      to: string;
      duration: string;
    };
  }>;
}

export interface QueryFilters {
  status?: string;
  priority?: string;
  destination?: string;
  assignedTo?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface QueryStats {
  total: number;
  new: number;
  assigned: number;
  inProgress: number;
  proposalSent: number;
  confirmed: number;
  converted: number;
}

export interface StaffNotification {
  id: string;
  type: 'assignment' | 'status_change' | 'follow_up_due' | 'proposal_request' | 'urgent_query';
  title: string;
  message: string;
  queryId?: string;
  staffId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  staffId: string;
  browserNotifications: boolean;
  emailNotifications: boolean;
  assignments: boolean;
  statusUpdates: boolean;
  followUpReminders: boolean;
  urgentOnly: boolean;
}

export interface WorkflowEvent {
  id: string;
  type: 'created' | 'assigned' | 'status_changed' | 'proposal_created' | 'follow_up' | 'comment_added' | 'ui_engagement';
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface QueryWorkflow {
  id: string;
  queryId: string;
  events: WorkflowEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  queryId: string;
  title: string;
  description: string;
  totalPrice: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'modified';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  costPerPerson: number;
  totalCost: number;
  finalPrice: number;
  itinerary?: {
    day: number;
    location: string;
    activities: string[];
    accommodation?: string;
  }[];
  inclusions: string[];
  exclusions: string[];
  terms: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'lead' | 'quotation' | 'booking' | 'payment' | 'itinerary' | 'support' | 'account' | 'reminder' | 'feedback';
  role: 'admin' | 'agent' | 'staff' | 'traveller';
  trigger: string;
  language: 'en' | 'ar' | 'fr' | 'es' | 'de';
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
  example: string;
  category: string;
}

export interface EmailPreview {
  subject: string;
  content: string;
  variables: Record<string, string>;
}
