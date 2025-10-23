import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Query } from '@/types/query';
import { useQueryAssignment } from '@/hooks/useQueryAssignment';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import { getAssignmentReason } from '@/services/countryAssignmentService';

interface QueryListProps {
  queries: Query[];
  mode: 'unassigned' | 'assigned' | 'all';
  onAssignQuery: (query: Query) => void;
}

const QueryList: React.FC<QueryListProps> = ({
  queries,
  mode,
  onAssignQuery
}) => {
  const { getApplicableRule, findBestStaffMatch } = useQueryAssignment();
  const { activeStaff } = useActiveStaffData();

  // Render query priority badge with appropriate styling
  const renderPriorityBadge = (priority: string) => {
    if (priority === 'High') {
      return <Badge variant="destructive">{priority}</Badge>;
    } else if (priority === 'Medium') {
      return <Badge variant="default">{priority}</Badge>;
    } else {
      return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Get priority based on query ID (mock logic)
  const getPriority = (queryId: string) => {
    if (queryId === 'ENQ20250001') return 'High';
    if (queryId === 'ENQ20250002') return 'Medium';
    return 'Low';
  };

  // Get staff member assigned to query using active staff data
  const getAssignedStaff = (query: Query) => {
    if (query.status === 'assigned' || query.status === 'in-progress') {
      if (query.id === 'ENQ20250002') return activeStaff[0];
      return activeStaff[1] || activeStaff[0];
    }
    return null;
  };

  // Get best matching rule for unassigned query with country consideration
  const getBestMatchRule = (query: Query) => {
    const bestStaff = findBestStaffMatch(query);
    if (bestStaff) {
      const reason = getAssignmentReason(bestStaff, query);
      
      switch (reason) {
        case 'Country Expertise':
          return <Badge className="bg-green-600">Country Match</Badge>;
        case 'Destination Expertise':
          return <Badge className="bg-blue-600">Expertise Match</Badge>;
        case 'Workload Balance':
          return <Badge className="bg-orange-600">Workload Balance</Badge>;
        default:
          return <Badge variant="outline">Manual</Badge>;
      }
    }

    const ruleType = getApplicableRule(query);
    switch (ruleType) {
      case 'agent-staff-relationship':
        return <Badge className="bg-purple-600">Agent Relationship</Badge>;
      case 'expertise-match':
        return <Badge className="bg-blue-600">Expertise Match</Badge>;
      case 'workload-balance':
        return <Badge className="bg-orange-600">Workload Balance</Badge>;
      default:
        return <Badge variant="outline">Manual</Badge>;
    }
  };

  if (mode === 'unassigned') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query ID</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>PAX</TableHead>
            <TableHead>Travel Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Best Match</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.filter(q => q.status === 'new').length > 0 ? (
            queries.filter(q => q.status === 'new').map((query) => (
              <TableRow key={query.id}>
                <TableCell>{query.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{query.destination.country}</div>
                    <div className="text-sm text-muted-foreground">
                      {query.destination.cities.join(', ')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} 
                  <div className="text-xs text-muted-foreground">
                    ({query.paxDetails.adults} A, {query.paxDetails.children} C, {query.paxDetails.infants} I)
                  </div>
                </TableCell>
                <TableCell>{query.travelDates.from}</TableCell>
                <TableCell>
                  {renderPriorityBadge(getPriority(query.id))}
                </TableCell>
                <TableCell>
                  {getBestMatchRule(query)}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onAssignQuery(query)}>
                    Assign
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No unassigned queries
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  if (mode === 'assigned') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query ID</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>PAX</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.filter(q => q.status === 'assigned' || q.status === 'in-progress').length > 0 ? (
            queries.filter(q => q.status === 'assigned' || q.status === 'in-progress').map((query) => {
              const assignedStaff = getAssignedStaff(query);
              return (
                <TableRow key={query.id}>
                  <TableCell>{query.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{query.destination.country}</div>
                      <div className="text-sm text-muted-foreground">
                        {query.destination.cities.join(', ')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} 
                    <div className="text-xs text-muted-foreground">
                      ({query.paxDetails.adults} A, {query.paxDetails.children} C, {query.paxDetails.infants} I)
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignedStaff && (
                      <div className="flex items-center">
                        <Avatar className="h-7 w-7 mr-2">
                          <AvatarFallback>{assignedStaff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{assignedStaff.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={query.status === 'in-progress' ? 'bg-blue-500' : ''}>
                      {query.status === 'assigned' ? 'Assigned' : 'In Progress'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignedStaff && (
                      <Badge className="bg-green-600">
                        {getAssignmentReason(assignedStaff, query)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onAssignQuery(query)}>
                      Reassign
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No assigned queries
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  // All queries mode with country-aware display
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Query ID</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>PAX</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Assignment</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => {
          const assignedStaff = getAssignedStaff(query);
          return (
            <TableRow key={query.id}>
              <TableCell>{query.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{query.destination.country}</div>
                  <div className="text-sm text-muted-foreground">
                    {query.destination.cities.join(', ')}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} 
                <div className="text-xs text-muted-foreground">
                  ({query.paxDetails.adults} A, {query.paxDetails.children} C, {query.paxDetails.infants} I)
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={query.status === 'new' ? 'outline' : 'default'} 
                  className={query.status === 'in-progress' ? 'bg-blue-500' : ''}
                >
                  {query.status === 'new' ? 'Unassigned' : 
                   query.status === 'assigned' ? 'Assigned' : 'In Progress'}
                </Badge>
              </TableCell>
              <TableCell>
                {query.status !== 'new' && assignedStaff ? (
                  <div className="flex items-center">
                    <Avatar className="h-7 w-7 mr-2">
                      <AvatarFallback>{assignedStaff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{assignedStaff.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {query.status === 'new' ? (
                  getBestMatchRule(query)
                ) : assignedStaff ? (
                  <Badge className="bg-green-600">
                    {getAssignmentReason(assignedStaff, query)}
                  </Badge>
                ) : (
                  <Badge variant="outline">Manual</Badge>
                )}
              </TableCell>
              <TableCell>
                {query.status === 'new' ? (
                  <Button variant="outline" size="sm" onClick={() => onAssignQuery(query)}>
                    Assign
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onAssignQuery(query)}>
                    Reassign
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default QueryList;
