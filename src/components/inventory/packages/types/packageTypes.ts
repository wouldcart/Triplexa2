
import { TourPackage } from '@/types/package';
import { City as TransportCity } from '@/pages/inventory/transport/types/city';

export interface PackageComponentProps {
  packageData: Partial<TourPackage>;
  updatePackageData: (updates: Partial<TourPackage>) => void;
}

export interface Destination {
  country: string;
  cities: string[];
}

// Use the shared City type from the transport module for consistency
export type City = {
  id: string;
  name: string;
};

export interface Country {
  id: string;
  name: string;
}

// Add utility function to convert from TransportCity to PackageCity
export const convertToPackageCity = (city: TransportCity): City => {
  return {
    id: city.id.toString(),
    name: city.name
  };
};
