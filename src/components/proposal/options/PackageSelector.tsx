import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProposalPackage } from '@/types/proposalOptions';
import { Check, Star, Package, DollarSign, Percent } from 'lucide-react';

interface PackageSelectorProps {
  packages: ProposalPackage[];
  selectedPackageId: string | null;
  onSelectPackage: (packageId: string) => void;
  formatCurrency?: (amount: number) => string;
  showSavings?: boolean;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  selectedPackageId,
  onSelectPackage,
  formatCurrency = (amount) => `$${amount}`,
  showSavings = true
}) => {
  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'custom': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'basic': return <Package className="h-5 w-5" />;
      case 'standard': return <Star className="h-5 w-5" />;
      case 'premium': return <Star className="h-5 w-5 fill-current" />;
      case 'custom': return <Package className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packages.map((pkg) => (
        <Card 
          key={pkg.id}
          className={`relative transition-all duration-200 cursor-pointer ${
            selectedPackageId === pkg.id 
              ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
              : 'hover:shadow-md hover:bg-gray-50'
          }`}
          onClick={() => onSelectPackage(pkg.id)}
        >
          {selectedPackageId === pkg.id && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          )}
          
          {pkg.type === 'premium' && (
            <div className="absolute -top-2 -left-2 bg-yellow-500 text-white rounded-full p-1">
              <Star className="h-4 w-4 fill-current" />
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPackageIcon(pkg.type)}
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
              </div>
              <Badge className={getPackageTypeColor(pkg.type)}>
                {pkg.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {pkg.description}
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Package options summary */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Includes:</div>
                <div className="space-y-1">
                  {pkg.options.slice(0, 4).map((option) => (
                    <div key={option.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" />
                      <span>{option.name}</span>
                    </div>
                  ))}
                  {pkg.options.length > 4 && (
                    <div className="text-xs text-muted-foreground">
                      +{pkg.options.length - 4} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Price:</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(pkg.totalPrice)}
                  </span>
                </div>
                
                {showSavings && pkg.savingsAmount && pkg.savingsAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span className="text-sm">You Save:</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(pkg.savingsAmount)}
                      {pkg.savingsPercentage && (
                        <span className="ml-1">({pkg.savingsPercentage.toFixed(0)}%)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Select button */}
              <Button 
                variant={selectedPackageId === pkg.id ? "default" : "outline"} 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPackage(pkg.id);
                }}
              >
                {selectedPackageId === pkg.id ? 'Selected' : 'Select Package'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};