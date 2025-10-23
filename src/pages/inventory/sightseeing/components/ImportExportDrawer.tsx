
import React, { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sightseeing } from '@/types/sightseeing';

interface ImportExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Sightseeing[];
  onExport: () => void;
  onImport: (importedData: Sightseeing[]) => void;
}

const ImportExportDrawer: React.FC<ImportExportDrawerProps> = ({
  open,
  onOpenChange,
  data,
  onExport,
  onImport
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('export');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const handleExport = async () => {
    try {
      onExport();
      toast({
        title: "Export successful",
        description: "Sightseeings data has been exported successfully",
      });
    } catch (error) {
      console.error('Error exporting sightseeings:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting sightseeings",
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
      const text = await file.text();
      const importedData = JSON.parse(text) as Sightseeing[];
      
      if (Array.isArray(importedData) && importedData.length > 0) {
        onImport(importedData);
        setImportStatus('success');
        setImportMessage(`Successfully imported ${importedData.length} sightseeings.`);
        
        toast({
          title: "Import successful",
          description: `Imported ${importedData.length} sightseeings`,
        });
      } else {
        setImportStatus('error');
        setImportMessage('No valid sightseeing data found in the import file.');
        
        toast({
          title: "Import warning",
          description: "No valid sightseeing data found in the import file",
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
          <SheetTitle>Import / Export Sightseeings</SheetTitle>
          <SheetDescription>
            Import sightseeings from JSON or export your current sightseeings data.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="export" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Export Sightseeings</h3>
              <p className="text-sm text-muted-foreground">
                Download your sightseeings data as a JSON file. The export will include all sightseeing data and can be used for backup or bulk editing.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 mt-6">
              <div className="border rounded-md p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Export Options</h4>
                <div className="flex items-center justify-between text-sm">
                  <span>Total sightseeings to export:</span>
                  <span className="font-medium">{data.length}</span>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleExport}
                disabled={data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to JSON
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Import Sightseeings</h3>
              <p className="text-sm text-muted-foreground">
                Upload a JSON file to import sightseeing data. The file should follow the export format.
              </p>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Import Requirements</h4>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li>File must be in .json format</li>
                <li>Required fields: name, country, city, status</li>
                <li>Optional: description, category, pricing, etc.</li>
                <li>Download a template by exporting first</li>
              </ul>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            
            <Button 
              className="w-full"
              onClick={triggerFileInput}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing...' : 'Select JSON File'}
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
