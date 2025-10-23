
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Country } from '../../types/country';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getCurrencyDisplayInfo } from '../../utils/currencyUtils';

interface CountryViewDrawerProps {
  deleteDrawerOpen: boolean;
  setDeleteDrawerOpen: (open: boolean) => void;
  selectedCountry: Country;
  handleConfirmDelete: () => void;
}

const CountryViewDrawer: React.FC<CountryViewDrawerProps> = ({
  deleteDrawerOpen,
  setDeleteDrawerOpen,
  selectedCountry,
  handleConfirmDelete
}) => {
  return (
    <Dialog open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedCountry.flag_url && (
              <div className="w-6 h-4 overflow-hidden rounded">
                <AspectRatio ratio={3/2}>
                  <img 
                    src={selectedCountry.flag_url} 
                    alt={`${selectedCountry.name} flag`} 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            )}
            {selectedCountry.name} ({selectedCountry.code})
          </DialogTitle>
          <DialogDescription>
            Country details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <span className="font-medium">Continent:</span>
            <span>{selectedCountry.continent}</span>
          </div>
          
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <span className="font-medium">Region:</span>
            <span>{selectedCountry.region}</span>
          </div>
          
          {(() => {
            const currencyInfo = getCurrencyDisplayInfo(selectedCountry);
            return (
              <>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="font-medium">Currency:</span>
                  <span>{currencyInfo.displaySymbol} {currencyInfo.displayCurrency}</span>
                </div>
                
                {/* Currency Override Section */}
                {currencyInfo.hasPricingOverride && (
                  <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <span className="font-medium">Pricing:</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                        Override: {currencyInfo.pricingSymbol} {currencyInfo.pricingCurrency}
                      </span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              selectedCountry.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedCountry.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <span className="font-medium">Popular:</span>
            <span>{selectedCountry.is_popular ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <span className="font-medium">Visa Required:</span>
            <span>{selectedCountry.visa_required ? 'Yes' : 'No'}</span>
          </div>
          
          {selectedCountry.languages && selectedCountry.languages.length > 0 && (
            <div className="grid grid-cols-[100px_1fr] items-start gap-4">
              <span className="font-medium">Languages:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCountry.languages.map((lang, idx) => (
                  <span 
                    key={`${lang}-${idx}`} 
                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDrawerOpen(false)}>
            Close
          </Button>
          <Button onClick={handleConfirmDelete}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryViewDrawer;
