
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import PageLayout from '@/components/layout/PageLayout';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Grid3X3, 
  List, 
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Home
} from 'lucide-react';
import type { Sightseeing as SightseeingType } from '@/types/sightseeing';
import { useSightseeingData } from './sightseeing/hooks/useSightseeingData';
import { useSightseeingActions } from './sightseeing/hooks/useSightseeingActions';
import SightseeingCard from './sightseeing/components/SightseeingCard';
import SightseeingTable from './sightseeing/components/SightseeingTable';
import SightseeingViewDrawer from './sightseeing/components/SightseeingViewDrawer';
import SightseeingDeleteDialog from './sightseeing/components/SightseeingDeleteDialog';
import { getExpirationStatus, getExpirationStats } from './sightseeing/services/expirationService';

const Sightseeing: React.FC = () => {
  const {
    sightseeings,
    setSightseeings,
    loading,
    addSightseeing,
    updateSightseeing,
    deleteSightseeing
  } = useSightseeingData();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSightseeing, setSelectedSightseeing] = useState<SightseeingType | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Import/Export removed for remote-only data policy

  const {
    handleViewSightseeing,
    handleEditSightseeing,
    handleDeleteSightseeing,
    handleDuplicateSightseeing,
    handleToggleStatus,
    handleConfirmDelete
  } = useSightseeingActions({
    sightseeings,
    setSightseeings,
    setSelectedSightseeing,
    setViewDrawerOpen,
    setDeleteDialogOpen
  });

  const itemsPerPage = 12;

  // Get unique filter options
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(sightseeings.map(s => s.country))].sort();
    return uniqueCountries;
  }, [sightseeings]);

  const cities = useMemo(() => {
    const filtered = selectedCountry === 'all' 
      ? sightseeings 
      : sightseeings.filter(s => s.country === selectedCountry);
    return [...new Set(filtered.map(s => s.city))].sort();
  }, [sightseeings, selectedCountry]);

  const categories = useMemo(() => {
    const allCategories = sightseeings
      .map(s => s.category)
      .filter(Boolean)
      .flatMap(cat => cat!.split(', '))
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .sort();
    return allCategories;
  }, [sightseeings]);

  // Filter and search logic
  const filteredSightseeings = useMemo(() => {
    return sightseeings.filter(sightseeing => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        sightseeing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sightseeing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sightseeing.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sightseeing.description && sightseeing.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Country filter
      const matchesCountry = selectedCountry === 'all' || sightseeing.country === selectedCountry;

      // City filter
      const matchesCity = selectedCity === 'all' || sightseeing.city === selectedCity;

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        (sightseeing.category && sightseeing.category.includes(selectedCategory));

      // Status filter
      const matchesStatus = selectedStatus === 'all' || sightseeing.status === selectedStatus;

      // Price filter
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && sightseeing.isFree) ||
        (priceFilter === 'paid' && !sightseeing.isFree);

      // Expiration filter
      const matchesExpiration = !showExpiredOnly || getExpirationStatus(sightseeing) === 'expired';

      return matchesSearch && matchesCountry && matchesCity && matchesCategory && 
             matchesStatus && matchesPrice && matchesExpiration;
    });
  }, [sightseeings, searchQuery, selectedCountry, selectedCity, selectedCategory, selectedStatus, priceFilter, showExpiredOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredSightseeings.length / itemsPerPage);
  const paginatedSightseeings = filteredSightseeings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = getExpirationStats(sightseeings);

  // Event handlers
  const handleView = (sightseeing: SightseeingType) => {
    handleViewSightseeing(sightseeing.id);
  };

  const handleEdit = (sightseeing: SightseeingType) => {
    handleEditSightseeing(sightseeing.id);
  };

  const handleDelete = (sightseeing: SightseeingType) => {
    handleDeleteSightseeing(sightseeing.id);
  };

  const handleDuplicate = (sightseeing: SightseeingType) => {
    handleDuplicateSightseeing(sightseeing.id);
  };

  const handleToggleStatusWrapper = (sightseeing: SightseeingType) => {
    handleToggleStatus(sightseeing.id);
  };

  const handleDeleteConfirm = () => {
    if (selectedSightseeing) {
      handleConfirmDelete(selectedSightseeing.id);
      setSelectedSightseeing(null);
    }
  };

  const handleAddNew = () => {
    window.location.href = '/inventory/sightseeing/add';
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedCity('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setPriceFilter('all');
    setShowExpiredOnly(false);
    setCurrentPage(1);
  };

  const handleFilterExpired = () => {
    setShowExpiredOnly(!showExpiredOnly);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading sightseeings...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sightseeing Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your sightseeing inventory and experiences
            </p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Sightseeing
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sightseeings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.valid}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringSoon}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search sightseeings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country: string) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city: string) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="expired-filter"
                  checked={showExpiredOnly}
                  onCheckedChange={setShowExpiredOnly}
                />
                <Label htmlFor="expired-filter" className="text-sm">
                  Expired Only
                </Label>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSightseeings.length} of {sightseeings.length} sightseeings
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Reset Filters
                </Button>
                {/* Import/Export removed for remote-only data policy */}
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
          <TabsContent value="grid" className="space-y-4">
            {paginatedSightseeings.length === 0 ? (
              <Card className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No sightseeings found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || selectedCountry !== 'all' || selectedCity !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by adding your first sightseeing experience.'
                  }
                </p>
                {(!searchQuery && selectedCountry === 'all' && selectedCity === 'all' && selectedCategory === 'all' && selectedStatus === 'all') && (
                  <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Sightseeing
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSightseeings.map((sightseeing) => (
                  <SightseeingCard
                    key={sightseeing.id}
                    sightseeing={sightseeing}
                    onView={() => handleView(sightseeing)}
                    onEdit={() => handleEdit(sightseeing)}
                    onDelete={() => handleDelete(sightseeing)}
                    onDuplicate={() => handleDuplicate(sightseeing)}
                    onToggleStatus={() => handleToggleStatusWrapper(sightseeing)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table">
            <SightseeingTable
              sightseeings={paginatedSightseeings}
              onView={handleViewSightseeing}
              onEdit={handleEditSightseeing}
              onDelete={handleDeleteSightseeing}
              onDuplicate={handleDuplicateSightseeing}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Dialogs and Drawers */}
        <SightseeingViewDrawer
          sightseeing={selectedSightseeing}
          open={viewDrawerOpen}
          onOpenChange={setViewDrawerOpen}
          onEdit={() => {
            setViewDrawerOpen(false);
            if (selectedSightseeing) handleEdit(selectedSightseeing);
          }}
        />

        <SightseeingDeleteDialog
          sightseeing={selectedSightseeing}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
        />

        {/* Import/Export drawer removed for remote-only data policy */}
      </div>
    </PageLayout>
  );
};

export default Sightseeing;
