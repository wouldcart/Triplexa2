
export interface City {
  id: number;
  name: string;
  country: string;  // This refers to the country name
  region: string;
  hasAirport: boolean;
  isPopular: boolean;
  status: "active" | "disabled";
}

// Export a utility function to filter cities by country
export const filterCitiesByCountry = (cities: City[], countryName: string): City[] => {
  return cities.filter(city => city.country === countryName && city.status === 'active');
};
