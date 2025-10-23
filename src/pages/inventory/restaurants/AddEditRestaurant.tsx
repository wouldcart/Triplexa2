
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import useRestaurantForm from './hooks/useRestaurantForm';
import RestaurantBasicInfoForm from './components/RestaurantBasicInfoForm';
import RestaurantImageForm from './components/RestaurantImageForm';
import RestaurantCuisineForm from './components/RestaurantCuisineForm';
import RestaurantPricingForm from './components/RestaurantPricingForm';
import RestaurantFeaturesForm from './components/RestaurantFeaturesForm';

const AddEditRestaurant: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    formData,
    isEditMode,
    countryOptions,
    filteredCityOptions,
    cuisineOptions,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleCuisineTypeChange,
    handleTimeChange,
    handleSubmit
  } = useRestaurantForm();

  return (
    <PageLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate('/inventory/restaurants')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Restaurant' : 'Add Restaurant'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? 'Update restaurant details' : 'Add a new restaurant to the inventory'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent>
              <RestaurantBasicInfoForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                handleCheckboxChange={handleCheckboxChange}
                countryOptions={countryOptions}
                filteredCityOptions={filteredCityOptions}
              />
            </CardContent>
          </Card>
          
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Image</CardTitle>
              <CardDescription>Upload high-quality images of the restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              <RestaurantImageForm 
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Menu Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RestaurantCuisineForm 
                formData={formData}
                cuisineOptions={cuisineOptions}
                handleCuisineTypeChange={handleCuisineTypeChange}
                handleCheckboxChange={handleCheckboxChange}
              />
            </CardContent>
          </Card>

          {/* Pricing Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RestaurantPricingForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
              />
            </CardContent>
          </Card>

          {/* Additional Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RestaurantFeaturesForm
                formData={formData}
                handleCheckboxChange={handleCheckboxChange}
                handleTimeChange={handleTimeChange}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory/restaurants')}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue/90">
              {isEditMode ? 'Update Restaurant' : 'Add Restaurant'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddEditRestaurant;
