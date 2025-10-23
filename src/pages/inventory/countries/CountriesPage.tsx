
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, Search, Trash2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CountriesTable from './components/CountriesTable';
import { useCountriesData } from './hooks/useCountriesData';
import { useCountryActions } from './hooks/useCountryActions';
import { useCountryImportExport } from './hooks/useCountryImportExport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import CountryViewDrawer from './components/drawers/CountryViewDrawer';
import CountryEditSheet from './components/CountryEditSheet';
import CountryAddSheet from './components/CountryAddSheet';
import CountryDeleteDrawer from './components/drawers/CountryDeleteDrawer';
import CountriesFilters from './components/CountriesFilters';
import AdvancedCountryImport from './components/AdvancedCountryImport';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import BulkEditDialog, { BulkUpdateData } from './components/BulkEditDialog';
import { CountriesService } from '@/services/countriesService';

const CountriesPage: React.FC = () => {
  // Selection state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // UI-only hidden countries state
  const [hiddenCountries, setHiddenCountries] = useState<string[]>([]);
  
  // Bulk edit state
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);

  const {
    countries,
    currentCountries,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    continentFilter,
    setContinentFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    selectedCountry,
    setSelectedCountry,
    editFormData,
    setEditFormData,
    newCountryData,
    setNewCountryData,
    viewDrawerOpen,
    setViewDrawerOpen,
    editDrawerOpen,
    setEditDrawerOpen,
    deleteDrawerOpen,
    setDeleteDrawerOpen,
    addDrawerOpen,
    setAddDrawerOpen,
    importDrawerOpen,
    setImportDrawerOpen,
    importFileRef,
    resetNewCountryForm,
    loading,
    toast,
    setItemsPerPage,
    refreshCountries
  } = useCountriesData(hiddenCountries);
  
  const countryActions = useCountryActions({
    countries,
    setSelectedCountry,
    setEditFormData,
    setViewDrawerOpen,
    setEditDrawerOpen,
    setDeleteDrawerOpen,
    selectedCountry,
    editFormData,
    newCountryData,
    setAddDrawerOpen,
    setImportDrawerOpen,
    resetNewCountryForm,
    setNewCountryData,
    refreshCountries,
    toast
  });

  // Import/Export functionality
  const importExport = useCountryImportExport({
    countries,
    setImportDrawerOpen,
    importFileRef,
    toast,
    searchQuery,
    statusFilter,
    continentFilter
  });

  // Selection handlers
  const handleSelectCountry = (id: string) => {
    setSelectedCountries(prev => 
      prev.includes(id) 
        ? prev.filter(countryId => countryId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = currentCountries.map(country => country.id);
      setSelectedCountries(allIds);
    } else {
      setSelectedCountries([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedCountries([]);
  };

  const handleSelectAllCountries = () => {
    setSelectedCountries(currentCountries.map(country => country.id));
  };

  const handleRemoveFromUI = () => {
    if (selectedCountries.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select countries to remove from UI",
        variant: "destructive",
      });
      return;
    }

    // Add selected countries to hidden list
    setHiddenCountries(prev => [...prev, ...selectedCountries]);
    
    // Clear selection after hiding
    setSelectedCountries([]);
    
    toast({
      title: "Countries Hidden",
      description: `${selectedCountries.length} countries have been hidden from the UI`,
    });
  };





  const handleBulkDelete = async (ids: string[]) => {
    try {
      if (ids.length === 0) {
        toast({
          title: "No Selection",
          description: "Please select countries to delete",
          variant: "destructive",
        });
        return;
      }

      // Get country names for confirmation
      const selectedCountryNames = countries
        .filter(country => ids.includes(country.id))
        .map(country => country.name)
        .slice(0, 3); // Show first 3 names
      
      const displayNames = selectedCountryNames.join(', ') + 
        (ids.length > 3 ? ` and ${ids.length - 3} more` : '');

      if (window.confirm(
        `Are you sure you want to permanently delete ${ids.length} ${ids.length === 1 ? 'country' : 'countries'}?\n\n` +
        `Countries: ${displayNames}\n\n` +
        `This action cannot be undone.`
      )) {
        // Show loading toast
        const loadingToast = toast({
          title: "Deleting Countries",
          description: `Deleting ${ids.length} countries...`,
        });

        const response = await CountriesService.bulkDeleteCountries(ids);
        
        if (response.success) {
          toast({
            title: "Delete Successful",
            description: `Successfully deleted ${ids.length} ${ids.length === 1 ? 'country' : 'countries'}`,
          });
          setSelectedCountries([]);
          // Refresh the data
          await refreshCountries();
        } else {
          toast({
            title: "Delete Failed",
            description: response.error || "Failed to delete countries",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete countries",
        variant: "destructive",
      });
    }
  };

  const handleBulkToggleStatus = async (ids: string[]) => {
    try {
      if (ids.length === 0) {
        toast({
          title: "No Selection",
          description: "Please select countries to toggle status",
          variant: "destructive",
        });
        return;
      }

      // Get selected countries and determine the most common status to toggle to
      const selectedCountries = countries.filter(country => ids.includes(country.id));
      const activeCount = selectedCountries.filter(c => c.status === 'active').length;
      const inactiveCount = selectedCountries.filter(c => c.status === 'inactive').length;
      
      // If more countries are active, toggle to inactive, otherwise toggle to active
      const newStatus = activeCount >= inactiveCount ? 'inactive' : 'active';
      const statusAction = newStatus === 'active' ? 'activate' : 'deactivate';
      
      // Get country names for confirmation
      const selectedCountryNames = selectedCountries
        .map(country => country.name)
        .slice(0, 3); // Show first 3 names
      
      const displayNames = selectedCountryNames.join(', ') + 
        (ids.length > 3 ? ` and ${ids.length - 3} more` : '');

      if (window.confirm(
        `Are you sure you want to ${statusAction} ${ids.length} ${ids.length === 1 ? 'country' : 'countries'}?\n\n` +
        `Countries: ${displayNames}\n\n` +
        `New status will be: ${newStatus.toUpperCase()}`
      )) {
        // Show loading toast
        const loadingToast = toast({
          title: "Updating Status",
          description: `${statusAction === 'activate' ? 'Activating' : 'Deactivating'} ${ids.length} countries...`,
        });

        const response = await CountriesService.bulkToggleStatus(ids, newStatus);
        
        if (response.success) {
          toast({
            title: "Status Update Successful",
            description: `Successfully ${statusAction}d ${ids.length} ${ids.length === 1 ? 'country' : 'countries'}`,
          });
          setSelectedCountries([]);
          // Refresh the data
          await refreshCountries();
        } else {
          toast({
            title: "Status Update Failed",
            description: response.error || "Failed to update country status",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Bulk status toggle error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle status for countries",
        variant: "destructive",
      });
    }
  };

  const handleBulkEdit = () => {
    if (selectedCountries.length > 0) {
      setBulkEditDialogOpen(true);
    }
  };

  const handleBulkUpdate = async (updateData: BulkUpdateData) => {
    try {
      if (selectedCountries.length === 0) {
        toast({
          title: "No Selection",
          description: "Please select countries to update",
          variant: "destructive",
        });
        return;
      }

      // Show loading toast
      const loadingToast = toast({
        title: "Updating Countries",
        description: `Updating ${selectedCountries.length} countries...`,
      });

      const response = await CountriesService.bulkUpdateCountries(selectedCountries, updateData);
      
      if (response.success) {
        toast({
          title: "Bulk Update Successful",
          description: `Successfully updated ${selectedCountries.length} ${selectedCountries.length === 1 ? 'country' : 'countries'}`,
        });
        setSelectedCountries([]);
        setBulkEditDialogOpen(false);
        // Refresh the data
        await refreshCountries();
      } else {
        toast({
          title: "Bulk Update Failed",
          description: response.error || "Failed to update countries",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update countries",
        variant: "destructive",
      });
    }
  };


  // Keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts({
    selectedCountries,
    onSelectAll: handleSelectAllCountries,
    onClearSelection: handleClearSelection,
    onBulkDelete: () => handleBulkDelete(selectedCountries),
    onBulkEdit: handleBulkEdit,
    onBulkToggleStatus: () => handleBulkToggleStatus(selectedCountries),
    isDialogOpen: bulkEditDialogOpen || viewDrawerOpen || editDrawerOpen || deleteDrawerOpen || addDrawerOpen
  });

  return (
    <PageLayout>
      <div className="p-3 sm:p-6">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Countries Management</h1>
            
            {/* Action Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
              <div className="flex gap-2">
                <AdvancedCountryImport 
                  refreshCountries={refreshCountries}
                  trigger={
                    <Button 
                      variant="outline"
                      className="flex items-center flex-1 sm:flex-none"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Import</span>
                    </Button>
                  }
                />
                <Button 
                  variant="outline"
                  onClick={() => importExport.handleExport()}
                  className="flex items-center flex-1 sm:flex-none"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Export</span>
                </Button>
                <Button 
                   onClick={countryActions.handleAddCountry}
                   className="flex items-center flex-1 sm:flex-none"
                   size="sm"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   <span className="hidden xs:inline">Add Country</span>
                 </Button>
                <KeyboardShortcutsHelp 
                  shortcuts={shortcuts}
                  selectedCount={selectedCountries.length}
                />
              </div>
            </div>
          </div>
          

        </div>
        
        {/* Enhanced Search and Filters */}
        <div className="mb-4 relative">
          <CountriesFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchType={searchType}
            setSearchType={setSearchType}
            continentFilter={continentFilter}
            setContinentFilter={setContinentFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
        
        {/* Combined Status Overview and Filters Section - Single Row Layout */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Status Overview Cards - Compact Row Layout */}
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">🌍</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{countries.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900/50 rounded-md flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Active</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      {countries.filter(country => country.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">⏸</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Inactive</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {countries.filter(country => country.status === 'inactive').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Pills - Aligned to Right */}
            {/* <div className="flex flex-wrap gap-2 lg:justify-end">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground mr-2">Filter:</span>
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="text-xs h-7"
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                  className="text-xs h-7"
                >
                  Active
                </Button>
                <Button 
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                  className="text-xs h-7"
                >
                  Inactive
                </Button>
                {continentFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-1 text-xs h-7"
                    onClick={() => setContinentFilter('all')}
                  >
                    {continentFilter} ×
                  </Button>
                )}
              </div>
            </div> */}
          </div>
        </div>
        
        <div className="relative">
          <CountriesTable 
            countries={currentCountries}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalCountries={countries.length}
            selectedCountries={selectedCountries}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            onPageSelect={goToPage}
            onItemsPerPageChange={setItemsPerPage}
            onView={countryActions.handleViewCountry}
            onEdit={countryActions.handleEditCountry}
            onDelete={countryActions.handleDeleteCountry}
            onToggleStatus={countryActions.handleToggleStatus}
            onSelectCountry={handleSelectCountry}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
            onBulkToggleStatus={handleBulkToggleStatus}
            onBulkEdit={handleBulkEdit}
          />
        </div>
        
        {/* Drawers and Sheets */}
        {selectedCountry && (
          <>
            <CountryViewDrawer 
              deleteDrawerOpen={viewDrawerOpen}
              setDeleteDrawerOpen={setViewDrawerOpen}
              selectedCountry={selectedCountry}
              handleConfirmDelete={countryActions.handleEditFromView}
            />
            
            <CountryDeleteDrawer 
              deleteDrawerOpen={deleteDrawerOpen}
              setDeleteDrawerOpen={setDeleteDrawerOpen}
              selectedCountry={selectedCountry}
              handleConfirmDelete={countryActions.handleConfirmDelete}
            />
          </>
        )}
        
        {editFormData && (
          <CountryEditSheet 
            formData={editFormData}
            isOpen={editDrawerOpen}
            onClose={() => setEditDrawerOpen(false)}
            onSave={countryActions.handleSaveEdit}
            onChange={countryActions.handleFormInputChange}
          />
        )}
        
        <CountryAddSheet 
          formData={newCountryData}
          isOpen={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          onSave={countryActions.handleSaveNewCountry}
          onChange={countryActions.handleNewCountryInputChange}
        />

        <BulkEditDialog
          isOpen={bulkEditDialogOpen}
          onClose={() => setBulkEditDialogOpen(false)}
          selectedCountries={countries.filter(country => selectedCountries.includes(country.id))}
          onBulkUpdate={handleBulkUpdate}
        />

      </div>
    </PageLayout>
  );
};

export default CountriesPage;
