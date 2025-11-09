
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  UserPlus, 
  MessageSquare, 
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Query } from '@/types/query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { findSupabaseAgentByNumericId } from '@/utils/supabaseAgentIds';

type SortField = 'id' | 'agentName' | 'destination' | 'travelDates' | 'pax' | 'duration' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface EnquiryListTableProps {
  queries: Query[];
  onQuerySelect?: (queryId: string, selected: boolean) => void;
  selectedQueries?: string[];
  onAssignQuery?: (query: Query) => void;
}

const EnquiryListTable: React.FC<EnquiryListTableProps> = ({
  queries,
  onQuerySelect,
  selectedQueries = [],
  onAssignQuery
}) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const { agents: supabaseAgents } = useSupabaseAgentsList();

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedQueries = React.useMemo(() => {
    const sorted = [...queries].sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.field) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'agentName':
          comparison = a.agentName.localeCompare(b.agentName);
          break;
        case 'destination':
          comparison = a.destination.country.localeCompare(b.destination.country);
          break;
        case 'travelDates':
          comparison = new Date(a.travelDates.from).getTime() - new Date(b.travelDates.from).getTime();
          break;
        case 'pax':
          const aPax = a.paxDetails.adults + a.paxDetails.children + a.paxDetails.infants;
          const bPax = b.paxDetails.adults + b.paxDetails.children + b.paxDetails.infants;
          comparison = aPax - bPax;
          break;
        case 'duration':
          comparison = a.tripDuration.nights - b.tripDuration.nights;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [queries, sortConfig]);

  const getStatusConfig = (status: string) => {
    const configs = {
      'new': {
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200',
        icon: AlertCircle
      },
      'assigned': {
        variant: 'outline' as const,
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
        icon: UserPlus
      },
      'in-progress': {
        variant: 'default' as const,
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200',
        icon: Clock
      },
      'proposal-sent': {
        variant: 'default' as const,
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
        icon: MessageSquare
      },
      'confirmed': {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
        icon: CheckCircle
      },
      'converted': {
        variant: 'default' as const,
        className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
        icon: CheckCircle
      },
      'cancelled': {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
        icon: AlertCircle
      }
    };

    return configs[status as keyof typeof configs] || configs.new;
  };

  const formatPaxCount = (pax: Query['paxDetails']) => {
    const total = pax.adults + pax.children + pax.infants;
    return {
      total,
      breakdown: `${pax.adults}A${pax.children > 0 ? ` ${pax.children}C` : ''}${pax.infants > 0 ? ` ${pax.infants}I` : ''}`
    };
  };

  const getDurationText = (duration: Query['tripDuration']) => {
    return `${duration.nights}N/${duration.days}D`;
  };

  const handleRowClick = (queryId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((event.target as HTMLElement).closest('button') || 
        (event.target as HTMLElement).closest('[role="checkbox"]') ||
        (event.target as HTMLElement).closest('.dropdown-trigger')) {
      return;
    }
    navigate(`/queries/${encodeURIComponent(queryId)}`);
  };

  const SortableHeader: React.FC<{ 
    field: SortField;
    label: string; 
    icon?: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
  }> = ({ field, label, icon, className, align = 'left' }) => {
    const isActive = sortConfig.field === field;
    const direction = sortConfig.direction;
    
    return (
      <TableHead 
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50 transition-colors font-semibold",
          align === 'center' && "text-center",
          align === 'right' && "text-right",
          className
        )}
        onClick={() => handleSort(field)}
      >
        <div className={cn(
          "flex items-center gap-2",
          align === 'center' && "justify-center",
          align === 'right' && "justify-end"
        )}>
          {icon}
          <span>{label}</span>
          <div className="flex flex-col">
            {!isActive ? (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            ) : direction === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-blue-600" />
            ) : (
              <ArrowUp className="h-3 w-3 text-blue-600" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40 border-b">
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
              >
                <div className="flex flex-col items-center gap-3">
                  <MessageSquare className="h-12 w-12 opacity-50" />
                  <div>
                    <p className="text-lg font-medium">No enquiries found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria</p>
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
                      const initials = initialsSource.split(' ').map(n => n[0]).join('').slice(0, 2);
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
                    <Badge 
                      variant={statusConfig.variant}
                      className={cn(statusConfig.className, "gap-1 font-medium")}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {query.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Enquiry
                        </DropdownMenuItem>
                        {query.status === 'new' && onAssignQuery && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAssignQuery(query)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign to Staff
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}/proposal`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
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
  );
};

export default EnquiryListTable;
