import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Calendar, MapPin, Users, Grid, List, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import PackageCard from '@/components/inventory/packages/PackageCard';
import { loadPackages, deletePackage, savePackages, updatePackage } from './packages/services/storageService';
import { TourPackage } from '@/types/package';

const Packages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load package data on component mount
  useEffect(() => {
    const data = loadPackages();
    setPackages(data);
  }, []);

  // Filter packages based on search query and active tab
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        pkg.destinations.some(dest => 
                          dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dest.cities.some(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
                        );
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'published') return matchesSearch && pkg.status === 'published';
    if (activeTab === 'drafts') return matchesSearch && pkg.status === 'draft';
    
    return matchesSearch;
  });

  const handleCreatePackage = () => {
    navigate('/inventory/packages/create');
  };

  const handleDeletePackage = (id: string) => {
    // Delete from local state
    const updatedPackages = packages.filter(pkg => pkg.id !== id);
    setPackages(updatedPackages);
    
    // Delete from storage
    deletePackage(id);
    
    toast({
      title: "Package deleted",
      description: "The package has been deleted successfully."
    });
  };
  
  const handleStatusChange = (id: string, newStatus: 'draft' | 'published') => {
    // Update local state
    const updatedPackages = packages.map(pkg => 
      pkg.id === id ? { ...pkg, status: newStatus } : pkg
    );
    setPackages(updatedPackages);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-4 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <LayoutGrid className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Tour Packages
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Create and manage custom tour packages with detailed itineraries
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{packages.filter(pkg => pkg.status === 'published').length} Published</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{packages.filter(pkg => pkg.status === 'draft').length} Drafts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{packages.length} Total</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleCreatePackage} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-6 py-3 text-base font-medium rounded-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Create Package</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search packages by name, destination, theme..."
                  className="pl-12 h-12 text-base border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-lg"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-lg"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              <TabsList className="grid grid-cols-3 w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-1 gap-1">
                <TabsTrigger value="all" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2 px-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                  All Packages
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                    {packages.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="published" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2 px-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Published
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                    {packages.filter(pkg => pkg.status === 'published').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-md rounded-lg py-2 px-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Drafts
                  <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs">
                    {packages.filter(pkg => pkg.status === 'draft').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              {filteredPackages.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {filteredPackages.map((pkg) => (
                    <PackageCard 
                      key={pkg.id} 
                      packageData={pkg} 
                      onDelete={() => handleDeletePackage(pkg.id)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6 mb-6">
                      <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No packages found</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-lg">
                      {searchQuery 
                        ? `No packages match your search criteria. Try adjusting your search.` 
                        : `You haven't created any packages yet. Create your first package to get started.`}
                    </p>
                    <Button 
                      onClick={handleCreatePackage} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-6 py-3 text-base font-medium rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Your First Package</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="published" className="mt-0">
              {filteredPackages.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {filteredPackages.map((pkg) => (
                    <PackageCard 
                      key={pkg.id} 
                      packageData={pkg} 
                      onDelete={() => handleDeletePackage(pkg.id)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-6 mb-6">
                      <Calendar className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No published packages</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-lg">
                      {searchQuery 
                        ? `No published packages match your search criteria.` 
                        : `You haven't published any packages yet. Create and publish a package to get started.`}
                    </p>
                    <Button 
                      onClick={handleCreatePackage} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-6 py-3 text-base font-medium rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Package</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="drafts" className="mt-0">
              {filteredPackages.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {filteredPackages.map((pkg) => (
                    <PackageCard 
                      key={pkg.id} 
                      packageData={pkg} 
                      onDelete={() => handleDeletePackage(pkg.id)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 p-6 mb-6">
                      <Calendar className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No draft packages</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-lg">
                      {searchQuery 
                        ? `No draft packages match your search criteria.` 
                        : `You don't have any packages saved as drafts.`}
                    </p>
                    <Button 
                      onClick={handleCreatePackage} 
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 px-6 py-3 text-base font-medium rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Package</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default Packages;
