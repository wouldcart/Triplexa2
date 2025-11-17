
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Country } from '../../types/country';
import { Switch } from "@/components/ui/switch";

interface CountryAddSheetProps {
  deleteDrawerOpen: boolean;
  setDeleteDrawerOpen: (open: boolean) => void;
  selectedCountry: Country | null;
  handleConfirmDelete: () => void;
}

const CountryAddSheet: React.FC<CountryAddSheetProps> = ({
  deleteDrawerOpen,
  setDeleteDrawerOpen,
  handleConfirmDelete
}) => {
  // Create local state for form data
  const [formData, setFormData] = React.useState<Omit<Country, 'id'>>({
    name: '',
    code: '',
    region: '',
    continent: '',
    currency: '',
    currency_symbol: '',
    status: 'active',
    flagUrl: '',
    isPopular: false,
    visaRequired: false,
    languages: []
  });

  // Handler for input changes
  const handleChange = (field: keyof Omit<Country, 'id'>, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <Dialog open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Country</DialogTitle>
          <DialogDescription>
            Add a new country to the inventory system
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Country Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Country Code</Label>
              <Input 
                id="code" 
                value={formData.code} 
                onChange={(e) => handleChange('code', e.target.value)} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="continent">Continent</Label>
              <Input 
                id="continent" 
                value={formData.continent} 
                onChange={(e) => handleChange('continent', e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input 
                id="region" 
                value={formData.region} 
                onChange={(e) => handleChange('region', e.target.value)} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input 
                id="currency" 
                value={formData.currency} 
                onChange={(e) => handleChange('currency', e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency_symbol">Currency Symbol</Label>
              <Input 
                id="currency_symbol" 
                value={formData.currency_symbol} 
                onChange={(e) => handleChange('currency_symbol', e.target.value)} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flagUrl">Flag URL</Label>
            <Input 
              id="flagUrl" 
              value={formData.flagUrl || ''} 
              onChange={(e) => handleChange('flagUrl', e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="status" 
                checked={formData.status === 'active'} 
                onCheckedChange={(checked) => 
                  handleChange('status', checked ? 'active' : 'inactive')
                } 
              />
              <Label htmlFor="status">Active</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isPopular" 
                checked={formData.isPopular} 
                onCheckedChange={(checked) => 
                  handleChange('isPopular', checked)
                } 
              />
              <Label htmlFor="isPopular">Popular</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="visaRequired" 
                checked={formData.visaRequired} 
                onCheckedChange={(checked) => 
                  handleChange('visaRequired', checked)
                } 
              />
              <Label htmlFor="visaRequired">Visa Required</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="languages">Languages (comma-separated)</Label>
            <Input 
              id="languages" 
              value={formData.languages?.join(', ') || ''} 
              onChange={(e) => {
                const languagesArray = e.target.value
                  .split(',')
                  .map(lang => lang.trim())
                  .filter(lang => lang !== '');
                handleChange('languages', languagesArray);
              }} 
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDrawerOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete}>
            Add Country
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryAddSheet;
