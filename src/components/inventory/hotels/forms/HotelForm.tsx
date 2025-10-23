import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import BasicInfoSection from './hotel-form/BasicInfoSection';
import DescriptionSection from './hotel-form/DescriptionSection';
import AddressSection from './hotel-form/AddressSection';
import LocationSection from './hotel-form/LocationSection';
import CheckInOutSection from './hotel-form/CheckInOutSection';
import StatusSection from './hotel-form/StatusSection';
import ImagesSection from './hotel-form/ImagesSection';
import AmenitiesSection from './hotel-form/AmenitiesSection';
import { initialCities } from '@/pages/inventory/cities/data/cityData';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import { useToast } from '@/hooks/use-toast';
import { Country } from '@/pages/inventory/countries/types/country';
import { Hotel, StarRating, HotelStatus } from '../types/hotel';
// Removed legacy transport currency utils; currency now derives from countries override

interface HotelFormProps {
  hotel?: Hotel; 
  onSubmit: (data: any) => void;
  onCancel: () => void;
  externalId?: number | null;
  isGeneratingExternalId?: boolean;
  onRegenerateExternalId?: () => void;
  isSubmitting?: boolean;
}

const HotelForm: React.FC<HotelFormProps> = ({ 
  hotel, 
  onSubmit, 
  onCancel, 
  externalId, 
  isGeneratingExternalId, 
  onRegenerateExternalId, 
  isSubmitting 
}) => {
  // Access toast notifications
  const { toast } = useToast();
  const { activeCountries: countries, loading } = useRealTimeCountriesData();
  
  // Get current date for default values
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  
  // Form state
  const [formData, setFormData] = useState<Partial<Hotel>>({
    name: hotel?.name || '',
    starRating: hotel?.starRating || 3,
    category: hotel?.category || '',
    description: hotel?.description || '',
    country: hotel?.country || '',
    city: hotel?.city || '',
    location: hotel?.location || '',
    address: hotel?.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    latitude: hotel?.latitude || 0,
    longitude: hotel?.longitude || 0,
    googleMapLink: hotel?.googleMapLink || '',
    contactInfo: hotel?.contactInfo || {
      phone: '',
      email: '',
      website: ''
    },
    checkInTime: hotel?.checkInTime || '14:00',
    checkOutTime: hotel?.checkOutTime || '12:00',
    policies: hotel?.policies || {
      cancellation: '',
      children: '',
      pets: '',
      payment: ''
    },
    status: hotel?.status || 'draft',
    facilities: hotel?.facilities || [],
    amenities: hotel?.amenities || [],
    images: hotel?.images || [],
    roomTypes: hotel?.roomTypes || [],
    createdAt: hotel?.createdAt || formattedDate,
    updatedAt: hotel?.updatedAt || formattedDate,
    lastUpdated: hotel?.lastUpdated || formattedDate,
    currency: hotel?.currency || 'USD',
    currencySymbol: hotel?.currencySymbol || '$'
  });
  
  // State for cities
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Load cities data when country changes
  useEffect(() => {
    if (formData.country) {
      const citiesForCountry = initialCities
        .filter(city => city.country === formData.country)
        .map(city => city.name);
      setAvailableCities(citiesForCountry);
    } else {
      setAvailableCities([]);
    }
  }, [formData.country]);
  
  // Update available cities when country changes
  useEffect(() => {
    if (formData.country) {
      const citiesInCountry = initialCities
        .filter(city => city.country === formData.country)
        .map(city => city.name);
        
      setAvailableCities([...new Set(citiesInCountry)]);
    } else {
      setAvailableCities([]);
    }
  }, [formData.country]);

  // Ensure currency auto-syncs with countries (including on edit initial load)
  useEffect(() => {
    if (!formData.country || !countries || countries.length === 0) return;
    const selectedCountry = countries.find(c => c.name === formData.country);
    if (!selectedCountry) return;

    let currencyCode = selectedCountry.currency || 'USD';
    let currencySymbol = selectedCountry.currency_symbol || '$';
    if (selectedCountry.pricing_currency_override === true) {
      currencyCode = selectedCountry.pricing_currency || currencyCode;
      currencySymbol = selectedCountry.pricing_currency_symbol || currencySymbol;
    }

    if (formData.currency !== currencyCode || formData.currencySymbol !== currencySymbol) {
      setFormData(prev => ({
        ...prev,
        currency: currencyCode,
        currencySymbol,
      }));
    }
  }, [countries, formData.country]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle star rating changes
  const handleStarRatingChange = (value: StarRating) => {
    setFormData(prev => ({
      ...prev,
      starRating: value
    }));
  };
  
  // Handle country changes
  const handleCountryChange = (countryName: string) => {
    // Determine currency from countries table with override logic
    let currencyCode = 'USD';
    let currencySymbol = '$';

    const selectedCountry = countries?.find(c => c.name === countryName);
    if (selectedCountry) {
      currencyCode = selectedCountry.currency || 'USD';
      currencySymbol = selectedCountry.currency_symbol || '$';

      if (selectedCountry.pricing_currency_override === true) {
        currencyCode = selectedCountry.pricing_currency || currencyCode;
        currencySymbol = selectedCountry.pricing_currency_symbol || currencySymbol;
      }
    }
    
    // Update form data with country and currency
    setFormData(prev => ({
      ...prev,
      country: countryName,
      currency: currencyCode,
      currencySymbol: currencySymbol,
      // Clear city when country changes
      city: ''
    }));
    
    // Auto-fill address country
    handleAddressChange({
      target: {
        name: 'country',
        value: countryName
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  // Handle city changes
  const handleCityChange = (city: string) => {
    setFormData(prev => ({
      ...prev,
      city
    }));
    
    // Auto-fill address city
    handleAddressChange({
      target: {
        name: 'city',
        value: city
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  // Handle address changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        [name]: value
      }
    }));
  };
  
  // Handle status changes
  const handleStatusChange = (status: HotelStatus) => {
    setFormData(prev => ({
      ...prev,
      status
    }));
  };
  
  // Handle amenity checkbox changes
  const handleAmenityChange = (checked: boolean, amenityId: string) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        amenities: [...(prev.amenities || []), amenityId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        amenities: (prev.amenities || []).filter(id => id !== amenityId)
      }));
    }
  };
  
  // Handle image array
  const handleImageChange = (index: number, field: string, value: string) => {
    const updatedImages = [...(formData.images || [])];
    updatedImages[index] = {
      ...updatedImages[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };
  
  // Set primary image
  const handleSetPrimary = (index: number) => {
    const updatedImages = (formData.images || []).map((image, i) => ({
      ...image,
      isPrimary: i === index
    }));
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };
  
  // Remove image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...(formData.images || [])];
    updatedImages.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };
  
  // Add new image
  const handleAddImage = () => {
    const newId = `img_${Date.now()}`;
    
    setFormData(prev => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { id: newId, url: '', isPrimary: (prev.images || []).length === 0 }
      ]
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.country || !formData.city) {
      toast({
        title: 'Validation Error', 
        description: 'Please fill in all required fields including hotel name, country, and city.',
        variant: "destructive"
      });
      return;
    }
    
    // Update lastUpdated field
    const finalData = {
      ...formData,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    onSubmit(finalData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Basic Information */}
          <BasicInfoSection 
            formData={formData} 
            handleInputChange={handleInputChange}
            handleStarRatingChange={handleStarRatingChange}
            defaultRating={formData.starRating?.toString() || ''}
            activeCountries={countries}
            handleCountryChange={handleCountryChange}
            availableCities={availableCities}
            handleCityChange={handleCityChange}
            externalId={externalId}
            isGeneratingExternalId={isGeneratingExternalId}
            onRegenerateExternalId={onRegenerateExternalId}
          />

          {/* Description & Amenities */}
          <DescriptionSection 
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Address */}
              <AddressSection 
                address={formData.address || {}}
                handleAddressChange={handleAddressChange}
              />
              
              {/* Geolocation Information */}
              <LocationSection 
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Check-in/out Times */}
              <CheckInOutSection 
                formData={formData}
                handleInputChange={handleInputChange}
              />
              
              {/* Status */}
              <StatusSection 
                status={formData.status || 'draft'} 
                handleStatusChange={handleStatusChange} 
              />
            </div>
          </div>

          {/* Gallery Images */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <ImagesSection 
              images={formData.images || []}
              handleImageChange={handleImageChange}
              handleSetPrimary={handleSetPrimary}
              handleRemoveImage={handleRemoveImage}
              handleAddImage={handleAddImage}
            />
          </div>

          {/* Amenities */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <AmenitiesSection 
              amenities={formData.amenities || []}
              handleCheckboxChange={handleAmenityChange}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              className="bg-brand-blue hover:bg-brand-blue/90"
              disabled={isSubmitting || isGeneratingExternalId}
            >
              {isSubmitting ? 'Saving...' : (hotel ? 'Update Hotel' : 'Save & Add Rooms')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HotelForm;
