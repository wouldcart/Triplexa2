
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form';
import { RefreshCw, Hash } from 'lucide-react';
import { generateEmployeeCodeFromDB, validateEmployeeCode, isEmployeeCodeUnique } from '@/utils/employeeCodeGenerator';

interface EmployeeCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  excludeId?: string; // For edit mode to exclude current staff member
}

const EmployeeCodeField: React.FC<EmployeeCodeFieldProps> = ({
  value,
  onChange,
  label = "Employee Code",
  placeholder = "Enter 4-digit code",
  disabled = false,
  error,
  excludeId
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newCode = await generateEmployeeCodeFromDB();
      onChange(newCode);
    } catch (error) {
      console.error('Failed to generate employee code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numeric input, up to 10 digits
    if (/^\d{0,10}$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const isValid = validateEmployeeCode(value);
  const isUnique = value ? isEmployeeCodeUnique(value, excludeId) : true;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={value}
              onChange={handleInputChange}
              placeholder={placeholder || 'Enter up to 10 digits'}
              disabled={disabled}
              maxLength={10}
              className={`pl-10 h-11 font-mono text-center tracking-wider border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${!isValid && value ? 'border-red-500' : ''} ${!isUnique ? 'border-red-500' : ''}`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={disabled || isGenerating}
            className="h-11 px-4 border-gray-300 hover:bg-blue-50"
            title="Generate automatic code"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {error && <FormMessage>{error}</FormMessage>}
      {value && !isValid && (
        <FormMessage>Employee code must be 1–10 digits</FormMessage>
      )}
      {value && isValid && !isUnique && (
        <FormMessage>This employee code is already in use</FormMessage>
      )}
    </div>
  );
};

export default EmployeeCodeField;
