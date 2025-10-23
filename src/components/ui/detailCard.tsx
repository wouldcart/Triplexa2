
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DetailCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const DetailCard: React.FC<DetailCardProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default DetailCard;
