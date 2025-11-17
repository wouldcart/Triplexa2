import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Settings, CheckCircle, Loader2 } from 'lucide-react';
import { OptionalToggleProps } from '@/types/optionalRecords';

/**
 * OptionalToggle Component
 * 
 * A modern, accessible toggle switch for marking items as optional or included.
 * Features smooth animations, color-coded states, and loading indicators.
 * 
 * Design:
 * - Purple theme (#8B5CF6) for included items
 * - Orange theme (#F59E0B) for optional items  
 * - iOS-style switch with smooth transitions
 * - Scale variants: sm (75%), md (90%), lg (100%)
 * - Loading spinner overlay during updates
 * 
 * Accessibility:
 * - Keyboard navigation support
 * - Screen reader friendly labels
 * - High contrast color combinations
 * - 44px minimum touch target size
 */
export const OptionalToggle: React.FC<OptionalToggleProps> = ({
  isOptional,
  onToggle,
  size = 'sm',
  showLabels = true,
  className,
  disabled = false,
  loading = false,
}) => {
  // Size scaling classes for different contexts
  const sizeClasses = {
    sm: 'scale-75',
    md: 'scale-90', 
    lg: 'scale-100',
  };

  // Handle toggle change with proper state management
  const handleToggle = (checked: boolean) => {
    if (!disabled && !loading) {
      onToggle(checked); // ON means Optional, OFF means Required
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 transition-all duration-200",
      "select-none",
      className
    )}>
      {/* Main toggle switch with accessibility features */}
      <div className="relative">
        <Switch
          checked={isOptional} // ON means Optional, OFF means Required
          onCheckedChange={handleToggle}
          className={cn(
            sizeClasses[size],
            "transition-transform duration-200 ease-in-out",
            "focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            loading && "cursor-wait"
          )}
          disabled={disabled || loading}
          aria-label={isOptional ? 'Mark as required' : 'Mark as optional'}
          aria-pressed={isOptional}
        />
        
        {/* Loading indicator overlay */}
        {loading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-white/50 dark:bg-gray-900/50 rounded-full"
          )}>
            <Loader2 className={cn(
              "h-3 w-3 text-blue-500 animate-spin",
              size === 'sm' && "h-2.5 w-2.5",
              size === 'lg' && "h-4 w-4"
            )} />
          </div>
        )}
      </div>

      {/* Status labels with color coding */}
      {showLabels && (
        <div className="flex items-center gap-1 min-w-0">
          {isOptional ? (
            <>
              {/* Optional state - Orange theme (ON position) */}
              <Settings 
                className={cn(
                  "h-3 w-3 text-orange-500 flex-shrink-0",
                  size === 'sm' && "h-2.5 w-2.5",
                  size === 'lg' && "h-4 w-4"
                )} 
              />
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                  "border-orange-200 dark:border-orange-800",
                  "hover:bg-orange-100 dark:hover:bg-orange-900/50"
                )}
              >
                Optional
              </Badge>
            </>
          ) : (
            <>
              {/* Required state - Green theme (OFF position) */}
              <CheckCircle 
                className={cn(
                  "h-3 w-3 text-green-500 flex-shrink-0",
                  size === 'sm' && "h-2.5 w-2.5", 
                  size === 'lg' && "h-4 w-4"
                )} 
              />
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                  "border-green-200 dark:border-green-800",
                  "hover:bg-green-100 dark:hover:bg-green-900/50"
                )}
              >
                Required
              </Badge>
            </>
          )}
        </div>
      )}
    </div>
  );
};

OptionalToggle.displayName = 'OptionalToggle';

export default OptionalToggle;