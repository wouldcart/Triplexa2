
import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Metric } from '@/data/mockData';
import { LucideIcon } from 'lucide-react';

type IconName = keyof typeof Icons;

interface MetricCardProps {
  metric: Metric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const { title, value, change, icon } = metric;
  
  // Ensure we're accessing a valid icon component with proper type checking
  const IconComponent = (Icons[icon as IconName] as LucideIcon) || Icons.Activity;
  
  const isPositiveChange = change > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</h3>
          <div className={cn(
            "flex items-center mt-2 text-sm",
            isPositiveChange ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isPositiveChange ? (
              <Icons.TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <Icons.TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(change)}% vs last month</span>
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-full",
          title === "Revenue" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
          title === "Active Bookings" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
          title === "New Agents" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
          "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        )}>
          <IconComponent className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
