import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Country } from '../types/country';
import { Edit3, AlertTriangle } from 'lucide-react';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: Country[];
  onBulkUpdate: (updates: BulkUpdateData) => Promise<void>;
}

export interface BulkUpdateData {
  status?: 'active' | 'inactive';
  continent?: string;
  region?: string;
  currency?: string;
  currency_symbol?: string;
  pricing_currency_override?: boolean;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  isOpen,
  onClose,
  selectedCountries,
  onBulkUpdate,
}) => {
  const [formData, setFormData] = useState<BulkUpdateData>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty values
    const updates: BulkUpdateData = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        (updates as any)[key] = value;
      }
    });

    if (Object.keys(updates).length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      await onBulkUpdate(updates);
      setFormData({});
      onClose();
    } catch (error) {
      console.error('Bulk update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({});
  };

  const continents = [
    'Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto mx-auto">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Bulk Edit Countries
          </DialogTitle>
          <DialogDescription className="text-sm">
            Edit {selectedCountries?.length || 0} selected countries. Only fields with values will be updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Selected Countries Preview */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Selected Countries ({selectedCountries?.length || 0})
              </div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 max-h-16 sm:max-h-20 overflow-y-auto break-words">
              {selectedCountries?.map((country, index) => (
                <span key={country.id}>
                  {country.name}
                  {index < (selectedCountries?.length || 0) - 1 && ', '}
                </span>
              )) || 'No countries selected'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Status */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Continent */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="continent" className="text-sm font-medium">Continent</Label>
              <Select
                value={formData.continent || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, continent: value }))}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Select continent" />
                </SelectTrigger>
                <SelectContent>
                  {continents.map((continent) => (
                    <SelectItem key={continent} value={continent}>
                      {continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="region" className="text-sm font-medium">Region</Label>
              <Input
                id="region"
                value={formData.region || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Enter region"
                className="h-9 sm:h-10"
              />
            </div>

            {/* Currency */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
              <Select
                value={formData.currency || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Symbol */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="currency_symbol" className="text-sm font-medium">Currency Symbol</Label>
              <Input
                id="currency_symbol"
                value={formData.currency_symbol || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, currency_symbol: e.target.value }))}
                placeholder="Enter currency symbol"
                className="h-9 sm:h-10"
              />
            </div>

            {/* Pricing Currency Override */}
            <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="pricing_currency_override"
                  checked={formData.pricing_currency_override || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pricing_currency_override: checked }))}
                />
                <Label htmlFor="pricing_currency_override" className="text-sm font-medium">Override Pricing Currency</Label>
              </div>
            </div>

            {/* Pricing Currency */}
            {formData.pricing_currency_override && (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="pricing_currency" className="text-sm font-medium">Pricing Currency</Label>
                  <Select
                    value={formData.pricing_currency || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_currency: value }))}
                  >
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Select pricing currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing Currency Symbol */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="pricing_currency_symbol" className="text-sm font-medium">Pricing Currency Symbol</Label>
                  <Input
                    id="pricing_currency_symbol"
                    value={formData.pricing_currency_symbol || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_currency_symbol: e.target.value }))}
                    placeholder="Enter pricing currency symbol"
                    className="h-9 sm:h-10"
                  />
                </div>
              </>
            )}
          </div>

          {/* Removed Description field: 'countries' table has no 'description' column */}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto order-3 sm:order-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Object.keys(formData).length === 0}
              className="w-full sm:w-auto order-1 sm:order-3"
            >
              {isLoading ? 'Updating...' : `Update ${selectedCountries.length} Countries`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;