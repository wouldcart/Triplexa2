
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Play, Users, MessageSquare, FileText, Calendar, CheckCircle,
  Clock, ArrowRight, Settings
} from 'lucide-react';
import { Query } from '@/types/query';
import { queryWorkflowService, WorkflowAction } from '@/services/queryWorkflowService';
import { useToast } from '@/hooks/use-toast';

interface WorkflowActionsProps {
  query: Query;
  onQueryUpdate?: (query: Query) => void;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  query,
  onQueryUpdate
}) => {
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const { toast } = useToast();

  const actions = queryWorkflowService.getAvailableActions(query);
  const thailandActions = queryWorkflowService.getThailandSpecificActions(query);
  const workflowSummary = queryWorkflowService.generateWorkflowSummary(query);

  const handleExecuteAction = async (actionId: string) => {
    setIsExecuting(actionId);
    
    try {
      const result = await queryWorkflowService.executeAction(query, actionId);
      
      if (result.success) {
        toast({
          title: "Action completed",
          description: result.message,
        });
        
        if (result.updatedQuery && onQueryUpdate) {
          onQueryUpdate(result.updatedQuery);
        }
      } else {
        toast({
          title: "Action failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const getActionIcon = (type: WorkflowAction['type']) => {
    switch (type) {
      case 'assignment': return Users;
      case 'communication': return MessageSquare;
      case 'proposal': return FileText;
      case 'follow-up': return Calendar;
      case 'status-change': return CheckCircle;
      default: return Play;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Play className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {actions.slice(0, 4).map((action) => {
              const Icon = getActionIcon(action.type);
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecuteAction(action.id)}
                  disabled={isExecuting === action.id}
                  className="justify-start gap-2 bg-background border-border text-foreground hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  {action.title}
                  {isExecuting === action.id && (
                    <Clock className="h-3 w-3 animate-spin ml-auto" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Thailand Specific Actions */}
      {thailandActions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-orange-600 dark:text-orange-400">
              Thailand Specific Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {thailandActions.map((action) => {
                const Icon = getActionIcon(action.type);
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteAction(action.id)}
                    disabled={isExecuting === action.id}
                    className="w-full justify-start gap-2 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-background hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  >
                    <Icon className="h-4 w-4" />
                    {action.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Overview */}
      <Dialog open={workflowOpen} onOpenChange={setWorkflowOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2 bg-background border-border text-foreground hover:bg-muted">
            <Settings className="h-4 w-4" />
            View Complete Workflow
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Query Workflow - {query.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Current Status */}
            <div>
              <h4 className="font-medium mb-2 text-foreground">Current Status</h4>
              <Badge className="capitalize bg-primary text-primary-foreground">{query.status}</Badge>
            </div>

            {/* Progress Timeline */}
            <div>
              <h4 className="font-medium mb-2 text-foreground">Progress Timeline</h4>
              <div className="space-y-2">
                {workflowSummary.completedSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <Badge variant="secondary" className="capitalize bg-muted text-foreground">{step}</Badge>
                    <span className="text-sm text-muted-foreground">Completed</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <Badge className="capitalize bg-primary text-primary-foreground">{workflowSummary.currentStep}</Badge>
                  <span className="text-sm text-muted-foreground">Current</span>
                </div>
              </div>
            </div>

            {/* Available Actions */}
            <div>
              <h4 className="font-medium mb-2 text-foreground">Available Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                {workflowSummary.nextActions.map((action) => {
                  const Icon = getActionIcon(action.type);
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      onClick={() => {
                        handleExecuteAction(action.id);
                        setWorkflowOpen(false);
                      }}
                      disabled={isExecuting === action.id}
                      className="justify-start gap-2 bg-background border-border text-foreground hover:bg-muted"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Estimated Completion */}
            <div>
              <h4 className="font-medium mb-2 text-foreground">Estimated Completion</h4>
              <p className="text-sm text-muted-foreground">
                {workflowSummary.estimatedCompletion}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowActions;
