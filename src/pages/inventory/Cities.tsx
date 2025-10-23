import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, Search, Trash2, RotateCcw, Eye, Edit, Filter, ToggleLeft, ToggleRight, Keyboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CitiesService, CityRow } from '@/services/citiesService';
import { CountriesService, CountryRow } from '@/services/countriesService';
import { useKeyboardShortcuts } from './cities/hooks/useKeyboardShortcuts';
import KeyboardShortcutsPopup from './cities/components/KeyboardShortcutsPopup';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface City extends CityRow {
  country_name?: string;
}

const CitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State management
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [bulkEditSheetOpen, setBulkEditSheetOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);

  // Form data states - updated to match new service interfaces
  const [addFormData, setAddFormData] = useState<CityInsert>({
    name: '',
    region: '',
    country: '',
    status: 'active',
    is_popular: false,
    has_airport: false
  });

  const [editFormData, setEditFormData] = useState<CityUpdate>({});

  const [bulkEditFormData, setBulkEditFormData] = useState({
    status: '' as '' | 'active' | 'disabled'
  });

  // Additional missing state variables - updated to match new service
  const [newCityData, setNewCityData] = useState<CityInsert>({
    name: '',
    region: '',
    country: '',
    status: 'active',
    is_popular: false,
    has_airport: false
  });
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  // Quick Import (text-based) states
  const [quickImportOpen, setQuickImportOpen] = useState(false);
  const [quickImportCountry, setQuickImportCountry] = useState<string>('');
  const [quickImportRegion, setQuickImportRegion] = useState<string>('');
  const [quickImportText, setQuickImportText] = useState<string>('');
  const [quickImportStatus, setQuickImportStatus] = useState<'active' | 'disabled'>('active');

  // Data loading function
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting data load...');
      console.log('🔄 Current cities state:', cities.length);
      
      // Load cities with proper pagination parameters
      console.log('📍 Loading cities...');
      const citiesResponse = await CitiesService.getAllCities(1, 1000); // Load up to 1000 cities
      console.log('📍 Cities response:', citiesResponse);
      
      if (citiesResponse.success && citiesResponse.data) {
        console.log('✅ Cities loaded successfully:', citiesResponse.data.cities.length, 'cities');
        setCities(citiesResponse.data.cities);
      } else {
        console.error('❌ Failed to load cities:', citiesResponse.error);
        toast({
          title: "Error",
          description: `Failed to load cities: ${citiesResponse.error}`,
          variant: "destructive"
        });
      }
      
      // Load active countries using CitiesService
      console.log('🌍 Loading active countries...');
      const countriesResponse = await CitiesService.getActiveCountries();
      console.log('🌍 Countries response:', countriesResponse);
      
      if (countriesResponse.success && countriesResponse.data) {
        console.log('✅ Active countries loaded successfully:', countriesResponse.data.length);
        setCountries(countriesResponse.data);
      } else {
        console.error('❌ Failed to load active countries:', countriesResponse.error);
        toast({
          title: "Error",
          description: `Failed to load active countries: ${countriesResponse.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🏁 Data loading completed');
    }
  };

  // Initial data loading
  useEffect(() => {
    console.log('🚀 Cities component mounted, calling loadData...');
    loadData();
  }, []);

  const handleAddCity = () => {
    setNewCityData({
      name: '',
      region: '',
      country: '',
      status: 'active',
      is_popular: false,
      has_airport: false
    });
    setAddSheetOpen(true);
  };

  // Quick import submit handler
  const handleQuickImportSubmit = async () => {
    try {
      // Basic validation
      if (!quickImportCountry) {
        toast({ title: 'Validation Error', description: 'Please select a country.', variant: 'destructive' });
        return;
      }
      if (!quickImportText.trim()) {
        toast({ title: 'Validation Error', description: 'Please enter one or more city names.', variant: 'destructive' });
        return;
      }

      // Split by commas or newlines, trim, dedupe, and filter empty
      const rawEntries = quickImportText
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const uniqueCityNames = Array.from(new Set(rawEntries));

      let successCount = 0;
      let failureCount = 0;

      for (const name of uniqueCityNames) {
        const res = await CitiesService.createCity({
          name,
          country: quickImportCountry,
          region: quickImportRegion || '',
          status: quickImportStatus,
          has_airport: false,
          is_popular: false,
        });

        if (res.success) successCount++; else failureCount++;
      }

      toast({
        title: 'Quick Import Complete',
        description: `${successCount} cities imported${failureCount ? `, ${failureCount} failed` : ''}.`,
      });

      // Refresh and reset
      await loadData();
      setQuickImportOpen(false);
      setQuickImportCountry('');
      setQuickImportRegion('');
      setQuickImportText('');
      setQuickImportStatus('active');
    } catch (err) {
      console.error('Quick import error:', err);
      toast({ title: 'Error', description: 'Failed to import cities.', variant: 'destructive' });
    }
  };

  const handleViewCity = (city: City) => {
    setSelectedCity(city);
    setViewDialogOpen(true);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setEditFormData({ 
      name: city.name,
      region: city.region,
      country: city.country,
      status: city.status,
      is_popular: city.is_popular,
      has_airport: city.has_airport
    });
    setEditSheetOpen(true);
  };

  const handleDeleteCity = (city: City) => {
    setSelectedCity(city);
    setDeleteDialogOpen(true);
  };

  const handleSaveNewCity = async () => {
    try {
      // Validation
      if (!newCityData.name || !newCityData.region || !newCityData.country) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (name, region, and country).",
          variant: "destructive"
        });
        return;
      }

      // Check for duplicates
      const existingCity = cities.find(
        city => city.name.toLowerCase() === newCityData.name.toLowerCase() && 
                city.region?.toLowerCase() === newCityData.region?.toLowerCase()
      );

      if (existingCity) {
        toast({
          title: "Validation Error",
          description: `City "${newCityData.name}" already exists in ${newCityData.region}.`,
          variant: "destructive"
        });
        return;
      }

      const response = await CitiesService.createCity(newCityData);

      if (response.success) {
        toast({
          title: "City Added",
          description: `${newCityData.name} has been successfully added.`,
        });
        setAddSheetOpen(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add city",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding city:', error);
      toast({
        title: "Error",
        description: "Failed to add city",
        variant: "destructive"
      });
    }
  };

  const handleSaveEditCity = async () => {
    if (!selectedCity || !editFormData) return;

    try {
      // Validation
      if (!editFormData.name || (!editFormData.region && !selectedCity.region)) {
        toast({
          title: "Validation Error",
          description: "City name and region are required fields.",
          variant: "destructive"
        });
        return;
      }

      // Check for duplicates (excluding current city)
      const existingCity = cities.find(
        city => city.id !== selectedCity.id &&
                city.name.toLowerCase() === (editFormData.name || selectedCity.name).toLowerCase() && 
                city.region?.toLowerCase() === (editFormData.region || selectedCity.region)?.toLowerCase()
      );

      if (existingCity) {
        toast({
          title: "Validation Error",
          description: `City "${editFormData.name || selectedCity.name}" already exists in ${editFormData.region || selectedCity.region}.`,
          variant: "destructive"
        });
        return;
      }

      const response = await CitiesService.updateCity(selectedCity.id.toString(), editFormData);

      if (response.success) {
        toast({
          title: "City Updated",
          description: `${editFormData.name || selectedCity.name} has been successfully updated.`,
        });
        setEditSheetOpen(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update city",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating city:', error);
      toast({
        title: "Error",
        description: "Failed to update city",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCity) return;

    try {
      const response = await CitiesService.deleteCity(selectedCity.id.toString());

      if (response.success) {
        toast({
          title: "City Deleted",
          description: `${selectedCity.name} has been successfully deleted.`,
        });
        setDeleteDialogOpen(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete city",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Error",
        description: "Failed to delete city",
        variant: "destructive"
      });
    }
  };

  // Bulk operations
  const handleBulkToggleStatus = async (status: 'active' | 'disabled') => {
    if (selectedCities.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select cities to update status",
        variant: "destructive"
      });
      return;
    }

    try {
      const promises = selectedCities.map(cityId => 
        CitiesService.updateCity(cityId, { status })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Status Updated",
          description: `${successCount} cities updated to ${status}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
        loadData();
        setSelectedCities([]);
      }
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast({
        title: "Error",
        description: "Failed to update city status",
        variant: "destructive"
      });
    }
  };

  // Per-row status toggle
  const handleToggleCityStatus = async (city: City) => {
    try {
      const newStatus: 'active' | 'disabled' = city.status === 'active' ? 'disabled' : 'active';
      const response = await CitiesService.updateCity(city.id.toString(), { status: newStatus });

      if (response.success) {
        toast({
          title: 'Status Updated',
          description: `${city.name} status changed to ${newStatus}.`,
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update city status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling city status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update city status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCities.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select cities to delete",
        variant: "destructive"
      });
      return;
    }

    try {
      const promises = selectedCities.map(cityId => 
        CitiesService.deleteCity(cityId)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Cities Deleted",
          description: `${successCount} cities deleted${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
        loadData();
        setSelectedCities([]);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Error",
        description: "Failed to delete cities",
        variant: "destructive"
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedCities.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select cities to edit",
        variant: "destructive"
      });
      return;
    }
    setBulkEditSheetOpen(true);
  };

  // Selection handlers
  const handleSelectCity = (cityId: string) => {
    setSelectedCities(prev => 
      prev.includes(cityId) 
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCities.length === filteredCities.length && filteredCities.length > 0) {
      setSelectedCities([]);
    } else {
      setSelectedCities(filteredCities.map(city => city.id.toString()));
    }
  };

  const handleClearSelection = () => {
    setSelectedCities([]);
  };



  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCountry, statusFilter]);

  // Fixed filtering logic - updated for new service structure
  const filteredCities = cities.filter(city => {
    const matchesSearch = !searchTerm || 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || city.country === selectedCountry;
    const matchesStatus = statusFilter === 'all' || city.status === statusFilter;
    
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const totalItems = filteredCities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get paginated cities for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCities = filteredCities.slice(startIndex, endIndex);

  // Status counts for compact status bar
  const totalCitiesCount = cities.length;
  const activeCitiesCount = cities.filter(c => c.status === 'active').length;
  const disabledCitiesCount = cities.filter(c => c.status === 'disabled').length;

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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Enhanced Export functionality - updated for new service structure
  const handleExport = () => {
    const dataToExport = filteredCities.length > 0 ? filteredCities : cities;
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(city => ({
      ID: city.id,
      Name: city.name,
      Region: city.region || '',
      Country: city.country || '',
      'Has Airport': city.has_airport ? 'Yes' : 'No',
      'Is Popular': city.is_popular ? 'Yes' : 'No',
      Status: city.status,
      'Created At': city.created_at,
      'Updated At': city.updated_at
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cities");
    
    // Generate an Excel file as a binary string
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save the file
    saveAs(data, `cities_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `${dataToExport.length} cities exported to Excel file.`,
    });
  };

  // Enhanced Import functionality
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
          // Process and validate imported data - updated for new service structure
          const processedData = importedData.map((row: any) => {
            const statusValue = (row['Status'] || '').toString().toLowerCase() === 'active' ? 'active' : 'disabled';
            
            return {
              name: row['Name'] || 'Unknown City',
              region: row['Region'] || '',
              country: row['Country'] || '',
              is_popular: (row['Is Popular'] || '').toString().toLowerCase() === 'yes',
              has_airport: (row['Has Airport'] || '').toString().toLowerCase() === 'yes',
              status: statusValue as 'active' | 'disabled'
            };
          });
          
          // Import cities one by one
          const importCities = async () => {
            let successCount = 0;
            let failureCount = 0;
            
            for (const cityData of processedData) {
              try {
                const response = await CitiesService.createCity(cityData);
                if (response.success) {
                  successCount++;
                } else {
                  failureCount++;
                }
              } catch (error) {
                failureCount++;
              }
            }
            
            toast({
              title: "Import Complete",
              description: `${successCount} cities imported successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
            });
            
            loadData();
          };
          
          importCities();
          setImportDialogOpen(false);
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast({
          title: "Import Failed",
          description: "There was an error importing the data. Please check the file format and try again.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsBinaryString(file);
    // Reset the input
    event.target.value = '';
  };

  // Keyboard shortcuts
  const shortcuts = [
    { key: 'Ctrl/Cmd + N', description: 'Add new city' },
    { key: 'Ctrl/Cmd + F', description: 'Focus search input' },
    { key: 'Ctrl/Cmd + A', description: 'Select all cities' },
    { key: 'Escape', description: 'Clear selection' },
    { key: 'Delete', description: 'Delete selected cities', requiresSelection: true },
    { key: 'Ctrl/Cmd + E', description: 'Edit selected cities', requiresSelection: true },
    { key: 'Ctrl/Cmd + T', description: 'Toggle status of selected cities', requiresSelection: true }
  ];

  // Keyboard shortcuts implementation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when dialogs are open or when typing in inputs
      if (
        addSheetOpen || editSheetOpen || deleteDialogOpen || viewSheetOpen || bulkEditSheetOpen || keyboardShortcutsOpen ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd + N - Add new city
      if (isCtrlOrCmd && event.key === 'n') {
        event.preventDefault();
        handleAddCity();
        return;
      }

      // Ctrl/Cmd + F - Focus search input
      if (isCtrlOrCmd && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Ctrl/Cmd + A - Select All
      if (isCtrlOrCmd && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      // Escape - Clear Selection
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClearSelection();
        return;
      }

      // Only proceed with other shortcuts if cities are selected
      if (selectedCities.length === 0) {
        return;
      }

      // Ctrl/Cmd + E - Bulk Edit
      if (isCtrlOrCmd && event.key === 'e') {
        event.preventDefault();
        handleBulkEdit();
        return;
      }

      // Delete - Bulk Delete
      if (event.key === 'Delete') {
        event.preventDefault();
        handleBulkDelete();
        return;
      }

      // Ctrl/Cmd + T - Bulk Toggle Status
      if (isCtrlOrCmd && event.key === 't') {
        event.preventDefault();
        handleBulkToggleStatus(selectedCities.length > 0 ? 'active' : 'disabled');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCities, addSheetOpen, editSheetOpen, deleteDialogOpen, viewSheetOpen, bulkEditSheetOpen, keyboardShortcutsOpen]);

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout>
      <div className="space-y-6">


        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cities Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage cities and their details across all countries
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Primary Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddCity} className="gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Add City</span>
                <span className="xs:hidden">Add</span>
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <Upload className="h-4 w-4" />
                <span className="hidden xs:inline">Import</span>
              </Button>
              <Button variant="outline" onClick={() => setQuickImportOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <Upload className="h-4 w-4" />
                <span className="hidden xs:inline">Quick Import</span>
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2 flex-1 sm:flex-none">
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">Export</span>
              </Button>
              <KeyboardShortcutsPopup shortcuts={shortcuts} selectedCount={selectedCities.length} />
            </div>
            
            {/* Bulk Actions - Hidden on mobile, shown in mobile bulk actions card */}
            {selectedCities.length > 0 && (
              <div className="hidden md:flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleBulkToggleStatus('active')} className="gap-2">
                  <ToggleRight className="h-4 w-4" />
                  Activate ({selectedCities.length})
                </Button>
                <Button variant="outline" onClick={() => handleBulkToggleStatus('disabled')} className="gap-2">
                  <ToggleLeft className="h-4 w-4" />
                  Disable ({selectedCities.length})
                </Button>
                <Button variant="outline" onClick={handleBulkEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit ({selectedCities.length})
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedCities.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Compact Status Bar with Counts */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/50 rounded-sm flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">🌍</span>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total</p>
                <p className="text-base font-bold text-blue-900 dark:text-blue-100">{totalCitiesCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-green-100 dark:bg-green-900/50 rounded-sm flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Active</p>
                <p className="text-base font-bold text-green-900 dark:text-green-100">{activeCitiesCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">⏸</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Disabled</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{disabledCitiesCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - redesigned: compact, no heading, mobile-first grid */}
        <Card className="border-muted">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    placeholder="Search cities"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>
              {/* Status */}
              <div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Country */}
              <div>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Items per page */}
              <div>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Desktop Table */}
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCities.length === filteredCities.length && filteredCities.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap lg:table-cell">Region</TableHead>
                <TableHead className="whitespace-nowrap">Country</TableHead>
                <TableHead className="whitespace-nowrap">Airport</TableHead>
                <TableHead className="whitespace-nowrap lg:table-cell">Popular</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading cities...
                  </TableCell>
                </TableRow>
              ) : paginatedCities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No cities found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCities.map((city) => (
                  <TableRow key={city.id} className="hover:bg-muted/50">
                    <TableCell className="py-2">
                      <Checkbox
                        checked={selectedCities.includes(city.id.toString())}
                        onCheckedChange={() => handleSelectCity(city.id.toString())}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm truncate max-w-[220px]">{city.name}</TableCell>
                    <TableCell className="text-sm lg:table-cell">{city.region || '-'}</TableCell>
                    <TableCell className="text-sm truncate max-w-[160px]">{city.country || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {city.has_airport ? (
                        <Badge variant="secondary">✈️ Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm lg:table-cell">
                      {city.is_popular ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={city.status === 'active' ? 'default' : 'secondary'}>
                          {city.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={city.status === 'active' ? 'Disable' : 'Activate'}
                          onClick={() => handleToggleCityStatus(city)}
                          className="h-8 px-2"
                        >
                          {city.status === 'active' ? (
                            <ToggleLeft className="h-4 w-4" />
                          ) : (
                            <ToggleRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCity(city)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCity(city)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCity(city)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {/* Mobile Bulk Actions */}
          {selectedCities.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCities.length} cities selected
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleStatus('active')}
                      className="h-8 px-2 text-xs"
                    >
                      <ToggleRight className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkToggleStatus('disabled')}
                      className="h-8 px-2 text-xs"
                    >
                      <ToggleLeft className="h-3 w-3 mr-1" />
                      Disable
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-8 px-2 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                Loading cities...
              </CardContent>
            </Card>
          ) : paginatedCities.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                No cities found
              </CardContent>
            </Card>
          ) : (
            paginatedCities.map((city) => (
              <Card key={city.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-3">
                    <Checkbox
                      checked={selectedCities.includes(city.id.toString())}
                      onCheckedChange={() => handleSelectCity(city.id.toString())}
                      className="mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base truncate">{city.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {city.country || 'Unknown'}
                            </span>
                            {city.region && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">{city.region}</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <Badge 
                              variant={city.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {city.status}
                            </Badge>
                            {city.has_airport && (
                              <Badge variant="outline" className="text-xs">✈️ Airport</Badge>
                            )}
                            {city.is_popular && (
                              <Badge variant="outline" className="text-xs">⭐ Popular</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCity(city)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCity(city)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCity(city)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} cities
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* View City Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>City Details</DialogTitle>
              <DialogDescription>
                View detailed information about this city
              </DialogDescription>
            </DialogHeader>
            {selectedCity && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm mt-1">{selectedCity.name}</p>
                  </div>
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Region</Label>
                    <p className="text-sm mt-1">{selectedCity.region || '-'}</p>
                  </div>
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Country</Label>
                    <p className="text-sm mt-1">{selectedCity.country || '-'}</p>
                  </div>
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Has Airport</Label>
                    <div className="mt-1">
                      <Badge variant={selectedCity.has_airport ? 'default' : 'secondary'}>
                        {selectedCity.has_airport ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={selectedCity.status === 'active' ? 'default' : 'secondary'}>
                        {selectedCity.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-md border">
                    <Label className="text-sm font-medium">Popular</Label>
                    <p className="text-sm mt-1">{selectedCity.is_popular ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add City Sheet */}
        <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New City
              </SheetTitle>
              <SheetDescription>
                Create a new city entry with all the required information.
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="city-name">City Name *</Label>
                <Input
                  id="city-name"
                  placeholder="Enter city name"
                  value={newCityData.name}
                  onChange={(e) => setNewCityData({ ...newCityData, name: e.target.value })}
                  className="border-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city-region">Regions (state/province/zone)</Label>
                <Input
                  id="city-region"
                  placeholder="Enter region"
                  value={newCityData.region || ''}
                  onChange={(e) => setNewCityData({ ...newCityData, region: e.target.value })}
                  className="border-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city-country">Country</Label>
                <Select 
                  value={newCityData.country}
                  onValueChange={(value) => setNewCityData({ ...newCityData, country: value })}
                >
                  <SelectTrigger id="city-country" className="border-2 focus:border-primary">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-has-airport">Has Airport</Label>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{newCityData.has_airport ? 'Yes' : 'No'}</span>
                    <Switch
                      id="city-has-airport"
                      checked={newCityData.has_airport || false}
                      onCheckedChange={(checked) => setNewCityData({ ...newCityData, has_airport: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-toggle">Status</Label>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{newCityData.status === 'active' ? 'Active' : 'Disabled'}</span>
                    <Switch
                      id="status-toggle"
                      checked={newCityData.status === 'active'}
                      onCheckedChange={(checked) => setNewCityData({ ...newCityData, status: checked ? 'active' : 'disabled' })}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-popular">Is Popular Destination</Label>
                    <Switch
                      id="is-popular"
                      checked={newCityData.is_popular}
                      onCheckedChange={(checked) => setNewCityData({ ...newCityData, is_popular: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <SheetFooter className="gap-2">
              <Button variant="outline" onClick={() => setAddSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewCity} className="gap-2">
                <Plus className="w-4 h-4" />
                Add City
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit City Sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit City
              </SheetTitle>
              <SheetDescription>
                Update the city information below.
              </SheetDescription>
            </SheetHeader>
            
            {selectedCity && (
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-city-name">City Name *</Label>
                  <Input
                    id="edit-city-name"
                    placeholder="Enter city name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="border-2 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-city-region">Region</Label>
                  <Input
                    id="edit-city-region"
                    placeholder="Enter region (optional)"
                    value={editFormData.region || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    className="border-2 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-city-country">Country</Label>
                  <Select 
                    value={editFormData.country || ''}
                    onValueChange={(value) => setEditFormData({ ...editFormData, country: value })}
                  >
                    <SelectTrigger id="edit-city-country" className="border-2 focus:border-primary">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-city-has-airport">Has Airport</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-city-has-airport"
                      checked={editFormData.has_airport || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, has_airport: checked })}
                    />
                    <Label htmlFor="edit-city-has-airport" className="text-sm text-muted-foreground">
                      City has an airport
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-is-popular">Is Popular Destination</Label>
                    <Switch
                      id="edit-is-popular"
                      checked={editFormData.is_popular || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_popular: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={editFormData.status || 'active'} 
                      onValueChange={(value: 'active' | 'disabled') => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger className="border-2 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            <SheetFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditCity} className="gap-2">
                <Edit className="w-4 h-4" />
                Save Changes
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* View City Sheet */}
        <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                City Details
              </SheetTitle>
              <SheetDescription>
                View detailed information about this city.
              </SheetDescription>
            </SheetHeader>
            
            {selectedCity && (
              <div className="space-y-6 py-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {selectedCity.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCity.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCity.country}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">REGION</Label>
                    <p className="text-sm font-medium">{selectedCity.region || 'Not specified'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">STATUS</Label>
                    <Badge 
                      variant={selectedCity.status === 'active' ? 'default' : 'secondary'}
                      className={selectedCity.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }
                    >
                      {selectedCity.status === 'active' ? '✓ Active' : '✗ Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">HAS AIRPORT</Label>
                    <div className="flex items-center gap-2">
                      {selectedCity.has_airport ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          ✈️ Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">POPULAR DESTINATION</Label>
                    <div className="flex items-center gap-2">
                      {selectedCity.is_popular ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          ⭐ Popular
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Regular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">CREATED</Label>
                    <p className="text-sm">{new Date(selectedCity.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">LAST UPDATED</Label>
                    <p className="text-sm">{new Date(selectedCity.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <SheetFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewSheetOpen(false)}>
                Close
              </Button>
              {selectedCity && (
                <Button onClick={() => {
                  setViewSheetOpen(false);
                  handleEditCity(selectedCity);
                }} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit City
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Delete City
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedCity?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">This will permanently delete:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCity?.name} in {selectedCity?.country}
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete City
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Import Dialog */}
        <Dialog open={quickImportOpen} onOpenChange={setQuickImportOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Quick Import Cities
              </DialogTitle>
              <DialogDescription>
                Paste city names (one per line or comma-separated) to import into the selected active country. For Region use (state/province/zone).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={quickImportCountry} onValueChange={setQuickImportCountry}>
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue placeholder="Select active country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.filter(c => c.status === 'active').map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Regions (state/province/zone)</Label>
                <Input
                  value={quickImportRegion}
                  onChange={(e) => setQuickImportRegion(e.target.value)}
                  placeholder="Enter region"
                />
              </div>

              <div className="space-y-2">
                <Label>Cities</Label>
                <Textarea
                  value={quickImportText}
                  onChange={(e) => setQuickImportText(e.target.value)}
                  placeholder="One city per line, or comma-separated"
                  className="min-h-[160px]"
                />
                <p className="text-xs text-muted-foreground">
                  Example: Lagos, Abuja, Port Harcourt
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={quickImportStatus} onValueChange={(value: 'active' | 'disabled') => setQuickImportStatus(value)}>
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setQuickImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickImportSubmit} className="gap-2">
                <Upload className="w-4 h-4" />
                Import Cities
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Cities
              </DialogTitle>
              <DialogDescription>
                Upload an Excel or CSV file exported from the Cities page.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <input
                id="cities-import-file"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleImport}
                className="hidden"
              />

              <Button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cities-import-file') as HTMLInputElement | null;
                  el?.click();
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>

              <p className="text-xs text-muted-foreground">
                Expected columns: <code>Name</code>, <code>Region</code>, <code>Country</code>, <code>Has Airport</code>, <code>Is Popular</code>, <code>Status</code>.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Sheet */}
        <Sheet open={bulkEditSheetOpen} onOpenChange={setBulkEditSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Bulk Edit Cities
              </SheetTitle>
              <SheetDescription>
                Edit multiple cities at once. Only filled fields will be updated.
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>{selectedCities.length} cities selected</strong> for bulk editing
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select 
                    value={bulkEditFormData.country} 
                    onValueChange={(value) => setBulkEditFormData({ ...bulkEditFormData, country: value })}
                  >
                    <SelectTrigger className="border-2 focus:border-primary">
                      <SelectValue placeholder="Select country (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No change</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={bulkEditFormData.status} 
                    onValueChange={(value: '' | 'active' | 'disabled') => setBulkEditFormData({ ...bulkEditFormData, status: value })}
                  >
                    <SelectTrigger className="border-2 focus:border-primary">
                      <SelectValue placeholder="Select status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No change</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> Only the fields you select will be updated. Empty fields will remain unchanged.
                </p>
              </div>
            </div>
            
            <SheetFooter className="gap-2">
              <Button variant="outline" onClick={() => setBulkEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  // Implement bulk edit logic
                  const updates: any = {};
                  if (bulkEditFormData.country) updates.country = bulkEditFormData.country;
                  if (bulkEditFormData.status) updates.status = bulkEditFormData.status;
                  
                  if (Object.keys(updates).length > 0) {
                    try {
                      const promises = selectedCities.map(cityId => 
                        CitiesService.updateCity(cityId, updates)
                      );
                      
                      const results = await Promise.all(promises);
                      const successCount = results.filter(r => r.success).length;
                      const failureCount = results.length - successCount;
                      
                      if (successCount > 0) {
                        toast({
                          title: "Bulk Edit Complete",
                          description: `${successCount} cities updated${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                        });
                        loadData();
                        setSelectedCities([]);
                        setBulkEditSheetOpen(false);
                        setBulkEditFormData({ country: '', status: '' });
                      }
                    } catch (error) {
                      console.error('Error in bulk edit:', error);
                      toast({
                        title: "Error",
                        description: "Failed to update cities",
                        variant: "destructive"
                      });
                    }
                  } else {
                    toast({
                      title: "No Changes",
                      description: "Please select at least one field to update",
                      variant: "destructive"
                    });
                  }
                }}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Update Cities
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
};

export default CitiesPage;
