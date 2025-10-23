
import React from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: 'active' | 'inactive' | boolean;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  additionalText?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  status, 
  variant = 'default', 
  className,
  additionalText = ''
}) => {
  // Convert boolean status to string
  const normalizedStatus = typeof status === 'boolean' 
    ? (status ? 'active' : 'inactive') 
    : status;
  
  const getStatusClass = () => {
    switch (normalizedStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400';

      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <UIBadge 
      variant={variant}
      className={cn(
        variant === 'default' ? getStatusClass() : '',
        'capitalize',
        className
      )}
    >
      {normalizedStatus} {additionalText}
    </UIBadge>
  );
};

export default Badge;
