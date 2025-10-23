
import { useState } from 'react';
import { Restaurant, CuisineType } from '../types/restaurantTypes';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const useRestaurantImportExport = (
  restaurants: Restaurant[], 
  filteredRestaurants: Restaurant[], 
  setRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>,
  saveRestaurants: (restaurants: Restaurant[]) => Promise<boolean>
) => {
  const { toast } = useToast();
  
  // Import restaurants data from Excel
  const importRestaurants = async (file: File): Promise<Restaurant[] | null> => {
    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Check if there's a Restaurants sheet
      if (!workbook.SheetNames.includes('Restaurants')) {
        throw new Error("Import file must contain a 'Restaurants' sheet");
      }
      
      // Parse the Restaurants sheet
      const restaurantsSheet = workbook.Sheets['Restaurants'];
      const importedData = XLSX.utils.sheet_to_json(restaurantsSheet);
      
      if (!Array.isArray(importedData) || importedData.length === 0) {
        throw new Error('No restaurant data found in the import file');
      }
      
      console.log('Importing restaurants from Excel:', importedData);
      
      // Process imported data to match Restaurant type
      const importedRestaurants: Restaurant[] = importedData.map((row: any, index) => {
        // Parse cuisine types from string or array
        let cuisineTypes: CuisineType[] = [];
        if (row['Cuisine Types']) {
          const cuisineStr = row['Cuisine Types']?.toString() || '';
          cuisineTypes = cuisineStr.split(',')
            .map(c => c.trim())
            .filter(c => c) as CuisineType[];
        }
        
        // Generate ID for new restaurant
        const newId = `rest${(Date.now() + index).toString(36)}`;
        
        // Build restaurant object with mandatory and fallback values
        const restaurant: Restaurant = {
          id: newId,
          externalId: row['External ID'] || undefined,
          name: row['Restaurant Name'] || `Imported Restaurant ${index + 1}`,
          address: row['Address'] || '',
          city: row['City'] || '',
          country: row['Country'] || '',
          area: row['Area'] || '',
          description: row['Description'] || '',
          cuisine: row['Cuisine'] || undefined,
          location: row['Location'] || undefined,
          priceRange: row['Price Range'] || undefined,
          priceCategory: (row['Price Category'] || '$') as '$' | '$$' | '$$$' | '$$$$',
          averageCost: parseFloat(row['Average Cost'] || '0'),
          averagePrice: parseFloat(row['Average Price'] || '0'),
          rating: parseFloat(row['Rating'] || '4'),
          reviewCount: parseInt(row['Review Count'] || '0'),
          openingTime: row['Opening Time'] || '09:00',
          closingTime: row['Closing Time'] || '22:00',
          openingHours: row['Opening Hours'] || undefined,
          imageUrl: row['Image URL'] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070',
          cuisineTypes,
          features: {
            outdoorSeating: row['Outdoor Seating'] === 'true' || row['Outdoor Seating'] === true,
            privateRooms: row['Private Rooms'] === 'true' || row['Private Rooms'] === true,
            wifi: row['WiFi'] === 'true' || row['WiFi'] === true,
            parking: row['Parking'] === 'true' || row['Parking'] === true,
            liveMusic: row['Live Music'] === 'true' || row['Live Music'] === true,
            cardAccepted: row['Card Accepted'] === 'true' || row['Card Accepted'] === true
          },
          mealTypes: {
            breakfast: row['Breakfast'] === 'true' || row['Breakfast'] === true,
            lunch: row['Lunch'] === 'true' || row['Lunch'] === true,
            dinner: row['Dinner'] === 'true' || row['Dinner'] === true,
            snacks: row['Snacks'] === 'true' || row['Snacks'] === true,
            beverages: row['Beverages'] === 'true' || row['Beverages'] === true
          },
          dietaryOptions: {
            pureVeg: row['Pure Veg'] === 'true' || row['Pure Veg'] === true,
            veganFriendly: row['Vegan Friendly'] === 'true' || row['Vegan Friendly'] === true,
            vegetarian: row['Vegetarian'] === 'true' || row['Vegetarian'] === true,
            seafood: row['Seafood'] === 'true' || row['Seafood'] === true,
            poultry: row['Poultry'] === 'true' || row['Poultry'] === true,
            redMeat: row['Red Meat'] === 'true' || row['Red Meat'] === true,
            aLaCarte: row['A La Carte'] === 'true' || row['A La Carte'] === true
          },
          currencySymbol: row['Currency Symbol'] || '$',
          currencyCode: row['Currency Code'] || 'USD',
          status: (row['Status']?.toLowerCase() === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
          isPreferred: row['Preferred'] === 'true' || row['Preferred'] === true,
          lastUpdated: new Date().toISOString(),
          vegOptions: row['Veg Options'] === 'true' || row['Veg Options'] === true
        };
        
        return restaurant;
      });
      // Fill derived fields if missing
      importedRestaurants.forEach(r => {
        if (!r.location) {
          r.location = [r.city, r.country].filter(Boolean).join(', ');
        }
        if (!r.openingHours) {
          r.openingHours = `${r.openingTime} - ${r.closingTime}`;
        }
      });
      
      // Merge with existing restaurants and persist via Supabase upsert
      const updatedRestaurants = [...restaurants, ...importedRestaurants];
      await saveRestaurants(updatedRestaurants);
      
      return importedRestaurants;
    } catch (error) {
      console.error('Error importing restaurants:', error);
      throw error;
    }
  };
  
  // Export restaurants data to Excel
  const exportRestaurants = async (): Promise<boolean> => {
    try {
      // Prepare restaurant data for export
      const exportData = filteredRestaurants.map(restaurant => ({
        'External ID': restaurant.externalId || '',
        'Restaurant Name': restaurant.name,
        'Location': restaurant.location || `${restaurant.city}${restaurant.country ? `, ${restaurant.country}` : ''}`,
        'City': restaurant.city,
        'Country': restaurant.country, 
        'Address': restaurant.address,
        'Area': restaurant.area || '',
        'Description': restaurant.description,
        'Cuisine': restaurant.cuisine || (restaurant.cuisineTypes[0] || ''),
        'Cuisine Types': restaurant.cuisineTypes.join(', '),
        'Price Range': restaurant.priceRange || '',
        'Price Category': restaurant.priceCategory,
        'Average Cost': restaurant.averageCost,
        'Average Price': restaurant.averagePrice ?? '',
        'Rating': restaurant.rating,
        'Review Count': restaurant.reviewCount,
        'Opening Time': restaurant.openingTime,
        'Closing Time': restaurant.closingTime,
        'Opening Hours': restaurant.openingHours || `${restaurant.openingTime} - ${restaurant.closingTime}`,
        'Image URL': restaurant.imageUrl,
        'Outdoor Seating': restaurant.features.outdoorSeating ? 'true' : 'false',
        'Private Rooms': restaurant.features.privateRooms ? 'true' : 'false',
        'WiFi': restaurant.features.wifi ? 'true' : 'false',
        'Parking': restaurant.features.parking ? 'true' : 'false',
        'Live Music': restaurant.features.liveMusic ? 'true' : 'false',
        'Card Accepted': restaurant.features.cardAccepted ? 'true' : 'false',
        'Breakfast': restaurant.mealTypes.breakfast ? 'true' : 'false',
        'Lunch': restaurant.mealTypes.lunch ? 'true' : 'false',
        'Dinner': restaurant.mealTypes.dinner ? 'true' : 'false',
        'Snacks': restaurant.mealTypes.snacks ? 'true' : 'false',
        'Beverages': restaurant.mealTypes.beverages ? 'true' : 'false',
        'Pure Veg': restaurant.dietaryOptions.pureVeg ? 'true' : 'false',
        'Vegan Friendly': restaurant.dietaryOptions.veganFriendly ? 'true' : 'false',
        'Vegetarian': restaurant.dietaryOptions.vegetarian ? 'true' : 'false',
        'Seafood': restaurant.dietaryOptions.seafood ? 'true' : 'false',
        'Poultry': restaurant.dietaryOptions.poultry ? 'true' : 'false',
        'Red Meat': restaurant.dietaryOptions.redMeat ? 'true' : 'false',
        'A La Carte': restaurant.dietaryOptions.aLaCarte ? 'true' : 'false',
        'Currency Symbol': restaurant.currencySymbol || '$',
        'Currency Code': restaurant.currencyCode || 'USD',
        'Status': restaurant.status,
        'Preferred': restaurant.isPreferred ? 'true' : 'false',
        'Last Updated': restaurant.lastUpdated || new Date().toISOString(),
        'Veg Options': restaurant.vegOptions ? 'true' : 'false'
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Restaurants');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(data, `Restaurants_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Error exporting restaurants:', error);
      throw error;
    }
  };
  
  return {
    importRestaurants,
    exportRestaurants
  };
};

export default useRestaurantImportExport;
