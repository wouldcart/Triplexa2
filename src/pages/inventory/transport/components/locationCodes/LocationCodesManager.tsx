
import React, { useState, useEffect } from 'react';
import LocationCodesHeader from './LocationCodesHeader';
import LocationCodesTable from './LocationCodesTable';
import LocationCodesPagination from './LocationCodesPagination';
import LocationCodeAddSheet from '../LocationCodeAddSheet';
import LocationCodeEditSheet from '../LocationCodeEditSheet';
import LocationCodeViewSheet from '../LocationCodeViewSheet';
import LocationCodeDeleteDialog from '../LocationCodeDeleteDialog';
import { useTransportData } from '../../hooks/useTransportData';
import { useCitiesData } from '@/hooks/useCitiesData';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LocationCode } from '../../types/transportTypes';
import {
  listLocationCodes,
  createLocationCode,
  updateLocationCode as updateLocationCodeRemote,
  deleteLocationCode as deleteLocationCodeRemote,
} from '@/services/locationCodesService';


// Sample UAE location codes data
const sampleUAELocationCodes: Omit<LocationCode, 'id'>[] = [
  // Dubai Airports
  {
    code: 'DXB',
    fullName: 'Dubai International Airport',
    category: 'airport',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.2532',
    longitude: '55.3657',
    status: 'active',
    notes: 'Main international airport serving Dubai'
  },
  {
    code: 'DWC',
    fullName: 'Al Maktoum International Airport',
    category: 'airport',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '24.8967',
    longitude: '55.1614',
    status: 'active',
    notes: 'Dubai World Central airport, also known as Dubai South'
  },
  // Abu Dhabi Airport
  {
    code: 'AUH',
    fullName: 'Abu Dhabi International Airport',
    category: 'airport',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    latitude: '24.4330',
    longitude: '54.6511',
    status: 'active',
    notes: 'Main international airport serving Abu Dhabi'
  },
  // Sharjah Airport
  {
    code: 'SHJ',
    fullName: 'Sharjah International Airport',
    category: 'airport',
    country: 'United Arab Emirates',
    city: 'Sharjah',
    latitude: '25.3285',
    longitude: '55.5172',
    status: 'active',
    notes: 'International airport serving Sharjah'
  },
  // Dubai Hotels
  {
    code: 'BURJ',
    fullName: 'Burj Al Arab Jumeirah',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.1412',
    longitude: '55.1853',
    status: 'active',
    notes: 'World-famous sail-shaped luxury hotel'
  },
  {
    code: 'ATLS',
    fullName: 'Atlantis The Palm Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.1308',
    longitude: '55.1173',
    status: 'active',
    notes: 'Iconic resort hotel on Palm Jumeirah'
  },
  {
    code: 'JWMD',
    fullName: 'JW Marriott Marquis Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.1857',
    longitude: '55.2441',
    status: 'active',
    notes: 'Twin tower luxury hotel in Business Bay'
  },
  {
    code: 'ARMN',
    fullName: 'Armani Hotel Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.1972',
    longitude: '55.2744',
    status: 'active',
    notes: 'Luxury hotel in Burj Khalifa designed by Giorgio Armani'
  },
  {
    code: 'ADDR',
    fullName: 'Address Downtown Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.1918',
    longitude: '55.2756',
    status: 'active',
    notes: 'Luxury hotel overlooking Dubai Fountain and Burj Khalifa'
  },
  {
    code: 'FOUR',
    fullName: 'Four Seasons Resort Dubai at Jumeirah Beach',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.2166',
    longitude: '55.2294',
    status: 'active',
    notes: 'Beachfront luxury resort with private beach access'
  },
  {
    code: 'RITZ',
    fullName: 'The Ritz-Carlton Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.2319',
    longitude: '55.2697',
    status: 'active',
    notes: 'Luxury beach resort on JBR Beach'
  },
  {
    code: 'PARK',
    fullName: 'Park Hyatt Dubai',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: '25.2370',
    longitude: '55.3429',
    status: 'active',
    notes: 'Luxury resort on Dubai Creek with marina and spa'
  },
  // Abu Dhabi Hotels
  {
    code: 'EMPL',
    fullName: 'Emirates Palace Abu Dhabi',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    latitude: '24.4619',
    longitude: '54.3178',
    status: 'active',
    notes: 'Luxury palace hotel in Abu Dhabi'
  },
  {
    code: 'SLUX',
    fullName: 'The St. Regis Saadiyat Island Resort',
    category: 'hotel',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    latitude: '24.5588',
    longitude: '54.4322',
    status: 'active',
    notes: 'Beachfront luxury resort on Saadiyat Island'
  }
];

const LocationCodesManager: React.FC = () => {
  const { 
    locations, 
    setLocations,
    toast
  } = useTransportData();
  
  // Use shared cities data hook to get active countries
  const { getActiveCountries, getCitiesByCountry } = useCitiesData();
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedLocationCode, setSelectedLocationCode] = useState<LocationCode | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sampleDataImported, setSampleDataImported] = useState(false);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Get countries and cities from shared data
  const countries = getActiveCountries();
  const cities = countryFilter === 'All' ? [] : getCitiesByCountry(countryFilter);

  // Load remote location codes on component mount
  useEffect(() => {
    const fetchRemote = async () => {
      try {
        const rows = await listLocationCodes();
        const mapped: LocationCode[] = rows.map(mapRowToUI);
        
        // If database is empty, use sample data to provide a better user experience
        if (mapped.length === 0) {
          console.log('Database is empty, loading sample UAE location codes');
          setIsDatabaseEmpty(true);
          const sampleData: LocationCode[] = sampleUAELocationCodes.map(sample => ({
            ...sample,
            id: uuidv4()
          }));
          setLocations(sampleData);
          
          // Optionally save sample data to localStorage for consistency
          localStorage.setItem('locationCodes', JSON.stringify(sampleData));
        } else {
          setIsDatabaseEmpty(false);
          setLocations(mapped);
        }
      } catch (error) {
        console.error('Failed to load location codes from Supabase:', error);
        // Fallback to any existing local data
        const existingData = localStorage.getItem('locationCodes');
        const existingCodes = existingData ? JSON.parse(existingData) : [];
        
        if (existingCodes.length) {
          setLocations(existingCodes);
        } else {
          // If no local data either, use sample data
          console.log('No local data found, loading sample UAE location codes');
          const sampleData: LocationCode[] = sampleUAELocationCodes.map(sample => ({
            ...sample,
            id: uuidv4()
          }));
          setLocations(sampleData);
          localStorage.setItem('locationCodes', JSON.stringify(sampleData));
        }
      }
    };
    fetchRemote();
  }, [setLocations]);
  
  // Open add sheet
  const handleAddClick = () => {
    setIsAddSheetOpen(true);
  };

  // Import sample data to database
  const handleImportSampleData = async () => {
    try {
      console.log('Importing sample UAE location codes to database...');
      const importedCodes: LocationCode[] = [];
      
      for (const sample of sampleUAELocationCodes) {
        try {
          const inserted = await createLocationCode(mapUIToInsert(sample));
          const mapped = mapRowToUI(inserted);
          importedCodes.push(mapped);
        } catch (error) {
          console.error(`Failed to import ${sample.code}:`, error);
        }
      }
      
      if (importedCodes.length > 0) {
        // Refresh the locations list
        const rows = await listLocationCodes();
        const mapped: LocationCode[] = rows.map(mapRowToUI);
        setLocations(mapped);
        setIsDatabaseEmpty(false);
        
        toast({
          title: "Sample data imported",
          description: `Successfully imported ${importedCodes.length} location codes to the database.`
        });
      }
    } catch (error) {
      console.error('Failed to import sample data:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to import sample data to database', 
        variant: 'destructive' 
      });
    }
  };
  
  // Handle adding a new location code
  const handleAddLocationCode = async (newLocationCode: Omit<LocationCode, 'id'>) => {
    try {
      const inserted = await createLocationCode(mapUIToInsert(newLocationCode));
      const mapped = mapRowToUI(inserted);
      setLocations([...locations, mapped]);
      setIsAddSheetOpen(false);
      toast({
        title: "Location code added",
        description: `${mapped.code} has been added successfully.`
      });
    } catch (error) {
      console.error('Failed to add location code:', error);
      toast({ title: 'Error', description: 'Failed to add location code', variant: 'destructive' });
    }
  };
  
  // Handle editing a location code
  const handleEditLocationCode = (locationCode: LocationCode) => {
    setSelectedLocationCode(locationCode);
    setIsEditOpen(true);
  };
  
  // Handle viewing location code details
  const handleViewLocationCode = (locationCode: LocationCode) => {
    setSelectedLocationCode(locationCode);
    setIsViewOpen(true);
  };
  
  // Handle deleting a location code
  const handleDeleteLocationCode = (locationCode: LocationCode) => {
    setSelectedLocationCode(locationCode);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    if (selectedLocationCode) {
      try {
        await deleteLocationCodeRemote(selectedLocationCode.id);
        const updatedLocations = locations.filter(loc => loc.id !== selectedLocationCode.id);
        setLocations(updatedLocations);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Location code deleted",
          description: `${selectedLocationCode.code} has been removed.`
        });
      } catch (error) {
        console.error('Failed to delete location code:', error);
        toast({ title: 'Error', description: 'Failed to delete location code', variant: 'destructive' });
      }
    }
  };
  
  // Handle updating a location code
  const handleUpdateLocationCode = async (updatedLocationCode: LocationCode) => {
    try {
      const updatedRow = await updateLocationCodeRemote(updatedLocationCode.id, mapUIToUpdate(updatedLocationCode));
      const mapped = mapRowToUI(updatedRow);
      const updatedLocations = locations.map(loc => (loc.id === mapped.id ? mapped : loc));
      setLocations(updatedLocations);
      setIsEditOpen(false);
      toast({
        title: "Location code updated",
        description: `${mapped.code} has been updated successfully.`
      });
    } catch (error) {
      console.error('Failed to update location code:', error);
      toast({ title: 'Error', description: 'Failed to update location code', variant: 'destructive' });
    }
  };

  // Handle toggle status
  const handleToggleStatus = (locationCode: LocationCode) => {
    const updatedLocationCode = {
      ...locationCode,
      status: locationCode.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive'
    };
    void handleUpdateLocationCode(updatedLocationCode);
  };
  
  // Filter location codes based on search query and filters
  const filteredLocationCodes = locations.filter(loc => {
    const matchesSearch = 
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = countryFilter === 'All' || loc.country === countryFilter;
    const matchesCategory = categoryFilter === 'All' || loc.category === categoryFilter;
    
    return matchesSearch && matchesCountry && matchesCategory;
  });
  
  // Get available countries from active countries and actual location data
  const availableCountries = ['All', ...new Set([
    ...countries.map(country => country.name),
    ...locations.map(loc => loc.country).filter(Boolean)
  ])];
  
  const categories = ['All', ...new Set(locations.map(loc => loc.category).filter(Boolean))];
  
  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLocationCodes.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLocationCodes.slice(indexOfFirstItem, indexOfLastItem);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, categoryFilter, itemsPerPage]);
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  
  return (
    <div className="space-y-6">
      <LocationCodesHeader 
        onAddClick={handleAddClick} 
        onImportSampleData={handleImportSampleData}
        showImportButton={isDatabaseEmpty}
      />
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search location codes..."
            className="w-full px-3 py-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          {availableCountries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-md"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      {/* Location Codes Table */}
      <div className="border rounded-lg">
        <LocationCodesTable
          locations={currentItems}
          onEdit={handleEditLocationCode}
          onDelete={handleDeleteLocationCode}
          onView={handleViewLocationCode}
          onToggleStatus={handleToggleStatus}
        />
        
        {/* Pagination */}
        <LocationCodesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLocationCodes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={Math.min(indexOfLastItem, filteredLocationCodes.length)}
        />
      </div>
      
      {/* Location Codes Map View */}
      
      
      {/* Empty state */}
      {filteredLocationCodes.length === 0 && (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No location codes found matching your filters
          </p>
          <Button onClick={handleAddClick} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add New Location Code
          </Button>
        </div>
      )}
      
      {/* Add sheet */}
      <LocationCodeAddSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={handleAddLocationCode}
        countries={countries}
        cities={cities}
      />
      
      {/* Edit sheet */}
      <LocationCodeEditSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateLocationCode}
        locationCode={selectedLocationCode}
        countries={countries}
        cities={cities}
      />
      
      {/* View sheet */}
      <LocationCodeViewSheet
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        locationCode={selectedLocationCode}
      />
      
      {/* Delete dialog */}
      <LocationCodeDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        locationCode={selectedLocationCode}
      />
    </div>
  );
};

export default LocationCodesManager;

// Helpers to map between DB rows and UI object
function mapRowToUI(row: any): LocationCode {
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    category: row.category,
    country: row.country,
    city: row.city,
    status: row.status,
    notes: row.notes ?? undefined,
    latitude: row.latitude != null ? String(row.latitude) : undefined,
    longitude: row.longitude != null ? String(row.longitude) : undefined,
  };
}

function mapUIToInsert(loc: Omit<LocationCode, 'id'>) {
  return {
    code: loc.code,
    full_name: loc.fullName,
    category: loc.category,
    country: loc.country,
    city: loc.city,
    status: loc.status,
    notes: loc.notes ?? null,
    latitude: loc.latitude && loc.latitude.trim() !== '' ? Number(loc.latitude) : null,
    longitude: loc.longitude && loc.longitude.trim() !== '' ? Number(loc.longitude) : null,
  };
}

function mapUIToUpdate(loc: LocationCode) {
  return {
    code: loc.code,
    full_name: loc.fullName,
    category: loc.category,
    country: loc.country,
    city: loc.city,
    status: loc.status,
    notes: loc.notes ?? null,
    latitude: loc.latitude && loc.latitude.trim() !== '' ? Number(loc.latitude) : null,
    longitude: loc.longitude && loc.longitude.trim() !== '' ? Number(loc.longitude) : null,
  };
}
