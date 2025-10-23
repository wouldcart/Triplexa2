
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit3, Save, X, FileText, Plus, Download, Upload, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface TermsConditionsData {
  paymentTerms: string;
  cancellationPolicy: string;
  inclusions: string[];
  exclusions: string[];
  additionalTerms: string;
}

interface TermsTemplate {
  id: string;
  name: string;
  country: string;
  data: TermsConditionsData;
}

interface EditableTermsConditionsModuleProps {
  data: TermsConditionsData;
  onChange: (data: TermsConditionsData) => void;
  readonly?: boolean;
  defaultCountry?: string;
}

const sampleTemplatesByCountry = {
  Thailand: {
    paymentTerms: '60% advance to be paid at the time of booking.\n100% payment is to be made for international packages before 7 days of departure date.\nIn case of cancellation standard cancellation policies will be applicable or may be changed as per the policies',
    cancellationPolicy: 'If you Cancel your Holiday\n\n07 days or more before date of departure : Full Refundable (Only Land Part)\n\n0 to 7 days before date of departure : Non Refundable (Only Land Part)',
    inclusions: [
      'Coral island with lunch on speed boat on SIC basis',
      'Pattaya city tour (tiger park (ticket extra) + gems gallery +big buddha) on private transfer. (Sedan Car)',
      'En route Bangkok (Golden buddha +Mini Reclining buddha with entry ticket) with Private transfer',
      'Safari world + Marine park + lunch on Private Transfer. (Monday remains closed) (Sedan Car)'
    ],
    exclusions: [
      'Request you to please keep all the conversations in a single mail & reply all to avoid any delay in mail',
      'The above is just a quote and we are not holding any booking',
      'Accommodations/Hotel room-rates & bedding is subject to availability at the time of booking',
      'Very Important Note: Hotel Room-rates are subject to availability due to High Peak Season the rates might be changed',
      'ROE Applicable on the day of payment processing',
      'ROE: - XE + 0.18 (For Thai Baht to INR)',
      'Hope all of the above is clear to you. Looking forward to hearing from you soon. And if any problem regarding the above quotation kindly contact below'
    ],
    additionalTerms: 'IMPORTANT NOTES:\n• Request you to please keep all the conversations in a single mail & reply all to avoid any delay in mail.\n• The above is just a quote and we are not holding any booking.\n• Accommodations/Hotel room-rates & bedding is subject to availability at the time of booking.\n• Very Important Note: Hotel Room-rates are subject to availability due to High Peak Season the rates might be changed.\n• ROE Applicable on the day of payment processing.\n• ROE: - XE + 0.18 (For Thai Baht to INR)\n• If Arrival & departure from DMK airport then it will be additional THB 300 per way per vehicle.\n• Hope all of the above is clear to you. Looking forward to hearing from you soon. And if any problem regarding the above quotation kindly contact below.\n\nGENERAL INFORMATION\nHere is a must take list that you should carry while traveling:\n• Original Passport (6 months validity)\n• Hotel confirmation voucher\n• Daywise Itinerary\n• Travel Insurance\n• THB 20000 or equivalent any currency per couple\n• Recent 02 Photograph 35*45 mm white background'
  },
  India: {
    paymentTerms: '40% advance at booking, 40% before 45 days of travel, remaining 20% before 15 days of departure. GST as applicable.',
    cancellationPolicy: 'Free cancellation up to 60 days before departure\n25% penalty for cancellations 45-59 days before departure\n50% penalty for cancellations 30-44 days before departure\n75% penalty for cancellations 15-29 days before departure\n100% penalty within 15 days',
    inclusions: [
      'Accommodation with daily breakfast',
      'Private AC vehicle with driver',
      'Professional English-speaking guide',
      'Monument entrance fees',
      'Airport/railway transfers',
      'Mineral water during sightseeing',
      'All applicable taxes'
    ],
    exclusions: [
      'Domestic/International airfare',
      'Camera fees at monuments',
      'Personal expenses and laundry',
      'Meals other than breakfast',
      'Tips to guide and driver',
      'Travel insurance',
      'Any items not mentioned in inclusions'
    ],
    additionalTerms: 'Valid passport/ID required. Foreign nationals need valid visa. Rates subject to availability. Peak season rates apply during Oct-Mar and festival periods.'
  },
  UAE: {
    paymentTerms: '50% advance payment at booking, remaining 50% due 7 days before arrival. All payments in AED or USD.',
    cancellationPolicy: 'Free cancellation up to 30 days before arrival\n50% penalty for cancellations 15-29 days before arrival\n75% penalty for cancellations 7-14 days before arrival\n100% penalty for cancellations within 7 days',
    inclusions: [
      'Hotel accommodation with breakfast',
      'Airport transfers in luxury vehicle',
      'Dubai city tour with professional guide',
      'Desert safari with BBQ dinner',
      'Dhow cruise dinner',
      'All entrance fees included',
      'Travel insurance coverage'
    ],
    exclusions: [
      'International flights',
      'UAE visa fees',
      'Personal shopping and expenses',
      'Alcoholic beverages',
      'Optional activities not mentioned',
      'Tips and gratuities',
      'Excess baggage charges'
    ],
    additionalTerms: 'Valid passport required. UAE visa required for most nationalities. Ramadan timings may affect some activities. Modest dress code required for certain attractions.'
  }
};

const defaultTermsData: TermsConditionsData = {
  paymentTerms: '30% advance payment required at booking, 70% due 30 days before departure',
  cancellationPolicy: 'Cancellations made 45+ days before departure: 10% penalty\nCancellations made 30-44 days before departure: 25% penalty\nCancellations made 15-29 days before departure: 50% penalty\nCancellations made less than 15 days: 100% penalty',
  inclusions: [
    'Accommodation as per itinerary',
    'Daily breakfast',
    'Airport transfers',
    'Sightseeing as mentioned',
    'Professional tour guide'
  ],
  exclusions: [
    'International airfare',
    'Personal expenses',
    'Travel insurance',
    'Meals not mentioned',
    'Optional activities'
  ],
  additionalTerms: 'All rates are subject to availability and may change without prior notice. Passport should be valid for minimum 6 months from travel date.'
};

const quickSuggestions = {
  inclusions: [
    'Airport transfers',
    'Daily breakfast',
    'Professional tour guide',
    'All entrance fees',
    'Private transportation',
    'Hotel accommodation',
    'Travel insurance',
    'Local SIM card',
    'Bottled water during tours',
    'Welcome drink on arrival',
    'Cultural show tickets',
    'Photography assistance'
  ],
  exclusions: [
    'International flights',
    'Visa fees',
    'Personal expenses',
    'Tips and gratuities',
    'Travel insurance',
    'Optional activities',
    'Meals not mentioned',
    'Excess baggage',
    'Early check-in/late check-out',
    'Room service charges',
    'Laundry services',
    'Medical expenses'
  ]
};

const EditableTermsConditionsModule: React.FC<EditableTermsConditionsModuleProps> = ({
  data,
  onChange,
  readonly = false,
  defaultCountry = 'Thailand'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TermsConditionsData>(data);
  
  const [savedTemplates, setSavedTemplates] = useState<TermsTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [detectedCountry, setDetectedCountry] = useState(defaultCountry);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const countries = [
    'Thailand', 'India', 'UAE', 'Malaysia', 'Singapore', 'Indonesia',
    'Vietnam', 'Cambodia', 'Philippines', 'Sri Lanka', 'Nepal', 'Maldives',
    'Japan', 'South Korea', 'China', 'Hong Kong', 'Australia', 'Canada',
    'New Zealand', 'United States', 'United Kingdom', 'Germany', 'France'
  ];

  // Load saved templates on component mount and auto-apply if available
  useEffect(() => {
    const loadTemplates = async () => {
      await loadSavedTemplates();
      // Auto-apply templates for the detected country if any exist after templates are loaded
      setTimeout(() => {
        autoApplyTemplatesForCountry(detectedCountry);
      }, 100);
    };
    
    loadTemplates();
  }, []);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  const loadSavedTemplates = () => {
    try {
      const saved = localStorage.getItem('termsConditionsTemplates');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that parsed data is an array and has the expected structure
        if (Array.isArray(parsed)) {
          const validTemplates = parsed.filter(template => 
            template && 
            typeof template === 'object' && 
            template.id && 
            template.name && 
            template.country && 
            template.data &&
            typeof template.data === 'object' &&
            Array.isArray(template.data.inclusions) &&
            Array.isArray(template.data.exclusions)
          );
          setSavedTemplates(validTemplates);
        } else {
          console.warn('Invalid templates data structure, clearing localStorage');
          localStorage.removeItem('termsConditionsTemplates');
          setSavedTemplates([]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Clear corrupted data
      localStorage.removeItem('termsConditionsTemplates');
      setSavedTemplates([]);
    }
  };

  const autoApplyTemplatesForCountry = (country: string) => {
    const countryTemplate = savedTemplates.find(t => t.country === country);
    if (countryTemplate && (!data.paymentTerms || data.paymentTerms === defaultTermsData.paymentTerms)) {
      onChange(countryTemplate.data);
      setEditData(countryTemplate.data);
      toast.success(`Applied ${country} template automatically`);
    }
  };

  const handleSave = () => {
    onChange(editData);
    setIsEditing(false);
    toast.success('Terms & conditions updated successfully');
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: TermsTemplate = {
      id: Date.now().toString(),
      name: templateName,
      country: selectedCountry,
      data: editData
    };

    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('termsConditionsTemplates', JSON.stringify(updatedTemplates));
    
    setIsTemplateDialogOpen(false);
    setTemplateName('');
    toast.success('Template saved successfully');
  };

  const applyTemplate = (template: TermsTemplate) => {
    setEditData(template.data);
    onChange(template.data);
    toast.success(`Applied template: ${template.name}`);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('termsConditionsTemplates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted successfully');
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      const updatedData = {
        ...editData,
        inclusions: [...editData.inclusions, newInclusion.trim()]
      };
      setEditData(updatedData);
      setNewInclusion('');
      if (!isEditing) {
        onChange(updatedData);
      }
    }
  };

  const removeInclusion = (index: number) => {
    const updatedData = {
      ...editData,
      inclusions: editData.inclusions.filter((_, i) => i !== index)
    };
    setEditData(updatedData);
    if (!isEditing) {
      onChange(updatedData);
    }
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      const updatedData = {
        ...editData,
        exclusions: [...editData.exclusions, newExclusion.trim()]
      };
      setEditData(updatedData);
      setNewExclusion('');
      if (!isEditing) {
        onChange(updatedData);
      }
    }
  };

  const removeExclusion = (index: number) => {
    const updatedData = {
      ...editData,
      exclusions: editData.exclusions.filter((_, i) => i !== index)
    };
    setEditData(updatedData);
    if (!isEditing) {
      onChange(updatedData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
          {!readonly && (
            <div className="flex items-center gap-2">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Manage Templates & Quick Apply</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Sample Templates by Country */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Quick Apply Country Templates</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(sampleTemplatesByCountry).map(([country, template]) => (
                          <div key={country} className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-medium">{country}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {template.inclusions.length} inclusions, {template.exclusions.length} exclusions
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const countryTemplate = {
                                    paymentTerms: template.paymentTerms,
                                    cancellationPolicy: template.cancellationPolicy,
                                    inclusions: template.inclusions,
                                    exclusions: template.exclusions,
                                    additionalTerms: template.additionalTerms
                                  };
                                  setEditData(countryTemplate);
                                  onChange(countryTemplate);
                                  setIsTemplateDialogOpen(false);
                                  toast.success(`Applied ${country} template`);
                                }}
                              >
                                Apply Template
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.paymentTerms.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save Current as Template */}
                    <div className="space-y-3 p-4 bg-accent/20 rounded-lg">
                      <Label className="text-base font-semibold">Save Current as Custom Template</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter template name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={saveAsTemplate} className="w-full" variant="secondary">
                        Save as Custom Template
                      </Button>
                    </div>

                    {/* Apply Custom Templates */}
                    {savedTemplates.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Your Custom Templates</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {savedTemplates.map(template => (
                            <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-medium text-sm">{template.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">{template.country}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {template.data.inclusions.length} inc. • {template.data.exclusions.length} exc.
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    applyTemplate(template);
                                    setIsTemplateDialogOpen(false);
                                  }}
                                >
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteTemplate(template.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-detected Country */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>Auto-detected destination: <strong className="text-primary">{detectedCountry}</strong></span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* 1. Inclusions */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Tour Inclusions</Label>
            
            {/* Add New Inclusion */}
            {(!readonly || isEditing) && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new inclusion..."
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
                    className="flex-1"
                  />
                  <Button onClick={addInclusion} size="sm" className="px-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Quick Suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Quick Add:</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.inclusions.map((suggestion, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          if (!editData.inclusions.includes(suggestion)) {
                            const updatedData = {
                              ...editData,
                              inclusions: [...editData.inclusions, suggestion]
                            };
                            setEditData(updatedData);
                            if (!isEditing) {
                              onChange(updatedData);
                            }
                          }
                        }}
                        disabled={editData.inclusions.includes(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inclusions List */}
            <div className="space-y-2">
              {editData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>
                  <span className="flex-1">{inclusion}</span>
                  {(!readonly || isEditing) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeInclusion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {editData.inclusions.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No inclusions added yet
                </div>
              )}
            </div>
          </div>

          {/* 2. Exclusions */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Tour Exclusions</Label>
            
            {/* Add New Exclusion */}
            {(!readonly || isEditing) && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new exclusion..."
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                    className="flex-1"
                  />
                  <Button onClick={addExclusion} size="sm" className="px-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Quick Suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Quick Add:</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.exclusions.map((suggestion, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          if (!editData.exclusions.includes(suggestion)) {
                            const updatedData = {
                              ...editData,
                              exclusions: [...editData.exclusions, suggestion]
                            };
                            setEditData(updatedData);
                            if (!isEditing) {
                              onChange(updatedData);
                            }
                          }
                        }}
                        disabled={editData.exclusions.includes(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exclusions List */}
            <div className="space-y-2">
              {editData.exclusions.map((exclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">✗</Badge>
                  <span className="flex-1">{exclusion}</span>
                  {(!readonly || isEditing) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExclusion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {editData.exclusions.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No exclusions added yet
                </div>
              )}
            </div>
          </div>

          {/* 3. Payment Terms */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Payment Terms</Label>
            {isEditing ? (
              <Textarea
                value={editData.paymentTerms}
                onChange={(e) => setEditData({ ...editData, paymentTerms: e.target.value })}
                rows={4}
                placeholder="Enter payment terms..."
              />
            ) : (
              <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                {data.paymentTerms || 'No payment terms specified'}
              </div>
            )}
          </div>

          {/* 4. Cancellation Policy */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Cancellation Policy</Label>
            {isEditing ? (
              <Textarea
                value={editData.cancellationPolicy}
                onChange={(e) => setEditData({ ...editData, cancellationPolicy: e.target.value })}
                rows={6}
                placeholder="Enter cancellation policy..."
              />
            ) : (
              <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                {data.cancellationPolicy || 'No cancellation policy specified'}
              </div>
            )}
          </div>

          {/* 5. Additional Terms & Conditions */}
          {(editData.additionalTerms || isEditing) && (
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Additional Terms & Conditions</Label>
              {isEditing ? (
                <Textarea
                  value={editData.additionalTerms}
                  onChange={(e) => setEditData({ ...editData, additionalTerms: e.target.value })}
                  rows={4}
                  placeholder="Enter additional terms..."
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                  {data.additionalTerms || 'No additional terms specified'}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableTermsConditionsModule;
