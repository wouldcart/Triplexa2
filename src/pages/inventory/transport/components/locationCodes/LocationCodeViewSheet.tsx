
import React from 'react';
import { Edit } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LocationCode } from '../../types/transportTypes';

interface LocationCodeViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locationCode: LocationCode | null;
  onEdit: () => void;
}

const LocationCodeViewSheet: React.FC<LocationCodeViewSheetProps> = ({
  isOpen,
  onClose,
  locationCode,
  onEdit
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Location Code Details</SheetTitle>
          <SheetDescription>
            View details of the selected location code
          </SheetDescription>
        </SheetHeader>
        
        {locationCode && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">Short Code</div>
              <div>{locationCode.code}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">Full Name</div>
              <div>{locationCode.fullName}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">Category</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  locationCode.category === 'airport' ? 'bg-blue-100 text-blue-800' :
                  locationCode.category === 'hotel' ? 'bg-green-100 text-green-800' :
                  locationCode.category === 'pier' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {locationCode.category}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">Country</div>
              <div>{locationCode.country}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">City</div>
              <div>{locationCode.city}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-2 border-b">
              <div className="font-medium">Status</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  locationCode.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {locationCode.status}
                </span>
              </div>
            </div>

            {(locationCode.latitude || locationCode.longitude) && (
              <div className="grid grid-cols-2 gap-4 pb-2 border-b">
                <div className="font-medium">Coordinates</div>
                <div className="font-mono text-sm">
                  {Number.isFinite(Number(locationCode.latitude))
                    ? Number(locationCode.latitude).toFixed(6)
                    : (locationCode.latitude || '—')}
                  {', '}
                  {Number.isFinite(Number(locationCode.longitude))
                    ? Number(locationCode.longitude).toFixed(6)
                    : (locationCode.longitude || '—')}
                </div>
              </div>
            )}
          </div>
        )}
        
        <SheetFooter className="pt-4">
          <Button onClick={onEdit} className="mr-2">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LocationCodeViewSheet;
