
import React, { useEffect, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, Edit, Clock, Star, MapPin, Users, Calendar,
  TrendingUp, AlertCircle, CheckCircle, FileText
} from 'lucide-react';
import { Query } from '@/types/query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import EnhancedStatusBadge from '@/components/queries/status/EnhancedStatusBadge';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { findSupabaseAgentByNumericId } from '@/utils/supabaseAgentIds';
import { resolveProfileNameById } from '@/services/profilesHelper';

interface EnhancedQueryListProps {
  queries: Query[];
  showActions?: boolean;
  calculatePriority: (query: Query) => number;
  categorizeQuery: (query: Query) => string;
}

  const EnhancedQueryList: React.FC<EnhancedQueryListProps> = ({
    queries,
    showActions = true,
    calculatePriority,
    categorizeQuery
  }) => {
    const { agents: supabaseAgents } = useSupabaseAgentsList();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { hasAdminAccess, isStaff } = useAccessControl();

  // Resolve assigned staff names for display
  const [assignedNamesMap, setAssignedNamesMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = Array.from(new Set((queries || [])
      .map(q => q.assignedTo)
      .filter((id): id is string => Boolean(id))));
    const missing = ids.filter(id => !(id in assignedNamesMap));
    if (missing.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const entries = await Promise.all(missing.map(async (id) => {
          const name = await resolveProfileNameById(id);
          return [id, name] as const;
        }));
        if (!mounted) return;
        const update: Record<string, string> = {};
        for (const [id, name] of entries) {
          if (name) update[id] = name;
        }
        if (Object.keys(update).length > 0) {
          setAssignedNamesMap(prev => ({ ...prev, ...update }));
        }
      } catch {
        // swallow errors; fallback will show raw ID
      }
    })();
    return () => { mounted = false; };
  }, [queries, assignedNamesMap]);

  // Filter queries based on user access level
  const getAccessibleQueries = (): Query[] => {
    if (!currentUser) return [];
    
    // Super admin and manager have access to all queries
    if (hasAdminAccess) {
      return queries;
    }
    
    // Staff users only see queries assigned to them
    if (isStaff) {
      return queries.filter(query => {
        // Check if query is assigned to current staff user
        return query.assignedTo === currentUser.name || 
               query.assignedTo === currentUser.id ||
               query.agentName === currentUser.name; // Also show if they created it
      });
    }
    
    // Default: no access
    return [];
  };

  const accessibleQueries = getAccessibleQueries();

  const getQueryPriority = (query: Query): 'low' | 'normal' | 'high' | 'urgent' => {
    const score = calculatePriority(query);
    if (score >= 8) return 'urgent';
    if (score >= 6) return 'high';
    if (score >= 4) return 'normal';
    return 'low';
  };

  const isNewAssignment = (query: Query): boolean => {
    return query.status === 'assigned' && 
      new Date().getTime() - new Date(query.createdAt).getTime() < 24 * 60 * 60 * 1000;
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'new': return 10;
      case 'assigned': return 25;
      case 'in-progress': return 50;
      case 'proposal-sent': return 75;
      case 'modify-proposal': return 65;
      case 'confirmed': return 90;
      case 'converted': return 100;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysUntilTravel = (travelDate: string) => {
    const days = Math.floor((new Date(travelDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getLastUpdated = (query: Query): string => {
    const now = new Date();
    const created = new Date(query.createdAt);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getDurationText = (duration: Query['tripDuration']) => {
    return `${duration.nights}N/${duration.days}D`;
  };

  const handleViewEnquiry = (queryId: string) => {
    console.log('Navigating to query details:', queryId);
    navigate(`/queries/${encodeURIComponent(queryId)}`);
  };

  const handleEditEnquiry = (queryId: string) => {
    console.log('Navigating to edit query:', queryId);
    navigate(`/queries/edit/${encodeURIComponent(queryId)}`);
  };

  return (
    <div className="space-y-4">
      {/* Access Level Info for Staff Users */}
      {isStaff && !hasAdminAccess && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Showing only enquiries assigned to you ({accessibleQueries.length} of {queries.length} total)
            </span>
          </div>
        </div>
      )}

      {accessibleQueries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          {isStaff && !hasAdminAccess ? (
            <div>
              <p>No enquiries assigned to you yet</p>
              <p className="text-xs mt-1">Contact your manager for enquiry assignments</p>
            </div>
          ) : (
            <p>No enquiries found matching your criteria</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquiry Details</TableHead>
                <TableHead>Destination & Category</TableHead>
                <TableHead>Travel Info</TableHead>
                <TableHead>Status & Progress</TableHead>
                <TableHead>Priority</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessibleQueries.map((query) => {
                const priority = calculatePriority(query);
                const category = categorizeQuery(query);
                const daysUntilTravel = calculateDaysUntilTravel(query.travelDates.from);
                const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;
                const lastUpdated = getLastUpdated(query);
                const queryPriority = getQueryPriority(query);
                const newAssignment = isNewAssignment(query);

                return (
                  <TableRow 
                    key={query.id} 
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      newAssignment && "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                    )}
                  >
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={() => handleViewEnquiry(query.id)}>
                            {query.id}
                          </span>
                          {newAssignment && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              NEW
                            </Badge>
                          )}
                          {daysUntilTravel <= 30 && (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const supAgent = findSupabaseAgentByNumericId(supabaseAgents, Number(query.agentId));
                            const displayName = supAgent?.agencyName || supAgent?.name || query.agentName;
                            const initial = (displayName || query.agentName || '?').charAt(0);
                            return (
                              <>
                                <Avatar className="h-6 w-6">
                                  {supAgent?.profile_image && (
                                    <AvatarImage src={supAgent.profile_image} alt={displayName || 'Agent'} />
                                  )}
                                  <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">{displayName}</span>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(query.createdAt)}
                        </p>
                        {query.assignedTo && (
                          <p className="text-xs text-blue-600">
                            Assigned to: {assignedNamesMap[query.assignedTo] || query.assignedTo}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{query.destination.country}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {query.destination.cities.join(', ')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(query.travelDates.from)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{totalPax} PAX</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline" className="text-xs font-medium">
                            {getDurationText(query.tripDuration)}
                          </Badge>
                        </div>
                        {daysUntilTravel <= 30 && (
                          <Badge variant="destructive" className="text-xs">
                            {daysUntilTravel} days left
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <EnhancedStatusBadge 
                          status={query.status}
                          isNewAssignment={newAssignment}
                          priority={queryPriority}
                          lastUpdated={lastUpdated}
                          size="sm"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-medium">{getStatusProgress(query.status)}%</span>
                          </div>
                          <Progress value={getStatusProgress(query.status)} className="h-2" />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <Badge className={cn(
                            "text-xs",
                            queryPriority === 'urgent' && 'bg-red-500 text-white',
                            queryPriority === 'high' && 'bg-orange-500 text-white',
                            queryPriority === 'normal' && 'bg-blue-500 text-white',
                            queryPriority === 'low' && 'bg-gray-500 text-white'
                          )}>
                            {queryPriority.toUpperCase()} ({priority}/10)
                          </Badge>
                        </div>
                        {query.status === 'converted' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>

                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewEnquiry(query.id)}
                            title="View Enquiry"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditEnquiry(query.id)}
                            title="Edit Enquiry"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EnhancedQueryList;
