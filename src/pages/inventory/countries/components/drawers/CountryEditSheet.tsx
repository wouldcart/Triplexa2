
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Country } from '../../types/country';
import { Switch } from "@/components/ui/switch";

interface CountryEditSheetProps {
  deleteDrawerOpen: boolean;
  setDeleteDrawerOpen: (open: boolean) => void;
  selectedCountry: Country;
  handleConfirmDelete: () => void;
}

const CountryEditSheet: React.FC<CountryEditSheetProps> = ({
  deleteDrawerOpen,
  setDeleteDrawerOpen,
  selectedCountry,
  handleConfirmDelete
}) => {
  // Create local state for form data
  const [formData, setFormData] = React.useState<Country>(selectedCountry);

  // Handler for input changes
  const handleChange = (field: keyof Country, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <Dialog open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Country: {selectedCountry.name}</DialogTitle>
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
            <Label htmlFor="flag_url">Flag URL</Label>
            <Input 
              id="flag_url" 
              value={formData.flag_url || ''} 
              onChange={(e) => handleChange('flag_url', e.target.value)} 
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
                id="is_popular" 
                checked={formData.is_popular} 
                onCheckedChange={(checked) => 
                  handleChange('is_popular', checked)
                } 
              />
              <Label htmlFor="is_popular">Popular</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="visa_required" 
                checked={formData.visa_required} 
                onCheckedChange={(checked) => 
                  handleChange('visa_required', checked)
                } 
              />
              <Label htmlFor="visa_required">Visa Required</Label>
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryEditSheet;
