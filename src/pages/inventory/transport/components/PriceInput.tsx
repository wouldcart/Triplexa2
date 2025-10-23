
import React from 'react';
import { Input } from '@/components/ui/input';
import { currencySymbols } from '../utils/constants';

export interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  country?: string;
  label?: string;
  id?: string;
  disabled?: boolean; // Added disabled prop
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  country = '',
  label = 'Price',
  id,
  disabled = false // Default to false
}) => {
  // Get currency symbol based on country or default to USD
  const currencySymbol = country && currencySymbols[country] ? currencySymbols[country] : '$';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert input to a number
    const numericValue = e.target.value ? parseFloat(e.target.value) : 0;
    onChange(numericValue);
  };
  
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <span className="text-gray-500">{currencySymbol}</span>
      </div>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value || ''}
        onChange={handleChange}
        className="pl-8"
        placeholder={label}
        disabled={disabled}
      />
    </div>
  );
};

export default PriceInput;
