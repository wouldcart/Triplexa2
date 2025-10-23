import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProposalOptions } from '@/hooks/useProposalOptions';
import { useSightseeingOptions } from '@/hooks/useSightseeingOptions';
import { useTransferOptions } from '@/hooks/useTransferOptions';
import { useDiningOptions } from '@/hooks/useDiningOptions';
import { OptionSelectionCard } from './OptionSelectionCard';
import { PackageSelector } from './PackageSelector';
import { ProposalComponentOption, ProposalPackage } from '@/types/proposalOptions';
import { 
  MapPin, Car, UtensilsCrossed, User, Activity, 
  Package, Settings, Calculator, Save, Eye 
} from 'lucide-react';

interface ProposalOptionsManagerProps {
  queryId: string;
  onOptionsChange?: (options: ProposalComponentOption[]) => void;
  onPriceChange?: (totalPrice: number) => void;
  formatCurrency?: (amount: number) => string;
  initialOptions?: ProposalComponentOption[];
}

export const ProposalOptionsManager: React.FC<ProposalOptionsManagerProps> = ({
  queryId,
  onOptionsChange,
  onPriceChange,
  formatCurrency = (amount) => `$${amount}`,
  initialOptions = []
}) => {
  const [activeTab, setActiveTab] = useState('packages');
  
  // Main options manager
  const {
    options,
    packages,
    selectedPackage,
    addOption,
    removeOption,
    updateOption,
    toggleOption,
    createPackage,
    selectPackage,
    getOptionsByType,
    getSelectedOptions,
    getTotalPrice,
    calculateSavings
  } = useProposalOptions(initialOptions);

  // Specialized hooks for different option types
  const sightseeingOptions = useSightseeingOptions();
  const transferOptions = useTransferOptions();
  const diningOptions = useDiningOptions();

  // Sample data creation (in real app, this would come from API/database)
  React.useEffect(() => {
    // Create sample packages if none exist
    if (packages.length === 0) {
      const basicPackage = createPackage({
        name: 'Basic Package',
        type: 'basic',
        description: 'Essential services with basic accommodations',
        options: options.filter(opt => opt.type === 'standard'),
        basePrice: 1000,
        totalPrice: 1000
      });

      const standardPackage = createPackage({
        name: 'Standard Package',
        type: 'standard',
        description: 'Comfortable travel with selected optional services',
        options: [
          ...options.filter(opt => opt.type === 'standard'),
          ...options.filter(opt => opt.type === 'optional').slice(0, 2)
        ],
        basePrice: 1500,
        totalPrice: 1500,
        savingsAmount: 200,
        savingsPercentage: 12
      });

      const premiumPackage = createPackage({
        name: 'Premium Package',
        type: 'premium',
        description: 'Luxury experience with all services included',
        options: options.filter(opt => opt.type !== 'alternative'),
        basePrice: 2500,
        totalPrice: 2500,
        savingsAmount: 500,
        savingsPercentage: 17
      });
    }
  }, [options.length, packages.length, createPackage]);

  // Notify parent components of changes
  React.useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange(getSelectedOptions());
    }
    if (onPriceChange) {
      onPriceChange(getTotalPrice());
    }
  }, [options, getSelectedOptions, getTotalPrice, onOptionsChange, onPriceChange]);

  const getTabIcon = (tabType: string) => {
    switch (tabType) {
      case 'packages': return <Package className="h-4 w-4" />;
      case 'sightseeing': return <MapPin className="h-4 w-4" />;
      case 'transfer': return <Car className="h-4 w-4" />;
      case 'dining': return <UtensilsCrossed className="h-4 w-4" />;
      case 'guide': return <User className="h-4 w-4" />;
      case 'activity': return <Activity className="h-4 w-4" />;
      case 'summary': return <Calculator className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const renderOptionCards = (optionType: string) => {
    const filteredOptions = getOptionsByType(optionType as any);
    
    if (filteredOptions.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              No {optionType} options available. Add options to get started.
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                // Add sample option based on type
                addOption({
                  id: `${optionType}_sample_${Date.now()}`,
                  componentType: optionType as any,
                  name: `Sample ${optionType} option`,
                  description: `A sample ${optionType} option for testing`,
                  type: 'optional',
                  isSelected: false,
                  isIncluded: false,
                  priority: 1,
                  pricing: {
                    basePrice: 100,
                    totalPrice: 100
                  }
                });
              }}
            >
              Add Sample Option
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOptions.map((option) => (
          <OptionSelectionCard
            key={option.id}
            option={option}
            onToggle={toggleOption}
            onUpdate={updateOption}
            formatCurrency={formatCurrency}
            showDetails={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with pricing summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Proposal Options Manager
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Selected</div>
                <div className="text-2xl font-bold">{formatCurrency(getTotalPrice())}</div>
              </div>
              {calculateSavings() > 0 && (
                <div className="text-right">
                  <div className="text-sm text-green-600">Savings</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculateSavings())}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {getSelectedOptions().length} Options Selected
            </Badge>
            <Badge variant="outline">
              Query: {queryId}
            </Badge>
            {selectedPackage && (
              <Badge variant="default">
                Package: {packages.find(p => p.id === selectedPackage)?.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            {getTabIcon('packages')}
            Packages
          </TabsTrigger>
          <TabsTrigger value="sightseeing" className="flex items-center gap-2">
            {getTabIcon('sightseeing')}
            Sightseeing
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            {getTabIcon('transfer')}
            Transfer
          </TabsTrigger>
          <TabsTrigger value="dining" className="flex items-center gap-2">
            {getTabIcon('dining')}
            Dining
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            {getTabIcon('guide')}
            Guide
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            {getTabIcon('activity')}
            Activity
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            {getTabIcon('summary')}
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Choose Your Package</h3>
              <Button variant="outline" size="sm">
                Create Custom Package
              </Button>
            </div>
            <PackageSelector
              packages={packages}
              selectedPackageId={selectedPackage}
              onSelectPackage={selectPackage}
              formatCurrency={formatCurrency}
              showSavings={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="sightseeing" className="mt-6">
          {renderOptionCards('sightseeing')}
        </TabsContent>

        <TabsContent value="transfer" className="mt-6">
          {renderOptionCards('transfer')}
        </TabsContent>

        <TabsContent value="dining" className="mt-6">
          {renderOptionCards('dining')}
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          {renderOptionCards('guide')}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {renderOptionCards('activity')}
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Selected Options</h4>
                    <div className="space-y-2">
                      {getSelectedOptions().map((option) => (
                        <div key={option.id} className="flex justify-between text-sm">
                          <span>{option.name}</span>
                          <span>{formatCurrency(option.pricing.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(getTotalPrice())}</span>
                      </div>
                      {calculateSavings() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Savings:</span>
                          <span>-{formatCurrency(calculateSavings())}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(getTotalPrice() - calculateSavings())}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Options
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Proposal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};