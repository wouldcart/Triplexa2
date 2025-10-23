
import { useState, useMemo } from 'react';
import { Query } from '@/types/query';

export interface QueryFilters {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  agentFilter: string[];
  countryFilter: string[];
  packageTypeFilter: string[];
  hotelCategoryFilter: string[];
  paxRange: { min: number; max: number };
  travelDateRange: { from: string; to: string };
}

export const useQueryFilters = (queries: Query[]) => {
  const [filters, setFilters] = useState<QueryFilters>({
    searchTerm: '',
    statusFilter: 'all',
    dateFilter: 'all',
    agentFilter: [],
    countryFilter: [],
    packageTypeFilter: [],
    hotelCategoryFilter: [],
    paxRange: { min: 0, max: 20 },
    travelDateRange: { from: '', to: '' }
  });

  // Get unique filter options from queries
  const filterOptions = useMemo(() => {
    const agents = [...new Set(queries.map(q => q.agentName))].sort();
    const countries = [...new Set(queries.map(q => q.destination.country))].sort();
    const packageTypes = [...new Set(queries.map(q => q.packageType))].sort();
    const hotelCategories = [...new Set(queries.map(q => q.hotelDetails.category))].sort();
    
    return {
      agents,
      countries,
      packageTypes,
      hotelCategories
    };
  }, [queries]);

  // Filter queries based on current filters
  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      // Search term filter
      const matchesSearch = filters.searchTerm === '' ||
        query.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        query.agentName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        query.destination.country.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        query.destination.cities.some(city => city.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = filters.statusFilter === 'all' || query.status === filters.statusFilter;
      
      // Date filter
      const matchesDate = filters.dateFilter === 'all' || (() => {
        const createdDate = new Date(query.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateFilter) {
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          default: return true;
        }
      })();

      // Agent filter
      const matchesAgent = filters.agentFilter.length === 0 || 
        filters.agentFilter.includes(query.agentName);

      // Country filter
      const matchesCountry = filters.countryFilter.length === 0 || 
        filters.countryFilter.includes(query.destination.country);

      // Package type filter
      const matchesPackageType = filters.packageTypeFilter.length === 0 || 
        filters.packageTypeFilter.includes(query.packageType);

      // Hotel category filter
      const matchesHotelCategory = filters.hotelCategoryFilter.length === 0 || 
        filters.hotelCategoryFilter.includes(query.hotelDetails.category);

      // PAX range filter
      const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;
      const matchesPaxRange = totalPax >= filters.paxRange.min && totalPax <= filters.paxRange.max;

      // Travel date range filter
      const matchesTravelDateRange = !filters.travelDateRange.from || !filters.travelDateRange.to ||
        (query.travelDates.from >= filters.travelDateRange.from && 
         query.travelDates.to <= filters.travelDateRange.to);
      
      return matchesSearch && matchesStatus && matchesDate && matchesAgent && 
             matchesCountry && matchesPackageType && matchesHotelCategory && 
             matchesPaxRange && matchesTravelDateRange;
    });
  }, [queries, filters]);

  const updateFilter = (key: keyof QueryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateFilter: 'all',
      agentFilter: [],
      countryFilter: [],
      packageTypeFilter: [],
      hotelCategoryFilter: [],
      paxRange: { min: 0, max: 20 },
      travelDateRange: { from: '', to: '' }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statusFilter !== 'all') count++;
    if (filters.dateFilter !== 'all') count++;
    if (filters.agentFilter.length > 0) count++;
    if (filters.countryFilter.length > 0) count++;
    if (filters.packageTypeFilter.length > 0) count++;
    if (filters.hotelCategoryFilter.length > 0) count++;
    if (filters.paxRange.min > 0 || filters.paxRange.max < 20) count++;
    if (filters.travelDateRange.from || filters.travelDateRange.to) count++;
    return count;
  };

  return {
    filters,
    filteredQueries,
    filterOptions,
    updateFilter,
    clearAllFilters,
    activeFiltersCount: getActiveFiltersCount()
  };
};
