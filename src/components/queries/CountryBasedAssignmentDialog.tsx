
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Query } from '@/types/query';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import { useQueryAssignment } from '@/hooks/useQueryAssignment';
import { findStaffByCountry, getAssignmentReason } from '@/services/countryAssignmentService';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';

interface CountryBasedAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: Query | null;
}

export const CountryBasedAssignmentDialog: React.FC<CountryBasedAssignmentDialogProps> = ({
  open,
  onOpenChange,
  query
}) => {
  const { activeStaff } = useActiveStaffData();
  const { assignQueryToStaff, isAssigning } = useQueryAssignment();
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const { getCountryById } = useRealTimeCountriesData();
  const mapIdsToCountryNames = (values: string[]): string[] =>
    (values || []).map(v => getCountryById(v)?.name || v).filter(Boolean) as string[];

  const staffMatches = useMemo(() => {
    if (!query) return [];
    
    const availableStaff = activeStaff.filter(staff => 
      staff.active && staff.assigned < staff.workloadCapacity
    );
    
    return findStaffByCountry(availableStaff, query.destination.country);
  }, [activeStaff, query]);

  const handleAssign = () => {
    if (!selectedStaffId || !query) return;
    
    assignQueryToStaff(query, selectedStaffId);
    onOpenChange(false);
    setSelectedStaffId(null);
  };

  if (!query) return null;

  const perfectMatches = staffMatches.filter(m => m.matchType === 'perfect');
  const otherMatches = staffMatches.filter(m => m.matchType !== 'perfect');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Query - Country-Based Matching</DialogTitle>
          <DialogDescription>
            Query {query.id} for destination: <strong>{query.destination.country}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Perfect Matches Section */}
          {perfectMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-600">🎯 Country Experts</Badge>
                <span className="text-sm text-muted-foreground">
                  Staff with {query.destination.country} operational experience
                </span>
              </div>
              
              <div className="space-y-2">
                {perfectMatches.map(({ staff, workloadRatio, score }) => {
                  const operationalCountries = mapIdsToCountryNames(staff.operationalCountries || []);
                  
                  return (
                    <Card 
                      key={staff.id}
                      className={`cursor-pointer transition-all ${
                        selectedStaffId === staff.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-green-500'
                      }`}
                      onClick={() => setSelectedStaffId(staff.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {staff.name}
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  Score: {Math.round(score)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{staff.role}</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">Workload:</span>
                              <Progress
                                value={workloadRatio * 100}
                                className="w-20 h-2"
                              />
                              <span className="text-xs">{staff.assigned}/{staff.workloadCapacity}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Countries:</span>
                            {operationalCountries.map((country, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className={`text-xs ${
                                  country === query.destination.country 
                                    ? 'border-green-500 text-green-700 bg-green-50' 
                                    : ''
                                }`}
                              >
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Available Staff */}
          {otherMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Other Available Staff</Badge>
                <span className="text-sm text-muted-foreground">
                  Staff without specific country expertise
                </span>
              </div>
              
              <div className="space-y-2">
                {otherMatches.slice(0, 3).map(({ staff, workloadRatio, score }) => {
                  const operationalCountries = mapIdsToCountryNames(staff.operationalCountries || []);
                  
                  return (
                    <Card 
                      key={staff.id}
                      className={`cursor-pointer transition-all ${
                        selectedStaffId === staff.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStaffId(staff.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-muted-foreground">{staff.role}</div>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm">
                            <span>{staff.assigned}/{staff.workloadCapacity}</span>
                            <Progress
                              value={workloadRatio * 100}
                              className="w-16 h-2 mt-1"
                            />
                          </div>
                        </div>
                        
                        {operationalCountries.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground">Countries:</span>
                              {operationalCountries.slice(0, 3).map((country, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {country}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {staffMatches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No available staff members found.</p>
              <p className="text-sm">All staff members are at capacity.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedStaffId || isAssigning}
          >
            {isAssigning ? "Assigning..." : "Assign Query"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
