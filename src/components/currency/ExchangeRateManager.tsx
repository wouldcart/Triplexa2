import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Trash2, RefreshCw, Lock, Unlock, Plus, Wifi, WifiOff, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExchangeRate, CurrencyService } from '@/services/currencyService';

interface ExchangeRateManagerProps {
  rates: ExchangeRate[];
  onUpdateRates: (rates: ExchangeRate[]) => void;
  isLoading: boolean;
  onRefreshRates: () => void;
}

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'MYR', name: 'Malaysian Ringgit' }
];

const ExchangeRateManager: React.FC<ExchangeRateManagerProps> = ({
  rates,
  onUpdateRates,
  isLoading,
  onRefreshRates
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState({
    fromCurrency: '',
    toCurrency: '',
    rate: '',
    margin: '',
    additionalSurcharge: ''
  });

  const handleDeleteRate = (id: string) => {
    const updatedRates = rates.filter(rate => rate.id !== id);
    onUpdateRates(updatedRates);
    toast({ title: 'Rate deleted successfully', variant: 'default' });
  };

  const handleToggleMarginLock = async (rateId: string) => {
    const updatedRates = rates.map(rate => {
      if (rate.id === rateId) {
        return {
          ...rate,
          isFixed: !rate.isFixed
        };
      }
      return rate;
    });
    
    onUpdateRates(updatedRates);
    toast({ 
      title: 'Margin lock updated', 
      description: 'Rate margin lock has been toggled',
      variant: 'default'
    });
  };

  const handleEditStart = (rate: ExchangeRate) => {
    setEditingId(rate.id);
    setEditForm({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toString(),
      margin: rate.margin.toString(),
      additionalSurcharge: rate.additionalSurcharge?.toString() || ''
    });
  };

  const handleEditSave = () => {
    if (!editForm.rate || !editForm.margin) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const updatedRates = rates.map(rate => {
      if (rate.id === editingId) {
        return {
          ...rate,
          fromCurrency: editForm.fromCurrency,
          toCurrency: editForm.toCurrency,
          rate: parseFloat(editForm.rate),
          margin: parseFloat(editForm.margin),
          additionalSurcharge: editForm.additionalSurcharge ? parseFloat(editForm.additionalSurcharge) : undefined,
          lastUpdated: new Date().toISOString()
        };
      }
      return rate;
    });

    onUpdateRates(updatedRates);
    setEditingId(null);
    toast({ title: 'Rate updated successfully', variant: 'default' });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({
      fromCurrency: '',
      toCurrency: '',
      rate: '',
      margin: '',
      additionalSurcharge: ''
    });
  };

  const handleAddRate = () => {
    if (!editForm.rate || !editForm.margin) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const newRate: ExchangeRate = {
      id: Date.now().toString(),
      from: editForm.fromCurrency,
      to: editForm.toCurrency,
      fromCurrency: editForm.fromCurrency,
      toCurrency: editForm.toCurrency,
      rate: parseFloat(editForm.rate),
      margin: parseFloat(editForm.margin),
      additionalSurcharge: editForm.additionalSurcharge ? parseFloat(editForm.additionalSurcharge) : undefined,
      isCustom: true,
      isRealTime: false,
      lastUpdated: new Date().toISOString()
    };

    onUpdateRates([...rates, newRate]);
    setShowAddForm(false);
    setEditForm({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: '',
      margin: '',
      additionalSurcharge: ''
    });
    toast({ title: 'Rate added successfully', variant: 'default' });
  };

  const handleAddFormCancel = () => {
    setShowAddForm(false);
    setEditForm({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: '',
      margin: '',
      additionalSurcharge: ''
    });
  };

  const getTimeSinceUpdate = (lastUpdated: string) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exchange Rate Management</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowAddForm(true)}
              variant="default"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
            <Button
              onClick={() => CurrencyService.clearCache()}
              variant="ghost"
              size="sm"
            >
              Clear Cache
            </Button>
            <Button
              onClick={onRefreshRates}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Add Rate Form */}
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="font-semibold mb-3">Add New Exchange Rate</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="space-y-2">
                  <Label>From Currency</Label>
                  <Select
                    value={editForm.fromCurrency}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, fromCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>To Currency</Label>
                  <Select
                    value={editForm.toCurrency}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, toCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="1.2345"
                    value={editForm.rate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Margin (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={editForm.margin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, margin: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Surcharge (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.18"
                    value={editForm.additionalSurcharge}
                    onChange={(e) => setEditForm(prev => ({ ...prev, additionalSurcharge: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <Button onClick={handleAddFormCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddRate} variant="default" size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </div>
            </div>
          )}

          {/* Existing Rates */}
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {editingId === rate.id ? (
                // Edit Form
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Select
                      value={editForm.fromCurrency}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, fromCurrency: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Select
                      value={editForm.toCurrency}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, toCurrency: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      className="h-8"
                      value={editForm.rate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Margin (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8"
                      value={editForm.margin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, margin: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Surcharge</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8"
                      value={editForm.additionalSurcharge}
                      onChange={(e) => setEditForm(prev => ({ ...prev, additionalSurcharge: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-end space-x-1">
                    <Button onClick={handleEditSave} variant="default" size="sm">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleEditCancel} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{rate.fromCurrency}</span>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">{rate.toCurrency}</span>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Rate:</span>{' '}
                        <span className="font-medium">{rate.rate.toFixed(4)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Final:</span>{' '}
                        <span className="font-medium">
                          {CurrencyService.calculateWithMargin(
                            rate.rate, 
                            rate.margin, 
                            1, 
                            rate.additionalSurcharge || 0
                          ).toFixed(4)}
                        </span>
                      </div>
                      {rate.additionalSurcharge && (
                        <div className="text-sm text-orange-600">
                          <span className="text-muted-foreground">Surcharge:</span>{' '}
                          <span className="font-medium">+{rate.additionalSurcharge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={rate.isRealTime ? "default" : "secondary"}>
                        {rate.isRealTime ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                        {rate.isRealTime ? 'Live' : 'Mock'}
                      </Badge>

                      <Badge variant={rate.isFixed ? "secondary" : "outline"}>
                        {rate.isFixed ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                        {rate.margin}% margin
                      </Badge>
                      
                      {rate.fromCurrency === 'THB' && rate.toCurrency === 'INR' && (
                        <Badge variant="destructive">Priority Rate</Badge>
                      )}

                      {rate.additionalSurcharge && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <Plus className="h-3 w-3 mr-1" />
                          Surcharge
                        </Badge>
                      )}
                      
                      {rate.isCustom && (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {getTimeSinceUpdate(rate.lastUpdated)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleToggleMarginLock(rate.id)}
                      variant="ghost"
                      size="sm"
                      title={rate.isFixed ? "Unlock margin" : "Lock margin"}
                    >
                      {rate.isFixed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={() => handleEditStart(rate)}
                      variant="ghost"
                      size="sm"
                      title="Edit rate"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    {rate.isCustom && (
                      <Button
                        onClick={() => handleDeleteRate(rate.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title="Delete rate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateManager;
