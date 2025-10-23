import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Query } from '@/types/query';
import { AdvancedProposalModule } from '@/types/advancedProposal';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';
import { AdvancedPricingEngine } from './services/PricingEngine';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';

// Import existing enhanced modules
import TransportModuleTab from '../enhanced/TransportModuleTab';
import HotelModuleTab from '../enhanced/HotelModuleTab';
import SightseeingModuleTab from '../enhanced/SightseeingModuleTab';
import RestaurantModuleTab from '../enhanced/RestaurantModuleTab';

// Import new advanced modules
import InsuranceModuleTab from './modules/InsuranceModuleTab';
import TechnologyModuleTab from './modules/TechnologyModuleTab';
import LuxuryModuleTab from './modules/LuxuryModuleTab';
import ShoppingModuleTab from './modules/ShoppingModuleTab';
import EntertainmentModuleTab from './modules/EntertainmentModuleTab';
import AirportModuleTab from './modules/AirportModuleTab';

import { 
  Car, Hotel, Landmark, Utensils, Shield, Smartphone, Crown, 
  ShoppingBag, Music, Plane, Calculator, TrendingUp, Users,
  FileText, Download, Share, Save
} from 'lucide-react';

interface AdvancedProposalBuilderProps {
  query: Query;
  onProposalSave?: (proposal: any) => void;
  onProposalExport?: (proposal: any) => void;
}

const AdvancedProposalBuilder: React.FC<AdvancedProposalBuilderProps> = ({
  query,
  onProposalSave,
  onProposalExport,
}) => {
  const [activeTab, setActiveTab] = useState('transport');
  const [selectedModules, setSelectedModules] = useState<AdvancedProposalModule[]>([]);
  const [pricingEngine] = useState(() => AdvancedPricingEngine.getInstance());
  
  const country = query.destination.country;
  const currencySymbol = getCurrencySymbolByCountry(country);

  // Load transport routes based on query data
  const { routes: transportRoutes = [], loading: routesLoading = false } = useTransportRoutes({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  }) || {};

  console.log('Transport routes loaded:', transportRoutes.length, 'routes');
  console.log('Routes loading state:', routesLoading);
  console.log('Query country:', country);
  console.log('Query cities:', query.destination.cities);

  // Update module counts based on real data
  const moduleCounts = {
    transport: transportRoutes.length,
    hotel: 3,
    sightseeing: 8,
    restaurant: 4,
    insurance: 4,
    technology: 4,
    luxury: 5,
    shopping: 3,
    entertainment: 2,
    airport: 4
  };

  const handleAddModule = (module: any) => {
    try {
      console.log('Adding module:', module);
      const advancedModule: AdvancedProposalModule = {
        id: module.id || `${module.type}_${Date.now()}`,
        type: module.type,
        name: module.data?.name || module.name || `${module.type} service`,
        category: module.type,
        data: module.data,
        pricing: {
          basePrice: module.pricing.basePrice,
          finalPrice: pricingEngine.calculateDynamicPricing(module, query, {
            enableSeasonalPricing: true,
            enableGroupDiscounts: true,
            enableAdvanceBooking: true,
            enableDemandPricing: true
          }),
          currency: module.pricing.currency,
          breakdown: module.pricing.breakdown
        },
        status: 'active',
        metadata: {
          supplier: module.data?.supplier,
          bookingReference: module.data?.bookingReference,
          confirmationRequired: true,
          tags: [module.type, query.destination.country]
        }
      };

      setSelectedModules(prev => [...prev, advancedModule]);
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const handleRemoveModule = (id: string) => {
    setSelectedModules(prev => prev.filter(module => module.id !== id));
  };

  const handleUpdatePricing = (id: string, pricing: any) => {
    setSelectedModules(prev => 
      prev.map(module => 
        module.id === id 
          ? { ...module, pricing: { ...module.pricing, ...pricing } }
          : module
      )
    );
  };

  // Calculate proposal totals
  const proposalTotals = useMemo(() => {
    const subtotal = selectedModules.reduce((sum, module) => sum + module.pricing.finalPrice, 0);
    const bundleDiscounts = pricingEngine.calculateBundleDiscounts(selectedModules);
    const discountAmount = bundleDiscounts.reduce((sum, discount) => {
      return sum + (discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value);
    }, 0);
    const total = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      total,
      bundleDiscounts,
      moduleCount: selectedModules.length
    };
  }, [selectedModules, pricingEngine]);

  const handleSaveProposal = () => {
    try {
      const proposal = {
        id: `proposal_${Date.now()}`,
        query,
        modules: selectedModules,
        totals: proposalTotals,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
      
      onProposalSave?.(proposal);
    } catch (error) {
      console.error('Error saving proposal:', error);
    }
  };

  const handleExportProposal = () => {
    try {
      const proposal = {
        query,
        modules: selectedModules,
        totals: proposalTotals
      };
      
      onProposalExport?.(proposal);
    } catch (error) {
      console.error('Error exporting proposal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white border-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">Advanced Proposal Builder</CardTitle>
                <p className="text-blue-100 dark:text-blue-200">
                  {query.destination.cities.join(', ')}, {country} • {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} travelers
                </p>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                  {query.travelDates.from} to {query.travelDates.to} • {query.tripDuration?.days} days
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSaveProposal} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button variant="secondary" onClick={handleExportProposal} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Proposal Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500 dark:text-blue-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{proposalTotals.moduleCount}</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Services Added</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{proposalTotals.subtotal.toFixed(0)} {currencySymbol}</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Subtotal</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500 dark:text-orange-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">-{proposalTotals.discountAmount.toFixed(0)} {currencySymbol}</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Bundle Savings</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500 dark:text-purple-400" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{proposalTotals.total.toFixed(0)} {currencySymbol}</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Total Price</div>
            </CardContent>
          </Card>
        </div>

        {/* Module Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <TabsTrigger value="transport" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Car className="h-3 w-3" />
              <span className="hidden sm:inline">Transport</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.transport}</Badge>
            </TabsTrigger>
            <TabsTrigger value="hotel" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Hotel className="h-3 w-3" />
              <span className="hidden sm:inline">Hotels</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.hotel}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sightseeing" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Landmark className="h-3 w-3" />
              <span className="hidden sm:inline">Sightseeing</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.sightseeing}</Badge>
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Utensils className="h-3 w-3" />
              <span className="hidden sm:inline">Dining</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.restaurant}</Badge>
            </TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Insurance</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.insurance}</Badge>
            </TabsTrigger>
            <TabsTrigger value="technology" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Smartphone className="h-3 w-3" />
              <span className="hidden sm:inline">Technology</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.technology}</Badge>
            </TabsTrigger>
            <TabsTrigger value="luxury" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Crown className="h-3 w-3" />
              <span className="hidden sm:inline">Luxury</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.luxury}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <ShoppingBag className="h-3 w-3" />
              <span className="hidden sm:inline">Shopping</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.shopping}</Badge>
            </TabsTrigger>
            <TabsTrigger value="entertainment" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Music className="h-3 w-3" />
              <span className="hidden sm:inline">Entertainment</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.entertainment}</Badge>
            </TabsTrigger>
            <TabsTrigger value="airport" className="flex items-center gap-1 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
              <Plane className="h-3 w-3" />
              <span className="hidden sm:inline">Airport</span>
              <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{moduleCounts.airport}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="transport" className="mt-6">
            <TransportModuleTab
              country={country}
              allRoutes={transportRoutes}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              loading={routesLoading}
            />
          </TabsContent>

          <TabsContent value="hotel" className="mt-6">
            <HotelModuleTab
              country={country}
              hotels={[]} // Pass actual hotels
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="sightseeing" className="mt-6">
            <SightseeingModuleTab
              country={country}
              sightseeing={[]} // Pass actual sightseeing
              selectedCities={query.destination.cities}
              selectedModules={selectedModules}
              transportAdded={selectedModules.some(m => m.type === 'transport')}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="restaurant" className="mt-6">
            <RestaurantModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="insurance" className="mt-6">
            <InsuranceModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="technology" className="mt-6">
            <TechnologyModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="luxury" className="mt-6">
            <LuxuryModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="shopping" className="mt-6">
            <ShoppingModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="entertainment" className="mt-6">
            <EntertainmentModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>

          <TabsContent value="airport" className="mt-6">
            <AirportModuleTab
              country={country}
              selectedModules={selectedModules}
              onAddModule={handleAddModule}
              onRemoveModule={handleRemoveModule}
              onUpdatePricing={handleUpdatePricing}
              query={query}
            />
          </TabsContent>
        </Tabs>

        {/* Selected Modules Summary */}
        {selectedModules.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                <span>Selected Services ({selectedModules.length})</span>
                <div className="flex items-center gap-4">
                  {proposalTotals.bundleDiscounts.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Bundle Savings: {proposalTotals.discountAmount.toFixed(0)} {currencySymbol}
                    </Badge>
                  )}
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {proposalTotals.total.toFixed(2)} {currencySymbol}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedModules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-3 bg-muted dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{module.name}</div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400 capitalize">
                        {module.type} • {module.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{module.pricing.finalPrice.toFixed(0)} {currencySymbol}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveModule(module.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedProposalBuilder;
