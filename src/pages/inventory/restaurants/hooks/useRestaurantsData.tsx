
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { initialCountries } from '../../countries/data/countryData';
import { initialCities } from '../../cities/data/cityData';
import { Restaurant, CuisineType } from '../types/restaurantTypes';
import { restaurantService } from '@/integrations/supabase/services/restaurantService';

export const useRestaurantsData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Restaurants state fetched from Supabase
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State variables
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(restaurants);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  // Active countries and cities from the system
  const activeCountries = initialCountries.filter(country => country.status === 'active');
  const activeCities = initialCities.filter(city => city.status === 'active');
  
  // Get unique cuisines from restaurants data
  const cuisineTypes = Array.from(new Set(restaurants.flatMap(restaurant => restaurant.cuisineTypes)));
  
  // Get unique locations from restaurants data (prefer explicit location, fallback to city)
  const locations = Array.from(new Set(restaurants.map(restaurant => restaurant.location || restaurant.city)));

  // Apply filters to restaurants
  useEffect(() => {
    // Initial load from Supabase
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const list = await restaurantService.list();
        // Convert service UI type to local Restaurant type by shallow casting
        setRestaurants(list as unknown as Restaurant[]);
      } catch (error) {
        console.error('Failed to load restaurants from Supabase:', error);
        toast({ title: 'Error', description: 'Failed to load restaurants from server.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  // Apply filters to restaurants
  useEffect(() => {
    let result = restaurants.filter(restaurant => {
      const matchesSearch = 
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        restaurant.cuisineTypes.some(cuisine => cuisine.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (restaurant.location || restaurant.city).toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.country.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesLocation = locationFilter === 'all' || (restaurant.location || restaurant.city) === locationFilter;
      const matchesPriceRange = priceRangeFilter === 'all' || restaurant.priceRange === priceRangeFilter;
      const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisineTypes.includes(cuisineFilter as CuisineType);
      
      return matchesSearch && matchesLocation && matchesPriceRange && matchesCuisine;
    });
    
    setFilteredRestaurants(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, locationFilter, priceRangeFilter, cuisineFilter, restaurants]);

  // Pagination logic
  const indexOfLastRestaurant = currentPage * itemsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

  // Save restaurant data
  const saveRestaurant = async (restaurantData: Partial<Restaurant>): Promise<Restaurant> => {
    try {
      // Create or update via Supabase
      let saved;
      if (!restaurantData.id) {
        saved = await restaurantService.create(restaurantData as any);
        toast({ title: 'Success', description: `${restaurantData.name} has been added successfully.` });
      } else {
        saved = await restaurantService.update(String(restaurantData.id), restaurantData as any);
        toast({ title: 'Success', description: `${restaurantData.name} has been updated successfully.` });
      }
      // Update local state
      setRestaurants(prev => {
        const exists = prev.some(r => r.id === saved.id);
        if (exists) return prev.map(r => (r.id === saved.id ? (saved as unknown as Restaurant) : r));
        return [...prev, saved as unknown as Restaurant];
      });
      return saved as unknown as Restaurant;
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({ title: 'Error', description: 'Failed to save restaurant data. Please try again.', variant: 'destructive' });
      throw error;
    }
  };

  // Handle restaurant actions
  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDetailsDialogOpen(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    navigate(`/inventory/restaurants/edit/${restaurant.id}`, { state: { restaurant } });
  };

  const handleDeleteClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRestaurant) {
      (async () => {
        try {
          await restaurantService.delete(selectedRestaurant.id);
          setRestaurants(prev => prev.filter(r => r.id !== selectedRestaurant.id));
          toast({ title: 'Restaurant deleted', description: `${selectedRestaurant.name} has been removed from the system.` });
          setIsDeleteDialogOpen(false);
        } catch (error) {
          console.error('Error deleting restaurant:', error);
          toast({ title: 'Error', description: 'Failed to delete restaurant. Please try again.', variant: 'destructive' });
        }
      })();
    }
  };

  // Handle add new restaurant
  const handleAddRestaurant = () => {
    navigate('/inventory/restaurants/add');
  };

  // Open import/export drawer
  const handleImportExport = () => {
    setIsImportExportOpen(true);
  };

  // Handle import completion
  const handleImportComplete = () => {
    toast({
      title: "Import complete",
      description: "Restaurants have been imported successfully.",
    });
  };

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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setPriceRangeFilter('all');
    setCuisineFilter('all');
  };

  return {
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
    isLoading,
    handleAddRestaurant,
    handleImportExport,
    handleViewDetails,
    handleEditRestaurant,
    handleDeleteClick,
    handleDeleteConfirm,
    handleImportComplete,
    saveRestaurant,
    setRestaurants,
    // Upsert many rows to Supabase for import/export flows
    saveRestaurants: async (updated: Restaurant[]) => {
      try {
        const upserted = await restaurantService.upsertMany(updated as any);
        setRestaurants(upserted as unknown as Restaurant[]);
        return true;
      } catch (error) {
        console.error('Error saving restaurants batch:', error);
        toast({ title: 'Error', description: 'Failed to save imported restaurants.', variant: 'destructive' });
        return false;
      }
    },
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
  };
};

export default useRestaurantsData;
