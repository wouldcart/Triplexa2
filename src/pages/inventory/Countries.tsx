import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Globe, 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  Eye, 
  Edit, 
  Trash2, 
  Import, 
  FileText,
  Check, 
  X,
  Plus,
  DollarSign,
  CurrencyIcon,
  Loader2
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from "@/hooks/use-toast";
import { CountriesService } from '@/services/countriesService';
import { CitiesService } from '@/services/citiesService';
import { Country } from '@/pages/inventory/countries/types/country';

// Function to get appropriate currency icon
const getCurrencyIcon = (currencySymbol: string) => {
  switch(currencySymbol) {
    case '฿': // Thai Baht
      return <CurrencyIcon className="h-4 w-4" />;
    case 'د.إ': // UAE Dirham
      return <CurrencyIcon className="h-4 w-4" />;
    case '$': // US Dollar
      return <DollarSign className="h-4 w-4" />;
    case '€': // Euro
      return <CurrencyIcon className="h-4 w-4" />;
    case '£': // British Pound
      return <CurrencyIcon className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};

const CountriesPage: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [editFormData, setEditFormData] = useState<Country | null>(null);
  const [newCountryData, setNewCountryData] = useState<Omit<Country, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    code: '',
    continent: '',
    region: '',
    currency: '',
    currency_symbol: '',
    status: 'active',
    flag_url: null,
    is_popular: false,
    visa_required: false,
    languages: [],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null
  });

  // Load countries from Supabase on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await CountriesService.getAllCountries();
      
      if (response.success && response.data) {
        setCountries(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load countries",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Added for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Added for region filtering
  const [regionFilter, setRegionFilter] = useState<string>('all');
  
  // Added for status filtering
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Get unique regions for the filter
  const availableRegions = Array.from(new Set(countries.map(country => country.region)));

  // Filter and paginate countries
  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          country.currency.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = regionFilter === 'all' || country.region === regionFilter;
    const matchesStatus = statusFilter === 'all' || country.status === statusFilter;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCountries = filteredCountries.slice(indexOfFirstItem, indexOfLastItem);
  
  // Pagination navigation
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle view country
  const handleViewCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsViewSheetOpen(true);
  };

  // Handle edit country
  const handleEditCountry = (country: Country) => {
    setSelectedCountry(country);
    setEditFormData({ ...country });
    setIsEditSheetOpen(true);
  };

  // Handle delete country
  const handleDeleteCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsDeleteDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (editFormData) {
      try {
        const response = await CountriesService.updateCountry(editFormData.id, {
          name: editFormData.name,
          code: editFormData.code,
          continent: editFormData.continent,
          region: editFormData.region,
          currency: editFormData.currency,
          currency_symbol: editFormData.currency_symbol,
          status: editFormData.status,
          flag_url: editFormData.flag_url,
          is_popular: editFormData.is_popular,
          visa_required: editFormData.visa_required,
          languages: editFormData.languages,
          pricing_currency_override: editFormData.pricing_currency_override,
          pricing_currency: editFormData.pricing_currency,
          pricing_currency_symbol: editFormData.pricing_currency_symbol
        });

        if (response.success && response.data) {
          setCountries(countries.map(country => (country.id === editFormData.id ? response.data : country)));
          setIsEditSheetOpen(false);
          setEditFormData(null);
          setSelectedCountry(null);
          toast({
            title: "Success",
            description: "Country updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to update country",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error updating country:', error);
        toast({
          title: "Error",
          description: "Failed to update country",
          variant: "destructive",
        });
      }
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (selectedCountry) {
      try {
        const response = await CountriesService.deleteCountry(selectedCountry.id);

        if (response.success) {
          setCountries(countries.filter(country => country.id !== selectedCountry.id));
          setIsDeleteDialogOpen(false);
          setSelectedCountry(null);
          toast({
            title: "Success",
            description: "Country deleted successfully",
          });
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to delete country",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting country:', error);
        toast({
          title: "Error",
          description: "Failed to delete country",
          variant: "destructive",
        });
      }
    }
  };

  // Handle add new country
  const handleAddCountry = async () => {
    if (newCountryData.name && newCountryData.code) {
      try {
        const response = await CountriesService.createCountry(newCountryData);

        if (response.success && response.data) {
          setCountries([...countries, response.data]);
          setNewCountryData({
            name: '',
            code: '',
            continent: '',
            region: '',
            currency: '',
            currency_symbol: '',
            status: 'active',
            flag_url: null,
            is_popular: false,
            visa_required: false,
            languages: [],
            pricing_currency_override: false,
            pricing_currency: null,
            pricing_currency_symbol: null
          });
          setIsAddSheetOpen(false);
          toast({
            title: "Success",
            description: "Country added successfully",
          });
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to add country",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error adding country:', error);
        toast({
          title: "Error",
          description: "Failed to add country",
          variant: "destructive",
        });
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: string) => {
    const country = countries.find(c => c.id === id);
    if (!country) return;

    const newStatus = country.status === 'active' ? 'disabled' : 'active';
    
    try {
      const response = await CountriesService.updateCountry(id, {
        ...country,
        status: newStatus
      });

      if (response.success && response.data) {
        setCountries(countries.map(c => c.id === id ? response.data : c));
        toast({
          title: "Success",
          description: `${country.name} has been ${newStatus}.`,
        });

        // Cascade city status based on country status change
        try {
          const citiesRes = await CitiesService.getCitiesByCountryId(id);
          if (citiesRes.success && citiesRes.data && citiesRes.data.length > 0) {
            const cityIds = citiesRes.data.map(city => city.id);
            const cascadeRes = await CitiesService.bulkToggleStatus(cityIds, newStatus as 'active' | 'disabled');
            if (cascadeRes.success) {
              toast({
                title: "Cities Synced",
                description: `${cascadeRes.data?.length ?? cityIds.length} cities set to ${newStatus}.`,
              });
            } else {
              toast({
                title: "Warning",
                description: cascadeRes.error || 'Country updated but failed to sync cities.',
                variant: 'destructive',
              });
            }
          } else {
            // No cities for this country; nothing to sync
            console.log(`No cities found for country ${id}; skipping cascade.`);
          }
        } catch (cascadeError) {
          console.error('Error cascading city status:', cascadeError);
          toast({
            title: "Warning",
            description: 'Country updated, but city status cascade encountered an error.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update country status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating country status:', error);
      toast({
        title: "Error",
        description: "Failed to update country status",
        variant: "destructive",
      });
    }
  };

  // Handle form input change for editing
  const handleFormInputChange = (field: keyof Country, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  // Handle form input change for new country
  const handleNewCountryInputChange = (field: keyof Omit<Country, 'id'>, value: any) => {
    setNewCountryData({
      ...newCountryData,
      [field]: value
    });
  };

  // Export countries to Excel
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(countries.map(country => ({
      ID: country.id,
      Name: country.name,
      Code: country.code,
      Continent: country.continent,
      Region: country.region,
      Currency: country.currency,
      'Currency Symbol': country.currency_symbol,
      'Flag URL': country.flag_url,
      'Is Popular': country.is_popular,
      'Visa Required': country.visa_required,
      Languages: Array.isArray(country.languages) ? country.languages.join(', ') : country.languages,
      'Pricing Currency Override': country.pricing_currency_override,
      'Pricing Currency': country.pricing_currency,
      'Pricing Currency Symbol': country.pricing_currency_symbol,
      Status: country.status
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Countries");
    
    // Generate an Excel file as a binary string
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save the file
    saveAs(data, 'countries.xlsx');
    
    toast.success({
      title: "Export successful",
      description: "Countries data has been exported to Excel file.",
    });
  };

  // Import countries from Excel
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet);
        
        if (importedData.length > 0) {
          // Process and validate imported data
          const processedData = importedData.map((row: any, index) => {
            // Ensure status is either "active" or "disabled"
            const statusValue = (row['Status'] || '').toString().toLowerCase() === 'active' ? 'active' : 'disabled';
            
            return {
              id: row['ID'] || (countries.length + index + 1).toString(),
              name: row['Name'] || 'Unknown Country',
              code: row['Code'] || 'XX',
              continent: row['Continent'] || 'Unknown Continent',
              region: row['Region'] || 'Unknown Region',
              currency: row['Currency'] || 'Unknown Currency',
              currency_symbol: row['Currency Symbol'] || '',
              status: statusValue as 'active' | 'inactive',
              flag_url: row['Flag URL'] || '',
              is_popular: Boolean(row['Is Popular']) || false,
              visa_required: Boolean(row['Visa Required']) || false,
              languages: row['Languages'] ? row['Languages'].split(',').map((lang: string) => lang.trim()) : ['English'],
              pricing_currency_override: Boolean(row['Pricing Currency Override']) || false,
              pricing_currency: row['Pricing Currency'] || '',
              pricing_currency_symbol: row['Pricing Currency Symbol'] || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Country;
          });
          
          // Update countries state with processed data
          setCountries([...countries, ...processedData]);
          setIsImportDialogOpen(false);
          
          toast.success({
            title: "Import successful",
            description: `${processedData.length} countries have been imported.`,
          });
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error({
          title: "Import failed",
          description: "There was an error importing the data. Please check the file format and try again."
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <PageLayout>
      <div className="p-4 md:p-6 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Countries Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage countries, regions and currency details.</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Import className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleExport}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setIsAddSheetOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Country</span>
            </Button>
          </div>
        </div>
        
        {/* Enhanced Search and Filter Section with Priority Layout */}
        <div className="space-y-6 mb-6">
          {/* Primary Search Bar - Hero Position */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-6 sticky top-4 z-20">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Search Countries</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find countries by name, code, or currency</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 z-10" />
                <Input 
                  className="pl-12 pr-4 h-14 text-lg bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-gray-500 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-gray-400" 
                  placeholder="Type to search countries, codes, or currencies..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Secondary Filters - Organized Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Filter Header */}
            <div className="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Advanced Filters</h4>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredCountries.length} of {countries.length} countries
                </div>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Region Filter */}
                <div className="space-y-3">
                  <Label htmlFor="region-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                    Region
                  </Label>
                  <select 
                    id="region-filter"
                    className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm py-3 px-4 focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-500"
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                  >
                    <option value="all">🌍 All Regions</option>
                    {availableRegions.map((region) => (
                      <option key={region} value={region}>📍 {region}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div className="space-y-3">
                  <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
                    Status
                  </Label>
                  <select 
                    id="status-filter"
                    className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm py-3 px-4 focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">📊 All Status</option>
                    <option value="active">✅ Active</option>
                    <option value="disabled">❌ Inactive</option>
                  </select>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-3 md:col-span-2 xl:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                    Quick Actions
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {/* Clear Filters Button */}
                    {(searchQuery || regionFilter !== 'all' || statusFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setRegionFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-sm px-4 py-2 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                    
                    {/* Export Filtered Results */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-sm px-4 py-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export ({filteredCountries.length})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {(searchQuery || regionFilter !== 'all' || statusFilter !== 'all') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-xs font-medium">
                      🔍 Search: "{searchQuery}"
                    </Badge>
                  )}
                  {regionFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-3 py-1 rounded-full text-xs font-medium">
                      📍 Region: {regionFilter}
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 px-3 py-1 rounded-full text-xs font-medium">
                      📊 Status: {statusFilter}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Countries Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries List
                </CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${filteredCountries.length} countries found`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-gray-500 dark:text-gray-400">Loading countries...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentCountries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      {countries.length === 0 ? "No countries available. Add some countries to get started." : "No countries found. Try a different search term or filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCountries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">{country.id}</TableCell>
                      <TableCell>{country.name}</TableCell>
                      <TableCell>{country.code}</TableCell>
                      <TableCell>{country.region}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <span className="mr-1">{getCurrencyIcon(country.currency_symbol)}</span>
                        {country.currency} ({country.currency_symbol})
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                          <Badge variant={country.status === 'active' ? 'default' : 'secondary'}>
                            {country.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewCountry(country)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditCountry(country)}
                            title="Edit Country"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {country.status === 'active' ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleStatus(country.id)}
                              title="Disable Country"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleStatus(country.id)}
                              title="Enable Country"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteCountry(country)}
                            title="Delete Country"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          {filteredCountries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCountries.length)} of {filteredCountries.length} countries
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                    const pageNumber = currentPage > 3 && totalPages > 5
                      ? currentPage - 3 + index + 1
                      : index + 1;
                      
                    if (pageNumber <= totalPages) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Countries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload an Excel file (.xlsx) containing country data. The file should have columns for Name, Code, Phone Code, Currency, Currency Code, Currency Symbol, Region and Status.
            </p>
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              <label className="flex flex-col items-center cursor-pointer">
                <Import className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">XLSX files only</span>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Country Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Country Details</SheetTitle>
            <SheetDescription>View detailed information about this country</SheetDescription>
          </SheetHeader>
          {selectedCountry && (
            <div className="py-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedCountry.name}</h3>
                <Badge variant={selectedCountry.status === 'active' ? 'default' : 'secondary'}>
                  {selectedCountry.status === 'active' ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country Code</p>
                  <p>{selectedCountry.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Continent</p>
                  <p>{selectedCountry.continent}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</p>
                <p>{selectedCountry.region}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency Information</p>
                <div className="flex items-center">
                  <span className="mr-2">{getCurrencyIcon(selectedCountry.currency)}</span>
                  <span>{selectedCountry.currency}</span>
                </div>
                <p className="text-lg">{selectedCountry.currency_symbol}</p>
              </div>

              {selectedCountry.flag_url && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Flag</p>
                  <img src={selectedCountry.flag_url} alt={`${selectedCountry.name} flag`} className="w-16 h-12 object-cover rounded" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Popular Destination</p>
                  <p>{selectedCountry.is_popular ? 'Yes' : 'No'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visa Required</p>
                  <p>{selectedCountry.visa_required ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-auto">
            <Button className="w-full" onClick={() => setIsViewSheetOpen(false)}>Close</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Country Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Country</SheetTitle>
            <SheetDescription>Update country information and settings</SheetDescription>
          </SheetHeader>
          {editFormData && (
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Country Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleFormInputChange('name', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Country Code</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => handleFormInputChange('code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-continent">Continent</Label>
                  <Input
                    id="edit-continent"
                    value={editFormData.continent}
                    onChange={(e) => handleFormInputChange('continent', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-region">Region</Label>
                <Input
                  id="edit-region"
                  value={editFormData.region}
                  onChange={(e) => handleFormInputChange('region', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency Name</Label>
                  <Input
                    id="edit-currency"
                    value={editFormData.currency}
                    onChange={(e) => handleFormInputChange('currency', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currencySymbol">Currency Symbol</Label>
                  <Input
                    id="edit-currencySymbol"
                    value={editFormData.currency_symbol}
                    onChange={(e) => handleFormInputChange('currency_symbol', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-flagUrl">Flag URL</Label>
                <Input
                  id="edit-flagUrl"
                  value={editFormData.flag_url || ''}
                  onChange={(e) => handleFormInputChange('flag_url', e.target.value)}
                  placeholder="https://example.com/flag.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-popular"
                      checked={editFormData.is_popular}
                      onCheckedChange={(checked) => handleFormInputChange('is_popular', checked)}
                    />
                    <Label htmlFor="edit-popular" className="cursor-pointer">
                      Popular Destination
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-visa"
                      checked={editFormData.visa_required}
                      onCheckedChange={(checked) => handleFormInputChange('visa_required', checked)}
                    />
                    <Label htmlFor="edit-visa" className="cursor-pointer">
                      Visa Required
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete <strong>{selectedCountry?.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Country Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New Country</SheetTitle>
            <SheetDescription>Enter country details and configurations</SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Country Name</Label>
              <Input
                id="add-name"
                value={newCountryData.name}
                onChange={(e) => handleNewCountryInputChange('name', e.target.value)}
                placeholder="e.g., Thailand"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-code">Country Code</Label>
                <Input
                  id="add-code"
                  value={newCountryData.code}
                  onChange={(e) => handleNewCountryInputChange('code', e.target.value)}
                  placeholder="e.g., TH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-continent">Continent</Label>
                <Input
                  id="add-continent"
                  value={newCountryData.continent}
                  onChange={(e) => handleNewCountryInputChange('continent', e.target.value)}
                  placeholder="e.g., Asia"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-region">Region</Label>
              <Input
                id="add-region"
                value={newCountryData.region}
                onChange={(e) => handleNewCountryInputChange('region', e.target.value)}
                placeholder="e.g., Southeast Asia"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-currency">Currency Name</Label>
                <Input
                  id="add-currency"
                  value={newCountryData.currency}
                  onChange={(e) => handleNewCountryInputChange('currency', e.target.value)}
                  placeholder="e.g., Thai Baht"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-currencySymbol">Currency Symbol</Label>
                <Input
                  id="add-currencySymbol"
                  value={newCountryData.currency_symbol}
                  onChange={(e) => handleNewCountryInputChange('currency_symbol', e.target.value)}
                  placeholder="e.g., ฿"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-flagUrl">Flag URL</Label>
              <Input
                id="add-flagUrl"
                value={newCountryData.flag_url || ''}
                onChange={(e) => handleNewCountryInputChange('flag_url', e.target.value)}
                placeholder="https://example.com/flag.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="add-popular"
                    checked={newCountryData.is_popular}
                    onCheckedChange={(checked) => handleNewCountryInputChange('is_popular', checked)}
                  />
                  <Label htmlFor="add-popular" className="cursor-pointer">
                    Popular Destination
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="add-visa"
                    checked={newCountryData.visa_required}
                    onCheckedChange={(checked) => handleNewCountryInputChange('visa_required', checked)}
                  />
                  <Label htmlFor="add-visa" className="cursor-pointer">
                    Visa Required
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="add-status"
                  checked={newCountryData.status === 'active'}
                  onCheckedChange={(checked) => handleNewCountryInputChange('status', checked ? 'active' : 'inactive')}
                />
                <Label htmlFor="add-status" className="cursor-pointer">
                  {newCountryData.status === 'active' ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button
              onClick={handleAddCountry}
              disabled={!newCountryData.name || !newCountryData.code}
            >
              Add Country
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
};

export default CountriesPage;
