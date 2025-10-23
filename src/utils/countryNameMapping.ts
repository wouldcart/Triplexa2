
// Utility for mapping country names between different data sources
export const countryNameMapping: Record<string, string> = {
  'United Arab Emirates': 'UAE',
  'UAE': 'UAE',
  'Thailand': 'Thailand'
};

export const mapCountryNameForCities = (countryName: string): string => {
  return countryNameMapping[countryName] || countryName;
};

export const getDisplayCountryName = (countryName: string): string => {
  // Reverse mapping for display purposes
  const reverseMapping: Record<string, string> = {
    'UAE': 'United Arab Emirates',
    'Thailand': 'Thailand'
  };
  return reverseMapping[countryName] || countryName;
};
