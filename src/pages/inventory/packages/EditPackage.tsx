
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TourPackage } from '@/types/package';
import PackageBasicInfo from '@/components/inventory/packages/PackageBasicInfo';
import ItineraryBuilder from '@/components/inventory/packages/ItineraryBuilder';
import CostPricing from '@/components/inventory/packages/CostPricing';
import TermsConditions from '@/components/inventory/packages/TermsConditions';
import { getPackageById, updatePackage } from './services/storageService';

const EditPackage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [packageData, setPackageData] = useState<Partial<TourPackage>>({});
  
  // Load package data when component mounts
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "No package ID provided.",
        variant: "destructive"
      });
      navigate('/inventory/packages');
      return;
    }
    
    // Get package data from storage
    try {
      const pkg = getPackageById(id);
      if (pkg) {
        setPackageData(pkg);
      } else {
        toast({
          title: "Error",
          description: "Package not found.",
          variant: "destructive"
        });
        navigate('/inventory/packages');
      }
    } catch (error) {
      console.error("Error loading package:", error);
      toast({
        title: "Error",
        description: "Failed to load package data. Please try again.",
        variant: "destructive"
      });
      navigate('/inventory/packages');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, toast]);
  
  // Handle form submission
  const handleSubmit = (published: boolean = false) => {
    if (!packageData.name) {
      toast({
        title: "Missing information",
        description: "Please provide a package name.",
        variant: "destructive"
      });
      setActiveTab('basic-info');
      return;
    }
    
    if (!packageData.destinations || packageData.destinations.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add at least one destination.",
        variant: "destructive"
      });
      setActiveTab('basic-info');
      return;
    }
    
    if (!packageData.itinerary || packageData.itinerary.length === 0) {
      toast({
        title: "Missing information",
        description: "Please create an itinerary.",
        variant: "destructive"
      });
      setActiveTab('itinerary');
      return;
    }
    
    // Update the status if published is true
    if (published) {
      packageData.status = 'published';
    }
    
    // Save to localStorage
    console.log("Updating package:", packageData);
    if (id) {
      updatePackage(id, packageData as TourPackage);
    }
    
    toast({
      title: published ? "Package published" : "Package updated",
      description: `${packageData.name} has been ${published ? 'published' : 'updated'} successfully.`
    });
    
    navigate('/inventory/packages');
  };
  
  // Handle form input changes
  const updatePackageData = (updates: Partial<TourPackage>) => {
    setPackageData(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Navigation to previous section
  const goToPrevious = () => {
    const tabs = ['basic-info', 'itinerary', 'pricing', 'terms'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  // Navigation to next section
  const goToNext = () => {
    const tabs = ['basic-info', 'itinerary', 'pricing', 'terms'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };
  
  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/inventory/packages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Tour Package</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic-info" className="flex gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Basic Info</span>
              <span className="inline sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              <span>Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Terms & Conditions</span>
              <span className="inline sm:hidden">Terms</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic-info" className="space-y-4">
            <PackageBasicInfo
              packageData={packageData}
              updatePackageData={updatePackageData}
            />
            <div className="flex justify-end mt-6">
              <Button onClick={goToNext}>
                Continue to Itinerary
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="itinerary" className="space-y-4">
            <ItineraryBuilder
              packageData={packageData}
              updatePackageData={updatePackageData}
            />
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPrevious}>
                Back
              </Button>
              <Button onClick={goToNext}>
                Continue to Pricing
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <CostPricing
              packageData={packageData}
              updatePackageData={updatePackageData}
            />
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPrevious}>
                Back
              </Button>
              <Button onClick={goToNext}>
                Continue to Terms
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="terms" className="space-y-4">
            <TermsConditions
              packageData={packageData}
              updatePackageData={updatePackageData}
            />
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={goToPrevious}>
                Back
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => handleSubmit(false)}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(true)}>
                  Publish Package
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default EditPackage;
