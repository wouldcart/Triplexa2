
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Sightseeing, Image } from '@/types/sightseeing';
import { useCitiesData } from '@/hooks/useCitiesData';
import { useSightseeingCurrency } from '@/hooks/useSightseeingCurrency';
import { X, User, DollarSign } from 'lucide-react';

interface BasicInformationProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
  countries: string[];
  cities: string[];
}

const BasicInformation: React.FC<BasicInformationProps> = ({
  formData,
  handleFormChange,
  countries,
  cities
}) => {
  const [newImageUrl, setNewImageUrl] = useState('');
  const { getActiveCountries, getCitiesByCountry } = useCitiesData();
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Currency auto-loading hook
  const { currencyInfo, loading: currencyLoading, error: currencyError } = useSightseeingCurrency(formData.country);

  // Load countries and cities data
  useEffect(() => {
    // Prefer countries passed via props if available; fallback to hook
    const propCountryNames = Array.isArray(countries) && countries.length > 0 ? countries : [];
    const hookCountryNames = getActiveCountries().map(country => country.name);
    const merged = propCountryNames.length > 0 ? propCountryNames : hookCountryNames;
    // Ensure currently selected country remains selectable even if inactive
    const finalCountries = new Set(merged);
    if (formData.country) finalCountries.add(formData.country);
    setAvailableCountries(Array.from(finalCountries));
  }, [countries, getActiveCountries, formData.country]);

  // Update available cities when country changes
  useEffect(() => {
    if (formData.country) {
      const citiesForCountry = getCitiesByCountry(formData.country);
      const cityNames = citiesForCountry.map(city => city.name);
      // Keep current city selectable even if filtered list doesn’t include it
      const finalCitySet = new Set(cityNames);
      if (formData.city) finalCitySet.add(formData.city);
      setAvailableCities(Array.from(finalCitySet));
    } else {
      setAvailableCities([]);
    }
  }, [formData.country, getCitiesByCountry, formData.city]);

  // Handle country change
  const handleCountryChange = (value: string) => {
    console.log('Country changed to:', value);
    handleFormChange('country', value);
    // City will be automatically filtered by the useEffect above
  };

  // Auto-save currency information when currency data is loaded
  useEffect(() => {
    if (currencyInfo && formData.country) {
      // Only update if the currency information has changed
      if (formData.pricing_currency !== currencyInfo.currency || 
          formData.pricing_currency_symbol !== currencyInfo.symbol) {
        handleFormChange('pricing_currency', currencyInfo.currency);
        handleFormChange('pricing_currency_symbol', currencyInfo.symbol);
      }
    }
  }, [currencyInfo, formData.country, formData.pricing_currency, formData.pricing_currency_symbol, handleFormChange]);

  const handleAddImage = () => {
    if (newImageUrl && formData.images?.every(img => img.url !== newImageUrl)) {
      // Create a new image object
      const newImage: Image = {
        id: (formData.images?.length || 0) + 1,
        url: newImageUrl,
        isPrimary: !formData.images || formData.images.length === 0
      };
      
      // Update form data with the new image
      const updatedImages = [...(formData.images || []), newImage];
      handleFormChange('images', updatedImages);
      
      // Also update imageUrl if this is the first image (for backward compatibility)
      if (!formData.imageUrl && newImage.isPrimary) {
        handleFormChange('imageUrl', newImageUrl);
      }
      
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (id: number) => {
    if (formData.images) {
      const imageToRemove = formData.images.find(img => img.id === id);
      const updatedImages = formData.images.filter(img => img.id !== id);
      
      // If we're removing the primary image, make the first remaining image primary
      if (imageToRemove?.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
        
        // Also update imageUrl for backward compatibility
        handleFormChange('imageUrl', updatedImages[0].url);
      }
      
      handleFormChange('images', updatedImages);
      
      // If removing the last image, clear imageUrl too
      if (updatedImages.length === 0) {
        handleFormChange('imageUrl', '');
      }
    }
  };

  const setPrimaryImage = (id: number) => {
    if (formData.images) {
      const updatedImages = formData.images.map(img => ({
        ...img,
        isPrimary: img.id === id
      }));
      
      handleFormChange('images', updatedImages);
      
      // Update imageUrl for backward compatibility
      const primaryImage = updatedImages.find(img => img.isPrimary);
      if (primaryImage) {
        handleFormChange('imageUrl', primaryImage.url);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select 
                value={formData.country || ''} 
                onValueChange={handleCountryChange}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.length > 0 ? (
                    availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading countries...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select 
                value={formData.city || ''} 
                onValueChange={(value) => handleFormChange('city', value)}
                disabled={!formData.country}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={formData.country ? "Select City" : "Select Country First"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.length > 0 ? (
                    availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-cities" disabled>
                      {formData.country ? "No cities available" : "Select country first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Currency Display */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <div className="relative">
                <Input 
                  id="currency" 
                  value={currencyInfo ? currencyInfo.displayText : (formData.country ? 'Loading...' : 'Select country first')}
                  disabled
                  className="bg-muted"
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {currencyError && (
                <p className="text-sm text-red-500">{currencyError}</p>
              )}
              {currencyInfo && (
                <p className="text-xs text-muted-foreground">
                  Auto-loaded from country settings
                </p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="name">Sightseeing Name *</Label>
              <Input 
                id="name" 
                value={formData.name || ''} 
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="E.g., Phi Phi Island Tour"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input 
                id="latitude" 
                type="number"
                step="0.000001"
                value={formData.latitude || ''} 
                onChange={(e) => handleFormChange('latitude', parseFloat(e.target.value) || null)}
                placeholder="E.g., 7.9519"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input 
                id="longitude" 
                type="number"
                step="0.000001"
                value={formData.longitude || ''} 
                onChange={(e) => handleFormChange('longitude', parseFloat(e.target.value) || null)}
                placeholder="E.g., 98.3381"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="googleMapLink">Google Map Link</Label>
              <Input 
                id="googleMapLink" 
                value={formData.googleMapLink || ''} 
                onChange={(e) => handleFormChange('googleMapLink', e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
            
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                value={formData.address || ''} 
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Full address of the location"
                rows={2}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description || ''} 
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe the sightseeing experience"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Images section */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {formData.images?.map((image) => (
                <div key={image.id} className="relative w-32 h-32 group">
                  <ImageWithFallback
                    src={image.url} 
                    alt={`Sightseeing image ${image.id}`} 
                    className={`w-full h-full object-cover rounded-md border-2 ${image.isPrimary ? 'border-primary' : 'border-transparent'}`}
                    fallbackIcon={<User className="h-8 w-8 text-muted-foreground" />}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-md">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        className="bg-primary text-white rounded-full p-1 mb-2 hover:bg-primary/80"
                        title="Set as primary image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5L20 7"></path>
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {image.isPrimary && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs px-1 rounded-bl-md">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL" 
                className="flex-grow"
              />
              <Button type="button" onClick={handleAddImage}>
                Add Image
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              Upload images or paste image URLs to showcase the sightseeing attraction.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInformation;
