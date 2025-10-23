import { ChatMessage, ChatConversation, SupportUser, SupportTicket } from '@/types/supportTypes';

export const mockSupportUsers: SupportUser[] = [
  {
    id: 'user-001',
    name: 'John Traveler',
    email: 'john@example.com',
    role: 'traveler',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: 'agent-001',
    name: 'Sarah Kumar',
    email: 'sarah@goldenindiatours.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=32&h=32&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: 'staff-001',
    name: 'Raj Patel',
    email: 'raj@goldenindiatours.com',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    isOnline: false,
    lastSeen: '2024-07-25T10:30:00Z'
  },
  {
    id: 'admin-001',
    name: 'Admin Support',
    email: 'admin@goldenindiatours.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face',
    isOnline: true
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    content: 'Hello! Welcome to Golden India Tours support. I\'m Sarah, your travel agent. How can I help you today?',
    timestamp: '2024-07-25T08:00:00Z',
    senderId: 'agent-001',
    senderName: 'Sarah Kumar',
    senderRole: 'agent',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-002',
    content: 'Hi Sarah! I have a few questions about my upcoming Delhi trip. Can you help me with some changes?',
    timestamp: '2024-07-25T08:05:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-003',
    content: 'Of course! I\'d be happy to help with any changes to your Delhi itinerary. What would you like to modify?',
    timestamp: '2024-07-25T08:06:00Z',
    senderId: 'agent-001',
    senderName: 'Sarah Kumar',
    senderRole: 'agent',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-004',
    content: 'I want to add an extra day to visit the Red Fort and also change my hotel to something closer to the city center. Is that possible?',
    timestamp: '2024-07-25T08:10:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-005',
    content: 'Absolutely! Let me check the availability for extending your stay. For the hotel change, I have a few great options near Connaught Place. Let me pull up your booking details.',
    timestamp: '2024-07-25T08:12:00Z',
    senderId: 'agent-001',
    senderName: 'Sarah Kumar',
    senderRole: 'agent',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-006',
    content: 'I\'m transferring this to our hotel specialist who can help with the accommodation change.',
    timestamp: '2024-07-25T08:15:00Z',
    senderId: 'agent-001',
    senderName: 'Sarah Kumar',
    senderRole: 'agent',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-007',
    content: 'Hello John! I\'m Raj from our accommodations team. I see you\'d like to change hotels. I have 3 excellent options near the city center with availability for your dates.',
    timestamp: '2024-07-25T08:20:00Z',
    senderId: 'staff-001',
    senderName: 'Raj Patel',
    senderRole: 'staff',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-008',
    content: 'Great! Could you send me the details of those hotels? I\'m particularly interested in places with good reviews and WiFi.',
    timestamp: '2024-07-25T08:25:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-009',
    content: 'Perfect! Here are your options:\n\n1. **The Imperial New Delhi** - 5-star luxury, heritage property\n   • Location: Janpath, walking distance to Connaught Place\n   • Rate: $280/night (upgrade +$150)\n   • WiFi: Complimentary high-speed\n\n2. **Taj Palace** - Modern 5-star with excellent amenities\n   • Location: Diplomatic Enclave\n   • Rate: $220/night (upgrade +$90)\n   • WiFi: Premium throughout property\n\n3. **The Leela Palace** - Premium location with spa\n   • Location: Chanakyapuri\n   • Rate: $350/night (upgrade +$220)\n   • WiFi: Complimentary in all areas\n\nWould you like more details about any of these?',
    timestamp: '2024-07-25T08:30:00Z',
    senderId: 'staff-001',
    senderName: 'Raj Patel',
    senderRole: 'staff',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-010',
    content: 'The Imperial sounds perfect! I love heritage properties. Could you tell me more about the amenities and confirm availability for July 27-29?',
    timestamp: '2024-07-25T08:35:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-011',
    content: 'Excellent choice! The Imperial New Delhi features:\n\n✅ **Amenities:**\n• Heritage architecture from 1931\n• 3 restaurants including award-winning Spice Route\n• Spa and fitness center\n• Outdoor pool\n• 24/7 room service\n• Concierge services\n\n✅ **Availability:** Confirmed for July 27-29\n✅ **Rate:** $280/night (3 nights = $840 total)\n✅ **Upgrade cost:** Additional $450 from your current booking\n\nShall I proceed with the reservation?',
    timestamp: '2024-07-25T08:40:00Z',
    senderId: 'staff-001',
    senderName: 'Raj Patel',
    senderRole: 'staff',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-012',
    content: 'Yes, please book it! Also, can you help with the Red Fort visit? I\'d like a guided tour if possible.',
    timestamp: '2024-07-25T08:45:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-013',
    content: 'Perfect! I\'ve initiated the hotel booking process. For the Red Fort tour, let me connect you with our activities specialist who can arrange a private guided tour.',
    timestamp: '2024-07-25T08:47:00Z',
    senderId: 'staff-001',
    senderName: 'Raj Patel',
    senderRole: 'staff',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-014',
    content: 'Hi John! I\'m Admin Support taking over the activities coordination. For Red Fort, I can arrange:\n\n🏛️ **Private Heritage Tour** (3 hours)\n• Expert historian guide\n• Skip-the-line access\n• Photography assistance\n• Traditional tea service\n• Price: $85 per person\n\n📅 **Available slots:** 9 AM, 2 PM, or 4 PM\n\nWhich time slot works best for you?',
    timestamp: '2024-07-25T08:50:00Z',
    senderId: 'admin-001',
    senderName: 'Admin Support',
    senderRole: 'admin',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-015',
    content: 'The 2 PM slot sounds perfect! Please book that for July 28th. This service is amazing - I feel so well taken care of!',
    timestamp: '2024-07-25T08:55:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-016',
    content: 'Wonderful! I\'ve booked your Red Fort private tour for July 28th at 2 PM. You\'ll receive confirmation details shortly.\n\n📋 **Summary of changes:**\n✅ Hotel: Upgraded to The Imperial New Delhi (July 27-29)\n✅ Tour: Red Fort Private Heritage Tour (July 28, 2 PM)\n✅ Total additional cost: $535\n\nIs there anything else I can help you with for your Delhi experience?',
    timestamp: '2024-07-25T09:00:00Z',
    senderId: 'admin-001',
    senderName: 'Admin Support',
    senderRole: 'admin',
    messageType: 'text',
    isRead: true
  },
  {
    id: 'msg-017',
    content: 'That\'s perfect! Thank you all so much. One last question - are there any good restaurants near The Imperial that you\'d recommend for dinner?',
    timestamp: '2024-07-25T09:05:00Z',
    senderId: 'user-001',
    senderName: 'John Traveler',
    senderRole: 'traveler',
    messageType: 'text',
    isRead: false
  }
];

export const mockConversations: ChatConversation[] = [
  {
    id: 'conv-001',
    title: 'Trip Extension & Hotel Change - Delhi',
    lastMessage: mockChatMessages[16],
    lastActivity: '2024-07-25T09:05:00Z',
    status: 'open',
    priority: 'medium',
    assignedAgent: {
      id: 'admin-001',
      name: 'Admin Support',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face',
      role: 'admin'
    },
    tripId: 'trip-001',
    participantIds: ['user-001', 'agent-001', 'staff-001', 'admin-001'],
    unreadCount: 1,
    tags: ['extension', 'hotel', 'itinerary', 'tours']
  },
  {
    id: 'conv-002',
    title: 'Payment Issue - Invoice #12345',
    lastActivity: '2024-07-24T15:30:00Z',
    status: 'pending',
    priority: 'high',
    assignedAgent: {
      id: 'staff-001',
      name: 'Raj Patel',
      role: 'staff'
    },
    participantIds: ['user-001', 'staff-001'],
    unreadCount: 0,
    tags: ['payment', 'billing']
  },
  {
    id: 'conv-003',
    title: 'Transport Query - Airport Pickup',
    lastActivity: '2024-07-23T11:45:00Z',
    status: 'closed',
    priority: 'low',
    assignedAgent: {
      id: 'agent-001',
      name: 'Sarah Kumar',
      role: 'agent'
    },
    tripId: 'trip-001',
    participantIds: ['user-001', 'agent-001'],
    unreadCount: 0,
    tags: ['transport', 'airport']
  }
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'ticket-001',
    subject: 'Unable to view trip details',
    description: 'I cannot access my trip itinerary from the mobile app',
    status: 'open',
    priority: 'medium',
    category: 'general',
    createdAt: '2024-07-25T08:00:00Z',
    updatedAt: '2024-07-25T08:00:00Z',
    createdBy: 'user-001',
    conversationId: 'conv-001'
  },
  {
    id: 'ticket-002',
    subject: 'Payment not reflecting',
    description: 'Made payment 3 days ago but status still shows pending',
    status: 'in-progress',
    priority: 'high',
    category: 'payment',
    createdAt: '2024-07-24T10:00:00Z',
    updatedAt: '2024-07-25T09:00:00Z',
    createdBy: 'user-001',
    assignedTo: 'staff-001',
    conversationId: 'conv-002'
  }
];

export const getConversationMessages = (conversationId: string): ChatMessage[] => {
  if (conversationId === 'conv-001') {
    return mockChatMessages;
  }
  return [];
};

export const getUserConversations = (userId: string): ChatConversation[] => {
  return mockConversations.filter(conv => 
    conv.participantIds.includes(userId)
  );
};