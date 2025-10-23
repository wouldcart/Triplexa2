import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
  compact?: boolean;
  touchOptimized?: boolean;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  className,
  headerAction,
  compact = false,
  touchOptimized = true,
  onClick
}) => {
  const isMobile = useIsMobile();

  const cardClasses = cn(
    "transition-all duration-200",
    touchOptimized && isMobile && "active:scale-[0.98] active:shadow-sm",
    onClick && "cursor-pointer hover:shadow-md",
    className
  );

  const contentPadding = compact 
    ? (isMobile ? "p-3" : "p-4")
    : (isMobile ? "p-4" : "p-6");

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(title || subtitle || headerAction) && (
        <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <CardTitle className={cn(
                  "truncate",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className={cn(
                  "text-muted-foreground mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={contentPadding}>
        {children}
      </CardContent>
    </Card>
  );
};

interface MobileListItemProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  children,
  title,
  subtitle,
  leftIcon,
  rightContent,
  className,
  onClick,
  disabled = false
}) => {
  const isMobile = useIsMobile();

  const itemClasses = cn(
    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
    "border border-border bg-card",
    !disabled && onClick && "cursor-pointer hover:bg-accent/50",
    !disabled && onClick && isMobile && "active:scale-[0.98] active:bg-accent",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <div className={itemClasses} onClick={!disabled ? onClick : undefined}>
      {leftIcon && (
        <div className="flex-shrink-0">
          {leftIcon}
        </div>
      )}
      
      <div className="min-w-0 flex-1">
        {title && (
          <div className={cn(
            "font-medium truncate",
            isMobile ? "text-sm" : "text-base"
          )}>
            {title}
          </div>
        )}
        {subtitle && (
          <div className={cn(
            "text-muted-foreground truncate",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {subtitle}
          </div>
        )}
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
      
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default MobileCard;