import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  FileText, CheckCircle, Calendar, DollarSign, 
  Upload, Bell, TrendingUp, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const AgentOverviewCards: React.FC = () => {
  const isMobile = useIsMobile();
  
  const overviewData = [
    {
      title: "Proposals Sent",
      value: "24",
      subtitle: "This month",
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      priority: "high"
    },
    {
      title: "Confirmed Trips",
      value: "12",
      subtitle: "Active bookings",
      change: "+8%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      priority: "high"
    },
    {
      title: "Commission Earned",
      value: "$2,450",
      subtitle: "$680 pending",
      change: "+15%",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      priority: "high"
    },
    {
      title: "Fixed Departures",
      value: "8",
      subtitle: "Available this month",
      change: "-2%",
      trend: "down",
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      priority: "medium"
    },
    {
      title: "Documents Uploaded",
      value: "156",
      subtitle: "All clients",
      change: "+5%",
      trend: "up",
      icon: Upload,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      priority: "medium"
    },
    {
      title: "Notifications",
      value: "3",
      subtitle: "Action required",
      change: "New",
      trend: "neutral",
      icon: Bell,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      priority: "high"
    }
  ];

  // Show only high priority cards on mobile, all on desktop
  const displayData = isMobile 
    ? overviewData.filter(item => item.priority === "high")
    : overviewData;

  return (
    <div className="space-y-4">
      {/* Mobile: Horizontal scrollable cards */}
      {isMobile ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-4 w-max">
            {displayData.map((item, index) => (
              <Card key={index} className="w-64 flex-shrink-0 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      {item.trend !== "neutral" && (
                        <Badge 
                          variant={item.trend === "up" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {item.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {item.change}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {item.value}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Desktop: Responsive grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {displayData.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    {item.trend !== "neutral" && (
                      <Badge 
                        variant={item.trend === "up" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {item.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {item.change}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {item.value}
                    </div>
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Mobile: Show all cards button */}
      {isMobile && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            Showing {displayData.length} of {overviewData.length} cards
          </Badge>
        </div>
      )}
    </div>
  );
};

export default AgentOverviewCards;