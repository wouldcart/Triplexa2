import { useCallback } from 'react';
import { Country } from '../types/country';
import * as XLSX from 'xlsx';

interface UseCountryImportExportProps {
  countries: Country[];
  setImportDrawerOpen: (open: boolean) => void;
  importFileRef: React.RefObject<HTMLInputElement>;
  toast: any;
  searchQuery?: string;
  statusFilter?: string;
  continentFilter?: string;
}

export const useCountryImportExport = ({
  countries,
  setImportDrawerOpen,
  importFileRef,
  toast,
  searchQuery,
  statusFilter,
  continentFilter
}: UseCountryImportExportProps) => {

  const handleImportClick = useCallback(() => {
    setImportDrawerOpen(true);
  }, [setImportDrawerOpen]);

  const handleExport = useCallback((includeAll: boolean = false) => {
    try {
      let dataToExport = countries;

      // Apply filters if not exporting all
      if (!includeAll) {
        dataToExport = countries.filter(country => {
          let matches = true;

          // Apply search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            matches = matches && (
              country.name.toLowerCase().includes(query) ||
              country.code.toLowerCase().includes(query) ||
              country.continent.toLowerCase().includes(query) ||
              country.region.toLowerCase().includes(query)
            );
          }

          // Apply status filter
          if (statusFilter && statusFilter !== 'all') {
            matches = matches && country.status === statusFilter;
          }

          // Apply continent filter
          if (continentFilter && continentFilter !== 'all') {
            matches = matches && country.continent === continentFilter;
          }

          return matches;
        });
      }

      // Prepare main countries data for export
      const exportData = dataToExport.map(country => ({
        'Country Name': country.name,
        'Country Code': country.code,
        Continent: country.continent,
        Region: country.region,
        Currency: country.currency,
        'Currency Symbol': country.currency_symbol,
        'Flag URL': country.flag_url,
        'Is Popular': country.is_popular ? 'Yes' : 'No',
        'Visa Required': country.visa_required ? 'Yes' : 'No',
        Status: country.status,
        'Pricing Currency Override': country.pricing_currency_override ? 'Yes' : 'No',
        'Pricing Currency': country.pricing_currency || '',
        'Pricing Currency Symbol': country.pricing_currency_symbol || ''
      }));

      // Prepare Currency Override table data (countries with overrides only)
      const currencyOverrideData = dataToExport
        .filter(country => country.pricing_currency_override)
        .map(country => ({
          'Country Name': country.name,
          'Country Code': country.code,
          'Local Currency': country.currency,
          'Local Currency Symbol': country.currency_symbol,
          'Override Currency': country.pricing_currency || '',
          'Override Currency Symbol': country.pricing_currency_symbol || '',
          'Override Status': 'Active',
          'Applied Date': new Date().toISOString().split('T')[0], // Current date as placeholder
          'Continent': country.continent,
          'Region': country.region
        }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add main countries worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Countries');

      // Add Currency Override table worksheet if there are overrides
      if (currencyOverrideData.length > 0) {
        const currencyWs = XLSX.utils.json_to_sheet(currencyOverrideData);
        XLSX.utils.book_append_sheet(wb, currencyWs, 'Currency Overrides');
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `countries-export-${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      const overrideMessage = currencyOverrideData.length > 0 
        ? ` including ${currencyOverrideData.length} currency overrides` 
        : '';

      toast({
        title: "Export Successful",
        description: `Exported ${dataToExport.length} countries${overrideMessage} to ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the countries data.",
        variant: "destructive",
      });
    }
  }, [countries, searchQuery, statusFilter, continentFilter, toast]);

  return {
    handleImportClick,
    handleExport
  };
};