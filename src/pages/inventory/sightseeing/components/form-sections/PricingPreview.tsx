
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, DollarSign, Car, Package, Users, UserCheck } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { getCurrencyByCountry } from '../../utils/currency';

interface PricingPreviewProps {
  formData: Sightseeing;
}

const PricingPreview: React.FC<PricingPreviewProps> = ({ formData }) => {
  const currency = getCurrencyByCountry(formData.country || '');
  const currencySymbol = currency.symbol;
  const enabledPricingOptions = formData.pricingOptions?.filter(option => option.isEnabled) || [];
  const enabledTransferOptions = formData.transferOptions?.filter(option => option.isEnabled) || [];
  const enabledPackageOptions = formData.packageOptions?.filter(option => option.isEnabled) || [];

  if (formData.isFree) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Pricing Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Badge variant="secondary" className="text-lg py-2 px-4">
              FREE ACTIVITY
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              This sightseeing activity is completely free of charge
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyPricing = 
    (formData.price && (formData.price.adult > 0 || formData.price.child > 0)) ||
    (formData.sicAvailable && formData.sicPricing && (formData.sicPricing.adult > 0 || formData.sicPricing.child > 0)) ||
    enabledPricingOptions.length > 0 ||
    enabledTransferOptions.length > 0 ||
    enabledPackageOptions.length > 0 ||
    (formData.groupSizeOptions && formData.groupSizeOptions.length > 0 && formData.groupSizeOptions.some(o => o.adultPrice > 0 || o.childPrice > 0));

  if (!hasAnyPricing) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Pricing Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No pricing options configured yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          Pricing Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Standard Pricing */}
        {formData.price && (formData.price.adult > 0 || formData.price.child > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" />
              <h4 className="font-medium">Standard Pricing</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Adult</div>
                <div className="font-semibold">{currencySymbol}{formData.price.adult}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Child</div>
                <div className="font-semibold">{currencySymbol}{formData.price.child}</div>
              </div>
            </div>
          </div>
        )}

        {/* SIC Pricing */}
        {formData.sicAvailable && formData.sicPricing && (formData.sicPricing.adult > 0 || formData.sicPricing.child > 0) && (
          <>
            {formData.price && (formData.price.adult > 0 || formData.price.child > 0) && <Separator />}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-4 w-4" />
                <h4 className="font-medium">SIC (Seat-in-Coach) Pricing</h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Available</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Adult</div>
                  <div className="font-semibold">{currencySymbol}{formData.sicPricing.adult}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Child</div>
                  <div className="font-semibold">{currencySymbol}{formData.sicPricing.child}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pricing Options */}
        {enabledPricingOptions.length > 0 && (
          <>
            {formData.price && (formData.price.adult > 0 || formData.price.child > 0) && <Separator />}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4" />
                <h4 className="font-medium">Pricing Options</h4>
                <Badge variant="outline">{enabledPricingOptions.length}</Badge>
              </div>
              <div className="space-y-2">
                {enabledPricingOptions.map((option, index) => (
                  <div key={option.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{option.type}</div>
                      <Badge variant="secondary" className="text-xs">Enabled</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Adult: <span className="font-semibold">{currencySymbol}{option.adultPrice}</span></div>
                      <div>Child: <span className="font-semibold">{currencySymbol}{option.childPrice}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Transfer Options */}
        {enabledTransferOptions.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-4 w-4" />
                <h4 className="font-medium">Transfer Options</h4>
                <Badge variant="outline">{enabledTransferOptions.length}</Badge>
              </div>
              <div className="space-y-2">
                {enabledTransferOptions.map((option, index) => (
                  <div key={option.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{option.vehicleType}</div>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">{option.type || 'SIC'}</Badge>
                        <Badge variant="secondary" className="text-xs">Enabled</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>Capacity: <span className="font-semibold">{option.capacity}</span></div>
                      <div>Price: <span className="font-semibold">{currencySymbol}{option.price} {option.priceUnit}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Package Options */}
        {enabledPackageOptions.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                <h4 className="font-medium">Package Options</h4>
                <Badge variant="outline">{enabledPackageOptions.length}</Badge>
              </div>
              <div className="space-y-2">
                {enabledPackageOptions.map((option, index) => (
                  <div key={option.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{option.name}</div>
                        <div className="text-xs text-muted-foreground">{option.type}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Enabled</Badge>
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground mb-2">{option.description}</div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Adult: <span className="font-semibold">{currencySymbol}{option.adultPrice}</span></div>
                      <div>Child: <span className="font-semibold">{currencySymbol}{option.childPrice}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Group Size Options */}
        {formData.groupSizeOptions && formData.groupSizeOptions.length > 0 && formData.groupSizeOptions.some(o => o.adultPrice > 0 || o.childPrice > 0) && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                <h4 className="font-medium">Group Size Options</h4>
                <Badge variant="outline">{formData.groupSizeOptions.length}</Badge>
              </div>
              <div className="space-y-2">
                {formData.groupSizeOptions.map((option, index) => (
                  <div key={option.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">
                        {option.minPeople} - {option.maxPeople} people
                      </div>
                      <Badge variant="secondary" className="text-xs">Group Rate</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Adult: <span className="font-semibold">{currencySymbol}{option.adultPrice}</span></div>
                      <div>Child: <span className="font-semibold">{currencySymbol}{option.childPrice}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingPreview;
