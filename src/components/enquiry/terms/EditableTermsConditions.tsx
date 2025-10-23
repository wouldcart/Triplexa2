import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Edit3, Save, X, Copy, RotateCcw } from 'lucide-react';
import { Query } from '@/types/query';
import { toast } from 'sonner';

interface EditableTermsConditionsProps {
  query: Query;
  terms: any;
  onUpdate: (terms: any) => void;
}

interface TermsData {
  paymentTerms: string;
  cancellationPolicy: string;
  additionalTerms: string;
  validity: string;
  inclusions: string;
  exclusions: string;
}

const defaultTermsTemplates = {
  paymentTerms: [
    '30% advance payment required at the time of booking',
    '50% advance payment required at the time of booking',
    '70% advance payment required 30 days before travel',
    'Full payment required 15 days before travel',
    'Payment in installments as per mutual agreement'
  ],
  cancellationPolicy: [
    'Free cancellation up to 30 days before travel',
    '25% cancellation charge 15-30 days before travel',
    '50% cancellation charge 7-15 days before travel',
    '100% cancellation charge within 7 days of travel',
    'No refund for no-show or early departure'
  ],
  additionalTerms: [
    'All rates are subject to availability at the time of booking',
    'Hotel check-in time is 3:00 PM and check-out time is 12:00 PM',
    'Valid passport required for international travel',
    'Travel insurance is highly recommended',
    'Rates may vary during peak seasons and special events'
  ],
  validity: [
    'This quotation is valid for 30 days from the date of issue',
    'This quotation is valid for 15 days from the date of issue',
    'This quotation is valid for 7 days from the date of issue',
    'Prices are subject to change without prior notice after validity period'
  ],
  inclusions: [
    'Accommodation on twin sharing basis',
    'Daily breakfast at the hotel',
    'Airport transfers as per itinerary',
    'Sightseeing tours with English speaking guide',
    'All transfers in air-conditioned vehicle'
  ],
  exclusions: [
    'Air fare / Train fare',
    'Personal expenses like laundry, telephone, tips, etc.',
    'Meals not mentioned in the itinerary',
    'Travel insurance',
    'Any increase in taxes or fuel surcharges'
  ]
};

const EditableTermsConditions: React.FC<EditableTermsConditionsProps> = ({
  query,
  terms,
  onUpdate
}) => {
  const [termsData, setTermsData] = useState<TermsData>({
    paymentTerms: '',
    cancellationPolicy: '',
    additionalTerms: '',
    validity: '',
    inclusions: '',
    exclusions: ''
  });

  const [editingSection, setEditingSection] = useState<keyof TermsData | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (terms) {
      setTermsData(terms);
    } else {
      // Initialize with default terms
      initializeDefaultTerms();
    }
  }, [terms]);

  const initializeDefaultTerms = () => {
    const defaultTerms: TermsData = {
      paymentTerms: '30% advance payment required at the time of booking\n70% balance payment required 15 days before travel',
      cancellationPolicy: 'Free cancellation up to 30 days before travel\n25% cancellation charge 15-30 days before travel\n50% cancellation charge 7-15 days before travel\n100% cancellation charge within 7 days of travel',
      additionalTerms: 'All rates are subject to availability at the time of booking\nValid passport required for international travel\nTravel insurance is highly recommended',
      validity: 'This quotation is valid for 30 days from the date of issue\nPrices are subject to change without prior notice after validity period',
      inclusions: 'Accommodation on twin sharing basis\nDaily breakfast at the hotel\nAirport transfers as per itinerary\nSightseeing tours with English speaking guide',
      exclusions: 'Air fare / Train fare\nPersonal expenses like laundry, telephone, tips, etc.\nMeals not mentioned in the itinerary\nTravel insurance'
    };
    
    setTermsData(defaultTerms);
    onUpdate(defaultTerms);
  };

  const startEdit = (section: keyof TermsData) => {
    setEditingSection(section);
    setEditValue(termsData[section]);
  };

  const saveEdit = () => {
    if (!editingSection) return;
    
    const updatedTerms = {
      ...termsData,
      [editingSection]: editValue
    };
    
    setTermsData(updatedTerms);
    onUpdate(updatedTerms);
    setEditingSection(null);
    setEditValue('');
    
    toast.success('Terms updated successfully');
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditValue('');
  };

  const addTemplate = (section: keyof TermsData, template: string) => {
    const currentValue = termsData[section];
    const newValue = currentValue ? `${currentValue}\n${template}` : template;
    
    const updatedTerms = {
      ...termsData,
      [section]: newValue
    };
    
    setTermsData(updatedTerms);
    onUpdate(updatedTerms);
    toast.success('Template added');
  };

  const copySection = (section: keyof TermsData) => {
    navigator.clipboard.writeText(termsData[section]);
    toast.success('Copied to clipboard');
  };

  const resetSection = (section: keyof TermsData) => {
    const updatedTerms = {
      ...termsData,
      [section]: ''
    };
    
    setTermsData(updatedTerms);
    onUpdate(updatedTerms);
    toast.success('Section reset');
  };

  const renderTermsSection = (
    section: keyof TermsData,
    title: string,
    placeholder: string,
    templates: string[]
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copySection(section)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => resetSection(section)}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEdit(section)}
              disabled={editingSection === section}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSection === section ? (
          <div className="space-y-3">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              rows={8}
              className="min-h-[200px]"
            />
            
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={saveEdit}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Templates:</p>
              <div className="grid gap-2">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="ghost"
                    className="text-left justify-start h-auto p-2 text-xs"
                    onClick={() => addTemplate(section, template)}
                  >
                    + {template}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border rounded-lg bg-gray-50 min-h-[120px]">
            {termsData[section] ? (
              <div className="whitespace-pre-wrap text-sm">{termsData[section]}</div>
            ) : (
              <div className="text-gray-500 italic text-sm">{placeholder}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Terms & Conditions
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and customize terms & conditions for your proposal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={initializeDefaultTerms}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset All
          </Button>
          <Badge variant="outline">
            {query.destination.country}
          </Badge>
        </div>
      </div>

      {/* Terms Sections */}
      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment">Payment & Cancellation</TabsTrigger>
          <TabsTrigger value="inclusions">Inclusions & Exclusions</TabsTrigger>
          <TabsTrigger value="additional">Additional Terms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment" className="space-y-4">
          {renderTermsSection(
            'paymentTerms',
            'Payment Terms',
            'Enter payment terms and conditions...',
            defaultTermsTemplates.paymentTerms
          )}
          
          {renderTermsSection(
            'cancellationPolicy',
            'Cancellation Policy',
            'Enter cancellation policy details...',
            defaultTermsTemplates.cancellationPolicy
          )}
          
          {renderTermsSection(
            'validity',
            'Validity',
            'Enter quotation validity period...',
            defaultTermsTemplates.validity
          )}
        </TabsContent>
        
        <TabsContent value="inclusions" className="space-y-4">
          {renderTermsSection(
            'inclusions',
            'Inclusions',
            'Enter what is included in the package...',
            defaultTermsTemplates.inclusions
          )}
          
          {renderTermsSection(
            'exclusions',
            'Exclusions',
            'Enter what is excluded from the package...',
            defaultTermsTemplates.exclusions
          )}
        </TabsContent>
        
        <TabsContent value="additional" className="space-y-4">
          {renderTermsSection(
            'additionalTerms',
            'Additional Terms',
            'Enter any additional terms and conditions...',
            defaultTermsTemplates.additionalTerms
          )}
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Terms Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Payment Terms</div>
              <div className="text-muted-foreground">
                {termsData.paymentTerms ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
            <div>
              <div className="font-medium">Cancellation Policy</div>
              <div className="text-muted-foreground">
                {termsData.cancellationPolicy ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
            <div>
              <div className="font-medium">Validity Period</div>
              <div className="text-muted-foreground">
                {termsData.validity ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
            <div>
              <div className="font-medium">Inclusions</div>
              <div className="text-muted-foreground">
                {termsData.inclusions ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
            <div>
              <div className="font-medium">Exclusions</div>
              <div className="text-muted-foreground">
                {termsData.exclusions ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
            <div>
              <div className="font-medium">Additional Terms</div>
              <div className="text-muted-foreground">
                {termsData.additionalTerms ? '✓ Configured' : '⚠ Not set'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditableTermsConditions;