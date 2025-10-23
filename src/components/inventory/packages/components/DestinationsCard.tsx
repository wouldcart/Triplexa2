
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PackageComponentProps, City } from '../types/packageTypes';
import { useDestinationsData } from './destinations/useDestinationsData';
import CountrySelector from './destinations/CountrySelector';
import CitySelector from './destinations/CitySelector';
import DestinationsList from './destinations/DestinationsList';

const DestinationsCard: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  const { countries, citiesByCountry } = useDestinationsData();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedCities([]);
  };

  const handleAddDestination = () => {
    if (!selectedCountry) return;
    
    const country = countries.find(c => c.id === selectedCountry)?.name || '';
    
    // If no cities selected, add the country with empty cities array
    if (selectedCities.length === 0) {
      const newDestination = {
        country,
        cities: []
      };
      
      const updatedDestinations = [...(packageData.destinations || [])];
      // If country already exists, don't add it again
      if (!updatedDestinations.find(d => d.country === country)) {
        updatedDestinations.push(newDestination);
        updatePackageData({ destinations: updatedDestinations });
      }
    } else {
      // With cities selected, add or update country with cities
      // Ensure we're storing city names as strings, not objects
      const cityNames = selectedCities.map(c => c.name);
      
      const updatedDestinations = [...(packageData.destinations || [])];
      const existingDestination = updatedDestinations.find(d => d.country === country);
      
      if (existingDestination) {
        // Update existing destination with new cities, avoiding duplicates
        existingDestination.cities = [...new Set([...existingDestination.cities, ...cityNames])];
      } else {
        // Add new destination
        updatedDestinations.push({
          country,
          cities: cityNames
        });
      }
      
      updatePackageData({ destinations: updatedDestinations });
      setSelectedCities([]);
    }
  };
  
  const handleRemoveDestination = (country: string, city?: string) => {
    const updatedDestinations = [...(packageData.destinations || [])];
    
    if (city) {
      // Remove specific city from the country
      const countryIndex = updatedDestinations.findIndex(d => d.country === country);
      if (countryIndex >= 0) {
        // Since cities are strings, we can directly filter them
        updatedDestinations[countryIndex].cities = updatedDestinations[countryIndex].cities.filter(c => c !== city);
        
        // If no cities left, remove the country
        if (updatedDestinations[countryIndex].cities.length === 0) {
          updatedDestinations.splice(countryIndex, 1);
        }
      }
    } else {
      // Remove entire country
      const countryIndex = updatedDestinations.findIndex(d => d.country === country);
      if (countryIndex >= 0) {
        updatedDestinations.splice(countryIndex, 1);
      }
    }
    
    updatePackageData({ destinations: updatedDestinations });
  };
  
  const handleCityMultiSelect = (id: string, checked: boolean) => {
    if (!selectedCountry) return;
    
    const availableCities = citiesByCountry[selectedCountry] || [];
    const city = availableCities.find(c => c.id === id);
    if (!city) return;
    
    if (checked) {
      setSelectedCities(prev => [...prev, city]);
    } else {
      setSelectedCities(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Destinations Covered*</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CountrySelector
            countries={countries}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
          />
          
          <CitySelector
            selectedCountry={selectedCountry}
            citiesByCountry={citiesByCountry}
            selectedCities={selectedCities}
            onCityToggle={handleCityMultiSelect}
            onAddDestination={handleAddDestination}
          />
        </div>
        
        <DestinationsList
          destinations={packageData.destinations || []}
          onRemoveDestination={handleRemoveDestination}
        />
      </CardContent>
    </Card>
  );
};

export default DestinationsCard;
