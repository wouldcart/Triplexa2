
import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, X, Globe, Building } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { useCountryCityData } from '@/hooks/useCountryCityData';

interface OptimizedBasicInformationProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
}

const OptimizedBasicInformation = memo(({ formData, handleFormChange }: OptimizedBasicInformationProps) => {
  const { countries, getCitiesByCountry, loading } = useCountryCityData();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState('');

  // Update cities when country changes
  useEffect(() => {
    if (formData.country) {
      const cities = getCitiesByCountry(formData.country);
      setAvailableCities(cities);
      
      // Clear city if it's not available in the new country
      if (formData.city && !cities.includes(formData.city)) {
        handleFormChange('city', '');
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.country, getCitiesByCountry, handleFormChange]);

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      const updatedActivities = [...(formData.activities || []), newActivity.trim()];
      handleFormChange('activities', updatedActivities);
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    const updatedActivities = formData.activities?.filter((_, i) => i !== index) || [];
    handleFormChange('activities', updatedActivities);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-500">Loading location data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Sightseeing Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Enter sightseeing name"
            className="w-full"
          />
        </div>

        {/* Country and City Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleFormChange('country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {country}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City *
            </Label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleFormChange('city', value)}
              disabled={!formData.country}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.country ? "Select city" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleFormChange('description', e.target.value)}
            placeholder="Enter detailed description"
            rows={4}
            className="w-full"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={formData.category || ''}
            onValueChange={(value) => handleFormChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Historical">Historical</SelectItem>
              <SelectItem value="Cultural">Cultural</SelectItem>
              <SelectItem value="Adventure">Adventure</SelectItem>
              <SelectItem value="Nature">Nature</SelectItem>
              <SelectItem value="Religious">Religious</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Shopping">Shopping</SelectItem>
              <SelectItem value="Food & Dining">Food & Dining</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Activities</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add activity"
                onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddActivity}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.activities && formData.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((activity, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {activity}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveActivity(index)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <p className="text-xs text-gray-500">
              Set whether this sightseeing is active or inactive
            </p>
          </div>
          <Switch
            id="status"
            checked={formData.status === 'active'}
            onCheckedChange={(checked) => 
              handleFormChange('status', checked ? 'active' : 'inactive')
            }
          />
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedBasicInformation.displayName = 'OptimizedBasicInformation';

export default OptimizedBasicInformation;
