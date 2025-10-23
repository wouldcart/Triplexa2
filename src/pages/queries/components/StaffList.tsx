import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StaffMember } from '@/types/assignment';
import { Progress } from '@/components/ui/progress';
import { getStaffOperationalCountries } from '@/services/countryMappingService';
import { Query } from '@/types/query';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { getStoredStaff } from '@/services/staffStorageService';

interface StaffListProps {
  staff: StaffMember[];
  selectedStaffId: number | null;
  onSelectStaff: (staffId: number) => void;
  query?: Query;
}

// Extended type to include operational countries
interface ExtendedStaffMember extends StaffMember {
  operationalCountries?: string[];
}

const StaffList: React.FC<StaffListProps> = ({
  staff,
  selectedStaffId,
  onSelectStaff,
  query
}) => {
  // Get enhanced staff data from the staff management system
  const { enhancedStaffMembers } = useEnhancedStaffData();

  // Merge staff data with operational countries from management system
  const enrichedStaff: ExtendedStaffMember[] = staff.map(staffMember => {
    // Get staff data from management system storage
    const managementStaff = getStoredStaff().find(stored => stored.id === staffMember.id.toString());
    
    // Get operational countries from management system or fallback to enhanced data
    const operationalCountries = managementStaff?.operationalCountries || 
      enhancedStaffMembers.find(enhanced => enhanced.id === staffMember.id)?.expertise || 
      [];

    return {
      ...staffMember,
      operationalCountries
    };
  });

  // Sort staff by country match, then active status, then name
  const sortedStaff = [...enrichedStaff].sort((a, b) => {
    // If query is provided, prioritize staff with matching operational countries
    if (query) {
      const aCountries = getStaffOperationalCountries(a.operationalCountries || []);
      const bCountries = getStaffOperationalCountries(b.operationalCountries || []);
      const aMatches = aCountries.includes(query.destination.country);
      const bMatches = bCountries.includes(query.destination.country);
      
      if (aMatches !== bMatches) return aMatches ? -1 : 1;
    }
    
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const getCountryMatchStatus = (member: ExtendedStaffMember) => {
    if (!query) return null;
    
    const operationalCountries = getStaffOperationalCountries(member.operationalCountries || []);
    const hasMatch = operationalCountries.includes(query.destination.country);
    
    return hasMatch ? 'perfect-match' : 'no-match';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Staff</CardTitle>
        {query && (
          <p className="text-sm text-muted-foreground">
            Destination: <strong>{query.destination.country}</strong>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStaff.map((member) => {
            const operationalCountries = getStaffOperationalCountries(member.operationalCountries || []);
            const countryMatchStatus = getCountryMatchStatus(member);
            
            return (
              <div 
                key={member.id} 
                className={`flex flex-col border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedStaffId === member.id ? 'border-primary bg-primary/5' : 
                  member.active ? 'hover:border-primary/50' : 'opacity-70'
                } ${
                  countryMatchStatus === 'perfect-match' ? 'border-green-500 bg-green-50' : ''
                }`}
                onClick={() => member.active && onSelectStaff(member.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {member.name}
                        {countryMatchStatus === 'perfect-match' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Country Expert
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge 
                      variant={member.active ? "default" : "secondary"} 
                      className={`mb-1 ${member.active ? "bg-green-500" : ""}`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {member.assigned}/{member.workloadCapacity}
                      </span>
                      <Progress
                        value={(member.assigned / member.workloadCapacity) * 100}
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Operational Countries Section - Updated to load from management system */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Operational Countries:</span>
                      <span className="text-xs text-muted-foreground">
                        {operationalCountries.length} countries
                      </span>
                    </div>
                    
                    {operationalCountries.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {operationalCountries.slice(0, 6).map((country, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={`text-xs transition-colors ${
                              query && country === query.destination.country 
                                ? 'border-green-500 text-green-700 bg-green-50 font-medium shadow-sm' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {country}
                          </Badge>
                        ))}
                        {operationalCountries.length > 6 && (
                          <Badge variant="outline" className="text-xs bg-gray-50">
                            +{operationalCountries.length - 6} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        No operational countries assigned from management system
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {sortedStaff.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">
                <Avatar className="h-16 w-16 mx-auto opacity-50">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              </div>
              <p>No staff members available for assignment.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffList;
