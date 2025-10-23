
import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '../../types/restaurantTypes';

export interface EditModeEffectProps {
  isEditMode: boolean;
  restaurants: Restaurant[];
  countryOptions: any[];
  cityOptions: any[];
  setFilteredCityOptions: (options: any[]) => void;
  setFormData: (data: Partial<Restaurant>) => void;
}

export const useEditModeEffect = ({
  isEditMode,
  restaurants,
  countryOptions,
  cityOptions,
  setFilteredCityOptions,
  setFormData
}: EditModeEffectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Load the restaurant data if in edit mode - after country and city options are loaded
  useEffect(() => {
    if (isEditMode && countryOptions.length > 0 && cityOptions.length > 0) {
      console.log('Editing mode activated, restaurant ID:', id);
      
      // Try to get restaurant from location state first
      let restaurantToEdit = location.state?.restaurant;
      
      // If not in location state, try to find it in restaurants array
      if (!restaurantToEdit) {
        console.log('Restaurant not found in location state, searching in restaurants array');
        const foundRestaurant = restaurants.find(r => r.id === id);
        if (foundRestaurant) {
          restaurantToEdit = foundRestaurant;
        }
      }
      
      if (restaurantToEdit) {
        console.log('Restaurant found for editing:', restaurantToEdit);
        console.log('Restaurant city to load:', restaurantToEdit.city);
        
        // First, pre-filter cities for the selected country to ensure they're available
        // when the form data is set
        if (restaurantToEdit.country) {
          console.log('Pre-filtering cities for country:', restaurantToEdit.country);
          const filtered = cityOptions.filter(city => city.country === restaurantToEdit.country);
          console.log('Filtered cities for edit mode:', filtered.length, filtered.map(c => c.name).join(', '));
          
          // First set filtered cities, so they're ready when form data is set
          setFilteredCityOptions(filtered);
          
          // Then, set form data with the full restaurant object in a slight delay
          // This ensures the city dropdown has options loaded before trying to select a value
          setTimeout(() => {
            console.log('Setting form data with city:', restaurantToEdit.city);
            setFormData({...restaurantToEdit});
          }, 0);
        } else {
          // If no country, just set the form data directly
          setFormData(restaurantToEdit);
        }
      } else {
        // If restaurant not found, show error and redirect
        console.error('Restaurant not found for ID:', id);
        toast({
          title: "Error",
          description: "Restaurant not found",
          variant: "destructive"
        });
        navigate('/inventory/restaurants');
      }
    }
  }, [isEditMode, id, location.state, restaurants, navigate, toast, countryOptions, cityOptions, setFormData, setFilteredCityOptions]);
};
