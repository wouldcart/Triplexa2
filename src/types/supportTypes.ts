export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderRole: 'traveler' | 'agent' | 'staff' | 'admin';
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage?: ChatMessage;
  lastActivity: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
    role: 'agent' | 'staff' | 'admin';
  };
  tripId?: string;
  participantIds: string[];
  unreadCount: number;
  tags?: string[];
}

export interface SupportUser {
  id: string;
  name: string;
  email: string;
  role: 'traveler' | 'agent' | 'staff' | 'admin';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'booking' | 'payment' | 'itinerary' | 'transport' | 'accommodation';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  tripId?: string;
  conversationId?: string;
}