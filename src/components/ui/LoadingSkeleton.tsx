import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'button' | 'tab';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className, 
  variant = 'card',
  count = 1 
}) => {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'card':
        return 'h-32 w-full bg-muted animate-pulse rounded-lg';
      case 'text':
        return 'h-4 w-3/4 bg-muted animate-pulse rounded';
      case 'button':
        return 'h-10 w-24 bg-muted animate-pulse rounded-md';
      case 'tab':
        return 'h-12 w-full bg-muted animate-pulse rounded';
      default:
        return 'h-4 w-full bg-muted animate-pulse rounded';
    }
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(getSkeletonClass(), className)}
        />
      ))}
    </div>
  );
};