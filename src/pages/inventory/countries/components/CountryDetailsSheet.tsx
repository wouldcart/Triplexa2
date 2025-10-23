
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Country } from '../types/country';
import { getCurrencyDisplayInfo } from '../utils/currencyUtils';

interface CountryDetailsSheetProps {
  country: Country;
  isOpen: boolean;
  onClose: () => void;
}

const CountryDetailsSheet: React.FC<CountryDetailsSheetProps> = ({
  country,
  isOpen,
  onClose
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            {country.flag_url && (
              <img 
                src={country.flag_url} 
                alt={`${country.name} flag`} 
                className="h-5 w-8 object-cover rounded-sm"
              />
            )}
            {country.name} ({country.code})
          </SheetTitle>
          <SheetDescription>
            Country details and information
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Continent</h4>
              <p className="mt-1">{country.continent}</p>
            </div>
            {(() => {
              const currencyInfo = getCurrencyDisplayInfo(country);
              return (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</h4>
                  <p className="mt-1">{currencyInfo.displaySymbol} {currencyInfo.displayCurrency}</p>
                  {currencyInfo.hasPricingOverride && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Pricing: {currencyInfo.pricingSymbol} {currencyInfo.pricingCurrency}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
            <div className="mt-1">
              <Badge className={country.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {country.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Popular Destination</h4>
              <p className="mt-1">{country.is_popular ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Visa Required</h4>
              <p className="mt-1">{country.visa_required ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {country.languages && country.languages.length > 0 ? (
                country.languages.map((language, index) => (
                  <Badge key={`${language}-${index}`} variant="outline">
                    {language}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No languages specified</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Flag</h4>
            {country.flag_url ? (
              <div className="mt-2">
                <img 
                  src={country.flag_url} 
                  alt={`${country.name} flag`} 
                  className="h-16 w-24 object-cover rounded-sm border"
                />
              </div>
            ) : (
              <p className="mt-1 text-gray-400">No flag image</p>
            )}
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CountryDetailsSheet;
