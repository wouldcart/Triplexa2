
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransportType } from '../types/transportTypes';

interface TransportTypeViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transportType: TransportType | null;
}

const TransportTypeViewSheet: React.FC<TransportTypeViewSheetProps> = ({
  isOpen,
  onClose,
  transportType
}) => {
  if (!transportType) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Transport Type Details</SheetTitle>
          <SheetDescription>
            View details of the selected transport type
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 pb-2 border-b">
            <div className="font-medium">Name</div>
            <div>{transportType.name}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2 border-b">
            <div className="font-medium">Category</div>
            <div>{transportType.category}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2 border-b">
            <div className="font-medium">Seating Capacity</div>
            <div>{transportType.seatingCapacity || 'N/A'}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2 border-b">
            <div className="font-medium">Luggage Capacity</div>
            <div>{transportType.luggageCapacity || 'N/A'}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-2 border-b">
            <div className="font-medium">Status</div>
            <div>
              <Badge variant={transportType.active ? "default" : "outline"}>
                {transportType.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TransportTypeViewSheet;
