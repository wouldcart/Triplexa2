
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { LocationCode } from '../types/transportTypes';
import { Country, City, useCitiesData } from '@/hooks/useCitiesData';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { nominatimService } from '@/services/nominatimService';
import { ExternalLink, MapPin, Plus } from 'lucide-react';

interface LocationCodeAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Omit<LocationCode, 'id'>) => void;
  countries: Country[];
  cities: City[];
}

const LocationCodeAddSheet: React.FC<LocationCodeAddSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  countries,
  cities
}) => {
  const { getCitiesByCountry } = useCitiesData();
  const [newLocation, setNewLocation] = useState<Omit<LocationCode, 'id'>>({
    code: '',
    fullName: '',
    category: 'airport',
    country: '',
    city: '',
    status: 'active',
    notes: '',
    latitude: '',
    longitude: ''
  });

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
  const filteredCities = newLocation.country ? getCitiesByCountry(newLocation.country) : [];

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setNewLocation({
        code: '',
        fullName: '',
        category: 'airport',
        country: '',
        city: '',
        status: 'active',
        notes: '',
        latitude: '',
        longitude: ''
      });
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  }, [isOpen]);

  const handleChange = (field: keyof Omit<LocationCode, 'id'>, value: string) => {
    setNewLocation(prev => ({
      ...prev,
      [field]: value,
      // Reset city when country changes
      ...(field === 'country' ? { city: '' } : {})
    }));
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
    // Reset to a default category
    handleChange('category', 'other');
  };

  const handleSubmit = () => {
    onSave(newLocation);
  };

  const isFormValid = () => {
    return (
      newLocation.code.trim() !== '' &&
      newLocation.fullName.trim() !== '' &&
      newLocation.country.trim() !== '' &&
      newLocation.city.trim() !== ''
    );
  };

  // Nominatim toggle from admin settings
  const [nominatimEnabled, setNominatimEnabled] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);

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
    const query = [newLocation.fullName, newLocation.city, newLocation.country].filter(Boolean).join(' ');
    if (!query.trim()) return;
    setIsGeocoding(true);
    try {
      const results = await nominatimService.search(query, { limit: 1 });
      
      if (results && results.length > 0) {
        const top = results[0];
        handleChange('latitude', top.lat);
        handleChange('longitude', top.lon);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const reverseLookup = async () => {
    if (!newLocation.latitude || !newLocation.longitude) return;
    setIsGeocoding(true);
    try {
      const res = await nominatimService.reverse(newLocation.latitude, newLocation.longitude);
      setReverseAddress(res.display_name || '');
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
          <SheetTitle>Add New Location Code</SheetTitle>
          <SheetDescription>
            Enter location details below
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Short Code <span className="text-red-500">*</span></Label>
            <Input
              id="code"
              value={newLocation.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Example: BKK APT"
            />
            <p className="text-xs text-muted-foreground">Example: BKK APT</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              value={newLocation.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter complete location name"
            />
            <p className="text-xs text-muted-foreground">Enter complete location name</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            {!showCustomCategory ? (
              <Select 
                value={newLocation.category} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
                value={newLocation.country} 
                onValueChange={(value) => handleChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
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
                value={newLocation.city} 
                onValueChange={(value) => handleChange('city', value)}
                disabled={!newLocation.country}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
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
                      {newLocation.country ? 'No cities available for this country' : 'Select a country first'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup 
              defaultValue={newLocation.status}
              onValueChange={(value) => handleChange('status', value as 'active' | 'inactive')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newLocation.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter additional notes"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={newLocation.latitude || ''}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="Enter latitude"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={newLocation.longitude || ''}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="Enter longitude"
              />
            </div>
          </div>

          {/* Coordinates preview */}
          <div className="space-y-2">
            <Label>Coordinates Preview</Label>
            <div className="rounded border p-2 text-sm font-mono">
              <div>
                Latitude: <span className={isValidLat(newLocation.latitude) ? 'text-foreground' : 'text-red-600'}>
                  {formatCoord(newLocation.latitude) || '—'}
                </span>
              </div>
              <div>
                Longitude: <span className={isValidLon(newLocation.longitude) ? 'text-foreground' : 'text-red-600'}>
                  {formatCoord(newLocation.longitude) || '—'}
                </span>
              </div>
            </div>
            {!isValidLat(newLocation.latitude) && newLocation.latitude && (
              <p className="text-xs text-red-600">Latitude must be between -90 and 90</p>
            )}
            {!isValidLon(newLocation.longitude) && newLocation.longitude && (
              <p className="text-xs text-red-600">Longitude must be between -180 and 180</p>
            )}
          </div>

          {/* Geocoding helpers */}
          <div className="space-y-2">
            {nominatimEnabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={geocodeFromName}
                  disabled={isGeocoding || !newLocation.fullName}
                >
                  <MapPin className="h-4 w-4 mr-1" /> Search coords from name
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={reverseLookup}
                  disabled={isGeocoding || !newLocation.latitude || !newLocation.longitude}
                >
                  Reverse geocode
                </Button>
                <a
                  href="/tools/nominatim"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> Open Nominatim Tools
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nominatim geocoding is disabled by admin. Enable it in Settings.
              </p>
            )}
            {reverseAddress && (
              <p className="text-xs text-muted-foreground">{reverseAddress}</p>
            )}
          </div>
        </div>
        
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>Save Location Code</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LocationCodeAddSheet;
