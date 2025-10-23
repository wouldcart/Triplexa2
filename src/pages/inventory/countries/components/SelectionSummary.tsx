import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckSquare, Square, Download, EyeOff } from 'lucide-react';
import { Country } from '../types/country';

interface SelectionSummaryProps {
  selectedCountries: string[];
  countries: Country[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  onExportSelected?: () => void;
  onRemoveFromUI?: () => void;
  className?: string;
}

const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  selectedCountries,
  countries,
  onClearSelection,
  onSelectAll,
  onExportSelected,
  onRemoveFromUI,
  className = ''
}) => {
  const selectedCount = selectedCountries.length;
  const totalCount = countries.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  if (selectedCount === 0) {
    return null;
  }

  const selectedCountryObjects = countries.filter(country => 
    selectedCountries.includes(country.id)
  );

  const activeSelected = selectedCountryObjects.filter(c => c.status === 'active').length;
  const inactiveSelected = selectedCountryObjects.filter(c => c.status === 'inactive').length;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {selectedCount} of {totalCount} selected
                </span>
                {isAllSelected && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    All
                  </Badge>
                )}
                {isPartiallySelected && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                    Partial
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {activeSelected > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {activeSelected} active
                  </span>
                )}
                {inactiveSelected > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {inactiveSelected} inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExportSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelected}
              className="border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
            >
              <Download className="w-4 h-4 mr-1" />
              Export Selected
            </Button>
          )}
          {onRemoveFromUI && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveFromUI}
              className="border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50"
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Remove from UI
            </Button>
          )}
          {!isAllSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              <Square className="w-4 h-4 mr-1" />
              Select All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;