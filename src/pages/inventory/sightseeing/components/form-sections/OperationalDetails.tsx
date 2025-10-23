import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  sightseeingCategories, 
  difficultyLevels, 
  seasons,
  daysOfWeek 
} from '../../data/initialData';
import { getExpirationStatus, formatValidityPeriod } from '../../services/expirationService';

interface OperationalDetailsProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
}

const OperationalDetails: React.FC<OperationalDetailsProps> = ({
  formData,
  handleFormChange
}) => {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    formData.category ? formData.category.split(', ') : []
  );
  
  const [newActivity, setNewActivity] = React.useState('');
  
  // Get start and end dates from validity period
  const getStartDate = (): Date | undefined => {
    if (!formData.validityPeriod) return undefined;
    try {
      return new Date(formData.validityPeriod.startDate);
    } catch (error) {
      console.error('Error parsing start date:', error);
      return undefined;
    }
  };

  const getEndDate = (): Date | undefined => {
    if (!formData.validityPeriod) return undefined;
    try {
      return new Date(formData.validityPeriod.endDate);
    } catch (error) {
      console.error('Error parsing end date:', error);
      return undefined;
    }
  };
  
  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    console.log('Start date selected:', date);
    
    if (date) {
      const currentEndDate = getEndDate();
      const validityPeriod = {
        startDate: date.toISOString(),
        endDate: currentEndDate ? currentEndDate.toISOString() : date.toISOString()
      };
      
      handleFormChange('validityPeriod', validityPeriod);
      handleFormChange('isExpired', false);
      handleFormChange('expirationNotified', false);
    } else {
      // If start date is cleared, clear the entire period
      handleFormChange('validityPeriod', null);
      handleFormChange('isExpired', false);
      handleFormChange('expirationNotified', false);
    }
  };
  
  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    console.log('End date selected:', date);
    
    if (date) {
      const currentStartDate = getStartDate();
      if (!currentStartDate) {
        // If no start date, set both to the same date
        const validityPeriod = {
          startDate: date.toISOString(),
          endDate: date.toISOString()
        };
        handleFormChange('validityPeriod', validityPeriod);
      } else {
        // Ensure end date is not before start date
        const finalEndDate = date < currentStartDate ? currentStartDate : date;
        const validityPeriod = {
          startDate: currentStartDate.toISOString(),
          endDate: finalEndDate.toISOString()
        };
        handleFormChange('validityPeriod', validityPeriod);
      }
      
      handleFormChange('isExpired', false);
      handleFormChange('expirationNotified', false);
    } else {
      // If end date is cleared but start date exists, keep start date only
      const currentStartDate = getStartDate();
      if (currentStartDate) {
        const validityPeriod = {
          startDate: currentStartDate.toISOString(),
          endDate: currentStartDate.toISOString()
        };
        handleFormChange('validityPeriod', validityPeriod);
      } else {
        // Clear entire period if no start date
        handleFormChange('validityPeriod', null);
        handleFormChange('isExpired', false);
        handleFormChange('expirationNotified', false);
      }
    }
  };
  
  const clearValidityPeriod = () => {
    console.log('Manually clearing validity period');
    handleFormChange('validityPeriod', null);
    handleFormChange('isExpired', false);
    handleFormChange('expirationNotified', false);
  };
  
  const expirationStatus = formData.validityPeriod ? getExpirationStatus(formData) : 'no-period';
  
  const handleCategoryChange = (category: string) => {
    let updated;
    if (selectedCategories.includes(category)) {
      updated = selectedCategories.filter(c => c !== category);
    } else {
      updated = [...selectedCategories, category];
    }
    setSelectedCategories(updated);
    handleFormChange('category', updated.join(', '));
  };
  
  const handleAddActivity = () => {
    if (newActivity && (!formData.activities?.includes(newActivity))) {
      const activities = formData.activities ? [...formData.activities, newActivity] : [newActivity];
      handleFormChange('activities', activities);
      setNewActivity('');
    }
  };
  
  const handleRemoveActivity = (activity: string) => {
    if (formData.activities) {
      handleFormChange('activities', formData.activities.filter(a => a !== activity));
    }
  };
  
  const handleDayOfWeekChange = (day: string) => {
    const currentDays = formData.daysOfWeek || [];
    let updatedDays;
    
    if (currentDays.includes(day)) {
      updatedDays = currentDays.filter(d => d !== day);
    } else {
      updatedDays = [...currentDays, day];
    }
    
    handleFormChange('daysOfWeek', updatedDays);
  };

  return (
    <div className="space-y-6">
      {/* Validity Period */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Validity Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !getStartDate() && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getStartDate() ? format(getStartDate()!, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={getStartDate()}
                      onSelect={handleStartDateChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !getEndDate() && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getEndDate() ? format(getEndDate()!, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={getEndDate()}
                      onSelect={handleEndDateChange}
                      disabled={(date) => {
                        const startDate = getStartDate();
                        return startDate ? date < startDate : false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Clear Button */}
            {formData.validityPeriod && (
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearValidityPeriod}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Period
                </Button>
              </div>
            )}
            
            {formData.validityPeriod && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    {formatValidityPeriod(formData.validityPeriod)}
                  </Badge>
                </div>
                
                {expirationStatus === 'expired' && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      This sightseeing has expired and will be automatically set to inactive.
                    </AlertDescription>
                  </Alert>
                )}
                
                {expirationStatus === 'expiring-soon' && (
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      This sightseeing expires within 7 days.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {category}
                <button 
                  onClick={() => handleCategoryChange(category)}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
            {selectedCategories.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No categories selected</div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
            {sightseeingCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                  className="border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor={`category-${category}`} className="text-sm text-gray-700 dark:text-gray-300">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Activities */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.activities?.map((activity) => (
              <Badge key={activity} variant="outline" className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                {activity}
                <button 
                  onClick={() => handleRemoveActivity(activity)}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
            {!formData.activities?.length && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No activities added</div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Add new activity (e.g., Snorkeling)" 
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className="flex-grow bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            <Button type="button" onClick={handleAddActivity} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Other operational details */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty Level */}
            <div className="space-y-3">
              <Label className="text-base text-gray-700 dark:text-gray-300">Difficulty Level</Label>
              <RadioGroup 
                value={formData.difficultyLevel || ''} 
                onValueChange={(value) => handleFormChange('difficultyLevel', value)}
                className="flex space-x-4"
              >
                {difficultyLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-1">
                    <RadioGroupItem value={level} id={`difficulty-${level}`} className="border-gray-400 dark:border-gray-500" />
                    <Label htmlFor={`difficulty-${level}`} className="text-sm text-gray-700 dark:text-gray-300">{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Season */}
            <div className="space-y-2">
              <Label htmlFor="season" className="text-gray-700 dark:text-gray-300">Season</Label>
              <Select 
                value={formData.season || ''} 
                onValueChange={(value) => handleFormChange('season', value)}
              >
                <SelectTrigger id="season" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Age Group */}
            <div className="space-y-2">
              <Label htmlFor="ageGroup" className="text-gray-700 dark:text-gray-300">Allowed Age Group</Label>
              <Input 
                id="ageGroup" 
                value={formData.allowedAgeGroup || ''} 
                onChange={(e) => handleFormChange('allowedAgeGroup', e.target.value)}
                placeholder="E.g., 3 to 60 years"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Days of Week */}
            <div className="space-y-3">
              <Label className="text-base text-gray-700 dark:text-gray-300">Days of Week</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`day-${day.value}`}
                      checked={(formData.daysOfWeek || []).includes(day.value)}
                      onCheckedChange={() => handleDayOfWeekChange(day.value)}
                      className="border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Timing & Location */}
            <div className="space-y-2">
              <Label htmlFor="timing" className="text-gray-700 dark:text-gray-300">Timing & Location</Label>
              <Input 
                id="timing" 
                value={formData.timing || ''} 
                onChange={(e) => handleFormChange('timing', e.target.value)}
                placeholder="E.g., 09:00 AM - 05:00 PM, Lobby Pickup"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Pick-up Time */}
            <div className="space-y-2">
              <Label htmlFor="pickupTime" className="text-gray-700 dark:text-gray-300">Pick-up Time</Label>
              <Input 
                id="pickupTime" 
                value={formData.pickupTime || ''} 
                onChange={(e) => handleFormChange('pickupTime', e.target.value)}
                placeholder="E.g., 08:30 AM"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-gray-700 dark:text-gray-300">Duration (HH:MM)</Label>
              <Input 
                id="duration" 
                value={formData.duration || ''} 
                onChange={(e) => handleFormChange('duration', e.target.value)}
                placeholder="E.g., 06:00"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalDetails;
