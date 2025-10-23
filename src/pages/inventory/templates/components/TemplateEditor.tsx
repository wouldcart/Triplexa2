import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import ProposalTemplateService from '@/services/proposalTemplateService';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';
import { Plus, Trash2, Calendar, MapPin, Save, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import SmartSuggestionsPanel from './SmartSuggestionsPanel';
import TemplateSummary from './TemplateSummary';

interface TemplateEditorProps {
  template: EnhancedProposalTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, isOpen, onClose, onSave }) => {
  const { toast } = useToast();
  const { countries, cities } = useInventoryData();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: '',
    cities: [''],
    days: 1,
    nights: 0,
    category: 'Standard' as 'Budget' | 'Standard' | 'Premium' | 'Luxury',
    tags: [] as string[],
    isActive: true
  });
  const [dayPlan, setDayPlan] = useState<ProposalDay[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);

  // Get available cities for selected country
  const getAvailableCities = () => {
    if (!formData.country) return [];
    
    // Since Country type may not have cities property, filter from cities data
    return cities.filter(city => 
      city.country.toLowerCase() === formData.country.toLowerCase()
    ).map(city => city.name);
  };

  const availableCities = getAvailableCities();

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        country: template.destination.country,
        cities: template.destination.cities,
        days: template.duration.days,
        nights: template.duration.nights,
        category: template.category,
        tags: template.metadata.tags,
        isActive: template.metadata.isActive
      });
      setDayPlan(template.dayPlan);
    } else {
      // Reset for new template
      setFormData({
        name: '',
        description: '',
        country: '',
        cities: [''],
        days: 1,
        nights: 0,
        category: 'Standard',
        tags: [],
        isActive: true
      });
      setDayPlan([]);
    }
  }, [template]);

  // Auto-update days/nights when day plan changes
  useEffect(() => {
    if (dayPlan.length > 0) {
      setFormData(prev => ({
        ...prev,
        days: dayPlan.length,
        nights: Math.max(0, dayPlan.length - 1)
      }));
    }
  }, [dayPlan.length]);

  const handleSave = async () => {
    try {
      const templateService = ProposalTemplateService.getInstance();
      
      const templateData: Partial<EnhancedProposalTemplate> = {
        id: template?.id,
        name: formData.name,
        description: formData.description,
        destination: {
          country: formData.country,
          cities: formData.cities.filter(city => city.trim() !== '')
        },
        duration: {
          days: formData.days,
          nights: formData.nights
        },
        category: formData.category,
        dayPlan: dayPlan,
        pricingMatrix: template?.pricingMatrix || [{
          paxCount: 2,
          basePrice: dayPlan.reduce((sum, day) => sum + day.totalCost, 0),
          markup: 0.15
        }],
        metadata: {
          ...template?.metadata,
          tags: formData.tags,
          isActive: formData.isActive,
          usageCount: template?.metadata?.usageCount || 0,
          averageRating: template?.metadata?.averageRating || 4.0,
          lastUsed: template?.metadata?.lastUsed || new Date().toISOString()
        }
      };

      templateService.saveTemplate(templateData);
      
      toast({
        title: "Template Saved",
        description: `${formData.name} has been saved successfully`,
      });
      
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const addDay = () => {
    const newDay: ProposalDay = {
      id: `day_${Date.now()}`,
      dayNumber: dayPlan.length + 1,
      date: '',
      city: formData.cities[0] || '',
      title: `Day ${dayPlan.length + 1}`,
      description: '',
      activities: [],
      meals: { breakfast: false, lunch: false, dinner: false },
      totalCost: 0
    };
    setDayPlan([...dayPlan, newDay]);
  };

  const removeDay = (dayId: string) => {
    const newDayPlan = dayPlan.filter(day => day.id !== dayId);
    // Renumber days
    const renumberedPlan = newDayPlan.map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      title: day.title.startsWith('Day ') ? `Day ${index + 1}` : day.title
    }));
    setDayPlan(renumberedPlan);
  };

  const updateDay = (dayId: string, updates: Partial<ProposalDay>) => {
    setDayPlan(dayPlan.map(day => 
      day.id === dayId ? { ...day, ...updates } : day
    ));
  };

  const addCity = () => {
    setFormData(prev => ({
      ...prev,
      cities: [...prev.cities, '']
    }));
  };

  const updateCity = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.map((city, i) => i === index ? value : city)
    }));
  };

  const removeCity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.filter((_, i) => i !== index)
    }));
  };

  const handleAddToDay = (dayId: string, item: any) => {
    if (dayId === 'current' && dayPlan.length > 0) {
      // Add to the last day if "current" is selected
      const lastDay = dayPlan[dayPlan.length - 1];
      const newActivity = {
        id: `activity_${Date.now()}`,
        name: item.name,
        price: item.price,
        duration: item.duration || '2 hours'
      };
      
      updateDay(lastDay.id, {
        activities: [...lastDay.activities, newActivity],
        totalCost: lastDay.totalCost + item.price
      });
      
      toast({
        title: "Activity Added",
        description: `${item.name} added to ${lastDay.title}`,
      });
    }
  };

  const handleUseDayTemplate = (template: ProposalDay) => {
    const newDay = {
      ...template,
      id: `day_${Date.now()}`,
      dayNumber: dayPlan.length + 1
    };
    setDayPlan([...dayPlan, newDay]);
    
    toast({
      title: "Day Template Applied",
      description: `${template.title} added to itinerary`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template ? 'Edit Template' : 'Create New Template'}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmartSuggestions(!showSmartSuggestions)}
              className="ml-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {showSmartSuggestions ? 'Hide' : 'Show'} AI Suggestions
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Main Editor */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="itinerary">Day Plan</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Budget">Budget</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this template..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value, cities: [''] }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="days">Days</Label>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      value={formData.days}
                      onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                      readOnly={dayPlan.length > 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nights">Nights</Label>
                    <Input
                      id="nights"
                      type="number"
                      min="0"
                      value={formData.nights}
                      onChange={(e) => setFormData(prev => ({ ...prev, nights: parseInt(e.target.value) || 0 }))}
                      readOnly={dayPlan.length > 0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cities</Label>
                  {formData.cities.map((city, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={city}
                        onValueChange={(value) => updateCity(index, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((cityName) => (
                            <SelectItem key={cityName} value={cityName}>
                              {cityName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.cities.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeCity(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addCity} className="w-full">
                    Add City
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Day-by-Day Itinerary</h3>
                  <Button onClick={addDay} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Day
                  </Button>
                </div>

                <div className="space-y-4">
                  {dayPlan.map((day, index) => (
                    <Card key={day.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Day {day.dayNumber}</span>
                            <Badge variant="outline">{day.city}</Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeDay(day.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={day.title}
                              onChange={(e) => updateDay(day.id, { title: e.target.value })}
                              placeholder="Day title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Select value={day.city} onValueChange={(value) => updateDay(day.id, { city: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.cities.filter(city => city.trim()).map((city) => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label>Description</Label>
                          <Textarea
                            value={day.description}
                            onChange={(e) => updateDay(day.id, { description: e.target.value })}
                            placeholder="Describe the day's activities..."
                            rows={2}
                          />
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Activities: {day.activities.length}</span>
                            <span className="text-sm font-medium">Total Cost: ${day.totalCost}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {dayPlan.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No days added yet. Click "Add Day" to start building your itinerary.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <TemplateSummary template={formData} dayPlan={dayPlan} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Template Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Active templates can be used in proposal creation
                      </p>
                    </div>
                    <Select 
                      value={formData.isActive ? 'active' : 'inactive'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                      }))}
                      placeholder="beach, family, budget, adventure..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Smart Suggestions Panel */}
          {showSmartSuggestions && formData.country && (
            <div className="w-96">
              <SmartSuggestionsPanel
                selectedCountry={formData.country}
                selectedCities={formData.cities.filter(city => city.trim())}
                templateCategory={formData.category}
                onAddToDay={handleAddToDay}
                onUseDayTemplate={handleUseDayTemplate}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name || !formData.country}>
            <Save className="h-4 w-4 mr-2" />
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditor;
