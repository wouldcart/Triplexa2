
import React, { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '../types/restaurantTypes';
import { useRestaurantImportExport } from '../hooks/useRestaurantImportExport';

interface ImportExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  saveRestaurants: (restaurants: Restaurant[]) => Promise<boolean>;
  setRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  onImportComplete?: () => void;
}

const ImportExportDrawer: React.FC<ImportExportDrawerProps> = ({
  open,
  onOpenChange,
  restaurants,
  filteredRestaurants,
  saveRestaurants,
  setRestaurants,
  onImportComplete
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('export');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const { importRestaurants, exportRestaurants } = useRestaurantImportExport(
    restaurants,
    filteredRestaurants, 
    setRestaurants,
    saveRestaurants
  );

  const handleExport = async () => {
    try {
      const success = await exportRestaurants();
      if (success) {
        toast({
          title: "Export successful",
          description: "Restaurants data has been exported to Excel",
        });
      }
    } catch (error) {
      console.error('Error exporting restaurants:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting restaurants",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('idle');
    setImportMessage('');

    try {
      const result = await importRestaurants(file);
      if (result && result.length > 0) {
        setImportStatus('success');
        setImportMessage(`Successfully imported ${result.length} restaurants.`);
        
        if (onImportComplete) {
          onImportComplete();
        }
        
        toast({
          title: "Import successful",
          description: `Imported ${result.length} restaurants`,
        });
      } else {
        setImportStatus('error');
        setImportMessage('No valid restaurant data found in the import file.');
        
        toast({
          title: "Import warning",
          description: "No valid restaurant data found in the import file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Unknown error during import');
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : 'Unknown error during import',
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle>Import / Export Restaurants</SheetTitle>
          <SheetDescription>
            Import restaurants from Excel or export your current restaurants data.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="export" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Export Restaurants</h3>
              <p className="text-sm text-muted-foreground">
                Download your restaurants data as an Excel file. The export will include all restaurant data and can be used for backup or bulk editing.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 mt-6">
              <div className="border rounded-md p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Export Options</h4>
                <div className="flex items-center justify-between text-sm">
                  <span>Total restaurants to export:</span>
                  <span className="font-medium">{filteredRestaurants.length}</span>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleExport}
                disabled={filteredRestaurants.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Import Restaurants</h3>
              <p className="text-sm text-muted-foreground">
                Upload an Excel file to import restaurant data. The file should follow the export format.
              </p>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Import Requirements</h4>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li>File must be in .xlsx format</li>
                <li>Required columns: Restaurant Name, City, Country, Cuisine Types</li>
                <li>Optional: Description, Price Category, Rating, etc.</li>
                <li>Download a template by exporting first</li>
              </ul>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx"
              className="hidden"
            />
            
            <Button 
              className="w-full"
              onClick={triggerFileInput}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing...' : 'Select Excel File'}
            </Button>
            
            {importStatus !== 'idle' && (
              <Alert variant={importStatus === 'success' ? 'default' : 'destructive'}>
                {importStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ImportExportDrawer;
