import React from 'react';
import { Country } from '../types/country';

interface FlagDisplayProps {
  country: Country;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const FlagDisplay: React.FC<FlagDisplayProps> = ({ 
  country, 
  size = 'medium',
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-6';
      case 'large':
        return 'w-16 h-12';
      default:
        return 'w-12 h-8';
    }
  };

  const fallbackSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCA0MCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxMEwyNCAxOE0yNCAxMEwxNiAxOCIgc3Ryb2tlPSIjOUI5QjlCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K';

  if (!country.flagUrl) {
    return (
      <div className={`${getSizeClasses()} bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-400">No flag</span>
      </div>
    );
  }

  return (
    <img
      src={country.flagUrl}
      alt={`${country.name} flag`}
      className={`${getSizeClasses()} object-cover rounded border border-gray-200 dark:border-gray-600 shadow-sm ${className}`}
      onError={(e) => {
        e.currentTarget.src = fallbackSvg;
      }}
    />
  );
};

export default FlagDisplay;