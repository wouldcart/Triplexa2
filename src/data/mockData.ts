
import {
  Home,
  Search,
  BarChart3,
  Users,
  Building,
  Settings,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  Calendar,
  Briefcase,
  Plane,
  Car,
  Utensils,
  Globe,
  MapPin,
  Landmark,
  Mountain,
  Package,
  UserCheck,
  Shield,
  Bell,
  Palette,
  Languages,
  DollarSign,
  BookTemplate,
  Activity,
  FileText,
  Cog
} from 'lucide-react';

// Original sidebar items export
export const sidebarItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: "Home"
  },
  {
    title: "Query Management",
    path: "/queries",
    icon: "MessageSquare"
  },
  {
    title: "Follow Ups",
    path: "/followups",
    icon: "CheckCircle"
  },
  {
    title: "Bookings",
    path: "/bookings",
    icon: "Calendar"
  },
  {
    title: "Itinerary Builder",
    path: "/itinerary",
    icon: "Briefcase"
  },
  {
    title: "Activity Tracking",
    path: "/activity-tracking",
    icon: "Activity"
  },
  {
    title: "Reports",
    path: "/reports",
    icon: "FileText"
  },
  {
    section: true,
    title: "Inventory",
    icon: "Package",
    items: [
      {
        title: "Transport",
        path: "/inventory/transport",
        icon: "Car"
      },
      {
        title: "Hotels",
        path: "/inventory/hotels",
        icon: "Building"
      },
      {
        title: "Sightseeing",
        path: "/inventory/sightseeing",
        icon: "Mountain"
      },
      {
        title: "Restaurants",
        path: "/inventory/restaurants",
        icon: "Utensils"
      },
      {
        title: "Visa",
        path: "/inventory/visa",
        icon: "Landmark"
      },
      {
        title: "Packages",
        path: "/inventory/packages",
        icon: "Plane"
      },
      {
        title: "Templates",
        path: "/inventory/templates",
        icon: "BookTemplate"
      },
      {
        title: "Cities",
        path: "/inventory/cities",
        icon: "MapPin"
      },
      {
        title: "Countries",
        path: "/inventory/countries",
        icon: "Globe"
      }
    ]
  },
  {
    section: true,
    title: "Management",
    icon: "Users",
    items: [
      {
        title: "Agents",
        path: "/management/agents",
        icon: "UserCheck"
      },
      {
        title: "Staff",
        path: "/management/staff",
        icon: "Users"
      },
      {
        title: "Admin",
        icon: "Shield",
        adminOnly: true,
        items: [
          {
            title: "Admin Dashboard",
            path: "/management/admin",
            icon: "Shield"
          },
          {
            title: "Admin Users",
            path: "/management/admin/users",
            icon: "Users"
          },
          {
            title: "App Settings",
            path: "/management/admin/app-settings",
            icon: "Cog"
          }
        ]
      }
    ]
  },
  {
    section: true,
    title: "Settings",
    icon: "Settings",
    items: [
      {
        title: "General",
        path: "/settings/general",
        icon: "Settings"
      },
      {
        title: "Account",
        path: "/settings/account",
        icon: "Users"
      },
      {
        title: "Appearance",
        path: "/settings/appearance",
        icon: "Palette"
      },
      {
        title: "Notifications",
        path: "/settings/notifications",
        icon: "Bell"
      },
      {
        title: "Languages",
        path: "/settings/languages",
        icon: "Globe"
      },
      {
        title: "Translation Tool",
        path: "/settings/translation-tool",
        icon: "Languages"
      },
      {
        title: "Currency Converter",
        path: "/settings/currency-converter",
        icon: "DollarSign"
      },
      {
        title: "API",
        path: "/settings/api",
        icon: "Settings"
      },
      {
        title: "Pricing",
        path: "/settings/pricing",
        icon: "DollarSign"
      },
      {
        title: "Access Control",
        path: "/settings/access-control",
        icon: "Shield",
        adminOnly: true
      },
      {
        title: "Agent Management",
        path: "/settings/agent-management",
        icon: "Users",
        adminOnly: true
      }
    ]
  }
];

// Dashboard metrics data
export type Metric = {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  iconClass: string;
  description?: string;
};

export const metrics: Metric[] = [
  {
    title: 'Total Bookings',
    value: '1,245',
    change: 12.5,
    changeType: 'increase',
    icon: 'Calendar',
    iconClass: 'bg-blue-100 text-blue-600',
    description: 'Total bookings this month'
  },
  {
    title: 'New Queries',
    value: '342',
    change: 8.2,
    changeType: 'increase',
    icon: 'MessageSquare',
    iconClass: 'bg-purple-100 text-purple-600',
    description: 'New queries received'
  },
  {
    title: 'Revenue',
    value: '$45,678',
    change: 5.8,
    changeType: 'increase',
    icon: 'BarChart3',
    iconClass: 'bg-green-100 text-green-600',
    description: 'Total revenue this month'
  },
  {
    title: 'Conversion Rate',
    value: '24.8%',
    change: 1.2,
    changeType: 'decrease',
    icon: 'BarChart3',
    iconClass: 'bg-orange-100 text-orange-600',
    description: 'Query to booking conversion'
  }
];

// Task type and data
export type Task = {
  id: string;
  title: string;
  date: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo?: string;
};

export const upcomingTasks: Task[] = [
  {
    id: 't1',
    title: 'Follow up with ABC Tours',
    date: '2024-05-14',
    dueDate: '2024-05-14',
    priority: 'high',
    status: 'Pending'
  },
  {
    id: 't2',
    title: 'Confirm hotel bookings for Smith family',
    date: '2024-05-14',
    dueDate: '2024-05-14',
    priority: 'high',
    status: 'In Progress'
  },
  {
    id: 't3',
    title: 'Send visa requirements to Johnson group',
    date: '2024-05-15',
    dueDate: '2024-05-15',
    priority: 'medium',
    status: 'Pending'
  },
  {
    id: 't4',
    title: 'Update package pricing for summer season',
    date: '2024-05-16',
    dueDate: '2024-05-16',
    priority: 'medium',
    status: 'Pending'
  },
  {
    id: 't5',
    title: 'Review feedback from April tours',
    date: '2024-05-17',
    dueDate: '2024-05-17',
    priority: 'low',
    status: 'Pending'
  }
];

// Alert type and data
export type Alert = {
  id: string;
  message: string;
  details?: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
};

export const alerts: Alert[] = [
  {
    id: 'a1',
    message: 'Flight DL189 to New York delayed by 2 hours',
    details: 'New departure time: 15:30',
    type: 'warning',
    timestamp: '2024-05-13T10:30:00'
  },
  {
    id: 'a2',
    message: 'Hotel Royal Palm fully booked for May 20-25',
    details: 'Consider alternative: Grand Resort',
    type: 'error',
    timestamp: '2024-05-13T09:15:00'
  },
  {
    id: 'a3',
    message: 'New visa requirements for Egypt effective June 1',
    details: 'Updated documentation required',
    type: 'info',
    timestamp: '2024-05-13T08:45:00'
  },
  {
    id: 'a4',
    message: 'Weather alert: Heavy rain forecast in Phuket',
    details: 'May affect outdoor activities',
    type: 'warning',
    timestamp: '2024-05-12T17:30:00'
  }
];

// Dashboard query type and data
export type DashboardQuery = {
  id: string;
  name: string;
  destination: {
    country: string;
    cities: string[];
  };
  dateCreated: string;
  status: 'New' | 'Processing' | 'Quoted' | 'Confirmed' | 'Closed' | 'Proposal Sent' | 'Follow Up';
  priority: 'Low' | 'Medium' | 'High';
  agent: {
    name: string;
    company: string;
  };
  duration: string;
  pax: number;
  assignee?: string;
};

export const recentQueries: DashboardQuery[] = [
  {
    id: 'q1',
    name: 'Johnson Family',
    destination: {
      country: 'Bali, Indonesia',
      cities: ['Ubud', 'Seminyak']
    },
    dateCreated: '2024-05-13',
    status: 'New',
    priority: 'Medium',
    agent: {
      name: 'John Smith',
      company: 'ABC Travels'
    },
    duration: '7 nights',
    pax: 4
  },
  {
    id: 'q2',
    name: 'Sarah Smith',
    destination: {
      country: 'Paris, France',
      cities: ['Paris', 'Nice']
    },
    dateCreated: '2024-05-12',
    status: 'Processing',
    priority: 'High',
    agent: {
      name: 'Emma Wilson',
      company: 'Luxury Travels'
    },
    duration: '5 nights',
    pax: 2,
    assignee: 'Emma Wilson'
  },
  {
    id: 'q3',
    name: 'Robert Brown',
    destination: {
      country: 'Tokyo, Japan',
      cities: ['Tokyo', 'Kyoto']
    },
    dateCreated: '2024-05-11',
    status: 'Quoted',
    priority: 'Medium',
    agent: {
      name: 'Alex Johnson',
      company: 'Asia Explorers'
    },
    duration: '10 nights',
    pax: 2,
    assignee: 'John Davis'
  },
  {
    id: 'q4',
    name: 'Corporate Retreat - Tech Inc',
    destination: {
      country: 'Phuket, Thailand',
      cities: ['Phuket']
    },
    dateCreated: '2024-05-10',
    status: 'Confirmed',
    priority: 'High',
    agent: {
      name: 'Sarah Lee',
      company: 'Corporate Events'
    },
    duration: '4 nights',
    pax: 12,
    assignee: 'Emma Wilson'
  },
  {
    id: 'q5',
    name: 'Williams Wedding',
    destination: {
      country: 'Santorini, Greece',
      cities: ['Santorini']
    },
    dateCreated: '2024-05-09',
    status: 'Proposal Sent',
    priority: 'Medium',
    agent: {
      name: 'Michael Williams',
      company: 'Wedding Planners Inc'
    },
    duration: '7 nights',
    pax: 20,
    assignee: 'John Davis'
  }
];

// Booking type and data
export type Booking = {
  id: string;
  name: string;
  location: string;
  destination: string;
  startDate: string;
  endDate: string;
  dateRange: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  people: number;
  travelers: string;
  value: string;
  amount: number;
  thumbnailUrl: string;
  title: string;
};

export const upcomingBookings: Booking[] = [
  {
    id: 'b1',
    name: 'Garcia Family',
    title: 'Tropical Paradise Getaway',
    location: 'Maldives',
    destination: 'Maldives',
    startDate: '2024-05-20',
    endDate: '2024-05-27',
    dateRange: 'May 20 - May 27, 2024',
    status: 'Confirmed',
    people: 4,
    travelers: '2 Adults, 2 Children',
    value: '$5,800',
    amount: 5800,
    thumbnailUrl: '/placeholder.svg'
  },
  {
    id: 'b2',
    name: 'Martin & Lisa',
    title: 'Alpine Adventure',
    location: 'Swiss Alps',
    destination: 'Swiss Alps',
    startDate: '2024-05-22',
    endDate: '2024-05-29',
    dateRange: 'May 22 - May 29, 2024',
    status: 'Pending',
    people: 2,
    travelers: '2 Adults',
    value: '$3,200',
    amount: 3200,
    thumbnailUrl: '/placeholder.svg'
  },
  {
    id: 'b3',
    name: 'Thompson Group',
    title: 'Desert Explorer Tour',
    location: 'Dubai',
    destination: 'Dubai',
    startDate: '2024-05-25',
    endDate: '2024-06-01',
    dateRange: 'May 25 - June 1, 2024',
    status: 'Confirmed',
    people: 6,
    travelers: '6 Adults',
    value: '$7,500',
    amount: 7500,
    thumbnailUrl: '/placeholder.svg'
  }
];

export type CurrentActivity = {
  activeStaff: number;
  processingBookings: number;
  activeInquiries: number;
  recentActivity: Array<{
    name: string;
    status: 'online' | 'busy' | 'away';
    action: string;
  }>;
};

export const currentActivities: CurrentActivity = {
  activeStaff: 12,
  processingBookings: 8,
  activeInquiries: 15,
  recentActivity: [
    { name: 'Emma Wilson', status: 'online', action: 'Working on Johnson itinerary' },
    { name: 'John Davis', status: 'online', action: 'Processing visa documents' },
    { name: 'Sarah Johnson', status: 'busy', action: 'Client meeting' },
    { name: 'Michael Chen', status: 'online', action: 'Flight booking' },
    { name: 'Rahul Sharma', status: 'away', action: 'Last active: 10 min ago' }
  ]
};
