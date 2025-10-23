
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Collapsible, CollapsibleContent, CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Users, ChevronDown, ChevronUp, UserCheck, Clock, Target,
  AlertCircle, CheckCircle2, ArrowRight, MapPin, Zap
} from 'lucide-react';
import { Query } from '@/types/query';
import { useToast } from '@/hooks/use-toast';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import { useQueryAssignment } from '@/hooks/useQueryAssignment';
import { getBestCountryMatch, getAssignmentReason } from '@/services/countryAssignmentService';
import { getStoredStaff } from '@/services/staffStorageService';

interface StaffAssignmentPanelProps {
  queries: Query[];
  onQueryUpdate?: (queries: Query[]) => void;
}

const StaffAssignmentPanel: React.FC<StaffAssignmentPanelProps> = ({
  queries,
  onQueryUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<number>(1);
  const [assigningQuery, setAssigningQuery] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { activeStaff, getAvailableStaff } = useActiveStaffData();
  const { assignQueryToStaff, findBestStaffMatch, autoAssignQueries, isAssigning } = useQueryAssignment();

  const unassignedQueries = queries.filter(q => q.status === 'new');
  const assignedQueries = queries.filter(q => 
    ['assigned', 'in-progress'].includes(q.status)
  );

  const handleSelfAssign = async (queryId: string) => {
    setAssigningQuery(queryId);
    assignQueryToStaff(queryId, currentStaffId);
    setAssigningQuery(null);
  };

  const handleQuickAssign = async (queryId: string, staffId: number) => {
    assignQueryToStaff(queryId, staffId);
  };

  const handleBulkAutoAssign = () => {
    if (unassignedQueries.length === 0) {
      toast({
        title: "No queries to assign",
        description: "All queries are already assigned",
        variant: "destructive",
      });
      return;
    }
    autoAssignQueries(unassignedQueries);
  };

  // Enhanced staff recommendation with country matching
  const getStaffRecommendation = (query: Query) => {
    const bestMatch = findBestStaffMatch(query);
    if (!bestMatch) return null;

    const reason = getAssignmentReason(bestMatch, query);
    const storedStaffData = getStoredStaff().find(s => s.id === bestMatch.id.toString());
    const operationalCountries = storedStaffData?.operationalCountries || [];
    const hasCountryMatch = operationalCountries.includes(query.destination.country);

    return {
      staff: bestMatch,
      reason,
      hasCountryMatch,
      operationalCountries
    };
  };

  const getWorkloadColor = (staff: any) => {
    const workloadPercentage = (staff.assigned / staff.workloadCapacity) * 100;
    if (workloadPercentage >= 90) return 'text-red-600 dark:text-red-400';
    if (workloadPercentage >= 70) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const currentStaff = activeStaff.find(s => s.id === currentStaffId);

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enhanced Staff Assignment Management
                <Badge variant="outline" className="border-border text-foreground">
                  {unassignedQueries.length} Unassigned
                </Badge>
                {unassignedQueries.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Smart Matching Available
                  </Badge>
                )}
              </div>
              {isExpanded ? 
                <ChevronUp className="h-5 w-5" /> : 
                <ChevronDown className="h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Enhanced Bulk Assignment Section */}
            {unassignedQueries.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">
                          Smart Bulk Assignment
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Auto-assign {unassignedQueries.length} queries using country expertise & workload balancing
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleBulkAutoAssign}
                      disabled={isAssigning}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isAssigning ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Auto-Assign All
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Staff Info */}
            {currentStaff && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {currentStaff.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">
                          {currentStaff.name} (You)
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {currentStaff.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Assigned: {currentStaff.assigned}/{currentStaff.workloadCapacity}
                      </div>
                      <Progress
                        value={(currentStaff.assigned / currentStaff.workloadCapacity) * 100}
                        className="w-24 h-2 mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Self-Assign Section with Smart Recommendations */}
            {unassignedQueries.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Smart Assignment Recommendations
                </h4>
                <div className="grid gap-3">
                  {unassignedQueries.slice(0, 3).map((query) => {
                    const recommendation = getStaffRecommendation(query);
                    return (
                      <div 
                        key={query.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg bg-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-foreground">{query.id}</span>
                            <Badge variant="outline" className="border-border text-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {query.destination.country}
                            </Badge>
                            {recommendation?.hasCountryMatch && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Country Expert Available
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Agent: {query.agentName} • PAX: {query.paxDetails.adults + query.paxDetails.children}
                          </div>
                          {recommendation && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                Recommended: {recommendation.staff.name}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 ml-2">
                                ({recommendation.reason})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelfAssign(query.id)}
                            disabled={assigningQuery === query.id}
                          >
                            {assigningQuery === query.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                            Self-Assign
                          </Button>
                          {recommendation && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickAssign(query.id, recommendation.staff.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Assign to {recommendation.staff.name.split(' ')[0]}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {unassignedQueries.length > 3 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm" className="text-muted-foreground">
                        View {unassignedQueries.length - 3} more unassigned queries
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Staff Overview with Country Expertise */}
            <div>
              <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Team Workload & Expertise Overview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStaff.map((staff) => {
                  const workloadPercentage = (staff.assigned / staff.workloadCapacity) * 100;
                  const isOverloaded = workloadPercentage >= 90;
                  const isBusy = workloadPercentage >= 70;
                  const storedStaffData = getStoredStaff().find(s => s.id === staff.id.toString());
                  const operationalCountries = storedStaffData?.operationalCountries || [];
                  
                  return (
                    <Card key={staff.id} className={`${
                      isOverloaded ? 'border-red-300 dark:border-red-700' :
                      isBusy ? 'border-orange-300 dark:border-orange-700' :
                      'border-border'
                    } bg-background`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-foreground">
                                {staff.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{staff.name}</div>
                              <div className="text-xs text-muted-foreground">{staff.role}</div>
                            </div>
                          </div>
                          {isOverloaded ? (
                            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Workload</span>
                            <span className={getWorkloadColor(staff)}>
                              {staff.assigned}/{staff.workloadCapacity}
                            </span>
                          </div>
                          <Progress value={workloadPercentage} className="h-2" />
                          
                          {/* Enhanced Expertise Display */}
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Expertise Areas:</div>
                            <div className="flex flex-wrap gap-1">
                              {staff.expertise.slice(0, 2).map((exp) => (
                                <Badge key={exp} variant="secondary" className="text-xs bg-muted text-foreground">
                                  {exp}
                                </Badge>
                              ))}
                              {staff.expertise.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-muted text-foreground">
                                  +{staff.expertise.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Operational Countries */}
                          {operationalCountries.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Operational Countries:</div>
                              <div className="flex flex-wrap gap-1">
                                {operationalCountries.slice(0, 3).map((country) => (
                                  <Badge key={country} variant="outline" className="text-xs border-green-300 text-green-700">
                                    {country}
                                  </Badge>
                                ))}
                                {operationalCountries.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{operationalCountries.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Quick Assignment with Country Matching */}
            {unassignedQueries.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Quick Assignment (Country-Aware)
                </h4>
                <div className="grid gap-3">
                  {unassignedQueries.slice(0, 2).map((query) => {
                    const recommendation = getStaffRecommendation(query);
                    return (
                      <div 
                        key={query.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{query.id}</span>
                            <Badge variant="outline" className="text-xs">
                              {query.destination.country}
                            </Badge>
                            {recommendation?.hasCountryMatch && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Match Found
                              </Badge>
                            )}
                          </div>
                          {recommendation && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Best match: {recommendation.staff.name} ({recommendation.reason})
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(value) => handleQuickAssign(query.id, parseInt(value))}>
                            <SelectTrigger className="w-[150px] bg-background border-input">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border">
                              {getAvailableStaff().map((staff) => {
                                const isRecommended = recommendation?.staff.id === staff.id;
                                return (
                                  <SelectItem key={staff.id} value={staff.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      {staff.name}
                                      {isRecommended && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          Recommended
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default StaffAssignmentPanel;
