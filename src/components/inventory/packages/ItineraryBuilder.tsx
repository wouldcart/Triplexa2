
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TourPackage, ItineraryDay } from '@/types/package';
import ItineraryDayEditor from './components/ItineraryDayEditor';
import { PackageComponentProps } from './types/packageTypes';

const ItineraryBuilder: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(packageData.itinerary || []);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Extract cities from destinations
  useEffect(() => {
    if (packageData.destinations && packageData.destinations.length > 0) {
      const cities: string[] = [];
      packageData.destinations.forEach(destination => {
        if (destination.cities && destination.cities.length > 0) {
          cities.push(...destination.cities);
        }
      });
      setAvailableCities([...new Set(cities)]); // Remove duplicates
    }
  }, [packageData.destinations]);

  // Add a new day to the itinerary
  const addDay = () => {
    const dayNumber = (itinerary.length > 0) ? itinerary[itinerary.length - 1].day + 1 : 1;
    
    // Default city based on previous day, start city, or first available city
    let defaultCity = '';
    if (itinerary.length > 0) {
      defaultCity = itinerary[itinerary.length - 1].city;
    } else if (packageData.startCity) {
      defaultCity = packageData.startCity;
    } else if (availableCities.length > 0) {
      defaultCity = availableCities[0];
    }
    
    const newDay: ItineraryDay = {
      id: uuidv4(),
      day: dayNumber,
      title: `Day ${dayNumber}`,
      city: defaultCity,
      meals: {
        breakfast: false,
        lunch: false,
        dinner: false
      },
      activities: [],
      accommodation: {
        customHotelName: ''
      }
    };
    
    const updatedItinerary = [...itinerary, newDay];
    setItinerary(updatedItinerary);
    updatePackageData({ itinerary: updatedItinerary });
  };

  // Update a day in the itinerary
  const updateDay = (index: number, updatedDay: ItineraryDay) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[index] = updatedDay;
    setItinerary(updatedItinerary);
    updatePackageData({ itinerary: updatedItinerary });
  };

  // Remove a day from the itinerary
  const removeDay = (index: number) => {
    const updatedItinerary = itinerary.filter((_, i) => i !== index);
    
    // Update day numbers
    const renumberedItinerary = updatedItinerary.map((day, idx) => ({
      ...day,
      day: idx + 1,
      title: day.title.startsWith(`Day `) ? `Day ${idx + 1}` : day.title
    }));
    
    setItinerary(renumberedItinerary);
    updatePackageData({ itinerary: renumberedItinerary });
  };

  // Calculate the previous city for transportation
  const getPreviousCity = (index: number) => {
    if (index > 0) {
      return itinerary[index - 1].city;
    }
    return packageData.startCity || '';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Itinerary Builder</h3>
          
          {itinerary.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-gray-500 mb-4">No itinerary days added yet. Start building your tour itinerary.</p>
              <Button onClick={addDay}>
                <Plus className="h-4 w-4 mr-2" /> Add First Day
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {itinerary.map((day, index) => (
                <ItineraryDayEditor
                  key={day.id}
                  day={day}
                  onUpdate={(updatedDay) => updateDay(index, updatedDay)}
                  onDelete={() => removeDay(index)}
                  cities={availableCities}
                  previousCity={getPreviousCity(index)}
                />
              ))}
              
              <Button 
                variant="outline" 
                onClick={addDay}
                className="w-full flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Day
              </Button>
            </div>
          )}
          
          {packageData.days > 0 && itinerary.length > 0 && packageData.days !== itinerary.length && (
            <div className={`mt-4 p-4 rounded-md ${packageData.days > itinerary.length ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
              <p>
                {packageData.days > itinerary.length
                  ? `Warning: Package duration is ${packageData.days} days, but only ${itinerary.length} day(s) are in the itinerary. Add ${packageData.days - itinerary.length} more day(s).`
                  : `Warning: Package duration is ${packageData.days} days, but the itinerary has ${itinerary.length} days. Remove ${itinerary.length - packageData.days} day(s) or update the package duration.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryBuilder;
