
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  MapPin, 
  CircleDollarSign,
  Utensils,
  X,
  Eye,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRestaurantsData } from './hooks/useRestaurantsData';
import RestaurantsContent from './components/RestaurantsContent';
import RestaurantDetailsDialog from './components/RestaurantDetailsDialog';
import ImportExportDrawer from './components/ImportExportDrawer';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

const RestaurantsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const {
    restaurants,
    filteredRestaurants,
    currentRestaurants,
    totalPages,
    currentPage,
    itemsPerPage,
    searchQuery,
    locationFilter,
    priceRangeFilter,
    cuisineFilter,
    locations,
    cuisineTypes,
    selectedRestaurant,
    isDetailsDialogOpen,
    isDeleteDialogOpen,
    isImportExportOpen,
    handleAddRestaurant,
    handleImportExport,
    handleViewDetails,
    handleEditRestaurant,
    handleDeleteClick,
    handleDeleteConfirm,
    handleImportComplete,
    saveRestaurants,
    setRestaurants,
    setSearchQuery,
    setLocationFilter,
    setPriceRangeFilter,
    setCuisineFilter,
    setItemsPerPage,
    nextPage,
    prevPage,
    goToPage,
    resetFilters,
    setIsDetailsDialogOpen,
    setIsDeleteDialogOpen,
    setIsImportExportOpen
  } = useRestaurantsData();

  // Calculate the indices for the results display
  const indexOfFirstRestaurant = (currentPage - 1) * itemsPerPage;
  const indexOfLastRestaurant = Math.min(currentPage * itemsPerPage, filteredRestaurants.length);

  // Calculate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end page based on current page
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis1');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis2');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <PageLayout
      title="Restaurant Management - Tour Inventory System"
      description="Comprehensive restaurant inventory management for tour operators. Add, edit, and manage restaurant listings with pricing, cuisine types, locations, and booking details."
      keywords={['restaurant management', 'tour inventory', 'dining options', 'restaurant booking', 'cuisine management', 'food services']}
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurant Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Add and manage restaurants in your inventory
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm" 
              onClick={handleImportExport}
            >
              <FileText className="mr-2 h-4 w-4" />
              Import/Export
            </Button>
            <Button 
              onClick={handleAddRestaurant}
              className="bg-brand-blue hover:bg-brand-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Restaurant
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative md:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={locationFilter}
            onValueChange={setLocationFilter}
          >
            <SelectTrigger className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priceRangeFilter}
            onValueChange={setPriceRangeFilter}
          >
            <SelectTrigger className="flex items-center">
              <CircleDollarSign className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="Budget">Budget</SelectItem>
              <SelectItem value="Mid-Range">Mid-Range</SelectItem>
              <SelectItem value="Fine Dining">Fine Dining</SelectItem>
              <SelectItem value="Luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={cuisineFilter}
            onValueChange={setCuisineFilter}
          >
            <SelectTrigger className="flex items-center">
              <Utensils className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(locationFilter !== 'all' || priceRangeFilter !== 'all' || cuisineFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
            
            {searchQuery && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs rounded-full"
                onClick={() => setSearchQuery('')}
              >
                Search: {searchQuery}
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            
            {locationFilter !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs rounded-full"
                onClick={() => setLocationFilter('all')}
              >
                Location: {locationFilter}
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            
            {priceRangeFilter !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs rounded-full"
                onClick={() => setPriceRangeFilter('all')}
              >
                Price: {priceRangeFilter}
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            
            {cuisineFilter !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs rounded-full"
                onClick={() => setCuisineFilter('all')}
              >
                Cuisine: {cuisineFilter}
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-blue-600 hover:text-blue-800"
              onClick={resetFilters}
            >
              Reset all
            </Button>
          </div>
        )}

        {/* Restaurant Display - Table or Grid */}
        {viewMode === 'grid' ? (
          <RestaurantsContent
            filteredRestaurants={filteredRestaurants}
            currentRestaurants={currentRestaurants}
            currentPage={currentPage}
            totalPages={totalPages}
            onViewDetails={handleViewDetails}
            onEdit={handleEditRestaurant}
            onDelete={handleDeleteClick}
            onAddRestaurant={handleAddRestaurant}
            onNextPage={nextPage}
            onPrevPage={prevPage}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Operating Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRestaurants.length > 0 ? (
                  currentRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {restaurant.name}
                          {restaurant.isPreferred && (
                            <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-xs">Preferred</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{restaurant.location || `${restaurant.city}, ${restaurant.country}`}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.cuisineTypes.slice(0, 2).map((cuisine) => (
                            <Badge key={cuisine} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                          {restaurant.cuisineTypes.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{restaurant.cuisineTypes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(restaurant.priceRange || restaurant.priceCategory)} · {restaurant.currencySymbol}{restaurant.averagePrice ?? restaurant.averageCost}
                      </TableCell>
                      <TableCell>{restaurant.openingHours || `${restaurant.openingTime} - ${restaurant.closingTime}`}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(restaurant)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRestaurant(restaurant)}
                            className="text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(restaurant)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center">
                        <Utensils className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No restaurants found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                          There are no restaurants matching your search criteria. Try adjusting your filters or add a new restaurant.
                        </p>
                        <Button 
                          className="mt-4 bg-brand-blue hover:bg-brand-blue/90"
                          onClick={handleAddRestaurant}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Restaurant
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Enhanced Table Pagination */}
            {filteredRestaurants.length > 0 && totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between py-4 px-4 border-t">
                <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                  Showing {indexOfFirstRestaurant + 1} to {Math.min(indexOfLastRestaurant, filteredRestaurants.length)} of {filteredRestaurants.length} restaurants
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={prevPage} 
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        page === 'ellipsis1' || page === 'ellipsis2' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={`page-${page}`}>
                            <PaginationLink
                              onClick={() => typeof page === 'number' && goToPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={nextPage} 
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Restaurant Details Dialog */}
        {selectedRestaurant && (
          <RestaurantDetailsDialog
            restaurant={selectedRestaurant}
            isOpen={isDetailsDialogOpen}
            onClose={() => setIsDetailsDialogOpen(false)}
            onEdit={() => {
              setIsDetailsDialogOpen(false);
              handleEditRestaurant(selectedRestaurant);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this restaurant?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the restaurant
                and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import/Export Drawer */}
        <ImportExportDrawer
          open={isImportExportOpen}
          onOpenChange={setIsImportExportOpen}
          restaurants={restaurants}
          filteredRestaurants={filteredRestaurants}
          saveRestaurants={saveRestaurants}
          setRestaurants={setRestaurants}
          onImportComplete={handleImportComplete}
        />
      </div>
    </PageLayout>
  );
};

export default RestaurantsPage;
