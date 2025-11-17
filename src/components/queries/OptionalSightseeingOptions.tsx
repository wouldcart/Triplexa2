import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Camera, Activity } from 'lucide-react';

interface OptionalSightseeingOptionsProps {
  options: any[];
  onOptionsChange: (options: any[]) => void;
}

export const OptionalSightseeingOptions: React.FC<OptionalSightseeingOptionsProps> = ({ 
  options, 
  onOptionsChange 
}) => {
  const updateOption = (id: string, field: string, value: any) => {
    onOptionsChange(options.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ));
  };

  const addActivity = (optionId: string) => {
    onOptionsChange(options.map(option => 
      option.id === optionId ? {
        ...option,
        activities: [...option.activities, { name: '', duration: '', cost: 0, description: '' }]
      } : option
    ));
  };

  const updateActivity = (optionId: string, activityIndex: number, field: string, value: any) => {
    onOptionsChange(options.map(option => 
      option.id === optionId ? {
        ...option,
        activities: option.activities.map((activity, index) => 
          index === activityIndex ? { ...activity, [field]: value } : activity
        )
      } : option
    ));
  };

  const removeActivity = (optionId: string, activityIndex: number) => {
    onOptionsChange(options.map(option => 
      option.id === optionId ? {
        ...option,
        activities: option.activities.filter((_, index) => index !== activityIndex)
      } : option
    ));
  };

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Optional Sightseeing Options
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add optional sightseeing packages that guests can choose from
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {options.map((option) => (
          <div key={option.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={option.isOptional}
                  onCheckedChange={(checked) => updateOption(option.id, 'isOptional', checked)}
                />
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.id === 'option1' ? 'Option 1' : 'Option 2'}: {option.isOptional ? 'Optional' : 'Included'}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Title</Label>
                <Input
                  value={option.title}
                  onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                  placeholder="Enter package title"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Description</Label>
                <Input
                  value={option.description}
                  onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                  placeholder="Brief description"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Activities</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addActivity(option.id)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Activity
                </Button>
              </div>

              {option.activities.map((activity, activityIndex) => (
                <div key={activityIndex} className="p-3 border border-gray-200 dark:border-gray-600 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Activity {activityIndex + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActivity(option.id, activityIndex)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Activity Name</Label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(option.id, activityIndex, 'name', e.target.value)}
                        placeholder="e.g., Museum visit, City tour"
                        className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Duration</Label>
                      <Input
                        value={activity.duration}
                        onChange={(e) => updateActivity(option.id, activityIndex, 'duration', e.target.value)}
                        placeholder="e.g., 2 hours, Half day"
                        className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Cost ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={activity.cost}
                        onChange={(e) => updateActivity(option.id, activityIndex, 'cost', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Description</Label>
                      <Input
                        value={activity.description}
                        onChange={(e) => updateActivity(option.id, activityIndex, 'description', e.target.value)}
                        placeholder="Brief description"
                        className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};