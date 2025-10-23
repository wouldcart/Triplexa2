
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { assignmentRules, toggleAssignmentRule } from '@/data/staffData';

interface AssignmentRulesProps {
  onEditRules: () => void;
}

const AssignmentRules: React.FC<AssignmentRulesProps> = ({ onEditRules }) => {
  const handleToggleRule = (ruleId: number, enabled: boolean) => {
    toggleAssignmentRule(ruleId, enabled);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assignment Rules</CardTitle>
          <Button variant="outline" size="sm" onClick={onEditRules}>Edit Rules</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {assignmentRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center">
                <span className="font-medium mr-2">{rule.priority}</span>
                <div>
                  <div>{rule.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {rule.type === 'agent-staff-relationship' && 'Assigns queries based on agent-staff relationships'}
                    {rule.type === 'expertise-match' && 'Assigns queries based on staff expertise with destination'}
                    {rule.type === 'workload-balance' && 'Assigns queries to staff with the lowest workload'}
                    {rule.type === 'round-robin' && 'Assigns queries sequentially based on staff priority'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  id={`rule-${rule.id}`}
                />
                <Label htmlFor={`rule-${rule.id}`}>
                  <Badge variant={rule.enabled ? "default" : "outline"} className={rule.enabled ? "bg-green-500" : ""}>
                    {rule.enabled ? "Active" : "Inactive"}
                  </Badge>
                </Label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentRules;
