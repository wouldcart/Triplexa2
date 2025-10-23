
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Country } from '../../types/country';

interface CountryDeleteDrawerProps {
  deleteDrawerOpen: boolean;
  setDeleteDrawerOpen: (open: boolean) => void;
  selectedCountry: Country | null;
  handleConfirmDelete: () => void;
  fileRef?: React.RefObject<HTMLInputElement>;
}

const CountryDeleteDrawer: React.FC<CountryDeleteDrawerProps> = ({
  deleteDrawerOpen,
  setDeleteDrawerOpen,
  selectedCountry,
  handleConfirmDelete,
  fileRef
}) => {
  return (
    <Dialog open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fileRef ? "Import Countries" : selectedCountry ? "Confirm Deletion" : "Add Country"}
          </DialogTitle>
        </DialogHeader>
        
        {selectedCountry && !fileRef && (
          <p className="py-4">
            Are you sure you want to delete {selectedCountry.name}? This action cannot be undone.
          </p>
        )}
        
        {fileRef && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload a file containing country data to import.
            </p>
            <input 
              type="file" 
              ref={fileRef}
              className="w-full"
              accept=".xlsx,.xls,.csv"
            />
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDrawerOpen(false)}>
            Cancel
          </Button>
          {!fileRef && (
            <Button 
              variant={selectedCountry ? "destructive" : "default"}
              onClick={handleConfirmDelete}
            >
              {selectedCountry ? "Delete" : "Save"}
            </Button>
          )}
          {fileRef && (
            <Button onClick={handleConfirmDelete}>
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryDeleteDrawer;
