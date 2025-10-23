
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Country } from '../types/country';
import { CountriesService } from '@/services/countriesService';
import { mapDbCountriesToFrontend } from '@/services/countryMapper';
import { useRealTimeCountries } from '@/hooks/useRealTimeCountries';
import { SearchType } from '../components/CountriesFilters';

export const useCountriesData = (hiddenCountries: string[] = []) => {
  // Use real-time countries hook
  const { countries, loading, refreshCountries } = useRealTimeCountries();
  
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [continentFilter, setContinentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Add missing state variables
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [editFormData, setEditFormData] = useState<Country | null>(null);
  const [newCountryData, setNewCountryData] = useState<Omit<Country, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    code: '',
    continent: '',
    region: '',
    currency: '',
    currency_symbol: '',
    flag_url: '',
    is_popular: false,
    visa_required: false,
    languages: [],
    status: 'active',
    pricing_currency_override: false,
    pricing_currency: '',
    pricing_currency_symbol: ''
  });
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Filter countries based on search query and filters
  useEffect(() => {
    const filtered = countries.filter(country => {
      // First check if the country is hidden from UI
      const isHidden = hiddenCountries.includes(country.id);
      if (isHidden) return false;
      
      let matchesSearch = true;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        
        switch (searchType) {
          case 'name':
            matchesSearch = country.name.toLowerCase().includes(query);
            break;
          case 'code':
            matchesSearch = country.code.toLowerCase().includes(query);
            break;
          case 'currency':
            matchesSearch = country.currency.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch = 
              country.name.toLowerCase().includes(query) || 
              country.code.toLowerCase().includes(query) ||
              country.currency.toLowerCase().includes(query);
            break;
        }
      }
      
      const matchesContinent = continentFilter === 'all' || country.continent === continentFilter;
      const matchesStatus = statusFilter === 'all' || country.status === statusFilter;
      
      return matchesSearch && matchesContinent && matchesStatus;
    });
    
    setFilteredCountries(filtered);
  }, [searchQuery, searchType, continentFilter, statusFilter, countries, hiddenCountries]);

  // Reset to first page only when filters change (not when countries data updates)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, continentFilter, statusFilter]);

  // Get paginated data
  const safeItemsPerPage = itemsPerPage && itemsPerPage > 0 ? itemsPerPage : 5; // Default to 5 if invalid
  const indexOfLastItem = currentPage * safeItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - safeItemsPerPage;
  const currentCountries = filteredCountries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = filteredCountries.length > 0 ? Math.ceil(filteredCountries.length / safeItemsPerPage) : 1;

  // Get unique continents for the filter
  const availableContinents = Array.from(new Set(countries.map(country => country.continent)));

  // Pagination functions
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

  // Function to reset the new country form
  const resetNewCountryForm = () => {
    setNewCountryData({
      name: '',
      code: '',
      continent: '',
      region: '',
      currency: '',
      currency_symbol: '',
      flag_url: '',
      is_popular: false,
      visa_required: false,
      languages: [],
      status: 'active',
      pricing_currency_override: false,
      pricing_currency: '',
      pricing_currency_symbol: ''
    });
  };

  return {
    countries,
    currentCountries,
    filteredCountries,
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
    itemsPerPage: safeItemsPerPage,
    setItemsPerPage,
    availableContinents,
    nextPage,
    prevPage,
    goToPage,
    indexOfFirstItem,
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
    refreshCountries
  };
};
