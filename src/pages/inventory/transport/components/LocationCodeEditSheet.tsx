
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationCode } from '../types/transportTypes';
import { Country, City, useCitiesData } from '@/hooks/useCitiesData';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { nominatimService } from '@/services/nominatimService';
import { ExternalLink, MapPin, Loader2, CheckCircle, AlertCircle, Search, Plus } from 'lucide-react';

interface LocationCodeEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: LocationCode) => void;
  locationCode: LocationCode | null;
  countries: Country[];
  cities: City[];
}

const LocationCodeEditSheet: React.FC<LocationCodeEditSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  locationCode,
  countries,
  cities
}) => {
  const { getCitiesByCountry } = useCitiesData();
  const [editedLocation, setEditedLocation] = useState<LocationCode | null>(null);

  // State for custom category input
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [predefinedCategories] = useState([
    'airport',
    'hotel', 
    'pier',
    'train_station',
    'bus_station',
    'port',
    'landmark',
    'other'
  ]);

  // Get filtered cities based on selected country
  const filteredCities = editedLocation?.country ? getCitiesByCountry(editedLocation.country) : [];

  useEffect(() => {
    if (locationCode) {
      setEditedLocation(locationCode);
      // Reset geocoding states when location changes
      setReverseAddress('');
      setGeocodingError('');
      setGeocodingSuccess('');
      // Reset custom category states
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  }, [locationCode]);

  const handleChange = (field: keyof LocationCode, value: string) => {
    if (editedLocation) {
      setEditedLocation({
        ...editedLocation,
        [field]: value,
        // Reset city when country changes
        ...(field === 'country' ? { city: '' } : {})
      });
      
      // Clear geocoding feedback when location details change
      if (['fullName', 'city', 'country'].includes(field)) {
        setGeocodingError('');
        setGeocodingSuccess('');
        setReverseAddress('');
      }
    }
  };

  const handleSubmit = () => {
    if (editedLocation) {
      onSave(editedLocation);
    }
  };

  const isFormValid = () => {
    return editedLocation &&
      editedLocation.code.trim() !== '' &&
      editedLocation.fullName.trim() !== '' &&
      editedLocation.country.trim() !== '' &&
      editedLocation.city.trim() !== '';
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setCustomCategory('');
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      handleChange('category', value);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      handleChange('category', customCategory.trim());
      setShowCustomCategory(false);
    }
  };

  const handleCustomCategoryCancel = () => {
    setShowCustomCategory(false);
    setCustomCategory('');
    // Reset to current category or default
    if (editedLocation) {
      handleChange('category', editedLocation.category || 'other');
    }
  };

  // Enhanced Nominatim helpers with better error handling and feedback
  const [nominatimEnabled, setNominatimEnabled] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string>('');
  const [geocodingSuccess, setGeocodingSuccess] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await AppSettingsService.getSetting(SETTING_CATEGORIES.INTEGRATIONS, 'nominatim_geocoding_enabled');
        if (res.success && res.data) {
          setNominatimEnabled(res.data.setting_value === 'true');
        } else {
          setNominatimEnabled(false);
        }
      } catch {
        setNominatimEnabled(false);
      }
    })();
  }, []);

  const geocodeFromName = async () => {
    if (!editedLocation) return;
    
    // Enhanced query construction for better accuracy
    const queryParts = [];
    if (editedLocation.fullName.trim()) queryParts.push(editedLocation.fullName.trim());
    if (editedLocation.city.trim()) queryParts.push(editedLocation.city.trim());
    if (editedLocation.country.trim()) queryParts.push(editedLocation.country.trim());
    
    const query = queryParts.join(', ');
    if (!query) {
      setGeocodingError('Please provide at least a location name to search for coordinates.');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError('');
    setGeocodingSuccess('');
    setReverseAddress('');

    try {
      // Enhanced search with multiple attempts for better accuracy
      let results = await nominatimService.search(query, { limit: 5 });
      
      // If no results with full query, try with just name and country
      if (!results || results.length === 0) {
        const fallbackQuery = [editedLocation.fullName, editedLocation.country].filter(Boolean).join(', ');
        if (fallbackQuery !== query) {
          results = await nominatimService.search(fallbackQuery, { limit: 5 });
        }
      }
      
      // If still no results, try with just the location name
      if (!results || results.length === 0) {
        if (editedLocation.fullName.trim()) {
          results = await nominatimService.search(editedLocation.fullName.trim(), { limit: 5 });
        }
      }

      if (results && results.length > 0) {
        const bestResult = results[0];
        
        // Validate coordinates
        const lat = parseFloat(bestResult.lat);
        const lon = parseFloat(bestResult.lon);
        
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          setGeocodingError('Invalid coordinates received from geocoding service.');
          return;
        }
        
        handleChange('latitude', bestResult.lat);
        handleChange('longitude', bestResult.lon);
        
        setGeocodingSuccess(`Found coordinates for "${bestResult.display_name}"`);
        
        // Show additional results if available
        if (results.length > 1) {
          setGeocodingSuccess(prev => `${prev} (${results.length - 1} other result${results.length > 2 ? 's' : ''} available)`);
        }
      } else {
        setGeocodingError(`No coordinates found for "${query}". Try a more specific or different location name.`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to search for coordinates. Please check your internet connection and try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const reverseLookup = async () => {
    if (!editedLocation?.latitude || !editedLocation?.longitude) return;
    
    // Validate coordinates before reverse lookup
    const lat = parseFloat(editedLocation.latitude);
    const lon = parseFloat(editedLocation.longitude);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setGeocodingError('Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180).');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError('');
    setGeocodingSuccess('');
    setReverseAddress('');

    try {
      const res = await nominatimService.reverse(lat, lon);
      if (res && res.display_name) {
        setReverseAddress(res.display_name);
        setGeocodingSuccess('Successfully found location details for the coordinates.');
      } else {
        setGeocodingError('No location details found for these coordinates.');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setGeocodingError('Failed to lookup location details. Please check your internet connection and try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Coordinate formatting and validation helpers
  const parseNumber = (s?: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const formatCoord = (s?: string) => {
    const n = parseNumber(s);
    return n === null ? '' : n.toFixed(6);
  };
  const isValidLat = (s?: string) => {
    const n = parseNumber(s);
    return n !== null && n >= -90 && n <= 90;
  };
  const isValidLon = (s?: string) => {
    const n = parseNumber(s);
    return n !== null && n >= -180 && n <= 180;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Location Code</SheetTitle>
          <SheetDescription>
            Update location details and coordinates
          </SheetDescription>
        </SheetHeader>
        
        {editedLocation && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Short Code <span className="text-red-500">*</span></Label>
              <Input
                id="code"
                value={editedLocation.code}
                onChange={(e) => handleChange('code', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={editedLocation.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              {!showCustomCategory ? (
                <Select 
                  value={editedLocation.category} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Custom Category
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomCategorySubmit();
                        } else if (e.key === 'Escape') {
                          handleCustomCategoryCancel();
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleCustomCategorySubmit}
                      disabled={!customCategory.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCustomCategoryCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter to add or Escape to cancel
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                <Select 
                  value={editedLocation.country} 
                  onValueChange={(value) => handleChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                <Select 
                  value={editedLocation.city} 
                  onValueChange={(value) => handleChange('city', value)}
                  disabled={!editedLocation.country}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCities.length > 0 ? (
                      filteredCities.map(city => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-cities" disabled>
                        {editedLocation.country ? 'No cities available for this country' : 'Select a country first'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup 
                value={editedLocation.status}
                onValueChange={(value) => handleChange('status', value as 'active' | 'inactive')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="edit-active" />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="edit-inactive" />
                  <Label htmlFor="edit-inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editedLocation.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={editedLocation.latitude || ''}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  placeholder="e.g., 13.6900"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={editedLocation.longitude || ''}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  placeholder="e.g., 100.7501"
                />
              </div>
            </div>

            {/* Enhanced Coordinates preview */}
            <div className="space-y-2">
              <Label>Coordinates Preview</Label>
              <div className="rounded border p-3 text-sm font-mono bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className={isValidLat(editedLocation.latitude) ? 'text-foreground font-medium' : 'text-red-600'}>
                    {formatCoord(editedLocation.latitude) || '—'}
                  </span>
                  {isValidLat(editedLocation.latitude) && <CheckCircle className="h-3 w-3 text-green-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className={isValidLon(editedLocation.longitude) ? 'text-foreground font-medium' : 'text-red-600'}>
                    {formatCoord(editedLocation.longitude) || '—'}
                  </span>
                  {isValidLon(editedLocation.longitude) && <CheckCircle className="h-3 w-3 text-green-600" />}
                </div>
              </div>
              {!isValidLat(editedLocation.latitude) && editedLocation.latitude && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Latitude must be between -90 and 90
                </p>
              )}
              {!isValidLon(editedLocation.longitude) && editedLocation.longitude && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Longitude must be between -180 and 180
                </p>
              )}
            </div>

            {/* Enhanced Geocoding helpers */}
            <div className="space-y-3">
              <Label>Geocoding Tools</Label>
              {nominatimEnabled ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={geocodeFromName}
                      disabled={isGeocoding || !editedLocation.fullName.trim()}
                      className="flex items-center gap-2"
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {isGeocoding ? 'Searching...' : 'Search coordinates'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={reverseLookup}
                      disabled={isGeocoding || !editedLocation.latitude || !editedLocation.longitude}
                      className="flex items-center gap-2"
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {isGeocoding ? 'Looking up...' : 'Reverse lookup'}
                    </Button>
                    <a
                      href="/tools/nominatim"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" /> Nominatim Tools
                    </a>
                  </div>
                  
                  {/* Enhanced feedback messages */}
                  {geocodingError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{geocodingError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {geocodingSuccess && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-700">{geocodingSuccess}</AlertDescription>
                    </Alert>
                  )}
                  
                  {reverseAddress && (
                    <div className="p-3 bg-muted rounded-md">
                      <Label className="text-xs text-muted-foreground">Location Details:</Label>
                      <p className="text-sm mt-1">{reverseAddress}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nominatim geocoding is disabled by admin. Enable it in Settings → General → System Settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
        
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LocationCodeEditSheet;
