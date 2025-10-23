
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Plus } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface InsuranceModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const InsuranceModuleTab: React.FC<InsuranceModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  const insuranceOptions = [
    {
      id: 'basic-travel',
      name: 'Basic Travel Insurance',
      type: 'basic',
      coverage: {
        medicalExpenses: 50000,
        tripCancellation: 10000,
        baggageLoss: 2000,
        personalAccident: 25000,
        emergencyEvacuation: 100000
      },
      price: 45,
      provider: 'SafeTravel Insurance'
    },
    {
      id: 'premium-travel',
      name: 'Premium Travel Insurance',
      type: 'premium',
      coverage: {
        medicalExpenses: 100000,
        tripCancellation: 25000,
        baggageLoss: 5000,
        personalAccident: 50000,
        emergencyEvacuation: 250000,
        adventureActivities: true
      },
      price: 85,
      provider: 'GlobalCare Insurance'
    },
    {
      id: 'adventure-travel',
      name: 'Adventure Travel Insurance',
      type: 'adventure',
      coverage: {
        medicalExpenses: 150000,
        tripCancellation: 35000,
        baggageLoss: 7500,
        personalAccident: 100000,
        emergencyEvacuation: 500000,
        adventureActivities: true,
        extremeSports: true
      },
      price: 125,
      provider: 'AdventureGuard Insurance'
    }
  ];

  const handleAddInsurance = (insurance: any) => {
    const totalPrice = insurance.price * totalPax;
    
    const module = {
      id: `insurance_${insurance.id}_${Date.now()}`,
      type: 'insurance',
      data: {
        ...insurance,
        totalPax,
        name: insurance.name,
        coverage: insurance.coverage
      },
      pricing: {
        basePrice: totalPrice,
        finalPrice: totalPrice,
        currency: country
      }
    };

    onAddModule(module);
  };

  const isInsuranceSelected = (insuranceId: string) => {
    return selectedModules.some(module => 
      module.type === 'insurance' && 
      module.data?.id === insuranceId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Travel Insurance Options</h3>
        <p className="text-muted-foreground">
          Protect your journey with comprehensive travel insurance coverage
        </p>
        <Badge variant="secondary" className="mt-2">
          {totalPax} travelers • {query.tripDuration?.days} days
        </Badge>
      </div>

      <div className="grid gap-6">
        {insuranceOptions.map((insurance) => (
          <Card key={insurance.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  {insurance.name}
                </div>
                <Badge variant="outline" className="capitalize">
                  {insurance.type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Medical Expenses</div>
                  <div className="font-medium">{currencySymbol}{insurance.coverage.medicalExpenses.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Trip Cancellation</div>
                  <div className="font-medium">{currencySymbol}{insurance.coverage.tripCancellation.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Baggage Loss</div>
                  <div className="font-medium">{currencySymbol}{insurance.coverage.baggageLoss.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Personal Accident</div>
                  <div className="font-medium">{currencySymbol}{insurance.coverage.personalAccident.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Emergency Evacuation</div>
                  <div className="font-medium">{currencySymbol}{insurance.coverage.emergencyEvacuation.toLocaleString()}</div>
                </div>
                {insurance.coverage.adventureActivities && (
                  <div>
                    <div className="text-muted-foreground">Adventure Activities</div>
                    <div className="font-medium text-green-600">✓ Covered</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Per person</div>
                  <div className="text-lg font-bold">{currencySymbol}{insurance.price}</div>
                  <div className="text-sm text-muted-foreground">
                    Total for {totalPax}: {currencySymbol}{insurance.price * totalPax}
                  </div>
                </div>
                {isInsuranceSelected(insurance.id) ? (
                  <Button variant="outline" disabled className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Added to Services
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleAddInsurance(insurance)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Insurance
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InsuranceModuleTab;
