
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { listAssignmentRules, updateAssignmentRuleEnabled, type DBAssignmentRule } from '@/services/assignmentRulesService';

interface AssignmentRulesProps {
  onEditRules: () => void;
}

const AssignmentRules: React.FC<AssignmentRulesProps> = ({ onEditRules }) => {
  const [rules, setRules] = useState<DBAssignmentRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await listAssignmentRules();
      if (!mounted) return;
      setRules(data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    // optimistic update
    setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, enabled } : r)));
    const { error } = await updateAssignmentRuleEnabled(ruleId, enabled);
    if (error) {
      // revert on error
      setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, enabled: !enabled } : r)));
    }
  };

  const describeRuleType = (type: string) => {
    switch (type) {
      case 'agent-staff-relationship':
        return 'Assigns queries based on agent-staff relationships';
      case 'expertise-match':
        return 'Assigns queries based on staff expertise with destination';
      case 'workload-balance':
        return 'Assigns queries to staff with the lowest workload';
      case 'round-robin':
        return 'Assigns queries sequentially based on staff priority';
      default:
        return type;
    }
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
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading rules…</div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => {
              const isEnabled = Boolean(rule.enabled ?? true);
              const isSelected = selectedRuleId === rule.id;
              return (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-2 border rounded transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent/20 border-primary' : ''
                  }`}
                  onClick={() => setSelectedRuleId(rule.id)}
                  role="button"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                >
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{rule.priority}</span>
                    <div>
                      <div>{rule.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {describeRuleType(rule.rule_type)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      id={`rule-${rule.id}`}
                    />
                    <Label htmlFor={`rule-${rule.id}`}>
                      <Badge variant={isEnabled ? 'default' : 'outline'} className={isEnabled ? 'bg-green-500' : ''}>
                        {isEnabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentRules;
