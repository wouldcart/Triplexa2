
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Target as TargetIcon, TrendingUp, Users, Clock, Star, DollarSign } from 'lucide-react';
import { Target as TargetType } from '@/types/staff';

interface TargetSettingsProps {
  department: string;
  role: string;
  targets: TargetType[];
  onTargetsChange: (targets: TargetType[]) => void;
}

const TargetSettings: React.FC<TargetSettingsProps> = ({
  department,
  role,
  targets,
  onTargetsChange
}) => {
  const [newTarget, setNewTarget] = useState<Partial<TargetType>>({
    name: '',
    type: 'revenue',
    value: 0,
    period: 'monthly',
    status: 'active'
  });

  // Define target types based on department and role
  const getAvailableTargetTypes = () => {
    const baseTypes = [
      { value: 'enquiries', label: 'Enquiries Handled', icon: Users },
      { value: 'response-time', label: 'Response Time (hours)', icon: Clock },
      { value: 'satisfaction', label: 'Customer Satisfaction', icon: Star }
    ];

    if (department === 'Sales' || department === 'Field Sales') {
      return [
        { value: 'revenue', label: 'Revenue ($)', icon: DollarSign },
        { value: 'conversions', label: 'Conversion Rate (%)', icon: TrendingUp },
        ...baseTypes
      ];
    }

    if (department === 'Operations') {
      return [
        { value: 'bookings', label: 'Bookings Completed', icon: TargetIcon },
        { value: 'efficiency', label: 'Task Efficiency (%)', icon: TrendingUp },
        ...baseTypes
      ];
    }

    if (department === 'Customer Support') {
      return [
        { value: 'tickets', label: 'Tickets Resolved', icon: TargetIcon },
        { value: 'first-call-resolution', label: 'First Call Resolution (%)', icon: TrendingUp },
        ...baseTypes
      ];
    }

    if (department === 'Finance') {
      return [
        { value: 'accuracy', label: 'Accuracy Rate (%)', icon: TargetIcon },
        { value: 'processing-time', label: 'Processing Time (hours)', icon: Clock },
        ...baseTypes.filter(t => t.value !== 'enquiries')
      ];
    }

    return baseTypes;
  };

  const getRecommendedTargets = () => {
    const recommendations = [];
    
    if (department === 'Sales') {
      if (role.includes('Senior') || role.includes('Manager')) {
        recommendations.push(
          { name: 'Monthly Revenue Target', type: 'revenue', value: 150000, period: 'monthly' },
          { name: 'Conversion Rate Target', type: 'conversions', value: 65, period: 'monthly' }
        );
      } else {
        recommendations.push(
          { name: 'Monthly Revenue Target', type: 'revenue', value: 100000, period: 'monthly' },
          { name: 'Conversion Rate Target', type: 'conversions', value: 50, period: 'monthly' }
        );
      }
    }

    if (department === 'Operations') {
      recommendations.push(
        { name: 'Monthly Bookings', type: 'bookings', value: 25, period: 'monthly' },
        { name: 'Task Efficiency', type: 'efficiency', value: 90, period: 'monthly' }
      );
    }

    if (department === 'Customer Support') {
      recommendations.push(
        { name: 'Response Time', type: 'response-time', value: 2, period: 'daily' },
        { name: 'Customer Satisfaction', type: 'satisfaction', value: 4.5, period: 'monthly' }
      );
    }

    if (department === 'Finance') {
      recommendations.push(
        { name: 'Accuracy Rate', type: 'accuracy', value: 98, period: 'monthly' },
        { name: 'Processing Time', type: 'processing-time', value: 4, period: 'daily' }
      );
    }

    return recommendations;
  };

  const addTarget = () => {
    if (!newTarget.name || !newTarget.type || !newTarget.value || !newTarget.period) {
      return;
    }

    const target: TargetType = {
      id: `T${Date.now()}`,
      name: newTarget.name,
      type: newTarget.type as any,
      value: Number(newTarget.value),
      achieved: 0,
      period: newTarget.period as any,
      startDate: new Date().toISOString().split('T')[0],
      endDate: getEndDate(newTarget.period as any),
      status: 'active'
    };

    onTargetsChange([...targets, target]);
    setNewTarget({
      name: '',
      type: 'revenue',
      value: 0,
      period: 'monthly',
      status: 'active'
    });
  };

  const removeTarget = (targetId: string) => {
    onTargetsChange(targets.filter(t => t.id !== targetId));
  };

  const addRecommendedTarget = (recommendation: any) => {
    const target: TargetType = {
      id: `T${Date.now()}`,
      name: recommendation.name,
      type: recommendation.type,
      value: recommendation.value,
      achieved: 0,
      period: recommendation.period,
      startDate: new Date().toISOString().split('T')[0],
      endDate: getEndDate(recommendation.period),
      status: 'active'
    };

    onTargetsChange([...targets, target]);
  };

  const getEndDate = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return now.toISOString().split('T')[0];
      case 'weekly':
        now.setDate(now.getDate() + 7);
        return now.toISOString().split('T')[0];
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        return now.toISOString().split('T')[0];
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        return now.toISOString().split('T')[0];
      default:
        return now.toISOString().split('T')[0];
    }
  };

  const availableTypes = getAvailableTargetTypes();
  const recommendations = getRecommendedTargets();

  const getTargetIcon = (type: string) => {
    const targetType = availableTypes.find(t => t.value === type);
    const IconComponent = targetType?.icon || TargetIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getTargetUnit = (type: string) => {
    switch (type) {
      case 'revenue': return '$';
      case 'conversions': return '%';
      case 'satisfaction': return '/5';
      case 'response-time': return 'hrs';
      case 'efficiency': return '%';
      case 'accuracy': return '%';
      case 'processing-time': return 'hrs';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Target Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure performance targets for {role} in {department} department
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Targets</TabsTrigger>
            <TabsTrigger value="add">Add New Target</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {targets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TargetIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No targets set yet</p>
                <p className="text-sm">Add targets to track performance metrics</p>
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTargetIcon(target.type)}
                      <div>
                        <h4 className="font-medium">{target.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Target: {target.value}{getTargetUnit(target.type)}</span>
                          <Badge variant="outline" className="text-xs">
                            {target.period}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {target.achieved}{getTargetUnit(target.type)} / {target.value}{getTargetUnit(target.type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((target.achieved / target.value) * 100).toFixed(1)}% achieved
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTarget(target.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            {/* Recommended Targets */}
            {recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recommended Targets for {department}</h4>
                <div className="grid gap-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{rec.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rec.value}{getTargetUnit(rec.type)} per {rec.period}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addRecommendedTarget(rec)}
                        disabled={targets.some(t => t.name === rec.name)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Target Form */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Create Custom Target</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-name">Target Name*</Label>
                  <Input
                    id="target-name"
                    value={newTarget.name}
                    onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                    placeholder="e.g., Monthly Sales Target"
                  />
                </div>

                <div>
                  <Label htmlFor="target-type">Target Type*</Label>
                  <Select
                    value={newTarget.type}
                    onValueChange={(value) => setNewTarget({ ...newTarget, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-value">Target Value*</Label>
                  <Input
                    id="target-value"
                    type="number"
                    value={newTarget.value}
                    onChange={(e) => setNewTarget({ ...newTarget, value: Number(e.target.value) })}
                    placeholder="Enter target value"
                  />
                </div>

                <div>
                  <Label htmlFor="target-period">Period*</Label>
                  <Select
                    value={newTarget.period}
                    onValueChange={(value) => setNewTarget({ ...newTarget, period: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="button" onClick={addTarget} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TargetSettings;
