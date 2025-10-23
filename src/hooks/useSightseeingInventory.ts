
import { useState, useEffect } from 'react';
import { Sightseeing } from '@/types/sightseeing';

interface UseSightseeingInventoryProps {
  country: string;
  cities: string[];
}

export const useSightseeingInventory = ({ country, cities }: UseSightseeingInventoryProps) => {
  const [sightseeing, setSightseeing] = useState<Sightseeing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSightseeing = () => {
      try {
        setLoading(true);
        // Check both possible localStorage keys for compatibility
        const savedSightseeing = localStorage.getItem('sightseeings') || localStorage.getItem('sightseeingData');
        
        if (savedSightseeing) {
          const parsedSightseeing = JSON.parse(savedSightseeing);
          // Filter sightseeing by country and cities
          const filteredSightseeing = parsedSightseeing.filter((item: Sightseeing) => {
            const matchesCountry = item.country?.toLowerCase() === country.toLowerCase();
            const matchesCities = cities.some(city => 
              item.city?.toLowerCase().includes(city.toLowerCase())
            );
            return matchesCountry || matchesCities;
          });
          
          setSightseeing(filteredSightseeing);
          console.log('Loaded filtered sightseeing:', filteredSightseeing.length, 'items for', country, cities);
        } else {
          console.log('No sightseeing data found in localStorage');
          setSightseeing([]);
        }
      } catch (error) {
        console.error('Error loading sightseeing:', error);
        setSightseeing([]);
      } finally {
        setLoading(false);
      }
    };

    if (country && cities.length > 0) {
      loadSightseeing();
    } else {
      setLoading(false);
    }
  }, [country, cities]);

  return { sightseeing, loading };
};
