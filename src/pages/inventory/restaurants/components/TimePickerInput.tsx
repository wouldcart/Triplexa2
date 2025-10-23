
import React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const TimePickerInput: React.FC<TimePickerInputProps> = ({ 
  value, 
  onChange,
  className
}) => {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
};

export default TimePickerInput;
