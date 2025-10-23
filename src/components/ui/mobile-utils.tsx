import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Mobile-optimized grid container
interface MobileGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = { mobile: 3, tablet: 4, desktop: 6 },
  className
}) => {
  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} xl:grid-cols-${cols.large}`;
  const gridGap = `gap-${gap.mobile} sm:gap-${gap.tablet} lg:gap-${gap.desktop}`;
  
  return (
    <div className={cn('grid', gridCols, gridGap, className)}>
      {children}
    </div>
  );
};

// Mobile-optimized button
interface MobileButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const isMobile = useIsMobile();
  
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-primary'
  };
  
  const sizeClasses = {
    sm: isMobile ? 'h-9 px-3 text-sm min-h-[36px]' : 'h-8 px-3 text-sm',
    md: isMobile ? 'h-10 px-4 text-sm min-h-[40px]' : 'h-9 px-4 text-sm',
    lg: isMobile ? 'h-12 px-6 text-base min-h-[48px]' : 'h-10 px-6 text-base'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </button>
  );
};

// Mobile-optimized text sizing
interface MobileTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const MobileText: React.FC<MobileTextProps> = ({
  children,
  variant = 'body',
  className,
  as
}) => {
  const textClasses = {
    h1: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold',
    h2: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold',
    h3: 'text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold',
    h4: 'text-sm sm:text-base lg:text-lg xl:text-xl font-medium',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm text-muted-foreground',
    small: 'text-xs'
  };
  
  const Component = as || (variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p');
  
  return (
    <Component className={cn(textClasses[variant], className)}>
      {children}
    </Component>
  );
};

// Mobile-optimized spacing container
interface MobileSpacingProps {
  children: React.ReactNode;
  padding?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  margin?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export const MobileSpacing: React.FC<MobileSpacingProps> = ({
  children,
  padding = { mobile: 3, tablet: 4, desktop: 6 },
  margin,
  className
}) => {
  const paddingClasses = `p-${padding.mobile} sm:p-${padding.tablet} lg:p-${padding.desktop}`;
  const marginClasses = margin ? `m-${margin.mobile} sm:m-${margin.tablet} lg:m-${margin.desktop}` : '';
  
  return (
    <div className={cn(paddingClasses, marginClasses, className)}>
      {children}
    </div>
  );
};

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className,
  padding = true,
  hover = true
}) => {
  return (
    <div className={cn(
      'bg-card text-card-foreground rounded-lg border shadow-sm',
      padding && 'p-3 sm:p-4 lg:p-6',
      hover && 'hover:shadow-md transition-shadow touch-manipulation',
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-optimized form field
interface MobileFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const MobileField: React.FC<MobileFieldProps> = ({
  children,
  label,
  error,
  required,
  className
}) => {
  return (
    <div className={cn('space-y-1 sm:space-y-2', className)}>
      {label && (
        <label className="text-sm sm:text-base font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs sm:text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

// Mobile-optimized icon sizing
interface MobileIconProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MobileIcon: React.FC<MobileIconProps> = ({
  children,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3 sm:h-4 sm:w-4',
    md: 'h-4 w-4 sm:h-5 sm:w-5',
    lg: 'h-5 w-5 sm:h-6 sm:w-6'
  };
  
  return (
    <span className={cn(sizeClasses[size], className)}>
      {children}
    </span>
  );
};

// Mobile-optimized table wrapper
interface MobileTableProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6', className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized stack layout
interface MobileStackProps {
  children: React.ReactNode;
  spacing?: number;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const MobileStack: React.FC<MobileStackProps> = ({
  children,
  spacing = 4,
  direction = 'vertical',
  className
}) => {
  const stackClasses = direction === 'vertical' 
    ? `space-y-${spacing}` 
    : `space-x-${spacing} flex flex-wrap`;
    
  return (
    <div className={cn(stackClasses, className)}>
      {children}
    </div>
  );
};