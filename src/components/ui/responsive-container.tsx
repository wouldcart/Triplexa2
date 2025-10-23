import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  as?: keyof JSX.IntrinsicElements;
}

const paddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3',
  md: 'p-3 sm:p-4 lg:p-6',
  lg: 'p-4 sm:p-6 lg:p-8',
  xl: 'p-6 sm:p-8 lg:p-12'
};

const maxWidthClasses = {
  none: '',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  desktopClassName,
  padding = 'md',
  maxWidth = 'none',
  as: Component = 'div'
}) => {
  const isMobile = useIsMobile();

  const responsiveClasses = cn(
    paddingClasses[padding],
    maxWidthClasses[maxWidth],
    maxWidth !== 'none' && 'mx-auto',
    className,
    isMobile ? mobileClassName : desktopClassName
  );

  return (
    <Component className={responsiveClasses}>
      {children}
    </Component>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}) => {
  const gridClasses = cn(
    'grid',
    gapClasses[gap],
    cols.mobile && `grid-cols-${cols.mobile}`,
    cols.tablet && `sm:grid-cols-${cols.tablet}`,
    cols.desktop && `lg:grid-cols-${cols.desktop}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    mobile?: 'row' | 'col';
    desktop?: 'row' | 'col';
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className,
  direction = { mobile: 'col', desktop: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start'
}) => {
  const stackClasses = cn(
    'flex',
    direction.mobile === 'row' ? 'flex-row' : 'flex-col',
    direction.desktop === 'row' ? 'lg:flex-row' : 'lg:flex-col',
    gapClasses[gap],
    `items-${align}`,
    `justify-${justify}`,
    className
  );

  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;