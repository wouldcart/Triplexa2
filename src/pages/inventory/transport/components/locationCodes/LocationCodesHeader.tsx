
import React from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationCodesHeaderProps {
  onAddClick: () => void;
  onImportSampleData?: () => void;
  showImportButton?: boolean;
}

const LocationCodesHeader: React.FC<LocationCodesHeaderProps> = ({ 
  onAddClick, 
  onImportSampleData,
  showImportButton = false 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-xl font-bold">Location Codes Management</h2>
        <p className="text-sm text-muted-foreground">Manage short codes and full names for locations used across the system.</p>
      </div>
      <div className="flex gap-2">
        {showImportButton && onImportSampleData && (
          <Button 
            variant="outline"
            onClick={onImportSampleData}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" /> Import Sample Data
          </Button>
        )}
        <Button 
          onClick={onAddClick}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Code
        </Button>
      </div>
    </div>
  );
};

export default LocationCodesHeader;
