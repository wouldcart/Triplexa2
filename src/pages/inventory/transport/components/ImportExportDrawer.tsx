import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TransportRoute } from '../types/transportTypes';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbolByCountry } from '../utils/currencyUtils';
import { DownloadCloud, Upload, FileSpreadsheet, AlertTriangle, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ImportExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (routes: TransportRoute[]) => void;
  currentRoutes: TransportRoute[];
}

interface ExportField {
  id: string;
  name: string;
  selected: boolean;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  level: 'error' | 'warning';
}

const ImportExportDrawer: React.FC<ImportExportDrawerProps> = ({
  isOpen,
  onClose,
  onImport,
  currentRoutes,
}) => {
  // Basic state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>('import');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  // Advanced import options
  const [importMode, setImportMode] = useState<'add' | 'replace' | 'update'>('add');
  const [validateBeforeImport, setValidateBeforeImport] = useState(true);
  const [continueOnError, setContinueOnError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [hasPreviewedData, setHasPreviewedData] = useState(false);

  // Advanced export options
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [splitByCountry, setSplitByCountry] = useState(false);
  const [exportCompressed, setExportCompressed] = useState(false);
  const [exportFields, setExportFields] = useState<ExportField[]>([
    { id: 'id', name: 'ID', selected: true },
    { id: 'code', name: 'Code', selected: true },
    { id: 'name', name: 'Name', selected: true },
    { id: 'country', name: 'Country', selected: true },
    { id: 'currency', name: 'Currency', selected: true },
    { id: 'transferType', name: 'Transfer Type', selected: true },
    { id: 'startLocation', name: 'Start Location', selected: true },
    { id: 'endLocation', name: 'End Location', selected: true },
    { id: 'intermediateStops', name: 'Intermediate Stops', selected: true },
    { id: 'transportTypes', name: 'Transport Types', selected: true },
    { id: 'enableSightseeing', name: 'Enable Sightseeing', selected: true },
    { id: 'sightseeingOptions', name: 'Sightseeing Options', selected: true },
    { id: 'status', name: 'Status', selected: true },
    { id: 'price', name: 'Price', selected: true },
    { id: 'distance', name: 'Distance', selected: true },
    { id: 'duration', name: 'Duration', selected: true },
    { id: 'description', name: 'Description', selected: true },
  ]);

  const resetState = () => {
    setFile(null);
    setImporting(false);
    setExporting(false);
    setImportProgress(0);
    setExportProgress(0);
    setValidationErrors([]);
    setPreviewData([]);
    setHasPreviewedData(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Reset state when a new file is selected
      setValidationErrors([]);
      setPreviewData([]);
      setHasPreviewedData(false);
    }
  };

  // Preview data before import
  const handlePreviewData = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to preview",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      // Show only first 10 rows in preview
      setPreviewData(jsonData.slice(0, 10));
      setHasPreviewedData(true);

      // Validate data
      if (validateBeforeImport) {
        const errors = validateImportData(jsonData);
        setValidationErrors(errors);
      }

    } catch (error) {
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const validateImportData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      // Required fields validation
      if (!row.code) {
        errors.push({
          row: index + 1,
          field: 'code',
          message: 'Route code is required',
          level: 'error'
        });
      }
      
      if (!row.name) {
        errors.push({
          row: index + 1,
          field: 'name',
          message: 'Route name is required',
          level: 'error'
        });
      }
      
      if (!row.country) {
        errors.push({
          row: index + 1,
          field: 'country',
          message: 'Country is required',
          level: 'warning'
        });
      }

      // Check for required locations
      if (!row.startLocation) {
        errors.push({
          row: index + 1,
          field: 'startLocation',
          message: 'Start location is required',
          level: 'error'
        });
      }
      
      if (!row.endLocation) {
        errors.push({
          row: index + 1,
          field: 'endLocation',
          message: 'End location is required',
          level: 'error'
        });
      }
      
      // Type validation
      if (row.price && isNaN(parseFloat(row.price))) {
        errors.push({
          row: index + 1,
          field: 'price',
          message: 'Price must be a number',
          level: 'error'
        });
      }
      
      if (row.distance && isNaN(parseFloat(row.distance))) {
        errors.push({
          row: index + 1,
          field: 'distance',
          message: 'Distance must be a number',
          level: 'error'
        });
      }

      // JSON data validation
      const jsonFields = ['transportTypes', 'intermediateStops', 'sightseeingOptions'];
      
      jsonFields.forEach(field => {
        if (row[field] && typeof row[field] === 'string') {
          try {
            JSON.parse(row[field]);
          } catch (e) {
            errors.push({
              row: index + 1,
              field,
              message: `Invalid JSON format in ${field}`,
              level: 'error'
            });
          }
        }
      });

      // Check for valid transfer type
      const validTransferTypes = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route', 'Private', 'Shared'];
      if (row.transferType && !validTransferTypes.includes(row.transferType)) {
        errors.push({
          row: index + 1,
          field: 'transferType',
          message: `Invalid transfer type. Must be one of: ${validTransferTypes.join(', ')}`,
          level: 'warning'
        });
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    // If validation is required and we haven't previewed the data yet
    if (validateBeforeImport && !hasPreviewedData) {
      toast({
        title: "Preview Required",
        description: "Please preview the data before importing to validate it",
        variant: "destructive",
      });
      return;
    }

    // Check for critical errors
    if (validateBeforeImport) {
      const criticalErrors = validationErrors.filter(e => e.level === 'error');
      if (criticalErrors.length > 0 && !continueOnError) {
        toast({
          title: "Validation Failed",
          description: `Found ${criticalErrors.length} critical errors. Please fix them or enable 'Continue on Error'`,
          variant: "destructive",
        });
        return;
      }
    }

    setImporting(true);
    setImportProgress(0);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      // Process in batches of 50 for smoother progress indicator
      const batchSize = 50;
      const batches = Math.ceil(jsonData.length / batchSize);
      
      // Array to collect all imported routes
      let importedRoutes: TransportRoute[] = [];
      let skippedRows = 0;

      // Process each batch
      for (let i = 0; i < batches; i++) {
        const startIdx = i * batchSize;
        const endIdx = Math.min((i + 1) * batchSize, jsonData.length);
        const batch = jsonData.slice(startIdx, endIdx);
        
        // Process each row in the batch
        const batchResults = batch.map((row: any, rowIdx: number) => {
          const absoluteRowIdx = startIdx + rowIdx;
          
          // Skip rows with critical errors if validation is enabled
          if (validateBeforeImport && !continueOnError) {
            const rowErrors = validationErrors.filter(
              e => e.row === absoluteRowIdx + 1 && e.level === 'error'
            );
            if (rowErrors.length > 0) {
              skippedRows++;
              return null;
            }
          }

          // Basic validation even if full validation is disabled
          if (!row.code || !row.name || !row.startLocation || !row.endLocation) {
            skippedRows++;
            return null;
          }

          // Process transport types
          let transportTypes = [];
          if (row.transportTypes) {
            try {
              transportTypes = typeof row.transportTypes === 'string' 
                ? JSON.parse(row.transportTypes) 
                : row.transportTypes;
            } catch (e) {
              transportTypes = [{
                id: `auto-${Date.now()}-${absoluteRowIdx}`,
                type: row.transportType || 'Standard',
                seatingCapacity: 4,
                luggageCapacity: 2,
                duration: row.duration || '00:00',
                price: row.price || 0
              }];
            }
          } else {
            transportTypes = [{
              id: `auto-${Date.now()}-${absoluteRowIdx}`,
              type: row.transportType || 'Standard',
              seatingCapacity: 4,
              luggageCapacity: 2,
              duration: row.duration || '00:00',
              price: row.price || 0
            }];
          }

          // Process intermediate stops
          let intermediateStops = [];
          if (row.intermediateStops) {
            try {
              intermediateStops = typeof row.intermediateStops === 'string' 
                ? JSON.parse(row.intermediateStops) 
                : row.intermediateStops;
            } catch (e) {
              intermediateStops = [];
            }
          }

          // Determine status
          let status: 'active' | 'inactive' | boolean;
          if (typeof row.status === 'string') {
            status = row.status === 'active' ? 'active' : 'inactive';
          } else if (typeof row.status === 'boolean') {
            status = row.status;
          } else {
            status = 'active'; // Default to active
          }

          // Create the route object
          return {
            id: row.id || `imported-${Date.now()}-${absoluteRowIdx}`,
            code: row.code,
            name: row.name,
            country: row.country || '',
            transferType: row.transferType || 'One-Way',
            startLocation: row.startLocation,
            startLocationFullName: row.startLocationFullName || row.startLocation,
            endLocation: row.endLocation,
            endLocationFullName: row.endLocationFullName || row.endLocation,
            intermediateStops: intermediateStops,
            transportTypes: transportTypes,
            enableSightseeing: Boolean(row.enableSightseeing),
            sightseeingOptions: row.sightseeingOptions ? (
              typeof row.sightseeingOptions === 'string' 
                ? JSON.parse(row.sightseeingOptions) 
                : row.sightseeingOptions
            ) : null,
            status: status,
            routePath: row.routePath ? (
              typeof row.routePath === 'string' 
                ? row.routePath.split(',') 
                : row.routePath
            ) : undefined,
            description: row.description || '',
            distance: row.distance ? Number(row.distance) : 0,
            duration: row.duration || '',
            price: row.price ? Number(row.price) : 0,
            routeSegments: row.routeSegments ? (
              typeof row.routeSegments === 'string'
                ? JSON.parse(row.routeSegments)
                : row.routeSegments
            ) : []
          } as TransportRoute;
        }).filter(Boolean); // Remove null entries (skipped rows)
        
        // Add batch results to imported routes
        importedRoutes = [...importedRoutes, ...batchResults];
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / batches) * 100));
        
        // Small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Handle different import modes
      if (importMode === 'replace') {
        // Replace all routes
        onImport(importedRoutes);
      } else if (importMode === 'update') {
        // Update existing routes and add new ones
        const currentIds = new Set(currentRoutes.map(r => r.id));
        const updatedRoutes = [...currentRoutes];
        
        // Update existing routes
        importedRoutes.forEach(newRoute => {
          const existingIndex = updatedRoutes.findIndex(r => r.id === newRoute.id);
          if (existingIndex >= 0) {
            updatedRoutes[existingIndex] = newRoute;
          } else {
            updatedRoutes.push(newRoute);
          }
        });
        
        onImport(updatedRoutes);
      } else {
        // Add mode (default) - just append
        onImport(importedRoutes);
      }

      toast({
        title: "Import Successful",
        description: `${importedRoutes.length} routes imported, ${skippedRows} rows skipped.`,
        variant: "success",
      });
      
      setTimeout(() => {
        resetState();
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  const handleToggleField = (id: string) => {
    setExportFields(exportFields.map(field => 
      field.id === id ? { ...field, selected: !field.selected } : field
    ));
  };

  const handleExport = async () => {
    if (currentRoutes.length === 0) {
      toast({
        title: "Export Failed",
        description: "No routes available to export",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    setExportProgress(0);
    
    try {
      // Get selected export fields
      const selectedFields = exportFields.filter(f => f.selected).map(f => f.id);
      
      // Filter routes if not including inactive
      const routesToExport = includeInactive 
        ? currentRoutes 
        : currentRoutes.filter(route => 
            route.status === 'active' || route.status === true
          );
      
      // Prepare data for export
      let preparedData: any[] = [];
      const totalRoutes = routesToExport.length;
      
      // Handle split by country if needed
      const countries = splitByCountry 
        ? [...new Set(routesToExport.map(route => route.country))]
        : ['allCountries'];
      
      const workbook = XLSX.utils.book_new();
      
      // Process in batches
      for (let countryIndex = 0; countryIndex < countries.length; countryIndex++) {
        const country = countries[countryIndex];
        
        const countryData = country === 'allCountries'
          ? routesToExport
          : routesToExport.filter(route => route.country === country);
          
        preparedData = countryData.map((route, index) => {
          // Create object with only selected fields
          const exportObj: any = {};
          
          // Add selected fields
          selectedFields.forEach(field => {
            if (field === 'currency') {
              exportObj[field] = getCurrencySymbolByCountry(route.country);
            } else if (field === 'transportTypes' || field === 'intermediateStops' || 
                      field === 'sightseeingOptions' || field === 'routeSegments') {
              exportObj[field] = JSON.stringify(route[field] || []);
            } else if (field === 'routePath' && route.routePath) {
              exportObj[field] = route.routePath.join(',');
            } else {
              // @ts-ignore - dynamic field access
              exportObj[field] = route[field];
            }
          });
          
          // Update progress periodically
          if (index % 20 === 0) {
            const progress = Math.round(((countryIndex / countries.length) + 
              ((index / countryData.length) * (1 / countries.length))) * 100);
            setExportProgress(progress);
          }
          
          return exportObj;
        });
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(preparedData);
        
        // Add worksheet to workbook
        const sheetName = country === 'allCountries' ? 'TransportRoutes' : country.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
      
      // Generate file based on selected format
      let data;
      let filename = `transport-routes-export-${new Date().toISOString().slice(0, 10)}`;
      
      if (exportFormat === 'xlsx') {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename += '.xlsx';
      } else if (exportFormat === 'csv') {
        // For CSV, we only use the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const csvOutput = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
        data = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        filename += '.csv';
      } else if (exportFormat === 'json') {
        // For JSON, combine data from all sheets
        let jsonData: any[] = [];
        workbook.SheetNames.forEach(sheetName => {
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          jsonData = [...jsonData, ...sheetData];
        });
        data = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        filename += '.json';
      }
      
      // Save the file
      saveAs(data, filename);
      
      toast({
        title: "Export Successful",
        description: `${totalRoutes} routes have been exported as ${exportFormat.toUpperCase()}.`,
        variant: "success",
      });
      
      // Complete progress and reset
      setExportProgress(100);
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setExporting(false);
      setExportProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code: "SAMPLE-001",
        name: "Sample Route 1",
        country: "Thailand",
        transferType: "One-Way",
        startLocation: "BKK",
        startLocationFullName: "Bangkok Airport",
        endLocation: "CITY",
        endLocationFullName: "Bangkok City Center",
        intermediateStops: JSON.stringify([
          { id: "stop1", locationCode: "STOP1", fullName: "Sample Stop 1" }
        ]),
        transportTypes: JSON.stringify([
          { id: "type1", type: "Sedan", seatingCapacity: 3, luggageCapacity: 2, duration: "01:30", price: 1200 }
        ]),
        enableSightseeing: true,
        status: "active",
        distance: 35,
        duration: "01:30",
        description: "Sample route description"
      },
      {
        code: "SAMPLE-002",
        name: "Sample Route 2",
        country: "UAE",
        transferType: "Round-Trip",
        startLocation: "DXB",
        startLocationFullName: "Dubai Airport",
        endLocation: "PALM",
        endLocationFullName: "Palm Jumeirah",
        intermediateStops: JSON.stringify([]),
        transportTypes: JSON.stringify([
          { id: "type1", type: "SUV", seatingCapacity: 5, luggageCapacity: 4, duration: "00:45", price: 250 }
        ]),
        enableSightseeing: false,
        status: "active",
        distance: 30,
        duration: "00:45",
        description: "Sample round trip route"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `transport-routes-template-${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to prepare your import data.",
    });
  };

  const getValidationSummary = () => {
    if (!validationErrors.length) return null;
    
    const errorCount = validationErrors.filter(e => e.level === 'error').length;
    const warningCount = validationErrors.filter(e => e.level === 'warning').length;
    
    return (
      <div className="my-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-medium mb-2">Validation Summary</h3>
        <div className="flex gap-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            <span>{errorCount} {errorCount === 1 ? 'error' : 'errors'}</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
            <span>{warningCount} {warningCount === 1 ? 'warning' : 'warnings'}</span>
          </div>
        </div>
        
        {validationErrors.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-2 py-1 text-left">Row</th>
                  <th className="px-2 py-1 text-left">Field</th>
                  <th className="px-2 py-1 text-left">Issue</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.slice(0, 5).map((error, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{error.row}</td>
                    <td className="px-2 py-1">{error.field}</td>
                    <td className="px-2 py-1 flex items-center">
                      {error.level === 'error' ? (
                        <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                      )}
                      {error.message}
                    </td>
                  </tr>
                ))}
                {validationErrors.length > 5 && (
                  <tr>
                    <td colSpan={3} className="px-2 py-1 text-center text-gray-500">
                      And {validationErrors.length - 5} more issues...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import/Export Transport Routes</SheetTitle>
          <SheetDescription>
            Advanced tools to import routes from Excel or export routes to various formats
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Routes</TabsTrigger>
            <TabsTrigger value="export">Export Routes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="importFile">Select File</Label>
              <div className="flex gap-2">
                <Input
                  id="importFile"
                  type="file"
                  accept=".xlsx, .xls, .csv, .json"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="flex-1"
                  disabled={importing}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={importing}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Import Mode</Label>
                <Select
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as 'add' | 'replace' | 'update')}
                  disabled={importing}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select import mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add (Append new routes)</SelectItem>
                    <SelectItem value="replace">Replace (Clear all existing routes)</SelectItem>
                    <SelectItem value="update">Update (Update existing & add new)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How to handle existing routes
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="validateImport">Validate Before Import</Label>
                    <p className="text-xs text-muted-foreground">
                      Check data for errors before importing
                    </p>
                  </div>
                  <Switch
                    id="validateImport"
                    checked={validateBeforeImport}
                    onCheckedChange={setValidateBeforeImport}
                    disabled={importing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="continueOnError">Continue on Error</Label>
                    <p className="text-xs text-muted-foreground">
                      Import valid rows even if errors exist
                    </p>
                  </div>
                  <Switch
                    id="continueOnError"
                    checked={continueOnError}
                    onCheckedChange={setContinueOnError}
                    disabled={importing || !validateBeforeImport}
                  />
                </div>
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Data Preview (First 10 rows)</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {Object.keys(previewData[0]).slice(0, 8).map((key, i) => (
                          <th key={i} className="px-2 py-1 text-left text-xs">{key}</th>
                        ))}
                        {Object.keys(previewData[0]).length > 8 && (
                          <th className="px-2 py-1 text-left text-xs">
                            +{Object.keys(previewData[0]).length - 8} more fields
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.entries(row).slice(0, 8).map(([key, value], j) => (
                            <td key={j} className="px-2 py-1 text-xs truncate max-w-[100px]">
                              {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50)}
                            </td>
                          ))}
                          {Object.keys(row).length > 8 && (
                            <td className="px-2 py-1 text-xs text-gray-500">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {getValidationSummary()}

            {importing && (
              <div className="mt-4 space-y-2">
                <Label>Import Progress</Label>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {importProgress}% Complete
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button 
                variant="outline"
                onClick={handlePreviewData}
                disabled={!file || importing}
              >
                Preview Data
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                >
                  {importing ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-pulse" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Routes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Export Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) => setExportFormat(value as 'xlsx' | 'csv' | 'json')}
                  disabled={exporting}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="includeInactive">Include Inactive Routes</Label>
                    <p className="text-xs text-muted-foreground">
                      Export disabled/inactive routes
                    </p>
                  </div>
                  <Switch
                    id="includeInactive"
                    checked={includeInactive}
                    onCheckedChange={setIncludeInactive}
                    disabled={exporting}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="splitByCountry">Split By Country</Label>
                    <p className="text-xs text-muted-foreground">
                      Create separate sheets for each country
                    </p>
                  </div>
                  <Switch
                    id="splitByCountry"
                    checked={splitByCountry}
                    onCheckedChange={setSplitByCountry}
                    disabled={exporting || exportFormat !== 'xlsx'}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Select Fields to Export</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {exportFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`field-${field.id}`}
                      checked={field.selected}
                      onCheckedChange={() => handleToggleField(field.id)}
                      disabled={exporting}
                    />
                    <Label htmlFor={`field-${field.id}`} className="text-sm">
                      {field.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Export Summary</Label>
              <div className="border rounded-md p-3 mt-1.5 bg-gray-50 dark:bg-gray-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total routes to export</span>
                  <Badge variant="secondary">
                    {includeInactive 
                      ? currentRoutes.length
                      : currentRoutes.filter(r => r.status === 'active' || r.status === true).length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Format</span>
                  <Badge variant="outline">
                    {exportFormat === 'xlsx' ? 'Excel' : exportFormat.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fields selected</span>
                  <Badge variant="secondary">
                    {exportFields.filter(f => f.selected).length} / {exportFields.length}
                  </Badge>
                </div>
              </div>
            </div>

            {exporting && (
              <div className="space-y-2">
                <Label>Export Progress</Label>
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {exportProgress}% Complete
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={
                  exporting || 
                  currentRoutes.length === 0 ||
                  exportFields.filter(f => f.selected).length === 0
                }
              >
                {exporting ? (
                  <>
                    <DownloadCloud className="mr-2 h-4 w-4 animate-pulse" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Export Routes
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4 flex justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            <p>
              {currentRoutes.length} {currentRoutes.length === 1 ? 'route' : 'routes'} available
            </p>
          </div>
          <Button variant="outline" onClick={onClose} disabled={importing || exporting}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ImportExportDrawer;
