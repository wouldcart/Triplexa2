
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DollarSign
} from 'lucide-react';
import { Query } from '@/types/query';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { resolveProfileNameById } from '@/services/profilesHelper';

interface EnquiryCardProps {
  query: Query;
  onAssignQuery?: (query: Query) => void;
}

const EnquiryCard: React.FC<EnquiryCardProps> = ({ query, onAssignQuery }) => {
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
  
  // Calculate priority score and progress
  const getPriorityInfo = () => {
    const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;
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
      return <Badge className="bg-red-500 text-white">Overdue</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge className="bg-red-500 text-white">{daysLeft} days left</Badge>;
    } else if (daysLeft <= 30) {
      return <Badge className="bg-orange-500 text-white">{daysLeft} days left</Badge>;
    } else {
      return <Badge className="bg-blue-500 text-white">{daysLeft} days left</Badge>;
    }
  };

  const priorityInfo = getPriorityInfo();
  const statusInfo = getStatusInfo();
  const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;

  // Calculate potential revenue
  const estimatedRevenue = query.budget?.max ? query.budget.max * 0.15 : 0; // 15% commission

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-4 p-4">
          {/* Enquiry Details */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  <button 
                    onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {query.id}
                  </button>
                </h3>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">T</AvatarFallback>
                </Avatar>
                <span>{query.agentName}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {format(new Date(query.createdAt), 'MMM dd, yyyy')}
              </div>
              {estimatedRevenue > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <DollarSign className="h-3 w-3" />
                  <span>Est. ${estimatedRevenue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Destination & Category */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <div className="font-semibold">{query.destination.country}</div>
                  <div className="text-sm text-muted-foreground">
                    {query.destination.cities.join(', ')}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {query.packageType}
              </Badge>
              {query.budget && (
                <div className="text-xs text-muted-foreground">
                  ${query.budget.min?.toLocaleString()} - ${query.budget.max?.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Travel Info */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{format(new Date(query.travelDates.from), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-lg">{totalPax} PAX</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {query.tripDuration.nights} nights
              </div>
              {getDaysLeftBadge()}
            </div>
          </div>

          {/* Status & Progress */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={cn("text-xs", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {format(new Date(query.updatedAt), 'dd MMM')} ago
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{statusInfo.progress}%</span>
                </div>
                <Progress value={statusInfo.progress} className="h-2" />
              </div>

              {query.assignedTo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserPlus className="h-3 w-3" />
                  <span>{assignedToName || query.assignedTo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Priority & Performance */}
          <div className="col-span-12 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Priority</span>
              </div>
              <Badge className={cn("text-white font-bold", priorityInfo.color)}>
                {priorityInfo.level} ({priorityInfo.score}/10)
              </Badge>
              
              {/* Performance Indicator */}
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">High Convert Potential</span>
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
              
              {/* Quick Communication Actions */}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="flex-1 p-1">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 p-1">
                  <Mail className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 p-1">
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnquiryCard;
