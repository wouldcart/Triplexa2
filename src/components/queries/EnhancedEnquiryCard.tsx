
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  DollarSign,
  CalendarDays,
  User,
  Baby,
  Zap,
  Target,
  Activity,
  Timer,
  CreditCard,
  Shield
} from 'lucide-react';
import { Query } from '@/types/query';
import { format, differenceInDays, differenceInHours, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { findSupabaseAgentByNumericId } from '@/utils/supabaseAgentIds';
import { resolveProfileNameById } from '@/services/profilesHelper';

interface EnhancedEnquiryCardProps {
  query: Query;
  onAssignQuery?: (query: Query) => void;
}

const EnhancedEnquiryCard: React.FC<EnhancedEnquiryCardProps> = ({ query, onAssignQuery }) => {
  const { agents: supabaseAgents } = useSupabaseAgentsList();
  const navigate = useNavigate();

  // Resolve assigned staff display name
  const [assignedToName, setAssignedToName] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (query.assignedTo) {
        try {
          const name = await resolveProfileNameById(query.assignedTo);
          if (mounted) setAssignedToName(name);
        } catch {
          if (mounted) setAssignedToName(null);
        }
      } else {
        if (mounted) setAssignedToName(null);
      }
    })();
    return () => { mounted = false; };
  }, [query.assignedTo]);

  // Calculate days left until travel
  const daysLeft = differenceInDays(new Date(query.travelDates.from), new Date());
  
  // Calculate creation time details
  const createdDate = new Date(query.createdAt);
  const hoursAgo = differenceInHours(new Date(), createdDate);
  const minutesAgo = differenceInMinutes(new Date(), createdDate);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });
  
  // Enhanced PAX details
  const paxDetails = query.paxDetails;
  const totalPax = paxDetails.adults + paxDetails.children + paxDetails.infants;
  
  const getPaxBreakdown = () => {
    const parts = [];
    if (paxDetails.adults > 0) parts.push(`${paxDetails.adults}A`);
    if (paxDetails.children > 0) parts.push(`${paxDetails.children}C`);
    if (paxDetails.infants > 0) parts.push(`${paxDetails.infants}I`);
    return parts.join('+');
  };

  // Enhanced duration display
  const getDurationDisplay = () => {
    const days = query.tripDuration.days || (query.tripDuration.nights + 1);
    const nights = query.tripDuration.nights;
    return `${days}D/${nights}N`;
  };

  // Priority calculation
  const getPriorityInfo = () => {
    let score = 5; // base score
    
    // Add urgency based on travel date
    if (daysLeft < 0) score = 10;
    else if (daysLeft <= 7) score = 9;
    else if (daysLeft <= 30) score = 8;
    else if (daysLeft <= 60) score = 7;
    
    // Add complexity factors
    if (query.packageType === 'luxury') score += 1;
    if (totalPax >= 8) score += 1;
    if (query.destination.cities.length > 2) score += 1;
    
    score = Math.min(10, score);
    
    const level = score >= 9 ? 'URGENT' : score >= 7 ? 'HIGH' : score >= 5 ? 'MEDIUM' : 'LOW';
    const color = score >= 9 ? 'bg-red-500' : score >= 7 ? 'bg-orange-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500';
    
    return { score, level, color };
  };

  const getStatusInfo = () => {
    const statusMap = {
      'new': { label: 'New', color: 'bg-orange-100 text-orange-800 border-orange-200', progress: 10 },
      'assigned': { label: 'Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200', progress: 25 },
      'in-progress': { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200', progress: 50 },
      'proposal-sent': { label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', progress: 75 },
      'confirmed': { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200', progress: 90 },
      'converted': { label: 'Converted', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', progress: 100 },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', progress: 0 }
    };
    
    return statusMap[query.status as keyof typeof statusMap] || statusMap.new;
  };

  const getDaysLeftBadge = () => {
    if (daysLeft < 0) {
      return <Badge className="bg-red-500 text-white animate-pulse">Overdue by {Math.abs(daysLeft)} days</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge className="bg-red-500 text-white">Urgent: {daysLeft} days left</Badge>;
    } else if (daysLeft <= 30) {
      return <Badge className="bg-orange-500 text-white">{daysLeft} days left</Badge>;
    } else {
      return <Badge className="bg-blue-500 text-white">{daysLeft} days left</Badge>;
    }
  };

  const getCreationBadge = () => {
    if (minutesAgo <= 30) {
      return <Badge className="bg-green-500 text-white animate-pulse">Live</Badge>;
    } else if (hoursAgo <= 2) {
      return <Badge className="bg-green-500 text-white animate-pulse">Just Created</Badge>;
    } else if (hoursAgo <= 24) {
      return <Badge className="bg-green-600 text-white">New Today</Badge>;
    }
    return null;
  };

  // Enhanced SLA and response time indicators
  const getSLAInfo = () => {
    const slaHours = query.packageType === 'luxury' ? 1 : query.packageType === 'business' ? 2 : 4;
    const isOverdue = hoursAgo > slaHours;
    const timeRemaining = slaHours - hoursAgo;
    
    return {
      slaHours,
      isOverdue,
      timeRemaining,
      urgency: isOverdue ? 'overdue' : timeRemaining <= 1 ? 'critical' : timeRemaining <= 2 ? 'warning' : 'normal'
    };
  };

  // Contact information masking
  const getMaskedContact = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      return '+XX XXXX XXXX';
    }
    return 'xxx@email.com';
  };

  const priorityInfo = getPriorityInfo();
  const statusInfo = getStatusInfo();
  const slaInfo = getSLAInfo();
  const estimatedRevenue = query.budget?.max ? query.budget.max * 0.15 : 0;

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 border-l-4",
      slaInfo.isOverdue ? "border-l-red-500 bg-red-50" : 
      priorityInfo.score >= 8 ? "border-l-orange-500" : "border-l-blue-500"
    )}>
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-4 p-4">
          {/* Enhanced Enquiry Details - Now with more information */}
          <div className="col-span-12 md:col-span-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  <button 
                    onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {query.id}
                  </button>
                </h3>
                {priorityInfo.score >= 8 && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                {slaInfo.isOverdue && <Timer className="h-4 w-4 text-red-500 animate-pulse" />}
              </div>
              
              {/* Enhanced PAX Display with Group Size Indicator */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-xl text-blue-800">{totalPax} PAX</span>
                  {totalPax >= 8 && <Badge className="bg-purple-500 text-white text-xs">Large Group</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-600" />
                    <span>{paxDetails.adults} Adults</span>
                  </div>
                  {paxDetails.children > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-600" />
                      <span>{paxDetails.children} Children</span>
                    </div>
                  )}
                  {paxDetails.infants > 0 && (
                    <div className="flex items-center gap-1">
                      <Baby className="h-3 w-3 text-gray-600" />
                      <span>{paxDetails.infants} Infants</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Format: {getPaxBreakdown()}
                </div>
              </div>

              {/* Enhanced Agent & Contact Info */}
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <div className="flex items-center gap-2 text-sm mb-2">
                  {(() => {
                    const supAgent = findSupabaseAgentByNumericId(supabaseAgents, Number(query.agentId));
                    const displayName = supAgent?.agencyName || supAgent?.name || query.agentName;
                    const initial = (displayName || query.agentName || '?').charAt(0);
                    return (
                      <>
                        <Avatar className="h-5 w-5">
                          {supAgent?.profile_image && (
                            <AvatarImage src={supAgent.profile_image} alt={displayName || 'Agent'} />
                          )}
                          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{displayName}</span>
                        <Badge variant="outline" className="text-xs">Agent</Badge>
                      </>
                    );
                  })()}
                </div>
                
                {/* Contact Preview */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600" title="Click to reveal phone">
                    <Phone className="h-3 w-3" />
                    <span>{getMaskedContact('phone')}</span>
                  </div>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600" title="Click to reveal email">
                    <Mail className="h-3 w-3" />
                    <span>{getMaskedContact('email')}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Creation Info with SLA */}
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Created:</span>
                  {getCreationBadge()}
                </div>
                <div className="text-xs">
                  <div className="font-medium">{format(createdDate, 'MMM dd, yyyy')}</div>
                  <div className="text-gray-500">{format(createdDate, 'h:mm a')}</div>
                  <div className="text-blue-600">({timeAgo})</div>
                </div>
                
                {/* SLA Indicator */}
                <div className={cn(
                  "mt-2 p-1 rounded text-xs flex items-center gap-1",
                  slaInfo.isOverdue ? "bg-red-100 text-red-800" :
                  slaInfo.urgency === 'critical' ? "bg-orange-100 text-orange-800" :
                  slaInfo.urgency === 'warning' ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                )}>
                  <Target className="h-3 w-3" />
                  <span>
                    SLA: {slaInfo.isOverdue ? `Overdue by ${Math.abs(slaInfo.timeRemaining)}h` : 
                          `${Math.max(0, Math.floor(slaInfo.timeRemaining))}h remaining`}
                  </span>
                </div>
              </div>

              {/* Enhanced Revenue & Budget Info */}
              {query.budget && (
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                    <CreditCard className="h-3 w-3" />
                    <span className="font-medium">Budget Range</span>
                  </div>
                  <div className="text-sm font-medium text-green-800">
                    ${query.budget.min?.toLocaleString()} - ${query.budget.max?.toLocaleString()}
                  </div>
                  {estimatedRevenue > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Est. Revenue: ${estimatedRevenue.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Destination & Category */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <div className="font-semibold">{query.destination.country}</div>
                  <div className="text-sm text-muted-foreground">
                    {query.destination.cities.join(', ')}
                  </div>
                  {query.destination.cities.length > 2 && (
                    <Badge variant="outline" className="text-xs mt-1">Multi-City</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {query.packageType}
                </Badge>
                
                {/* Special Requirements */}
                {query.specialRequests && query.specialRequests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {query.specialRequests.slice(0, 2).map((req, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {req.substring(0, 10)}...
                      </Badge>
                    ))}
                    {query.specialRequests.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{query.specialRequests.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Communication Preference */}
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MessageSquare className="h-3 w-3" />
                <span className="capitalize">{query.communicationPreference}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Travel Info */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-3">
              {/* Travel Dates */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Travel Dates</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{format(new Date(query.travelDates.from), 'MMM dd, yyyy')}</div>
                  <div className="text-gray-600">{format(new Date(query.travelDates.to), 'MMM dd, yyyy')}</div>
                  {query.travelDates.isEstimated && (
                    <Badge variant="outline" className="text-xs mt-1">Estimated</Badge>
                  )}
                </div>
              </div>

              {/* Duration Display */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-800 text-lg">{getDurationDisplay()}</span>
                </div>
                <div className="text-xs text-green-600">
                  {query.tripDuration.days || (query.tripDuration.nights + 1)} days, {query.tripDuration.nights} nights
                </div>
              </div>

              {getDaysLeftBadge()}
            </div>
          </div>

          {/* Enhanced Status & Progress */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={cn("text-xs", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {format(new Date(query.updatedAt), 'dd MMM')}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{statusInfo.progress}%</span>
                </div>
                <Progress value={statusInfo.progress} className="h-2" />
              </div>

              {/* Assignment Info */}
              {query.assignedTo && (
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                    <UserPlus className="h-3 w-3" />
                    <span>Assigned to:</span>
                  </div>
                  <div className="text-sm font-medium text-blue-800">{assignedToName || query.assignedTo}</div>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <Activity className="h-3 w-3" />
                    <span>Active workload: 85%</span>
                  </div>
                </div>
              )}

              {/* Last Activity */}
              <div className="text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last activity: {timeAgo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Priority & Performance */}
          <div className="col-span-12 md:col-span-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Priority</span>
              </div>
              <Badge className={cn("text-white font-bold", priorityInfo.color)}>
                {priorityInfo.level}
              </Badge>
              <div className="text-xs text-center">({priorityInfo.score}/10)</div>
              
              {/* Performance Indicators */}
              <div className="space-y-1">
                {query.status === 'converted' && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Converted</span>
                  </div>
                )}
                
                {slaInfo.urgency === 'critical' && (
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="h-3 w-3 text-red-500 animate-pulse" />
                    <span className="text-red-600">SLA Critical</span>
                  </div>
                )}
                
                {query.packageType === 'luxury' && (
                  <div className="flex items-center gap-1 text-xs">
                    <Shield className="h-3 w-3 text-purple-500" />
                    <span className="text-purple-600">VIP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="col-span-12 md:col-span-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
                className="w-full justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/queries/edit/${encodeURIComponent(query.id)}`)}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              {/* Enhanced Communication Actions */}
              <div className="grid grid-cols-3 gap-1">
                <Button variant="ghost" size="sm" className="p-1" title="Call Customer">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1" title="Send Email">
                  <Mail className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1" title="Quick Message">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>

              {query.status === 'new' && onAssignQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignQuery(query)}
                  className="w-full justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Quick Assign
                </Button>
              )}

              {/* SLA Action if overdue */}
              {slaInfo.isOverdue && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Timer className="h-4 w-4 mr-2" />
                  SLA Escalate
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedEnquiryCard;
