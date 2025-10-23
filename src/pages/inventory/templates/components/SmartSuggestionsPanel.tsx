
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, MapPin, Clock, DollarSign, Star, Hotel, 
  Car, Camera, UtensilsCrossed, Sparkles 
} from 'lucide-react';
import { useSmartTemplateSuggestions } from '../hooks/useSmartTemplateSuggestions';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';

interface SmartSuggestionsPanelProps {
  selectedCountry: string;
  selectedCities: string[];
  templateCategory: 'Budget' | 'Standard' | 'Premium' | 'Luxury';
  onAddToDay: (dayId: string, item: any) => void;
  onUseDayTemplate: (template: ProposalDay) => void;
}

const SmartSuggestionsPanel: React.FC<SmartSuggestionsPanelProps> = ({
  selectedCountry,
  selectedCities,
  templateCategory,
  onAddToDay,
  onUseDayTemplate
}) => {
  const { suggestions, loading, priceRange } = useSmartTemplateSuggestions(
    selectedCountry,
    selectedCities,
    templateCategory
  );
  const [activeTab, setActiveTab] = useState('templates');

  const getIcon = (type: string) => {
    switch (type) {
      case 'hotel': return Hotel;
      case 'transport': return Car;
      case 'sightseeing': return Camera;
      case 'restaurant': return UtensilsCrossed;
      default: return Plus;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Premium': return 'bg-purple-100 text-purple-800';
      case 'Luxury': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading suggestions...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Smart Suggestions
          <Badge className={getCategoryColor(templateCategory)}>
            {templateCategory}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered suggestions based on {selectedCountry} and your template category
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="templates">Day Plans</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="sightseeing">Activities</TabsTrigger>
            <TabsTrigger value="restaurants">Dining</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Pre-built Day Templates</h4>
              <Badge variant="outline">
                ${priceRange.min}-${priceRange.max} range
              </Badge>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {suggestions.dayTemplates.map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{template.title}</h5>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {template.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${template.totalCost}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.activities.length} activities
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUseDayTemplate(template)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {(['hotels', 'transport', 'sightseeing', 'restaurants'] as const).map((type) => {
            const EmptyStateIcon = getIcon(type);
            return (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{type} Suggestions</h4>
                  <Badge variant="outline">
                    {suggestions[type].length} options
                  </Badge>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {suggestions[type].map((item) => {
                      const IconComponent = getIcon(item.type);
                      return (
                        <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <IconComponent className="h-4 w-4 text-blue-600 mt-1" />
                              <div className="flex-1">
                                <h5 className="font-medium">{item.name}</h5>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <DollarSign className="h-3 w-3" />
                                    {item.price} {item.currency}
                                    {item.paxBased && <span className="text-xs">/pax</span>}
                                  </div>
                                  {item.rating && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                                      {item.rating}
                                    </div>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {item.city}, {item.country}
                                  {item.duration && (
                                    <>
                                      <Clock className="h-3 w-3 ml-2" />
                                      {item.duration}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAddToDay('current', item)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {suggestions[type].length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <EmptyStateIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No {type} suggestions available for selected destination</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SmartSuggestionsPanel;
