
import { useState, useEffect } from 'react';
import { TransportRoute } from '@/pages/queries/types/proposalTypes';
import { importTransportRoutes, exportTransportRoutes, type ImportOptions, type ExportOptions } from '@/utils/transportRoutesImportExport';

interface UseTransportRoutesProps {
  country: string;
  cities: string[];
}

export const useTransportRoutes = (params?: Partial<UseTransportRoutesProps>) => {
  const country = params?.country ?? '';
  const cities = params?.cities ?? [];

  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure parameters are valid
  const validCountry = country || '';
  const validCities = Array.isArray(cities) ? cities : [];

  useEffect(() => {
    const loadRoutes = () => {
      try {
        setLoading(true);
        const savedRoutes = localStorage.getItem('savedTransportRoutes');

        if (savedRoutes) {
          const parsedRoutes = JSON.parse(savedRoutes);
          // Filter routes by country and cities
          const filteredRoutes = parsedRoutes
            .filter((route: any) => {
              const matchesCountry = validCountry
                ? route.country?.toLowerCase() === validCountry.toLowerCase()
                : true;
              const matchesCities = validCities.length > 0
                ? validCities.some((city) =>
                    route.from?.toLowerCase().includes(city.toLowerCase()) ||
                    route.to?.toLowerCase().includes(city.toLowerCase())
                  )
                : true;
              return matchesCountry && matchesCities;
            })
            .map((route: any) => ({
              id: route.id || `route_${Date.now()}`,
              from: route.from || route.startLocation || '',
              to: route.to || route.endLocation || '',
              distance: route.distance || 0,
              duration: route.duration || '1h',
              transportType: route.transportType || route.type || 'Car',
              price: route.price || 0,
              name:
                route.name || `${route.from || route.startLocation} to ${route.to || route.endLocation}`,
              country: route.country || validCountry,
            }));

          setRoutes(filteredRoutes);
        } else {
          // No saved routes; return empty list but not undefined
          setRoutes([]);
        }
      } catch (error) {
        console.error('Error loading transport routes:', error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    if (validCountry || (validCities && validCities.length > 0)) {
      loadRoutes();
    } else {
      setLoading(false);
      setRoutes([]);
    }
  }, [validCountry, validCities.join('|')]);

  // Always return a stable object
  const importRoutesFile = async (file: File, options: ImportOptions) => {
    return importTransportRoutes(file, options);
  };

  const exportRoutes = async (options: ExportOptions) => {
    return exportTransportRoutes(options);
  };

  return { routes, loading, importRoutesFile, exportRoutes };
};
