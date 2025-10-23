
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface WeekdayOffSelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
}

const WEEKDAYS = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const WeekdayOffSelector: React.FC<WeekdayOffSelectorProps> = ({
  selectedDays,
  onChange,
}) => {
  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedDays, day]);
    } else {
      onChange(selectedDays.filter(d => d !== day));
    }
  };

  return (
    <div className="space-y-2">
      <Label>Weekdays Off</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {WEEKDAYS.map(({ value, label }) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedDays.includes(value)}
              onCheckedChange={(checked) => handleDayToggle(value, checked as boolean)}
            />
            <Label className="text-sm">{label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekdayOffSelector;
