
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { TaxConfiguration } from '@/types/taxManagement';
import { Plus, Edit, Trash2, Calculator, FileText, Settings } from 'lucide-react';

interface TaxManagementPanelProps {
  onUpdate?: () => void;
}

const TaxManagementPanel: React.FC<TaxManagementPanelProps> = ({ onUpdate }) => {
  const [taxConfigs, setTaxConfigs] = useState(TaxCalculationService.getTaxConfigurations());
  const [selectedConfig, setSelectedConfig] = useState<TaxConfiguration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setTaxConfigs(TaxCalculationService.getTaxConfigurations());
    onUpdate?.();
  };

  const handleToggleConfig = (configId: string) => {
    const config = taxConfigs.find(c => c.id === configId);
    if (config) {
      const updatedConfig = { ...config, isActive: !config.isActive };
      TaxCalculationService.updateTaxConfiguration(updatedConfig);
      handleRefresh();
      
      toast({
        title: "Tax Configuration Updated",
        description: `${config.countryCode} tax configuration ${config.isActive ? 'disabled' : 'enabled'}.`
      });
    }
  };

  const getTaxTypeColor = (taxType: string) => {
    const colors = {
      'GST': 'bg-green-100 text-green-800',
      'VAT': 'bg-blue-100 text-blue-800',
      'SALES_TAX': 'bg-purple-100 text-purple-800',
      'NONE': 'bg-gray-100 text-gray-800'
    };
    return colors[taxType as keyof typeof colors] || colors.NONE;
  };

  const getCountryName = (countryCode: string) => {
    const countries = {
      'IN': 'India',
      'AE': 'UAE',
      'SG': 'Singapore',
      'TH': 'Thailand',
      'US': 'United States',
      'GB': 'United Kingdom'
    };
    return countries[countryCode as keyof typeof countries] || countryCode;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure country-specific tax rules including GST, VAT, and TDS
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Rule
        </Button>
      </div>

      {/* Tax Configuration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{taxConfigs.length}</div>
                <div className="text-sm text-muted-foreground">Total Tax Rules</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{taxConfigs.filter(c => c.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Active Rules</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{taxConfigs.filter(c => c.taxType === 'GST').length}</div>
                <div className="text-sm text-muted-foreground">GST Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead>Primary Rate</TableHead>
                <TableHead>TDS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxConfigs.map((config) => {
                const primaryRate = config.taxRates.find(r => r.isDefault)?.rate || 0;
                
                return (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {getCountryName(config.countryCode)}
                      <div className="text-xs text-muted-foreground">{config.countryCode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTaxTypeColor(config.taxType)}>
                        {config.taxType}
                      </Badge>
                    </TableCell>
                    <TableCell>{primaryRate}%</TableCell>
                    <TableCell>
                      {config.tdsConfiguration?.isApplicable ? (
                        <Badge variant="outline">
                          {config.tdsConfiguration.rate}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={() => handleToggleConfig(config.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConfig(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {taxConfigs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tax configurations found</p>
              <p className="text-sm">Add your first tax rule to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Tax Configuration */}
      {selectedConfig && (
        <Card>
          <CardHeader>
            <CardTitle>
              {getCountryName(selectedConfig.countryCode)} - Tax Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Service Tax Rates</Label>
                <div className="space-y-2 mt-2">
                  {selectedConfig.taxRates.map((rate) => (
                    <div key={rate.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium capitalize">{rate.serviceType}</div>
                        <div className="text-xs text-muted-foreground">{rate.description}</div>
                      </div>
                      <Badge variant={rate.isDefault ? "default" : "outline"}>
                        {rate.rate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedConfig.tdsConfiguration && (
                <div>
                  <Label>TDS Configuration</Label>
                  <div className="space-y-2 mt-2">
                    <div className="p-3 border rounded bg-muted/30">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>TDS Rate: <span className="font-medium">{selectedConfig.tdsConfiguration.rate}%</span></div>
                        <div>Threshold: <span className="font-medium">₹{selectedConfig.tdsConfiguration.threshold.toLocaleString()}</span></div>
                        <div>Exemption: <span className="font-medium">₹{selectedConfig.tdsConfiguration.exemptionLimit.toLocaleString()}</span></div>
                        <div>Status: <span className="font-medium">{selectedConfig.tdsConfiguration.isApplicable ? 'Active' : 'Inactive'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaxManagementPanel;
