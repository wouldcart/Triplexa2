
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationCode } from '../types/transportTypes';
import { MapPin, Globe, Building2, Info } from 'lucide-react';

interface LocationCodeViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locationCode: LocationCode | null;
}

const LocationCodeViewSheet: React.FC<LocationCodeViewSheetProps> = ({
  isOpen,
  onClose,
  locationCode
}) => {
  if (!locationCode) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {locationCode.code}
          </SheetTitle>
          <SheetDescription>
            Location code details
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Full Name:</span>
                  <p className="text-sm">{locationCode.fullName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Short Code:</span>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{locationCode.code}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Category:</span>
                  <Badge variant="secondary" className="ml-2 capitalize">
                    {locationCode.category}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge 
                    variant={locationCode.status === 'active' ? 'default' : 'secondary'} 
                    className="ml-2 capitalize"
                  >
                    {locationCode.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Country:</span>
                  <p className="text-sm">{locationCode.country}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">City:</span>
                  <p className="text-sm">{locationCode.city}</p>
                </div>
                {locationCode.latitude && locationCode.longitude && (
                  <div>
                    <span className="text-sm font-medium">Coordinates:</span>
                    <p className="text-sm font-mono">
                      {locationCode.latitude}, {locationCode.longitude}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {locationCode.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Notes
                </h4>
                <p className="text-sm bg-muted p-3 rounded">{locationCode.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <SheetFooter>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LocationCodeViewSheet;
