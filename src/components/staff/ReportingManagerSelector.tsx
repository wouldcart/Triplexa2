
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Users } from 'lucide-react';
import { useReportingManagers } from '@/hooks/useReportingManagers';

interface ReportingManagerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  excludeId?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

const ReportingManagerSelector: React.FC<ReportingManagerSelectorProps> = ({
  value,
  onChange,
  excludeId,
  label = "Reporting Manager",
  placeholder = "Select reporting manager...",
  error
}) => {
  const reportingManagers = useReportingManagers(excludeId);

  const selectedManager = reportingManagers.find(manager => manager.id === value);

  const handleValueChange = (newValue: string) => {
    // Convert "none" back to empty string for the form
    onChange(newValue === "none" ? "" : newValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      
      <Select value={value || "none"} onValueChange={handleValueChange}>
        <SelectTrigger className="h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <SelectItem value="none" className="text-gray-900 dark:text-gray-100">
            <span className="text-gray-500 dark:text-gray-400">No reporting manager</span>
          </SelectItem>
          {reportingManagers.map(manager => (
            <SelectItem key={manager.id} value={manager.id} className="text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <User className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{manager.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{manager.role}</span>
                    <span>•</span>
                    <span>{manager.department}</span>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
          {reportingManagers.length === 0 && (
            <SelectItem value="no-managers" disabled className="text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>No managers available</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {selectedManager && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Badge variant="secondary" className="text-xs">
            {selectedManager.role} - {selectedManager.department}
          </Badge>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ReportingManagerSelector;
