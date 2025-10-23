import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Utensils, Users, Hotel } from 'lucide-react';
import { EnhancedMarkupData } from '@/types/enhancedMarkup';

interface ServiceCostCalculatorProps {
  markupData: EnhancedMarkupData;
  formatCurrency: (amount: number) => string;
}

export const ServiceCostCalculator: React.FC<ServiceCostCalculatorProps> = ({
  markupData,
  formatCurrency
}) => {
  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  
  if (!selectedOption) return null;

  const { serviceCosts } = selectedOption;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Cost Breakdown</h3>
        <p className="text-muted-foreground text-sm">
          Detailed breakdown of sightseeing, transport, and dining costs for the selected option.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sightseeing Costs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-blue-600" />
              Sightseeing & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {markupData.adults} Adults, {markupData.children} Children
              </span>
            </div>

            {serviceCosts.sightseeing.adultPrice && serviceCosts.sightseeing.childPrice ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Adult Rate:</span>
                  <span>{formatCurrency(serviceCosts.sightseeing.adultPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Child Rate:</span>
                  <span>{formatCurrency(serviceCosts.sightseeing.childPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Adult Cost ({markupData.adults}×):</span>
                  <span>{formatCurrency(serviceCosts.sightseeing.adultPrice * markupData.adults)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Child Cost ({markupData.children}×):</span>
                  <span>{formatCurrency((serviceCosts.sightseeing.childPrice || 0) * markupData.children)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Flat Rate per Person:</span>
                  <span>{formatCurrency((serviceCosts.sightseeing.flatRate || serviceCosts.sightseeing.total) / markupData.totalPax)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total PAX ({markupData.totalPax}×):</span>
                  <span>{formatCurrency(serviceCosts.sightseeing.total)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Sightseeing:</span>
                <span className="text-blue-600">{formatCurrency(serviceCosts.sightseeing.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transport Costs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-green-600" />
              Transport & Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Distributed across {markupData.totalPax} passengers
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Transport Cost:</span>
                <span>{formatCurrency(serviceCosts.transport.totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Per Person Cost:</span>
                <span>{formatCurrency(serviceCosts.transport.perPersonCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Adults ({markupData.adults}×):</span>
                <span>{formatCurrency(serviceCosts.transport.perPersonCost * markupData.adults)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Children ({markupData.children}×):</span>
                <span>{formatCurrency(serviceCosts.transport.perPersonCost * markupData.children)}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Transport:</span>
                <span className="text-green-600">{formatCurrency(serviceCosts.transport.totalCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dining Costs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-4 w-4 text-orange-600" />
              Dining & Meals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {markupData.adults} Adults, {markupData.children} Children
              </span>
            </div>

            {serviceCosts.dining.adultPrice && serviceCosts.dining.childPrice ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Adult Meal Rate:</span>
                  <span>{formatCurrency(serviceCosts.dining.adultPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Child Meal Rate:</span>
                  <span>{formatCurrency(serviceCosts.dining.childPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Adult Cost ({markupData.adults}×):</span>
                  <span>{formatCurrency(serviceCosts.dining.adultPrice * markupData.adults)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Child Cost ({markupData.children}×):</span>
                  <span>{formatCurrency((serviceCosts.dining.childPrice || 0) * markupData.children)}</span>
                </div>
              </div>
            ) : serviceCosts.dining.total > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Flat Rate per Person:</span>
                  <span>{formatCurrency((serviceCosts.dining.flatRate || serviceCosts.dining.total) / markupData.totalPax)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total PAX ({markupData.totalPax}×):</span>
                  <span>{formatCurrency(serviceCosts.dining.total)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Badge variant="secondary">No dining costs included</Badge>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Dining:</span>
                <span className="text-orange-600">{formatCurrency(serviceCosts.dining.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Costs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hotel className="h-4 w-4 text-purple-600" />
              Accommodation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {serviceCosts.accommodation.totalRooms} Rooms, {serviceCosts.accommodation.totalNights} Nights
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Rooms:</span>
                <span>{serviceCosts.accommodation.totalRooms}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Nights:</span>
                <span>{serviceCosts.accommodation.totalNights}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Per Person Cost:</span>
                <span>{formatCurrency(serviceCosts.accommodation.perPersonCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Adults ({markupData.adults}×):</span>
                <span>{formatCurrency(serviceCosts.accommodation.perPersonCost * markupData.adults)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Children ({markupData.children}×):</span>
                <span>{formatCurrency(serviceCosts.accommodation.perPersonCost * markupData.children)}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Accommodation:</span>
                <span className="text-purple-600">{formatCurrency(serviceCosts.accommodation.totalCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Services Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(serviceCosts.sightseeing.total)}
              </div>
              <div className="text-sm text-muted-foreground">Sightseeing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(serviceCosts.transport.totalCost)}
              </div>
              <div className="text-sm text-muted-foreground">Transport</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(serviceCosts.dining.total)}
              </div>
              <div className="text-sm text-muted-foreground">Dining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(serviceCosts.accommodation.totalCost)}
              </div>
              <div className="text-sm text-muted-foreground">Accommodation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(
                  serviceCosts.sightseeing.total + 
                  serviceCosts.transport.totalCost + 
                  serviceCosts.dining.total +
                  serviceCosts.accommodation.totalCost
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};