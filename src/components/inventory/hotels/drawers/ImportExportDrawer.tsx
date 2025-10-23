import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSupabaseHotelImportExport } from '../hooks/useSupabaseHotelImportExport';
import GoogleHotelImporter from '../components/GoogleHotelImporter';

interface ImportExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportExportDrawer: React.FC<ImportExportDrawerProps> = ({ open, onOpenChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { 
    importHotelsFromExcel, 
    exportHotelsToExcel, 
    isImporting, 
    isExporting 
  } = useSupabaseHotelImportExport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an Excel file to import.",
      });
      return;
    }

    try {
      const statistics = await importHotelsFromExcel(file);
      
      if (statistics.successful > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${statistics.successful} hotels with their room types. ${statistics.failed > 0 ? `${statistics.failed} failed.` : ''}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: `Failed to import any hotels. ${statistics.errors.length > 0 ? statistics.errors[0].message : 'Please check the file format.'}`,
        });
      }
      
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import. Please try again.",
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportHotelsToExcel();
      toast({
        title: "Export successful",
        description: "Hotel data has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export. Please try again.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import/Export Hotels</SheetTitle>
          <SheetDescription>
            Import hotels from Excel, Google search, or export current hotels to Excel.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="export" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import Excel</TabsTrigger>
            <TabsTrigger value="google">Import Google</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Export Options</h3>
                <p className="text-sm text-muted-foreground">
                  This will export all hotels matching your current filters including complete room type details.
                </p>
              </div>
              
              <Button 
                onClick={handleExport} 
                className="w-full"
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Hotels to Excel"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Import from Excel</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an Excel file with hotel data. The file should have a 'Hotels' sheet and optionally a 'RoomTypes' sheet to import complete hotel details.
                </p>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="hotel-import">Excel File</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="hotel-import"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                </div>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>
              
              <Separator />
              
              <Button 
                onClick={handleImport} 
                className="w-full"
                disabled={!file || isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import Hotels"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="google" className="py-4 space-y-4">
            <GoogleHotelImporter onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ImportExportDrawer;
