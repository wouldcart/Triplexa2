
import React from 'react';
import { cn } from '@/lib/utils';
import { Alert } from '@/data/mockData';
import { AlertTriangle, Info } from 'lucide-react';

interface AlertsListProps {
  alerts: Alert[];
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getAlertClass = (type: string): string => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alerts</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={cn(
              "p-4 rounded-lg border flex",
              getAlertClass(alert.type)
            )}
          >
            <div className="mr-3 flex-shrink-0">
              {getAlertIcon(alert.type)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
              {alert.details && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{alert.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsList;
