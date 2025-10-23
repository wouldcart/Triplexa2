import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download, XCircle, Info, Settings, Play, Square, RotateCcw, Eye, TrendingUp, Clock, Users, Database, FileCheck, AlertCircle } from 'lucide-react';
import { useAdvancedCountryImport, ImportOptions } from '../hooks/useAdvancedCountryImport';
import { useToast } from '@/hooks/use-toast';

interface AdvancedCountryImportProps {
  refreshCountries?: () => Promise<void>;
  trigger?: React.ReactNode;
}

const AdvancedCountryImport: React.FC<AdvancedCountryImportProps> = ({
  refreshCountries,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  const {
    isImporting,
    importProgress,
    importStatistics,
    processedData,
    validationErrors,
    importOptions,
    fileInputRef,
    handleFileImport,
    executeImport,
    cancelImport,
    resetImport,
    setImportOptions,
    hasValidData,
    canExecuteImport,
    hasErrors,
    hasWarnings
  } = useAdvancedCountryImport({
    refreshCountries,
    toast,
    onImportComplete: (stats) => {
      toast({
        title: "Import Completed Successfully",
        description: `Imported ${stats.processedRecords} countries successfully.`,
      });
      setActiveTab('results');
    },
    onImportError: (error) => {
      toast({
        title: "Import Failed",
        description: error,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
      setActiveTab('validation');
    }
  };

  const handleOptionsChange = (key: keyof ImportOptions, value: any) => {
    setImportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const downloadTemplate = () => {
    const headers = [
      'name',
      'code',
      'continent',
      'region',
      'currency',
      'currency_symbol',
      'status',
      'flag_url',
      'is_popular',
      'visa_required',
      'pricing_currency_override',
      'pricing_currency'
    ];

    const sampleData = [
      [
        'United States',
        'US',
        'North America',
        'Northern America',
        'USD',
        '$',
        'active',
        'https://flagcdn.com/us.svg',
        'true',
        'false',
        'false',
        ''
      ],
      [
        'United Kingdom',
        'GB',
        'Europe',
        'Northern Europe',
        'GBP',
        '£',
        'active',
        'https://flagcdn.com/gb.svg',
        'true',
        'false',
        'false',
        ''
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'countries-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getErrorIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'parsing':
        return <FileText className="h-4 w-4" />;
      case 'validating':
        return <FileCheck className="h-4 w-4" />;
      case 'processing':
        return <Database className="h-4 w-4" />;
      case 'saving':
        return <Upload className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const StatCard = ({ title, value, icon, description, color = "default" }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    description?: string;
    color?: "default" | "green" | "red" | "yellow" | "blue";
  }) => {
    const colorClasses = {
      default: "border-gray-200",
      green: "border-green-200 bg-green-50",
      red: "border-red-200 bg-red-50",
      yellow: "border-yellow-200 bg-yellow-50",
      blue: "border-blue-200 bg-blue-50"
    };

    return (
      <Card className={`${colorClasses[color]}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Advanced Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Advanced Country Import
          </DialogTitle>
          <DialogDescription>
            Import countries from CSV or Excel files with advanced validation and processing options.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2" disabled={!hasValidData && processedData.length === 0}>
              <FileCheck className="h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={importProgress.stage !== 'completed'}>
              <TrendingUp className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload File
                  </CardTitle>
                  <CardDescription>
                    Select a CSV or Excel file containing country data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Choose a file to upload
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports CSV and Excel files up to 10MB
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Select File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {isImporting && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStageIcon(importProgress.stage)}
                          <span className="text-sm font-medium">
                            {importProgress.currentStep}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelImport}
                          className="gap-2"
                        >
                          <Square className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                      <Progress value={importProgress.percentage} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{importProgress.recordsProcessed} of {importProgress.totalRecords} records</span>
                        <span>{importProgress.percentage}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Template & Guidelines
                  </CardTitle>
                  <CardDescription>
                    Download template and review import guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV Template
                  </Button>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Required Fields:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• <strong>name:</strong> Country name (2-100 characters)</li>
                      <li>• <strong>code:</strong> 2-letter ISO country code (e.g., US, GB)</li>
                      <li>• <strong>continent:</strong> Continent name</li>
                      <li>• <strong>region:</strong> Geographic region</li>
                      <li>• <strong>currency:</strong> 3-letter currency code (e.g., USD)</li>
                      <li>• <strong>currency_symbol:</strong> Currency symbol (e.g., $)</li>
                      <li>• <strong>status:</strong> active or inactive</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Optional Fields:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• <strong>flag_url:</strong> URL to flag image</li>
                      <li>• <strong>is_popular:</strong> true/false</li>
                      <li>• <strong>visa_required:</strong> true/false</li>
                      <li>• <strong>pricing_currency_override:</strong> true/false</li>
                      <li>• <strong>pricing_currency:</strong> Override currency code</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            {processedData.length > 0 && (
              <>
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Records"
                    value={importStatistics.totalRecords}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                  />
                  <StatCard
                    title="Valid Records"
                    value={importStatistics.validRecords}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="green"
                  />
                  <StatCard
                    title="Invalid Records"
                    value={importStatistics.invalidRecords}
                    icon={<XCircle className="h-5 w-5" />}
                    color="red"
                  />
                  <StatCard
                    title="Duplicates"
                    value={importStatistics.duplicateRecords}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="yellow"
                  />
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Validation Issues ({validationErrors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {validationErrors.map((error, index) => (
                            <Alert key={index} className={`
                              ${error.severity === 'error' ? 'border-red-500/50 bg-red-500/10 dark:border-red-400/50 dark:bg-red-400/10' : ''}
                              ${error.severity === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 dark:border-yellow-400/50 dark:bg-yellow-400/10' : ''}
                              ${error.severity === 'info' ? 'border-blue-500/50 bg-blue-500/10 dark:border-blue-400/50 dark:bg-blue-400/10' : ''}
                            `}>
                              <div className="flex items-start gap-2">
                                {getErrorIcon(error.severity)}
                                <div className="flex-1">
                                  <AlertDescription>
                                    <strong>Row {error.row}, {error.field}:</strong> {error.message}
                                    {error.suggestion && (
                                      <div className="text-xs mt-1 text-muted-foreground">
                                        💡 {error.suggestion}
                                      </div>
                                    )}
                                  </AlertDescription>
                                </div>
                              </div>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Data Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Data Preview
                    </CardTitle>
                    <CardDescription>
                      Preview of processed data (showing first 10 records)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Issues</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedData.slice(0, 10).map((record, index) => (
                            <TableRow key={index}>
                              <TableCell>{record.originalRowIndex}</TableCell>
                              <TableCell className="font-medium">{record.name}</TableCell>
                              <TableCell>{record.code}</TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={record.isNew ? 'default' : 'outline'}>
                                  {record.isNew ? 'New' : 'Update'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.validationErrors.length > 0 ? (
                                  <div className="flex gap-1">
                                    {record.validationErrors.filter(e => e.severity === 'error').length > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {record.validationErrors.filter(e => e.severity === 'error').length} errors
                                      </Badge>
                                    )}
                                    {record.validationErrors.filter(e => e.severity === 'warning').length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {record.validationErrors.filter(e => e.severity === 'warning').length} warnings
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                                    Valid
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetImport}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('settings')}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </Button>
                    <Button
                      onClick={executeImport}
                      disabled={!canExecuteImport}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Execute Import
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Options</CardTitle>
                <CardDescription>
                  Configure how the import should be processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-mode">Import Mode</Label>
                      <Select
                        value={importOptions.mode}
                        onValueChange={(value) => handleOptionsChange('mode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create_only">Create Only</SelectItem>
                          <SelectItem value="update_only">Update Only</SelectItem>
                          <SelectItem value="create_and_update">Create & Update</SelectItem>
                          <SelectItem value="preview_only">Preview Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose how to handle existing countries
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="batch-size">Batch Size</Label>
                      <Input
                        id="batch-size"
                        type="number"
                        min="1"
                        max="100"
                        value={importOptions.batchSize}
                        onChange={(e) => handleOptionsChange('batchSize', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of records to process at once (1-100)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="skip-duplicates">Skip Duplicates</Label>
                        <p className="text-xs text-gray-500">
                          Skip records that already exist
                        </p>
                      </div>
                      <Switch
                        id="skip-duplicates"
                        checked={importOptions.skipDuplicates}
                        onCheckedChange={(checked) => handleOptionsChange('skipDuplicates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-partial">Allow Partial Import</Label>
                        <p className="text-xs text-gray-500">
                          Continue import even if some records fail
                        </p>
                      </div>
                      <Switch
                        id="allow-partial"
                        checked={importOptions.allowPartialImport}
                        onCheckedChange={(checked) => handleOptionsChange('allowPartialImport', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-fix">Auto-fix Minor Errors</Label>
                        <p className="text-xs text-gray-500">
                          Automatically fix common formatting issues
                        </p>
                      </div>
                      <Switch
                        id="auto-fix"
                        checked={importOptions.autoFixMinorErrors}
                        onCheckedChange={(checked) => handleOptionsChange('autoFixMinorErrors', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="validate-only">Validate Only</Label>
                        <p className="text-xs text-gray-500">
                          Only validate data without importing
                        </p>
                      </div>
                      <Switch
                        id="validate-only"
                        checked={importOptions.validateOnly}
                        onCheckedChange={(checked) => handleOptionsChange('validateOnly', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {importProgress.stage === 'completed' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Processed"
                    value={importStatistics.processedRecords}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="green"
                    description="Successfully imported"
                  />
                  <StatCard
                    title="Skipped"
                    value={importStatistics.skippedRecords}
                    icon={<XCircle className="h-5 w-5" />}
                    color="red"
                    description="Failed to import"
                  />
                  <StatCard
                    title="New Countries"
                    value={importStatistics.newRecords}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                    description="Newly created"
                  />
                  <StatCard
                    title="Updated"
                    value={importStatistics.updateRecords}
                    icon={<Database className="h-5 w-5" />}
                    color="yellow"
                    description="Existing countries updated"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Import Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Import completed successfully! {importStatistics.processedRecords} out of {importStatistics.totalRecords} records were imported.
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetImport();
                            setActiveTab('upload');
                          }}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Import More
                        </Button>
                        <Button
                          onClick={() => setIsOpen(false)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Done
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedCountryImport;