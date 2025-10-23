import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, XCircle, SkipForward, Activity, MapPin, Utensils, Hotel } from 'lucide-react';
import { loadActivityStats } from '@/utils/activityDataUtils';

interface ValidationRule {
  id: string;
  label: string;
  status: 'valid' | 'warning' | 'invalid';
  message: string;
  skippable?: boolean;
  skipped?: boolean;
}

interface EnhancedValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onSkipRule?: (ruleId: string) => void;
  validationRules: ValidationRule[];
  queryId?: string;
  title?: string;
}

const EnhancedValidationDialog: React.FC<EnhancedValidationDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
  onSkipRule,
  validationRules,
  queryId,
  title = "Proposal Validation"
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Load activity statistics
  const activityStats = queryId ? loadActivityStats(queryId) : null;

  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sightseeing': return Activity;
      case 'transport': return MapPin;
      case 'meal': return Utensils;
      case 'accommodation': return Hotel;
      default: return Activity;
    }
  };

  const hasErrors = validationRules.some(rule => rule.status === 'invalid');
  const hasWarnings = validationRules.some(rule => rule.status === 'warning');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : hasWarnings ? (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {hasErrors 
              ? "Please fix the following issues before generating the proposal:"
              : hasWarnings 
              ? "Please review the following warnings before proceeding:"
              : "All validation checks passed successfully."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activity Details</TabsTrigger>
            <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              {activityStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Activities</span>
                        <Badge variant="outline">{activityStats.stats?.total || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Complete Activities</span>
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {activityStats.stats?.complete || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Incomplete Activities</span>
                        <Badge variant="destructive" className={activityStats.stats?.incomplete > 0 ? '' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}>
                          {activityStats.stats?.incomplete || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Data Quality Score</span>
                        <Badge variant="outline" className={
                          (activityStats.validationSummary?.dataQualityScore || 0) >= 80 
                            ? 'border-green-500 text-green-700 dark:border-green-400 dark:text-green-300'
                            : (activityStats.validationSummary?.dataQualityScore || 0) >= 60
                            ? 'border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300'
                            : 'border-red-500 text-red-700 dark:border-red-400 dark:text-red-300'
                        }>
                          {activityStats.validationSummary?.dataQualityScore || 0}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Activity Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activityStats.stats?.byType && Object.entries(activityStats.stats.byType).map(([type, count]) => {
                        const IconComponent = getActivityIcon(type);
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm capitalize">{type}</span>
                            </div>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Validation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {validationRules.filter(r => r.status === 'valid').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationRules.filter(r => r.status === 'warning').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-red-600">
                        {validationRules.filter(r => r.status === 'invalid').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              {activityStats?.incompleteActivities && activityStats.incompleteActivities.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-600">Incomplete Activities</h3>
                  {activityStats.incompleteActivities.map((activity: any, index: number) => (
                    <Card key={index} className="border-red-200 dark:border-red-800">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{activity.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                            {activity.validationErrors && activity.validationErrors.length > 0 && (
                              <ul className="text-sm text-red-600 mt-2">
                                {activity.validationErrors.map((error: string, errorIndex: number) => (
                                  <li key={errorIndex}>• {error}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <Badge variant="destructive" className="shrink-0">
                            Incomplete
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>All activities have complete data!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-3">
              {validationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border ${getStatusColor(rule.status)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getStatusIcon(rule.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {rule.label}
                          {rule.skipped && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Skipped
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs mt-1 opacity-90">{rule.message}</p>
                      </div>
                    </div>
                    {rule.skippable && rule.status === 'warning' && !rule.skipped && onSkipRule && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSkipRule(rule.id)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        <SkipForward className="h-3 w-3 mr-1" />
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onProceed}
            disabled={hasErrors}
            variant={hasErrors ? "destructive" : hasWarnings ? "secondary" : "default"}
          >
            {hasErrors ? "Fix Issues First" : "Generate Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedValidationDialog;