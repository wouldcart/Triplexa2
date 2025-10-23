
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Search, Filter, Plus, Download, Table2, Grid3X3 } from 'lucide-react';
import HotelFilters from '@/components/inventory/hotels/HotelFilters';
import HotelsTable from '@/components/inventory/hotels/HotelsTable';
import HotelGrid from '@/components/inventory/hotels/HotelGrid';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { useHotelFilters } from '@/components/inventory/hotels/hooks/useHotelFilters';
import { HotelFilters as HotelFiltersType } from '@/components/inventory/hotels/types/hotel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImportExportDrawer from '@/components/inventory/hotels/drawers/ImportExportDrawer';
import { Card, CardContent } from '@/components/ui/card';
import SampleDataImporter from '@/components/inventory/hotels/components/SampleDataImporter';

const Hotels: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [importExportOpen, setImportExportOpen] = useState(false);
  
  const { 
    hotels, 
    loading, 
    refreshHotels 
  } = useSupabaseHotelsData();

  // Typed filters and derived filtered hotels
  const { filters, setFilters, filteredHotels: filteredByFilters } = useHotelFilters(hotels);
  const filteredHotels = filteredByFilters;
  const exportHotels = () => {};

  // Reset pagination when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Calculate pagination
  const totalItems = filteredHotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.city.toLowerCase().includes(searchTerm.toLowerCase())
  ).length;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Apply search filter in addition to the other filters
  const displayedHotels = filteredHotels
    .filter(hotel => 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(startIndex, endIndex);

  // Compute active filter count safely with typed filters
  const getActiveFilterCount = (f: HotelFiltersType) => {
    let count = 0;
    if (f.country && f.country !== 'all') count++;
    if (f.city && f.city !== 'all') count++;
    if (f.location && f.location !== 'all') count++;
    if (f.starRating !== 'all') count++;
    if (f.status !== 'all') count++;
    if (f.category && f.category !== 'all') count++;
    if (f.roomTypes.length > 0) count++;
    if (f.facilities.length > 0) count++;
    if (f.priceRange.min > 0 || f.priceRange.max < 10000) count++;
    if (f.dateRange.from && f.dateRange.to) count++;
    return count;
  };
  const activeFilterCount = getActiveFilterCount(filters);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleAddNewHotel = () => {
    navigate('/inventory/hotels/add');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hotel Inventory</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your hotel listings and room types
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportExportOpen(true)}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              Import/Export
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-brand-blue hover:bg-brand-blue/90 flex items-center gap-2"
              onClick={handleAddNewHotel}
            >
              <Plus className="h-4 w-4" />
              Add New Hotel
            </Button>
          </div>
        </div>
        
        {/* Search and Filters Card */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Search hotels by name, location, country, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="default" 
                  className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={toggleFilters}
                  aria-expanded={showFilters}
                  aria-controls="hotel-filters-panel"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-blue rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                
                <Tabs 
                  defaultValue="table" 
                  value={viewMode} 
                  onValueChange={(v) => setViewMode(v as 'grid' | 'table')}
                  className="hidden md:flex"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table" className="flex items-center gap-2">
                      <Table2 className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      Grid
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" id="hotel-filters-panel">
                <HotelFilters filters={filters} setFilters={setFilters} />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
            </CardContent>
          </Card>
        )}
        
        {/* Sample Data Importer - Show when no hotels */}
        {!loading && hotels.length === 0 && (
          <div className="flex justify-center py-8">
            <SampleDataImporter />
          </div>
        )}

        {/* Hotels Display */}
        {!loading && hotels.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} hotels
              </p>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {viewMode === 'table' ? (
              <HotelsTable hotels={displayedHotels} searchTerm={''} />
            ) : (
              <HotelGrid hotels={displayedHotels} searchTerm={''} />
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* First Page */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Pages around current */}
                    {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                      let pageNum;
                      
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      
                      if (pageNum <= 0 || pageNum > totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            isActive={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {/* Ellipsis if needed */}
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Last Page */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Empty State - when search returns no results */}
        {!loading && hotels.length > 0 && totalItems === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No hotels found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Import/Export Drawer */}
      <ImportExportDrawer 
        open={importExportOpen} 
        onOpenChange={setImportExportOpen} 
      />
    </PageLayout>
  );
};

export default Hotels;
