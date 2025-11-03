import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Target,
  ArrowRight,
  Eye,
  Clock
} from 'lucide-react';

const SalesDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const salesMetrics = {
    newEnquiries: 28,
    hotLeads: 15,
    converted: 8,
    responseTime: '2.5 hrs',
    conversionRate: 28.6,
    monthlyRevenue: '₹12.5L',
    leadsClosed: 45,
    targetAchievement: 85,
    agentSatisfaction: 92
  };

  const quickActions = [
    { title: 'Create New Quote', badge: '5', description: 'Generate instant pricing for agents' },
    { title: 'Follow-up Reminders', badge: '12', description: 'Pending follow-ups requiring attention' },
    { title: 'Agent Communication', badge: '8', description: 'Unread messages from agents' }
  ];

  const recentActivities = [
    { id: 1, type: 'query', message: 'New enquiry from Dream Tours', user: 'Agent Network', priority: 'high', timestamp: '5 min ago' },
    { id: 2, type: 'booking', message: 'Booking confirmed for Vacation Paradise', user: 'Sales Team', priority: 'medium', timestamp: '15 min ago' },
    { id: 3, type: 'query', message: 'Quote generated for Travel Express', user: 'Sales Executive', priority: 'low', timestamp: '1 hour ago' }
  ];

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Staff Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Dedicated workspace for sales staff</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-100 text-green-800">Sales Access</div>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{salesMetrics.newEnquiries} New Enquiries</div>
            <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <FileText className="mr-2 h-4 w-4" />Quick Quote
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Enquiries</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{salesMetrics.newEnquiries}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-sm text-green-600">+12%</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hot Leads</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{salesMetrics.hotLeads}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-sm text-green-600">+8%</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Converted</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{salesMetrics.converted}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-sm text-green-600">+15%</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{salesMetrics.responseTime}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-sm text-red-600">-5%</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Performance Metrics</h3>
            <p className="text-sm text-muted-foreground">Key performance indicators for this month</p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2"><span>Conversion Rate</span><span>{salesMetrics.conversionRate}%</span></div>
              <div role="progressbar" className="relative w-full overflow-hidden rounded-full bg-secondary h-2">
                <div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - salesMetrics.conversionRate}%)` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span>Target Achievement</span><span>{salesMetrics.targetAchievement}%</span></div>
              <div role="progressbar" className="relative w-full overflow-hidden rounded-full bg-secondary h-2">
                <div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - salesMetrics.targetAchievement}%)` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span>Agent Satisfaction</span><span>{salesMetrics.agentSatisfaction}%</span></div>
              <div role="progressbar" className="relative w-full overflow-hidden rounded-full bg-secondary h-2">
                <div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - salesMetrics.agentSatisfaction}%)` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Quick Actions</h3><p className="text-sm text-muted-foreground">Access your most used sales functions with real-time counts</p></div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{action.title}</h3>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs bg-red-100 text-red-600">{action.badge}</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center"><Clock className="h-5 w-5 mr-2" />Recent Activity</h3><p className="text-sm text-muted-foreground">Live updates from your sales system</p></div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs ${activity.priority === 'high' ? 'bg-red-100 text-red-600' : activity.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{activity.priority}</div>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full" onClick={() => navigate('/sales/enquiries')}>
                View All Activities
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Current location: <span className="font-mono text-foreground">{location.pathname}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
