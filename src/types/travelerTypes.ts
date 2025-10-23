export interface AgentDetails {
  name: string;
  company: string;
  phone: string;
  email: string;
}

export interface TravelerTrip {
  id: string;
  destination: string;
  country: string;
  cities: string[];
  startDate: string;
  endDate: string;
  duration: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  imageUrl?: string;
  description?: string;
  tags: ('business' | 'leisure' | 'mixed')[];
  agentDetails?: AgentDetails;
}

export interface TripActivity {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  type: 'flight' | 'hotel' | 'sightseeing' | 'transport' | 'meal' | 'other';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isStaffAssigned: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TravelerNotification {
  id: string;
  title: string;
  message: string;
  type: 'activity' | 'trip-update' | 'message' | 'confirmation';
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  relatedTripId?: string;
  relatedActivityId?: string;
}

export interface TravelerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: {
    language: string;
    darkMode: boolean;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    expenseTracking: boolean;
  };
}

export interface TodayActivity extends TripActivity {
  isToday: boolean;
  timeUntil?: string;
}

export interface TripFeedback {
  id: string;
  tripId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AdditionalRequest {
  id: string;
  tripId: string;
  activityId?: string;
  type: 'addon' | 'change' | 'extra-service' | 'cancellation' | 'update';
  title: string;
  description: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  estimatedCost?: number;
}