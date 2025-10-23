
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryPricingRule } from '@/types/countryPricing';

interface CountryPricingEditDialogProps {
  rule: CountryPricingRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleId: string, updates: Partial<CountryPricingRule>) => void;
}

const CountryPricingEditDialog: React.FC<CountryPricingEditDialogProps> = ({
  rule,
  isOpen,
  onClose,
  onSave
}) => {
  const [editValues, setEditValues] = useState<Partial<CountryPricingRule>>({});

  useEffect(() => {
    if (rule) {
      setEditValues(rule);
    }
  }, [rule]);

  const handleSave = () => {
    if (rule && editValues) {
      onSave(rule.id, editValues);
      onClose();
    }
  };

  if (!rule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {rule.countryName} Pricing Rule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Markup</Label>
              <Input
                type="number"
                value={editValues.defaultMarkup || 0}
                onChange={(e) => setEditValues(prev => ({ 
                  ...prev, 
                  defaultMarkup: Number(e.target.value) 
                }))}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label>Markup Type</Label>
              <Select 
                value={editValues.markupType} 
                onValueChange={(value) => setEditValues(prev => ({ 
                  ...prev, 
                  markupType: value as 'percentage' | 'fixed' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Tier</Label>
              <Select 
                value={editValues.tier} 
                onValueChange={(value) => setEditValues(prev => ({ 
                  ...prev, 
                  tier: value as any 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conversion Margin (%)</Label>
              <Input
                type="number"
                value={editValues.conversionMargin || 0}
                onChange={(e) => setEditValues(prev => ({ 
                  ...prev, 
                  conversionMargin: Number(e.target.value) 
                }))}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Seasonal Adjustment (%)</Label>
            <Input
              type="number"
              value={editValues.seasonalAdjustment || 0}
              onChange={(e) => setEditValues(prev => ({ 
                ...prev, 
                seasonalAdjustment: Number(e.target.value) 
              }))}
              step="0.1"
              placeholder="Optional seasonal adjustment"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryPricingEditDialog;
