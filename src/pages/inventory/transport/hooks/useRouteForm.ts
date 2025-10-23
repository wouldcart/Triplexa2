import { useState, useEffect, useCallback } from 'react';
import { TransportRoute, LocationCode, SightseeingOption, Stop } from '@/pages/inventory/transport/types/transportTypes';
import { useFormValidation, customValidationRules } from './useFormValidation';
import { Sightseeing } from '@/types/sightseeing';

export const useRouteForm = (initialData: Partial<TransportRoute>, locations: LocationCode[], sightseeingLocations: Sightseeing[]) => {
  const [routeData, setRouteData] = useState<Partial<TransportRoute>>({
    ...initialData,
    startLocationFullName: initialData.startLocationFullName || '',
    endLocationFullName: initialData.endLocationFullName || '',
  });
  const [filteredLocations, setFilteredLocations] = useState<LocationCode[]>([]);
  const [filteredSightseeingLocations, setFilteredSightseeingLocations] = useState<Sightseeing[]>([]);
  const [routeSegments, setRouteSegments] = useState<string[]>([]);

  const { validateField, errors } = useFormValidation();

  const onChange = (field: string, value: any) => {
    setRouteData(prevData => ({ ...prevData, [field]: value }));
  };

  const extractShortCode = (code: string) => {
    if (!code) return '';
    return code.split(' ')[0];
  };

  const getLocationTypeDescription = (code: string) => {
    const location = locations.find(loc => loc.code === code);
    if (!location) return '';

    switch (location.category) {
      case 'airport': return 'APT';
      case 'hotel': return 'HTL';
      case 'pier': return 'PIER';
      default: return location.category.slice(0, 3).toUpperCase();
    }
  };

  const generateRouteCodeSegments = useCallback(() => {
    const allStops = [
      routeData.startLocation,
      ...(routeData.intermediateStops?.map(stop => stop.locationCode) || []),
      routeData.endLocation
    ].filter(Boolean) as string[];

    if (allStops.length < 2) return [];

    const segments: string[] = [];
    for (let i = 0; i < allStops.length - 1; i++) {
      const fromCode = extractShortCode(allStops[i]);
      const fromType = getLocationTypeDescription(allStops[i]);
      const toCode = extractShortCode(allStops[i + 1]);
      const toType = getLocationTypeDescription(allStops[i + 1]);
      segments.push(`${fromCode} ${fromType} – ${toCode} ${toType}`);
    }
    return segments;
  }, [routeData.startLocation, routeData.endLocation, routeData.intermediateStops, locations]);

  const generateCompleteRouteCode = useCallback(() => {
    const allStops = [
      routeData.startLocation,
      ...(routeData.intermediateStops?.map(stop => stop.locationCode) || []),
      routeData.endLocation
    ].filter(Boolean) as string[];

    if (allStops.length < 2) return '';

    const routeParts = allStops.map((locationCode, index) => {
      const shortCode = extractShortCode(locationCode);
      const locationType = getLocationTypeDescription(locationCode);
      return `${shortCode} ${locationType}${index < allStops.length - 1 ? ' - ' : ''}`;
    });

    return routeParts.join('');
  }, [routeData.startLocation, routeData.endLocation, routeData.intermediateStops, locations]);

  useEffect(() => {
    if (routeData.country) {
      setFilteredLocations(locations.filter(loc => loc.country === routeData.country));
      setFilteredSightseeingLocations(
        sightseeingLocations.filter(loc => loc.country === routeData.country)
      );
    }
  }, [routeData.country, locations, sightseeingLocations]);

  useEffect(() => {
    const allLocations = [
      routeData.startLocation,
      ...(routeData.intermediateStops?.map(stop => stop.locationCode) || []),
      routeData.endLocation
    ].filter(Boolean);

    if (allLocations.length >= 2) {
      const segments = generateRouteCodeSegments();
      setRouteSegments(segments);

      const startLoc = locations.find(loc => loc.code === routeData.startLocation);
      const endLoc = locations.find(loc => loc.code === routeData.endLocation);

      if (startLoc && endLoc) {
        let generatedName: string;
        if (routeData.transferType === 'Multi-Stop' || routeData.transferType === 'en route') {
          const intermediateNames = routeData.intermediateStops?.map(stop => {
            const loc = locations.find(l => l.code === stop.locationCode);
            return loc ? loc.fullName : '';
          }).filter(Boolean);

          if (intermediateNames && intermediateNames.length > 0) {
            generatedName = `${startLoc.fullName} → ${intermediateNames.join(' → ')} → ${endLoc.fullName}`;
          } else {
            generatedName = `${startLoc.fullName} → ${endLoc.fullName}`;
          }
        } else {
          generatedName = `${startLoc.fullName} → ${endLoc.fullName}`;
        }
        onChange('name', generatedName);

        const routeCode = generateCompleteRouteCode();
        onChange('code', routeCode);
      }
    }
  }, [routeData.startLocation, routeData.endLocation, routeData.intermediateStops, routeData.transferType, locations, generateRouteCodeSegments, generateCompleteRouteCode]);



  const onRemoveTransportType = (typeId: string) => {
    const updatedTransportTypes = routeData.transportTypes?.filter(type => type.id !== typeId);
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  const onTransportTypeChange = (typeId: string, field: string, value: any) => {
    const updatedTransportTypes = routeData.transportTypes?.map(type =>
      type.id === typeId ? { ...type, [field]: value } : type
    );
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  return {
    routeData,
    setRouteData,
    onChange,
    filteredLocations,
    filteredSightseeingLocations,
    routeSegments,
    validateField,
    errors,
    extractShortCode,
    getLocationTypeDescription,
    generateRouteCodeSegments,
    generateCompleteRouteCode,
    onRemoveTransportType,
    onTransportTypeChange
  };
};