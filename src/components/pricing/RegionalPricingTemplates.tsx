import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { RegionalPricingTemplate } from '@/types/countryPricing';
import { Plus, MapPin, Play } from 'lucide-react';

interface RegionalPricingTemplatesProps {
  onUpdate?: () => void;
}

const RegionalPricingTemplates: React.FC<RegionalPricingTemplatesProps> = ({ onUpdate }) => {
  const [settings, setSettings] = useState(EnhancedPricingService.getEnhancedSettings());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const { toast } = useToast();

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const regions = Array.from(new Set(availableCountries.map(c => c.region)));

  const [newTemplate, setNewTemplate] = useState<Partial<RegionalPricingTemplate>>({
    name: '',
    region: '',
    description: '',
    defaultMarkup: 8,
    markupType: 'percentage',
    countries: [],
    isActive: true
  });

  const handleApplyTemplate = () => {
    if (!selectedTemplate || targetCountries.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a template and target countries.",
        variant: "destructive"
      });
      return;
    }

    EnhancedPricingService.applyRegionalTemplate(selectedTemplate, targetCountries);
    setTargetCountries([]);
    setSelectedTemplate('');

    toast({
      title: "Template Applied",
      description: `Regional pricing template has been applied to ${targetCountries.length} countries.`
    });

    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regional Pricing Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and apply pricing templates for specific regions
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Apply Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Apply Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {settings.regionalTemplates.filter(t => t.isActive).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Countries</Label>
              <Select onValueChange={(value) => {
                if (!targetCountries.includes(value)) {
                  setTargetCountries([...targetCountries, value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Add countries" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetCountries.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Countries:</Label>
              <div className="flex flex-wrap gap-2">
                {targetCountries.map((code) => {
                  const country = availableCountries.find(c => c.code === code);
                  return (
                    <Badge 
                      key={code} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => setTargetCountries(targetCountries.filter(c => c !== code))}
                    >
                      {country?.name} ×
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <Button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate || targetCountries.length === 0}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Apply Template to Selected Countries
          </Button>
        </CardContent>
      </Card>

      {/* Existing Templates */}
      <div className="grid gap-4">
        {settings.regionalTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{template.region}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Default Markup:</span>
                      <div className="font-medium">
                        {template.markupType === 'percentage' 
                          ? `${template.defaultMarkup}%` 
                          : `${template.defaultMarkup}`
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Countries:</span>
                      <div className="font-medium">{template.countries.length} countries</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{template.markupType}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {settings.regionalTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No regional templates configured</p>
          <p className="text-sm">Create your first template to get started</p>
        </div>
      )}
    </div>
  );
};

export default RegionalPricingTemplates;
