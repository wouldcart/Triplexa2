import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidatedInputProps {
  id?: string;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  onValidate?: (value: string | number) => string | null;
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  helpText?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidIcon?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  value,
  onChange,
  onValidate,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
  step,
  className,
  disabled = false,
  helpText,
  validateOnChange = true,
  validateOnBlur = true,
  showValidIcon = true,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const validateValue = (val: string | number) => {
    if (!onValidate) return;

    const errorMessage = onValidate(val);
    setError(errorMessage);
    setIsValid(!errorMessage && val !== '' && val !== 0);
  };

  useEffect(() => {
    if (isTouched && validateOnChange) {
      validateValue(value);
    }
  }, [value, isTouched, validateOnChange, onValidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
    
    if (!isTouched) {
      setIsTouched(true);
    }
  };

  const handleBlur = () => {
    if (!isTouched) {
      setIsTouched(true);
    }
    
    if (validateOnBlur) {
      validateValue(value);
    }
  };

  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = error && isTouched;
  const showSuccess = isValid && isTouched && showValidIcon && !hasError;

  const inputClassName = cn(
    'bg-background border-input text-foreground transition-colors',
    hasError && 'border-destructive focus:border-destructive',
    showSuccess && 'border-green-500 focus:border-green-500',
    className
  );

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-1">
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <InputComponent
          id={inputId}
          type={type === 'textarea' ? undefined : type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={inputClassName}
        />
        
        {/* Validation icons */}
        {(hasError || showSuccess) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : showSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Specialized components for common use cases
export const ValidatedNumberInput: React.FC<Omit<ValidatedInputProps, 'type'>> = (props) => (
  <ValidatedInput {...props} type="number" />
);

export const ValidatedTextarea: React.FC<Omit<ValidatedInputProps, 'type'>> = (props) => (
  <ValidatedInput {...props} type="textarea" />
);

export default ValidatedInput;