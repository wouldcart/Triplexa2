
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Plus, CheckCircle, Clock, DollarSign, FileText, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TourPackage } from '@/types/package';
import PackageBasicInfo from '@/components/inventory/packages/PackageBasicInfo';
import ItineraryBuilder from '@/components/inventory/packages/ItineraryBuilder';
import CostPricing from '@/components/inventory/packages/CostPricing';
import TermsConditions from '@/components/inventory/packages/TermsConditions';
import { tourPackageService } from '@/integrations/supabase/services/tourPackageService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const CreatePackage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-info');
  
  // Package state with initial values
  const [packageData, setPackageData] = useState<Partial<TourPackage>>({
    name: '',
    minPax: 2,
    days: 1,
    nights: 0,
    isFixedDeparture: false,
    totalSeats: 0,
    startCity: '',
    endCity: '',
    destinations: [],
    packageType: 'domestic',
    themes: [],
    banners: [],
    itinerary: [],
    baseCost: 0,
    markup: 15,
    finalPrice: 0,
    pricePerPerson: 0,
    currency: 'INR',
    inclusions: '',
    exclusions: '',
    cancellationPolicy: '',
    paymentPolicy: '',
    status: 'draft'
  });

  // Calculate completion percentage for progress indicator
  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 4;
    
    // Basic Info checks
    if (packageData.name && packageData.destinations && packageData.destinations.length > 0) {
      completed++;
    }
    
    // Itinerary checks
    if (packageData.itinerary && packageData.itinerary.length > 0) {
      completed++;
    }
    
    // Pricing checks
    if (packageData.baseCost > 0 && packageData.finalPrice > 0) {
      completed++;
    }
    
    // Terms checks
    if (packageData.inclusions || packageData.exclusions) {
      completed++;
    }
    
    return Math.round((completed / total) * 100);
  };

  // Validation for each step
  const getStepValidation = (step: string) => {
    switch (step) {
      case 'basic-info':
        return packageData.name && packageData.destinations && packageData.destinations.length > 0;
      case 'itinerary':
        return packageData.itinerary && packageData.itinerary.length > 0;
      case 'pricing':
        return packageData.baseCost > 0 && packageData.finalPrice > 0;
      case 'terms':
        return true; // Terms are optional
      default:
        return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (published: boolean = false) => {
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
    
    try {
      const created = await tourPackageService.createFromUiPackage({
        ...packageData,
        status: published ? 'published' : 'draft',
        createdAt: new Date().toISOString(),
      });
      toast({
        title: published ? 'Package published' : 'Package saved as draft',
        description: `${created.name} has been ${published ? 'published' : 'saved as draft'} successfully.`,
      });
      navigate('/inventory/packages');
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message ?? 'An error occurred while saving the package.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle form input changes
  const updatePackageData = (updates: Partial<TourPackage>) => {
    setPackageData(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle navigation between tabs
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

  const tabsConfig = [
    {
      id: 'basic-info',
      label: 'Basic Info',
      icon: MapPin,
      description: 'Package details and destinations'
    },
    {
      id: 'itinerary',
      label: 'Itinerary',
      icon: Calendar,
      description: 'Day-by-day activities'
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: DollarSign,
      description: 'Cost and pricing details'
    },
    {
      id: 'terms',
      label: 'Terms',
      icon: FileText,
      description: 'Policies and conditions'
    }
  ];
  
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/inventory/packages')}
                className="h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Create New Tour Package
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Build a comprehensive tour package with detailed itinerary and pricing
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300">
                  {getCompletionPercentage()}% Complete
                </Badge>
                <div className="w-32">
                  <Progress value={getCompletionPercentage()} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <TabsList className="grid grid-cols-4 w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-1 h-auto">
                {tabsConfig.map((tab) => {
                  const Icon = tab.icon;
                  const isCompleted = getStepValidation(tab.id);
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className="flex flex-col gap-2 p-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 rounded-md transition-all duration-200 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{tab.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <TabsContent value="basic-info" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Package Information</h2>
                  <p className="text-gray-600 dark:text-gray-400">Enter the basic details for your tour package</p>
                </div>
                <PackageBasicInfo
                  packageData={packageData}
                  updatePackageData={updatePackageData}
                />
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={goToNext}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                  >
                    Continue to Itinerary
                    <Calendar className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="itinerary" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Itinerary Builder</h2>
                  <p className="text-gray-600 dark:text-gray-400">Create a detailed day-by-day itinerary for your package</p>
                </div>
                <ItineraryBuilder
                  packageData={packageData}
                  updatePackageData={updatePackageData}
                />
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={goToPrevious} className="px-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Basic Info
                  </Button>
                  <Button 
                    onClick={goToNext}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                  >
                    Continue to Pricing
                    <DollarSign className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cost & Pricing</h2>
                  <p className="text-gray-600 dark:text-gray-400">Set the base cost, markup, and final pricing for your package</p>
                </div>
                <CostPricing
                  packageData={packageData}
                  updatePackageData={updatePackageData}
                />
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={goToPrevious} className="px-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Itinerary
                  </Button>
                  <Button 
                    onClick={goToNext}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                  >
                    Continue to Terms
                    <FileText className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="terms" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h2>
                  <p className="text-gray-600 dark:text-gray-400">Define inclusions, exclusions, and policies for your package</p>
                </div>
                <TermsConditions
                  packageData={packageData}
                  updatePackageData={updatePackageData}
                />
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={goToPrevious} className="px-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pricing
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSubmit(false)}
                      className="px-6 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button 
                      onClick={() => handleSubmit(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Publish Package
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Quick Actions Sidebar */}
          <div className="fixed bottom-6 right-6 z-10">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSubmit(false)}
                    className="text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Quick Save
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    {getCompletionPercentage()}% done
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreatePackage;
