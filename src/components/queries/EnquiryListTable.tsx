import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Query } from "@/types/query";
import { useSupabaseAgentsList } from "@/hooks/useSupabaseAgentsList";
import { findSupabaseAgentByNumericId } from "@/utils/supabaseAgentIds";
import { AutomatedProposalStatusBadge } from "@/components/queries/status/AutomatedProposalStatusBadge";
import {
  MessageSquare,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  ArrowUpDown,
} from "lucide-react";

interface EnquiryListTableProps {
  queries: Query[];
  selectedQueries?: string[];
  onQuerySelect?: (queryId: string, selected: boolean) => void;
  onAssignQuery?: (query: Query) => void;
  getAutomatedProposalStatus?: (queryId: string) => string | null;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

interface SortableHeaderProps {
  field: string;
  label: string;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const EnquiryListTable: React.FC<EnquiryListTableProps> = ({
  queries,
  selectedQueries = [],
  onQuerySelect,
  onAssignQuery,
  getAutomatedProposalStatus = () => null,
  sortField,
  sortDirection,
  onSort,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Responsive viewport detection
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const { agents: supabaseAgents } = useSupabaseAgentsList();

  const handleRowClick = (queryId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    navigate(`/queries/${encodeURIComponent(queryId)}`);
  };

  const formatPaxCount = (paxDetails: Query['paxDetails']) => {
    const adults = paxDetails?.adults || 0;
    const children = paxDetails?.children || 0;
    const infants = paxDetails?.infants || 0;
    const total = adults + children + infants;
    
    return {
      total,
      breakdown: `${adults}A${children > 0 ? ` ${children}C` : ''}${infants > 0 ? ` ${infants}I` : ''}`
    };
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: MessageSquare },
      assigned: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: UserPlus },
      in_progress: { variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: Clock },
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: CheckCircle },
    };
    return configs[status as keyof typeof configs] || configs.new;
  };

  const getDurationText = (duration: string | { days: number; nights: number }) => {
    if (typeof duration === 'string') {
      const match = duration.match(/^(\d+)([dw])$/);
      if (!match) return duration;
      const value = parseInt(match[1]);
      const unit = match[2];
      return unit === 'd' ? `${value}D` : `${value}W`;
    }
    if (duration && typeof duration === 'object') {
      return `${duration.days}D/${duration.nights}N`;
    }
    return '';
  };

  const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, icon, align = 'left', className = '' }) => {
    const isActive = sortField === field;
    const isAsc = isActive && sortDirection === 'asc';
    
    return (
      <TableHead className={cn(
        "cursor-pointer select-none transition-colors hover:bg-muted/50",
        align === 'center' && "text-center",
        align === 'right' && "text-right",
        className
      )}>
        <div 
          className="flex items-center gap-2 py-3"
          onClick={() => onSort?.(field)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSort?.(field);
            }
          }}
          aria-label={`Sort by ${label}`}
        >
          {icon}
          <span className="font-semibold">{label}</span>
          <ArrowUpDown className={cn(
            "h-4 w-4 transition-transform",
            isActive && "text-primary",
            isActive && !isAsc && "rotate-180"
          )} />
        </div>
      </TableHead>
    );
  };

  // Sort queries based on current sort configuration
  const sortedQueries = React.useMemo(() => {
    if (!sortField || !onSort) return queries;
    
    return [...queries].sort((a, b) => {
      let aValue: unknown = a;
      let bValue: unknown = b;
      
      // Handle nested field access
      const fieldParts = sortField.split('.');
      for (const part of fieldParts) {
        aValue = aValue?.[part];
        bValue = bValue?.[part];
      }
      
      // Handle special cases
      if (sortField === 'pax') {
        aValue = formatPaxCount(a.paxDetails).total;
        bValue = formatPaxCount(b.paxDetails).total;
      } else if (sortField === 'agentName') {
        const supAgentA = findSupabaseAgentByNumericId(supabaseAgents, Number(a.agentId));
        const supAgentB = findSupabaseAgentByNumericId(supabaseAgents, Number(b.agentId));
        aValue = supAgentA?.agencyName || supAgentA?.name || a.agentName;
        bValue = supAgentB?.agencyName || supAgentB?.name || b.agentName;
      } else if (sortField === 'travelDates') {
        aValue = new Date(a.travelDates.from).getTime();
        bValue = new Date(b.travelDates.from).getTime();
      } else if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      
      const aNorm = typeof aValue === 'number' ? aValue : String(aValue ?? '');
      const bNorm = typeof bValue === 'number' ? bValue : String(bValue ?? '');
      if (typeof aNorm === 'number' && typeof bNorm === 'number') {
        if (aNorm < bNorm) return sortDirection === 'asc' ? -1 : 1;
        if (aNorm > bNorm) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
      const cmp = String(aNorm).localeCompare(String(bNorm));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [queries, sortField, sortDirection, onSort, supabaseAgents]);


  const MobileEnquiryCard: React.FC<{ query: Query }> = ({ query }) => {
    const statusConfig = getStatusConfig(query.status);
    const StatusIcon = statusConfig.icon;
    const paxInfo = formatPaxCount(query.paxDetails);
    const supAgent = findSupabaseAgentByNumericId(supabaseAgents, Number(query.agentId));
    const displayName = supAgent?.agencyName || supAgent?.name || query.agentName;
    const location = [supAgent?.city, supAgent?.country].filter(Boolean).join(', ');
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-blue-700 dark:text-blue-400 truncate">{query.id}</h3>
              <Badge variant="outline" className="text-xs flex-shrink-0">{query.packageType}</Badge>
            </div>
            <Badge variant={statusConfig.variant} className={cn(statusConfig.className, "gap-1 text-xs font-medium")}> 
              <StatusIcon className="h-3 w-3" />
              {query.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-muted" onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}>
            <Eye className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            {supAgent?.profile_image && <AvatarImage src={supAgent.profile_image} alt={displayName || 'Agent'} />}
            <AvatarFallback className="text-xs font-medium">
              {(displayName || query.agentName).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">{location || `ID: ${query.agentId}`}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{query.destination.country}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{format(new Date(query.travelDates.from), 'MMM dd')}</span>
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">{query.destination.cities.join(', ')}</div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-blue-600">{paxInfo.total}</span>
            <span className="text-xs text-muted-foreground">{paxInfo.breakdown}</span>
          </div>
          {getAutomatedProposalStatus(query.id) && (
            <AutomatedProposalStatusBadge status={getAutomatedProposalStatus(query.id)!} size="sm" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search enquiries..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Search enquiries"
            />
          </div>
          
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select className="px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Destinations</option>
              <option value="thailand">Thailand</option>
              <option value="vietnam">Vietnam</option>
              <option value="cambodia">Cambodia</option>
              <option value="laos">Laos</option>
              <option value="myanmar">Myanmar</option>
              <option value="singapore">Singapore</option>
              <option value="malaysia">Malaysia</option>
              <option value="indonesia">Indonesia</option>
              <option value="philippines">Philippines</option>
            </select>
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Mobile View - Enhanced Card Layout (320px - 639px) */}
      {isMobile && (
        <div className="space-y-4 px-2 sm:px-0" role="list" aria-label="Enquiry cards">
          {sortedQueries.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" role="status">
              <div className="flex flex-col items-center gap-4">
                <MessageSquare className="h-16 w-16 opacity-50" />
                <div>
                  <p className="text-xl font-semibold mb-2">No enquiries found</p>
                  <p className="text-base text-muted-foreground">Try adjusting your filters or search criteria</p>
                </div>
              </div>
            </div>
          ) : (
            sortedQueries.map((query) => (
              <div key={query.id} role="listitem">
                <MobileEnquiryCard query={query} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Tablet/Desktop View - Enhanced Table Layout (640px+) */}
      {(isTablet || isDesktop) && (
        <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <TableRow>
                  {onQuerySelect && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedQueries.length === queries.length && queries.length > 0}
                        onCheckedChange={(checked) => {
                          queries.forEach(q => onQuerySelect(q.id, checked as boolean));
                        }}
                      />
                    </TableHead>
                  )}
                  
                  <SortableHeader 
                    field="id"
                    label="Enquiry ID" 
                    icon={<MessageSquare className="h-4 w-4" />}
                  />
                  
                  <SortableHeader 
                    field="agentName"
                    label="Agent" 
                    icon={<Users className="h-4 w-4" />}
                    className="min-w-[180px]"
                  />
                  
                  <SortableHeader 
                    field="destination"
                    label="Destination" 
                    icon={<MapPin className="h-4 w-4" />}
                    className="min-w-[200px]"
                  />
                  
                  <SortableHeader 
                    field="travelDates"
                    label="Travel Dates" 
                    icon={<Calendar className="h-4 w-4" />}
                    className="min-w-[140px]"
                  />
                  
                  <SortableHeader 
                    field="pax"
                    label="PAX" 
                    icon={<Users className="h-4 w-4" />}
                    align="center"
                    className="w-20"
                  />
                  
                  <SortableHeader 
                    field="duration"
                    label="Duration" 
                    icon={<Clock className="h-4 w-4" />}
                    align="center"
                    className="w-24"
                  />
                  
                  <SortableHeader 
                    field="status"
                    label="Status" 
                    icon={<CheckCircle className="h-4 w-4" />}
                  />
                  
                  <SortableHeader 
                    field="createdAt"
                    label="Created" 
                    icon={<Calendar className="h-4 w-4" />}
                    className="min-w-[100px]"
                  />
                  
                  <TableHead className="w-12 text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {sortedQueries.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={onQuerySelect ? 10 : 9} 
                      className="text-center py-12 text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <MessageSquare className="h-16 w-16 opacity-50" />
                        <div>
                          <p className="text-xl font-semibold">No enquiries found</p>
                          <p className="text-base">Try adjusting your filters or search criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedQueries.map((query) => {
                    const statusConfig = getStatusConfig(query.status);
                    const StatusIcon = statusConfig.icon;
                    const paxInfo = formatPaxCount(query.paxDetails);
                    
                    return (
                      <TableRow 
                        key={query.id}
                        className="hover:bg-muted/30 cursor-pointer transition-all duration-200 border-b border-muted/20"
                        onClick={(e) => handleRowClick(query.id, e)}
                      >
                        {onQuerySelect && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedQueries.includes(query.id)}
                              onCheckedChange={(checked) => onQuerySelect(query.id, checked as boolean)}
                            />
                          </TableCell>
                        )}
                        
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-blue-700 text-sm">{query.id}</span>
                            <Badge variant="outline" className="text-xs w-fit">
                              {query.packageType}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {(() => {
                            const supAgent = findSupabaseAgentByNumericId(supabaseAgents, Number(query.agentId));
                            const displayName = supAgent?.agencyName || supAgent?.name || query.agentName;
                            const location = [supAgent?.city, supAgent?.country].filter(Boolean).join(', ');
                            const initialsSource = displayName || query.agentName;
                            const initials = initialsSource.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                            return (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {supAgent?.profile_image && (
                                    <AvatarImage src={supAgent.profile_image} alt={displayName || 'Agent'} />
                                  )}
                                  <AvatarFallback className="text-xs font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{displayName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {location || `ID: ${query.agentId}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-sm">{query.destination.country}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {query.destination.cities.join(', ')}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{format(new Date(query.travelDates.from), 'MMM dd')}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              to {format(new Date(query.travelDates.to), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-lg text-blue-600">{paxInfo.total}</span>
                            <span className="text-xs text-muted-foreground font-medium">{paxInfo.breakdown}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs font-medium">
                            {getDurationText(query.tripDuration)}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-2">
                            {/* Original query status */}
                            <Badge 
                              variant={statusConfig.variant}
                              className={cn(statusConfig.className, "gap-1 font-medium")}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {query.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            
                            {/* Automated proposal status (if available) */}
                            {getAutomatedProposalStatus(query.id) && (
                              <div>
                                <AutomatedProposalStatusBadge 
                                  status={getAutomatedProposalStatus(query.id)!}
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{format(new Date(query.createdAt), 'MMM dd')}</span>
                            <span className="text-xs">{format(new Date(query.createdAt), 'yyyy')}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="dropdown-trigger">
                              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56" role="menu">
                              <DropdownMenuItem 
                                onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
                                className="h-12 text-base"
                                role="menuitem"
                              >
                                <Eye className="mr-3 h-5 w-5" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}/edit`)}
                                className="h-12 text-base"
                                role="menuitem"
                              >
                                <Edit className="mr-3 h-5 w-5" />
                                Edit Enquiry
                              </DropdownMenuItem>
                              {query.status === 'new' && onAssignQuery && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => onAssignQuery(query)}
                                    className="h-12 text-base"
                                    role="menuitem"
                                  >
                                    <UserPlus className="mr-3 h-5 w-5" />
                                    Assign to Staff
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}/proposal`)}
                                className="h-12 text-base"
                                role="menuitem"
                              >
                                <MessageSquare className="mr-3 h-5 w-5" />
                                Create Proposal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryListTable;