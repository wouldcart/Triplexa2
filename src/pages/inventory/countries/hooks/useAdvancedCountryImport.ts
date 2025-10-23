import { useState, useRef, useCallback } from 'react';
import { CountriesService, CountryRow } from '@/services/countriesService';
import { Country } from '../types/country';
import { mapDbCountriesToFrontend, mapFrontendCountryToDbInsert } from '@/services/countryMapper';
import * as XLSX from 'xlsx';

// Enhanced interfaces for advanced import
export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ImportStatistics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  newRecords: number;
  updateRecords: number;
  skippedRecords: number;
  processedRecords: number;
}

export interface ImportProgress {
  stage: 'idle' | 'parsing' | 'validating' | 'processing' | 'saving' | 'completed' | 'error';
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  recordsProcessed: number;
  totalRecords: number;
}

export interface ProcessedCountryData {
  id?: string;
  name: string;
  code: string;
  continent: string;
  region: string;
  currency: string;
  currency_symbol: string;
  status: 'active' | 'inactive';
  flag_url?: string;
  is_popular?: boolean;
  visa_required?: boolean;
  pricing_currency_override?: boolean;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
  isNew: boolean;
  isUpdate: boolean;
  isDuplicate: boolean;
  validationErrors: ImportValidationError[];
  originalRowIndex: number;
}

export interface ImportOptions {
  mode: 'create_only' | 'update_only' | 'create_and_update' | 'preview_only';
  skipDuplicates: boolean;
  validateOnly: boolean;
  batchSize: number;
  allowPartialImport: boolean;
  autoFixMinorErrors: boolean;
}

interface UseAdvancedCountryImportProps {
  onImportComplete?: (stats: ImportStatistics) => void;
  onImportError?: (error: string) => void;
  refreshCountries?: () => Promise<void>;
  toast?: any;
}

export const useAdvancedCountryImport = ({
  onImportComplete,
  onImportError,
  refreshCountries,
  toast
}: UseAdvancedCountryImportProps) => {
  // State management
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    stage: 'idle',
    percentage: 0,
    currentStep: 'Ready to import',
    recordsProcessed: 0,
    totalRecords: 0
  });
  const [importStatistics, setImportStatistics] = useState<ImportStatistics>({
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    duplicateRecords: 0,
    newRecords: 0,
    updateRecords: 0,
    skippedRecords: 0,
    processedRecords: 0
  });
  const [processedData, setProcessedData] = useState<ProcessedCountryData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mode: 'create_and_update',
    skipDuplicates: false,
    validateOnly: false,
    batchSize: 50,
    allowPartialImport: true,
    autoFixMinorErrors: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Validation functions
  const validateCountryCode = (code: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    
    if (!code || typeof code !== 'string') {
      errors.push({
        row: 0,
        field: 'code',
        value: code,
        message: 'Country code is required',
        severity: 'error'
      });
      return errors;
    }

    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode.length !== 2) {
      errors.push({
        row: 0,
        field: 'code',
        value: code,
        message: 'Country code must be exactly 2 characters',
        severity: 'error',
        suggestion: 'Use ISO 3166-1 alpha-2 format (e.g., US, GB, FR)'
      });
    }

    if (!/^[A-Z]{2}$/.test(cleanCode)) {
      errors.push({
        row: 0,
        field: 'code',
        value: code,
        message: 'Country code must contain only letters',
        severity: 'error',
        suggestion: 'Use only uppercase letters (A-Z)'
      });
    }

    return errors;
  };

  const validateCountryName = (name: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push({
        row: 0,
        field: 'name',
        value: name,
        message: 'Country name is required',
        severity: 'error'
      });
      return errors;
    }

    const cleanName = name.trim();
    
    if (cleanName.length < 2) {
      errors.push({
        row: 0,
        field: 'name',
        value: name,
        message: 'Country name must be at least 2 characters',
        severity: 'error'
      });
    }

    if (cleanName.length > 100) {
      errors.push({
        row: 0,
        field: 'name',
        value: name,
        message: 'Country name must be less than 100 characters',
        severity: 'error'
      });
    }

    return errors;
  };

  const validateCurrency = (currency: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    
    if (!currency || typeof currency !== 'string') {
      errors.push({
        row: 0,
        field: 'currency',
        value: currency,
        message: 'Currency code is required',
        severity: 'error'
      });
      return errors;
    }

    const cleanCurrency = currency.trim().toUpperCase();
    
    if (cleanCurrency.length !== 3) {
      errors.push({
        row: 0,
        field: 'currency',
        value: currency,
        message: 'Currency code must be exactly 3 characters',
        severity: 'error',
        suggestion: 'Use ISO 4217 format (e.g., USD, EUR, GBP)'
      });
    }

    if (!/^[A-Z]{3}$/.test(cleanCurrency)) {
      errors.push({
        row: 0,
        field: 'currency',
        value: currency,
        message: 'Currency code must contain only letters',
        severity: 'error'
      });
    }

    return errors;
  };

  const validateStatus = (status: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    const validStatuses = ['active', 'inactive'];
    
    if (!status || typeof status !== 'string') {
      errors.push({
        row: 0,
        field: 'status',
        value: status,
        message: 'Status is required',
        severity: 'error'
      });
      return errors;
    }

    const cleanStatus = status.trim().toLowerCase();
    
    if (!validStatuses.includes(cleanStatus)) {
      errors.push({
        row: 0,
        field: 'status',
        value: status,
        message: 'Status must be either "active" or "inactive"',
        severity: 'error',
        suggestion: 'Use "active" or "inactive"'
      });
    }

    return errors;
  };

  const validateUrl = (url: string, fieldName: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    
    if (!url) return errors; // Optional field
    
    try {
      new URL(url);
    } catch {
      errors.push({
        row: 0,
        field: fieldName,
        value: url,
        message: 'Invalid URL format',
        severity: 'warning',
        suggestion: 'Ensure URL starts with http:// or https://'
      });
    }

    return errors;
  };

  const validateBoolean = (value: any, fieldName: string): ImportValidationError[] => {
    const errors: ImportValidationError[] = [];
    
    if (value === undefined || value === null || value === '') return errors; // Optional field
    
    const stringValue = String(value).toLowerCase().trim();
    const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
    
    if (!validBooleans.includes(stringValue)) {
      errors.push({
        row: 0,
        field: fieldName,
        value: value,
        message: 'Invalid boolean value',
        severity: 'warning',
        suggestion: 'Use true/false, 1/0, or yes/no'
      });
    }

    return errors;
  };

  // Data processing functions
  const parseFileContent = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let jsonData: any[] = [];

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              reject(new Error('CSV file must contain at least a header row and one data row'));
              return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            jsonData = lines.slice(1).map((line, index) => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, i) => {
                row[header] = values[i] || '';
              });
              row._originalRowIndex = index + 2; // +2 because we skip header and arrays are 0-indexed
              return row;
            });
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            
            // Add row index for tracking
            jsonData = jsonData.map((row, index) => ({
              ...row,
              _originalRowIndex: index + 2 // +2 because Excel rows start at 1 and we skip header
            }));
          }

          // Normalize column headers to match expected format
          jsonData = jsonData.map(row => normalizeRowHeaders(row));

          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  // Normalize column headers from export format to import format
  const normalizeRowHeaders = (row: any): any => {
    const normalized: any = {};
    
    // Create mapping from export headers to import field names
    const headerMapping: { [key: string]: string } = {
      'Country Name': 'name',
      'Country Code': 'code',
      'Continent': 'continent',
      'Region': 'region',
      'Currency': 'currency',
      'Currency Symbol': 'currency_symbol',
      'Status': 'status',
      'Flag URL': 'flag_url',
      'Is Popular': 'is_popular',
      'Visa Required': 'visa_required',
      'Pricing Currency Override': 'pricing_currency_override',
      'Pricing Currency': 'pricing_currency',
      'Pricing Currency Symbol': 'pricing_currency_symbol'
    };

    // Map export headers to import field names
    Object.keys(row).forEach(key => {
      if (headerMapping[key]) {
        let value = row[key];
        
        // Convert Yes/No to boolean for boolean fields
        if (['Is Popular', 'Visa Required', 'Pricing Currency Override'].includes(key)) {
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            value = lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1';
          }
        }
        
        normalized[headerMapping[key]] = value;
      } else {
        // Keep original key if no mapping found (for direct field names)
        normalized[key] = row[key];
      }
    });

    // Preserve special fields
    if (row._originalRowIndex) {
      normalized._originalRowIndex = row._originalRowIndex;
    }

    return normalized;
  };

  const normalizeBoolean = (value: any): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    
    const stringValue = String(value).toLowerCase().trim();
    
    if (['true', '1', 'yes', 'y'].includes(stringValue)) return true;
    if (['false', '0', 'no', 'n'].includes(stringValue)) return false;
    
    return undefined;
  };

  const processRawData = async (rawData: any[], existingCountries: Country[]): Promise<ProcessedCountryData[]> => {
    const processed: ProcessedCountryData[] = [];
    const existingCodes = new Set(existingCountries.map(c => c.code.toUpperCase()));
    const existingNames = new Set(existingCountries.map(c => c.name.toLowerCase()));
    const processedCodes = new Set<string>();
    const processedNames = new Set<string>();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowIndex = row._originalRowIndex || i + 2;
      const errors: ImportValidationError[] = [];

      // Extract and validate required fields
      const name = row.name?.toString().trim() || '';
      const code = row.code?.toString().trim().toUpperCase() || '';
      const continent = row.continent?.toString().trim() || '';
      const region = row.region?.toString().trim() || '';
      const currency = row.currency?.toString().trim().toUpperCase() || '';
      const currency_symbol = row.currency_symbol?.toString().trim() || '';
      const status = row.status?.toString().trim().toLowerCase() || '';

      // Extract optional fields
      const flag_url = row.flag_url?.toString().trim() || '';
      const is_popular = normalizeBoolean(row.is_popular);
      const visa_required = normalizeBoolean(row.visa_required);
      const pricing_currency_override = normalizeBoolean(row.pricing_currency_override);
      const pricing_currency = row.pricing_currency?.toString().trim().toUpperCase() || '';
      const pricing_currency_symbol = row.pricing_currency_symbol?.toString().trim() || '';

      // Validate all fields
      errors.push(...validateCountryName(name).map(e => ({ ...e, row: rowIndex })));
      errors.push(...validateCountryCode(code).map(e => ({ ...e, row: rowIndex })));
      errors.push(...validateCurrency(currency).map(e => ({ ...e, row: rowIndex })));
      errors.push(...validateStatus(status).map(e => ({ ...e, row: rowIndex })));

      if (flag_url) {
        errors.push(...validateUrl(flag_url, 'flag_url').map(e => ({ ...e, row: rowIndex })));
      }

      if (row.is_popular !== undefined && row.is_popular !== null && row.is_popular !== '') {
        errors.push(...validateBoolean(row.is_popular, 'is_popular').map(e => ({ ...e, row: rowIndex })));
      }

      if (row.visa_required !== undefined && row.visa_required !== null && row.visa_required !== '') {
        errors.push(...validateBoolean(row.visa_required, 'visa_required').map(e => ({ ...e, row: rowIndex })));
      }

      if (row.pricing_currency_override !== undefined && row.pricing_currency_override !== null && row.pricing_currency_override !== '') {
        errors.push(...validateBoolean(row.pricing_currency_override, 'pricing_currency_override').map(e => ({ ...e, row: rowIndex })));
      }

      // Validate required fields are not empty
      if (!continent) {
        errors.push({
          row: rowIndex,
          field: 'continent',
          value: continent,
          message: 'Continent is required',
          severity: 'error'
        });
      }

      if (!region) {
        errors.push({
          row: rowIndex,
          field: 'region',
          value: region,
          message: 'Region is required',
          severity: 'error'
        });
      }

      if (!currency_symbol) {
        errors.push({
          row: rowIndex,
          field: 'currency_symbol',
          value: currency_symbol,
          message: 'Currency symbol is required',
          severity: 'error'
        });
      }

      // Check for duplicates within the file
      const isDuplicateCode = processedCodes.has(code);
      const isDuplicateName = processedNames.has(name.toLowerCase());

      if (isDuplicateCode && code) {
        errors.push({
          row: rowIndex,
          field: 'code',
          value: code,
          message: 'Duplicate country code in file',
          severity: 'error'
        });
      }

      if (isDuplicateName && name) {
        errors.push({
          row: rowIndex,
          field: 'name',
          value: name,
          message: 'Duplicate country name in file',
          severity: 'warning'
        });
      }

      // Check for duplicates with existing data
      const isExistingCode = existingCodes.has(code);
      const isExistingName = existingNames.has(name.toLowerCase());

      if (isExistingCode && importOptions.mode === 'create_only') {
        errors.push({
          row: rowIndex,
          field: 'code',
          value: code,
          message: 'Country code already exists (create-only mode)',
          severity: 'error'
        });
      }

      if (!isExistingCode && importOptions.mode === 'update_only') {
        errors.push({
          row: rowIndex,
          field: 'code',
          value: code,
          message: 'Country code does not exist (update-only mode)',
          severity: 'error'
        });
      }

      // Add to processed sets
      if (code) processedCodes.add(code);
      if (name) processedNames.add(name.toLowerCase());

      // Create processed data entry
      const processedEntry: ProcessedCountryData = {
        name,
        code,
        continent,
        region,
        currency,
        currency_symbol,
        status: (status === 'active' || status === 'inactive') ? status as 'active' | 'inactive' : 'active',
        flag_url: flag_url || undefined,
        is_popular,
        visa_required,
        pricing_currency_override,
        pricing_currency: pricing_currency || undefined,
        pricing_currency_symbol: pricing_currency_symbol || undefined,
        isNew: !isExistingCode,
        isUpdate: isExistingCode,
        isDuplicate: isDuplicateCode || isDuplicateName,
        validationErrors: errors,
        originalRowIndex: rowIndex
      };

      processed.push(processedEntry);
    }

    return processed;
  };

  // Main import function
  const handleFileImport = useCallback(async (file: File) => {
    if (!file) return;

    // Reset state
    setIsImporting(true);
    setValidationErrors([]);
    setProcessedData([]);
    setImportStatistics({
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateRecords: 0,
      newRecords: 0,
      updateRecords: 0,
      skippedRecords: 0,
      processedRecords: 0
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Stage 1: Parsing
      setImportProgress({
        stage: 'parsing',
        percentage: 10,
        currentStep: 'Parsing file content...',
        recordsProcessed: 0,
        totalRecords: 0
      });

      const rawData = await parseFileContent(file);
      
      if (rawData.length === 0) {
        throw new Error('No data found in file');
      }

      // Stage 2: Validating
      setImportProgress({
        stage: 'validating',
        percentage: 30,
        currentStep: 'Validating data...',
        recordsProcessed: 0,
        totalRecords: rawData.length
      });

      // Get existing countries for duplicate checking
      const existingCountriesResponse = await CountriesService.getAllCountries();
      
      if (!existingCountriesResponse.success || !existingCountriesResponse.data) {
        throw new Error(existingCountriesResponse.error || 'Failed to fetch existing countries');
      }
      
      // Map CountryRow[] to Country[] for processing
      const existingCountries = mapDbCountriesToFrontend(existingCountriesResponse.data);
      
      // Process and validate data
      const processed = await processRawData(rawData, existingCountries);
      
      // Calculate statistics
      const stats: ImportStatistics = {
        totalRecords: processed.length,
        validRecords: processed.filter(p => p.validationErrors.filter(e => e.severity === 'error').length === 0).length,
        invalidRecords: processed.filter(p => p.validationErrors.filter(e => e.severity === 'error').length > 0).length,
        duplicateRecords: processed.filter(p => p.isDuplicate).length,
        newRecords: processed.filter(p => p.isNew && p.validationErrors.filter(e => e.severity === 'error').length === 0).length,
        updateRecords: processed.filter(p => p.isUpdate && p.validationErrors.filter(e => e.severity === 'error').length === 0).length,
        skippedRecords: 0,
        processedRecords: 0
      };

      // Collect all validation errors
      const allErrors = processed.flatMap(p => p.validationErrors);

      setProcessedData(processed);
      setValidationErrors(allErrors);
      setImportStatistics(stats);

      // Stage 3: Completed validation
      setImportProgress({
        stage: 'completed',
        percentage: 100,
        currentStep: 'Validation completed',
        recordsProcessed: processed.length,
        totalRecords: processed.length
      });

      toast?.({
        title: "File Processed",
        description: `Processed ${stats.totalRecords} records. ${stats.validRecords} valid, ${stats.invalidRecords} with errors.`,
      });

    } catch (error) {
      setImportProgress({
        stage: 'error',
        percentage: 0,
        currentStep: 'Import failed',
        recordsProcessed: 0,
        totalRecords: 0
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onImportError?.(errorMessage);
      
      toast?.({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      abortControllerRef.current = null;
    }
  }, [importOptions, onImportError, toast]);

  // Execute import function
  const executeImport = useCallback(async () => {
    if (!processedData.length) return;

    setIsImporting(true);
    
    try {
      // Filter valid records based on import mode
      const validRecords = processedData.filter(record => {
        const hasErrors = record.validationErrors.filter(e => e.severity === 'error').length > 0;
        if (hasErrors && !importOptions.allowPartialImport) return false;
        
        switch (importOptions.mode) {
          case 'create_only':
            return record.isNew && !hasErrors;
          case 'update_only':
            return record.isUpdate && !hasErrors;
          case 'create_and_update':
            return !hasErrors;
          default:
            return false;
        }
      });

      if (validRecords.length === 0) {
        throw new Error('No valid records to import');
      }

      // Stage 4: Processing
      setImportProgress({
        stage: 'processing',
        percentage: 0,
        currentStep: 'Processing records...',
        recordsProcessed: 0,
        totalRecords: validRecords.length
      });

      // Process in batches
      const batchSize = importOptions.batchSize;
      let processedCount = 0;
      const results = [];

      for (let i = 0; i < validRecords.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Import cancelled');
        }

        const batch = validRecords.slice(i, i + batchSize);
        
        // Update progress
        setImportProgress(prev => ({
          ...prev,
          percentage: Math.round((processedCount / validRecords.length) * 80) + 10, // 10-90%
          currentStep: `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(validRecords.length / batchSize)}...`,
          recordsProcessed: processedCount
        }));

        // Process batch
        for (const record of batch) {
          try {
            const countryData: Omit<Country, 'id'> = {
              name: record.name,
              code: record.code,
              continent: record.continent,
              region: record.region,
              currency: record.currency,
              currency_symbol: record.currency_symbol,
              status: record.status,
              flag_url: record.flag_url,
              is_popular: record.is_popular ?? false,
              visa_required: record.visa_required ?? false,
              languages: [], // Default empty array for languages
              pricing_currency_override: record.pricing_currency_override ?? false,
              pricing_currency: record.pricing_currency,
              pricing_currency_symbol: record.pricing_currency_symbol,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            let result;
            if (record.isNew) {
              const mappedData = mapFrontendCountryToDbInsert(countryData);
              result = await CountriesService.createCountry(mappedData);
            } else {
              // Find existing country by code
              const existingCountriesResponse = await CountriesService.getAllCountries();
              if (existingCountriesResponse.success && existingCountriesResponse.data) {
                const existing = existingCountriesResponse.data.find(c => c.code === record.code);
                if (existing) {
                  const mappedData = mapFrontendCountryToDbInsert(countryData);
                  result = await CountriesService.updateCountry(existing.id, mappedData);
                }
              }
            }

            results.push({ success: true, record, result });
            processedCount++;
          } catch (error) {
            results.push({ 
              success: false, 
              record, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Stage 5: Saving
      setImportProgress({
        stage: 'saving',
        percentage: 95,
        currentStep: 'Finalizing import...',
        recordsProcessed: processedCount,
        totalRecords: validRecords.length
      });

      // Calculate final statistics
      const finalStats: ImportStatistics = {
        ...importStatistics,
        processedRecords: results.filter(r => r.success).length,
        skippedRecords: results.filter(r => !r.success).length
      };

      setImportStatistics(finalStats);

      // Stage 6: Completed
      setImportProgress({
        stage: 'completed',
        percentage: 100,
        currentStep: 'Import completed successfully',
        recordsProcessed: processedCount,
        totalRecords: validRecords.length
      });

      // Refresh data
      if (refreshCountries) {
        await refreshCountries();
      }

      onImportComplete?.(finalStats);

      toast?.({
        title: "Import Completed",
        description: `Successfully imported ${finalStats.processedRecords} of ${finalStats.totalRecords} records.`,
      });

    } catch (error) {
      setImportProgress({
        stage: 'error',
        percentage: 0,
        currentStep: 'Import failed',
        recordsProcessed: 0,
        totalRecords: 0
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onImportError?.(errorMessage);
      
      toast?.({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }, [processedData, importOptions, importStatistics, onImportComplete, onImportError, refreshCountries, toast]);

  // Cancel import function
  const cancelImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsImporting(false);
    setImportProgress({
      stage: 'idle',
      percentage: 0,
      currentStep: 'Ready to import',
      recordsProcessed: 0,
      totalRecords: 0
    });
  }, []);

  // Reset function
  const resetImport = useCallback(() => {
    setProcessedData([]);
    setValidationErrors([]);
    setImportStatistics({
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateRecords: 0,
      newRecords: 0,
      updateRecords: 0,
      skippedRecords: 0,
      processedRecords: 0
    });
    setImportProgress({
      stage: 'idle',
      percentage: 0,
      currentStep: 'Ready to import',
      recordsProcessed: 0,
      totalRecords: 0
    });
  }, []);

  return {
    // State
    isImporting,
    importProgress,
    importStatistics,
    processedData,
    validationErrors,
    importOptions,
    fileInputRef,

    // Actions
    handleFileImport,
    executeImport,
    cancelImport,
    resetImport,
    setImportOptions,

    // Computed values
    hasValidData: processedData.length > 0 && importStatistics.validRecords > 0,
    canExecuteImport: processedData.length > 0 && importStatistics.validRecords > 0 && !isImporting,
    hasErrors: validationErrors.filter(e => e.severity === 'error').length > 0,
    hasWarnings: validationErrors.filter(e => e.severity === 'warning').length > 0
  };
};