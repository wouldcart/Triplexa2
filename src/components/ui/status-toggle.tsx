import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface StatusToggleProps {
  /**
   * Current status value (boolean)
   */
  isActive: boolean;
  /**
   * Callback when status changes
   */
  onToggle: (isActive: boolean) => void;
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
  /**
   * Size variant of the toggle
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show text labels next to the toggle
   */
  showLabels?: boolean;
  /**
   * Custom labels for active/inactive states
   */
  labels?: {
    active: string;
    inactive: string;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Loading state
   */
  loading?: boolean;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  isActive,
  onToggle,
  disabled = false,
  size = 'md',
  showLabels = true,
  labels = {
    active: 'Active',
    inactive: 'Inactive'
  },
  className,
  loading = false
}) => {
  const handleToggle = (checked: boolean) => {
    if (!disabled && !loading) {
      onToggle(checked);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn(
      'flex items-center gap-2',
      sizeClasses[size],
      className
    )}>
      {showLabels && (
        <span className={cn(
          'font-medium transition-colors',
          isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {isActive ? labels.active : labels.inactive}
        </span>
      )}
      
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={disabled || loading}
        className={cn(
          'transition-all duration-200',
          loading && 'opacity-50 cursor-not-allowed',
          size === 'sm' && 'scale-75',
          size === 'lg' && 'scale-125'
        )}
        aria-label={`Toggle status: ${isActive ? labels.active : labels.inactive}`}
      />
      
      {loading && (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Status badge component that shows the current status with color coding
 */
interface StatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const variantClasses = {
    default: isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    outline: isActive
      ? 'border border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
      : 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
  };

  return (
    <div className={cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full mr-2',
        isActive ? 'bg-green-500' : 'bg-gray-400'
      )} />
      {isActive ? 'Active' : 'Inactive'}
    </div>
  );
};

export default StatusToggle;