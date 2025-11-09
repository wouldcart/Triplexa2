import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  DBAssignmentRule,
  listAssignmentRules,
  createAssignmentRule,
  updateAssignmentRule,
  deleteAssignmentRule,
} from '@/services/assignmentRulesService';

type Props = { onClose: () => void };

const RULE_OPTIONS: { value: string; label: string }[] = [
  { value: 'expertise-match', label: 'Country/Destination Expertise' },
  { value: 'workload-balance', label: 'Workload Balance' },
  { value: 'agent-staff-relationship', label: 'Agent–Staff Relationship' },
  { value: 'round-robin', label: 'Round Robin' },
];

const AssignmentRulesEditor: React.FC<Props> = ({ onClose }) => {
  const { toast } = useToast();
  const [rules, setRules] = useState<DBAssignmentRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newRule, setNewRule] = useState<Omit<DBAssignmentRule, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    rule_type: 'expertise-match',
    priority: 1,
    enabled: true,
    conditions: null,
  });

  const loadRules = async () => {
    setLoading(true);
    const { data, error } = await listAssignmentRules();
    if (error) {
      setError('Failed to load assignment rules');
      setRules([]);
    } else {
      setError(null);
      setRules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreate = async () => {
    if (!newRule.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive', description: 'Please enter a rule name.' });
      return;
    }
    const { data, error } = await createAssignmentRule(newRule);
    if (error) {
      toast({ title: 'Create failed', variant: 'destructive', description: String(error?.message || error) });
      return;
    }
    toast({ title: 'Rule created', description: `${data?.name} added.` });
    setNewRule({ name: '', rule_type: 'expertise-match', priority: (rules?.length || 0) + 1, enabled: true, conditions: null });
    await loadRules();
  };

  const handleUpdate = async (id: string, patch: Partial<DBAssignmentRule>) => {
    const { error } = await updateAssignmentRule(id, patch);
    if (error) {
      toast({ title: 'Update failed', variant: 'destructive', description: String(error?.message || error) });
      return;
    }
    toast({ title: 'Rule updated' });
    await loadRules();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteAssignmentRule(id);
    if (error) {
      toast({ title: 'Delete failed', variant: 'destructive', description: String(error?.message || error) });
      return;
    }
    toast({ title: 'Rule deleted' });
    await loadRules();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Assignment Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 p-3 border rounded">
                  <div className="md:col-span-3">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={rule.name}
                      onChange={(e) => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, name: e.target.value } : r)))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={rule.rule_type}
                      onValueChange={(val) => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, rule_type: val } : r)))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Priority</Label>
                    <Input
                      type="number"
                      value={rule.priority}
                      onChange={(e) => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, priority: Number(e.target.value) } : r)))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Enabled</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!rule.enabled}
                        onCheckedChange={(checked) => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: checked } : r)))}
                      />
                      <span className="text-xs">{rule.enabled ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end gap-2">
                    <Button variant="outline" onClick={() => handleUpdate(rule.id, rule)}>Save</Button>
                    <Button variant="destructive" onClick={() => handleDelete(rule.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create New Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
            <div className="md:col-span-3">
              <Label className="text-xs">Name</Label>
              <Input value={newRule.name} onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs">Type</Label>
              <Select value={newRule.rule_type} onValueChange={(val) => setNewRule((p) => ({ ...p, rule_type: val }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Priority</Label>
              <Input type="number" value={newRule.priority} onChange={(e) => setNewRule((p) => ({ ...p, priority: Number(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Enabled</Label>
              <div className="flex items-center gap-2">
                <Switch checked={!!newRule.enabled} onCheckedChange={(checked) => setNewRule((p) => ({ ...p, enabled: checked }))} />
                <span className="text-xs">{newRule.enabled ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <Button onClick={handleCreate}>Add Rule</Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
          <Separator className="mt-4" />
          <p className="text-xs text-muted-foreground mt-2">Rules are applied in ascending priority order. Ensure the most specific rule has the lowest number.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentRulesEditor;