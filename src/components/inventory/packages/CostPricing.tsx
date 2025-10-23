
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, RefreshCw, CalculatorIcon } from 'lucide-react';
import { TourPackage } from '@/types/package';

interface CostPricingProps {
  packageData: Partial<TourPackage>;
  updatePackageData: (updates: Partial<TourPackage>) => void;
}

const CostPricing: React.FC<CostPricingProps> = ({ packageData, updatePackageData }) => {
  // Available currencies
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' }
  ];
  
  // Local state for tracking transport costs
  const [transportCosts, setTransportCosts] = useState<number>(0);

  // Calculate transportation costs from itinerary
  useEffect(() => {
    if (packageData.itinerary && packageData.itinerary.length > 0) {
      let totalTransportCost = 0;
      packageData.itinerary.forEach(day => {
        if (day.transportation && day.transportation.price) {
          totalTransportCost += day.transportation.price;
        }
      });
      setTransportCosts(totalTransportCost);
    }
  }, [packageData.itinerary]);
  
  // Format price with currency symbol
  const formatCurrency = (amount: number): string => {
    const currency = currencies.find(c => c.code === (packageData.currency || 'INR'));
    return `${currency?.symbol || ''}${amount.toLocaleString()}`;
  };
  
  // Calculate final price when baseCost or markup changes
  useEffect(() => {
    if (packageData.baseCost !== undefined && packageData.markup !== undefined) {
      const basePrice = packageData.baseCost;
      const markupAmount = basePrice * (packageData.markup / 100);
      const finalPrice = basePrice + markupAmount;
      const pricePerPerson = finalPrice / (packageData.minPax || 1);
      
      updatePackageData({ 
        finalPrice: Math.round(finalPrice),
        pricePerPerson: Math.round(pricePerPerson)
      });
    }
  }, [packageData.baseCost, packageData.markup, packageData.minPax]);

  // Recalculate base cost based on transportation costs
  const recalculateBaseCost = () => {
    // You can add more automated cost calculations here
    const newBaseCost = (packageData.baseCost || 0) + transportCosts;
    updatePackageData({ baseCost: newBaseCost });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Cost & Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={packageData.currency || 'INR'} 
                onValueChange={(value) => updatePackageData({ currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="baseCost">Base Cost (Per Package)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currencies.find(c => c.code === (packageData.currency || 'INR'))?.symbol}
                </span>
                <Input 
                  id="baseCost"
                  type="number"
                  className="pl-8"
                  value={packageData.baseCost || ''}
                  onChange={(e) => updatePackageData({ baseCost: Math.max(0, parseFloat(e.target.value) || 0) })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="markup">Markup Percentage</Label>
              <div className="relative">
                <Input 
                  id="markup"
                  type="number"
                  className="pr-8"
                  value={packageData.markup || ''}
                  onChange={(e) => updatePackageData({ markup: Math.max(0, parseFloat(e.target.value) || 0) })}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="commission">Agent Commission</Label>
              <div className="relative">
                <Input 
                  id="commission"
                  type="number"
                  className="pr-8"
                  value={packageData.commission || ''}
                  onChange={(e) => updatePackageData({ commission: Math.max(0, parseFloat(e.target.value) || 0) })}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          {transportCosts > 0 && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg">
              <div className="flex items-start space-x-3">
                <CalculatorIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Detected transport costs from itinerary: {formatCurrency(transportCosts)}</p>
                  <p className="text-sm mt-1">These costs can be added to your base cost automatically.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={recalculateBaseCost}
                    className="mt-2 bg-blue-100 dark:bg-blue-800/30"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Recalculate Base Cost
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Price Summary</h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Base Cost:</span>
                <span className="font-medium">{formatCurrency(packageData.baseCost || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Markup ({packageData.markup || 0}%):
                </span>
                <span className="font-medium">
                  {formatCurrency((packageData.baseCost || 0) * ((packageData.markup || 0) / 100))}
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Final Package Price:</span>
                <span className="font-bold text-lg">{formatCurrency(packageData.finalPrice || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Price Per Person (Min. {packageData.minPax || 1} pax):
                </span>
                <span className="font-bold text-lg">{formatCurrency(packageData.pricePerPerson || 0)}</span>
              </div>
              
              {packageData.commission !== undefined && packageData.commission > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Agent Commission ({packageData.commission}%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency((packageData.finalPrice || 0) * ((packageData.commission || 0) / 100))}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800/30 rounded-lg">
            <div className="flex">
              <Calculator className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  The final price includes your markup percentage. Price per person is calculated based on the minimum number of pax.
                </p>
                {packageData.isFixedDeparture && packageData.totalSeats && (
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    For fixed departure packages, total revenue potential is {formatCurrency((packageData.pricePerPerson || 0) * (packageData.totalSeats || 0))}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostPricing;
