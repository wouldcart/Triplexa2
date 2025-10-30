
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Plus, Edit, Trash, TrendingUp, Percent } from 'lucide-react';
import { toast } from 'sonner';
import type { CommissionSlab, MarkupConfiguration } from '@/types/agentSettings';

const mockCommissionSlabs: CommissionSlab[] = [
  {
    id: '1',
    name: 'Basic Volume Tier',
    type: 'volume',
    minThreshold: 0,
    maxThreshold: 50000,
    commissionRate: 5,
    isActive: true,
    applicableProducts: ['hotels', 'flights'],
    validFrom: '2024-01-01',
  },
  {
    id: '2',
    name: 'Premium Volume Tier',
    type: 'volume',
    minThreshold: 50001,
    maxThreshold: 200000,
    commissionRate: 7.5,
    isActive: true,
    applicableProducts: ['hotels', 'flights', 'packages'],
    validFrom: '2024-01-01',
  },
];

const mockMarkupConfig: MarkupConfiguration = {
  id: '1',
  name: 'Standard Markup Configuration',
  baseMarkup: 10,
  tierMultipliers: {
    basic: 1.0,
    premium: 1.2,
    vip: 1.5,
  },
  geographicVariations: [
    { region: 'Europe', multiplier: 1.1 },
    { region: 'Asia', multiplier: 0.9 },
    { region: 'Americas', multiplier: 1.0 },
  ],
  seasonalAdjustments: [
    { season: 'Peak Season', adjustment: 15, startDate: '2024-06-01', endDate: '2024-08-31' },
    { season: 'Low Season', adjustment: -5, startDate: '2024-11-01', endDate: '2024-02-29' },
  ],
  isActive: true,
};

const CommissionManagementTab: React.FC = () => {
  const [commissionSlabs, setCommissionSlabs] = useState<CommissionSlab[]>(mockCommissionSlabs);
  const [markupConfig, setMarkupConfig] = useState<MarkupConfiguration>(mockMarkupConfig);
  const [isSlabDialogOpen, setIsSlabDialogOpen] = useState(false);
  const [newSlab, setNewSlab] = useState({
    name: '',
    type: 'volume' as 'volume' | 'performance' | 'tier',
    minThreshold: 0,
    maxThreshold: 0,
    commissionRate: 0,
    applicableProducts: [] as string[],
  });

  const handleAddCommissionSlab = () => {
    if (!newSlab.name || newSlab.commissionRate <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const slab: CommissionSlab = {
      id: Date.now().toString(),
      ...newSlab,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
    };

    setCommissionSlabs(prev => [...prev, slab]);
    setNewSlab({
      name: '',
      type: 'volume',
      minThreshold: 0,
      maxThreshold: 0,
      commissionRate: 0,
      applicableProducts: [],
    });
    setIsSlabDialogOpen(false);
    toast.success('Commission slab added successfully');
  };

  const handleToggleSlabActive = (slabId: string) => {
    setCommissionSlabs(prev => prev.map(slab => 
      slab.id === slabId ? { ...slab, isActive: !slab.isActive } : slab
    ));
    toast.success('Commission slab status updated');
  };

  const handleMarkupConfigUpdate = (field: string, value: any) => {
    setMarkupConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTierMultiplierUpdate = (tier: string, value: number) => {
    setMarkupConfig(prev => ({
      ...prev,
      tierMultipliers: { ...prev.tierMultipliers, [tier]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Commission Slabs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Commission Slabs Management
            </CardTitle>
            <Dialog open={isSlabDialogOpen} onOpenChange={setIsSlabDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Commission Slab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Commission Slab</DialogTitle>
                  <DialogDescription>
                    Create a commission tier with thresholds, rate, and applicable products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="slabName">Slab Name</Label>
                    <Input
                      id="slabName"
                      value={newSlab.name}
                      onChange={(e) => setNewSlab(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter slab name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slabType">Slab Type</Label>
                    <Select value={newSlab.type} onValueChange={(value: any) => setNewSlab(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select slab type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volume Based</SelectItem>
                        <SelectItem value="performance">Performance Based</SelectItem>
                        <SelectItem value="tier">Tier Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minThreshold">Min Threshold</Label>
                      <Input
                        id="minThreshold"
                        type="number"
                        value={newSlab.minThreshold}
                        onChange={(e) => setNewSlab(prev => ({ ...prev, minThreshold: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxThreshold">Max Threshold</Label>
                      <Input
                        id="maxThreshold"
                        type="number"
                        value={newSlab.maxThreshold}
                        onChange={(e) => setNewSlab(prev => ({ ...prev, maxThreshold: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      value={newSlab.commissionRate}
                      onChange={(e) => setNewSlab(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsSlabDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCommissionSlab}>
                      Add Slab
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slab Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Threshold Range</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid From</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionSlabs.map((slab) => (
                <TableRow key={slab.id}>
                  <TableCell className="font-medium">{slab.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{slab.type}</Badge>
                  </TableCell>
                  <TableCell>
                    ${slab.minThreshold.toLocaleString()} - ${slab.maxThreshold.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Percent className="mr-1 h-3 w-3" />
                      {slab.commissionRate}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={slab.isActive ? 'default' : 'secondary'}>
                      {slab.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(slab.validFrom).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={slab.isActive ? 'destructive' : 'default'} 
                        size="sm"
                        onClick={() => handleToggleSlabActive(slab.id)}
                      >
                        {slab.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Markup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Markup Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Markup */}
          <div>
            <Label htmlFor="baseMarkup">Base Markup (%)</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                id="baseMarkup"
                type="number"
                value={markupConfig.baseMarkup}
                onChange={(e) => handleMarkupConfigUpdate('baseMarkup', parseFloat(e.target.value))}
                className="w-32"
              />
              <Switch
                checked={markupConfig.isActive}
                onCheckedChange={(checked) => handleMarkupConfigUpdate('isActive', checked)}
              />
              <span className="text-sm text-gray-600">
                {markupConfig.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Tier Multipliers */}
          <div>
            <h4 className="font-medium mb-3">Tier Multipliers</h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(markupConfig.tierMultipliers).map(([tier, multiplier]) => (
                <div key={tier}>
                  <Label htmlFor={`tier-${tier}`}>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</Label>
                  <Input
                    id={`tier-${tier}`}
                    type="number"
                    step="0.1"
                    value={multiplier}
                    onChange={(e) => handleTierMultiplierUpdate(tier, parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Variations */}
          <div>
            <h4 className="font-medium mb-3">Geographic Variations</h4>
            <div className="space-y-2">
              {markupConfig.geographicVariations.map((variation, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded">
                  <span className="font-medium">{variation.region}:</span>
                  <span>Multiplier {variation.multiplier}x</span>
                  <Badge variant="outline">
                    {((variation.multiplier - 1) * 100).toFixed(1)}% adjustment
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonal Adjustments */}
          <div>
            <h4 className="font-medium mb-3">Seasonal Adjustments</h4>
            <div className="space-y-2">
              {markupConfig.seasonalAdjustments.map((adjustment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{adjustment.season}</span>
                    <div className="text-sm text-gray-600">
                      {new Date(adjustment.startDate).toLocaleDateString()} - {new Date(adjustment.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={adjustment.adjustment > 0 ? 'default' : 'destructive'}>
                    {adjustment.adjustment > 0 ? '+' : ''}{adjustment.adjustment}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => toast.success('Markup configuration saved')}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionManagementTab;
