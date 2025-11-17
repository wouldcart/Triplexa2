import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Car, Bus, Plane, Ship } from 'lucide-react';

interface OptionalTransportOptionsProps {
  options: any[];
  onOptionsChange: (options: any[]) => void;
}

const transportIcons = {
  private: Car,
  shared: Bus,
  flight: Plane,
  cruise: Ship
};

const transportTypes = [
  { value: 'private', label: 'Private Car', icon: Car },
  { value: 'shared', label: 'Shared Shuttle', icon: Bus },
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'cruise', label: 'Cruise/Boat', icon: Ship }
];

export const OptionalTransportOptions: React.FC<OptionalTransportOptionsProps> = ({ 
  options, 
  onOptionsChange 
}) => {
  const updateOption = (id: string, field: string, value: any) => {
    onOptionsChange(options.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ));
  };

  const addOption = () => {
    const newOption = {
      id: `transport${Date.now()}`,
      type: 'private' as const,
      description: '',
      cost: 0,
      isOptional: false,
      details: { from: '', to: '', duration: '' }
    };
    onOptionsChange([...options, newOption]);
  };

  const removeOption = (id: string) => {
    onOptionsChange(options.filter(option => option.id !== id));
  };

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          Optional Transport Options
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add optional transport options that guests can choose from
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => {
          const IconComponent = transportIcons[option.type] || Car;
          return (
            <div key={option.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={option.isOptional}
                    onCheckedChange={(checked) => updateOption(option.id, 'isOptional', checked)}
                  />
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.isOptional ? 'Optional' : 'Included'} Transport
                    </Label>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Transport Type</Label>
                  <Select
                    value={option.type}
                    onValueChange={(value) => updateOption(option.id, 'type', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-3 w-3" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={option.cost}
                    onChange={(e) => updateOption(option.id, 'cost', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  value={option.description}
                  onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                  placeholder="Describe the transport option..."
                  rows={2}
                  className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">From</Label>
                  <Input
                    value={option.details?.from || ''}
                    onChange={(e) => updateOption(option.id, 'details', { ...option.details, from: e.target.value })}
                    placeholder="Departure location"
                    className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">To</Label>
                  <Input
                    value={option.details?.to || ''}
                    onChange={(e) => updateOption(option.id, 'details', { ...option.details, to: e.target.value })}
                    placeholder="Destination"
                    className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Duration</Label>
                  <Input
                    value={option.details?.duration || ''}
                    onChange={(e) => updateOption(option.id, 'details', { ...option.details, duration: e.target.value })}
                    placeholder="e.g., 2 hours"
                    className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Transport Option
        </Button>
      </CardContent>
    </Card>
  );
};