
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  FileText, 
  UserPlus, 
  MessageSquare, 
  CheckCircle,
  Calendar,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { WorkflowEvent, Query } from '@/types/query';
import { queryWorkflowService } from '@/services/queryWorkflowService';
import { cn } from '@/lib/utils';

interface EnquiryTimelineProps {
  query: Query;
}

const EnquiryTimeline: React.FC<EnquiryTimelineProps> = ({ query }) => {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [workflowStats, setWorkflowStats] = useState<any>(null);

  useEffect(() => {
    // Initialize workflow if it doesn't exist
    let workflow = queryWorkflowService.getWorkflow(query.id);
    if (!workflow) {
      queryWorkflowService.createQueryCreatedEvent(query);
    }

    // Load events and stats
    const queryEvents = queryWorkflowService.getQueryEvents(query.id);
    setEvents(queryEvents);
    setWorkflowStats(queryWorkflowService.getWorkflowStats(query.id));
  }, [query.id]);

  const getEventIcon = (type: WorkflowEvent['type']) => {
    switch (type) {
      case 'created':
        return FileText;
      case 'assigned':
        return UserPlus;
      case 'status_changed':
        return CheckCircle;
      case 'proposal_created':
        return MessageSquare;
      case 'follow_up':
        return Calendar;
      case 'comment_added':
        return MessageSquare;
      default:
        return Clock;
    }
  };

  const getEventColor = (type: WorkflowEvent['type']) => {
    switch (type) {
      case 'created':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'assigned':
        return 'text-purple-500 bg-purple-50 border-purple-200';
      case 'status_changed':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'proposal_created':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'follow_up':
        return 'text-indigo-500 bg-indigo-50 border-indigo-200';
      case 'comment_added':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleExportTimeline = () => {
    const exportData = queryWorkflowService.exportWorkflow(query.id);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiry-${query.id}-timeline.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Stats */}
      {workflowStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Timeline Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportTimeline}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{workflowStats.totalEvents}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{workflowStats.daysInCurrentStatus}</p>
                <p className="text-sm text-muted-foreground">Days in Status</p>
              </div>
              {workflowStats.timeToFirstProposal && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{workflowStats.timeToFirstProposal}</p>
                  <p className="text-sm text-muted-foreground">Days to Proposal</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{workflowStats.averageResponseTime}</p>
                <p className="text-sm text-muted-foreground">Avg Response (days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No timeline events available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
              
              <div className="space-y-6">
                {events.map((event, index) => {
                  const Icon = getEventIcon(event.type);
                  const colorClasses = getEventColor(event.type);
                  const { date, time } = formatDateTime(event.timestamp);
                  const isExpanded = expandedEvents.has(event.id);
                  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

                  return (
                    <div key={event.id} className="relative flex items-start space-x-4">
                      {/* Timeline node */}
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 z-10",
                        colorClasses
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm">{event.details}</h4>
                              {hasMetadata && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleEventExpansion(event.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                              <User className="h-3 w-3" />
                              <span>{event.userName}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.userRole}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{date}</span>
                              <span>{time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded metadata */}
                        {isExpanded && hasMetadata && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                            <h5 className="font-medium text-sm mb-2">Event Details</h5>
                            <div className="space-y-1 text-sm">
                              {Object.entries(event.metadata!).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="font-medium">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {index < events.length - 1 && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnquiryTimeline;
