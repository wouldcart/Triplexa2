
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Users, Star, Wand2 } from "lucide-react";
import { DayTemplate, useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';

interface DayTemplateSelectorProps {
  query: Query;
  dayNumber: number;
  onApplyTemplate: (template: DayTemplate) => void;
  onClose: () => void;
}

export const DayTemplateSelector: React.FC<DayTemplateSelectorProps> = ({
  query,
  dayNumber,
  onApplyTemplate,
  onClose
}) => {
  const { dayTemplates, travelerProfile } = useSmartSuggestions(query, dayNumber);

  const TemplateCard: React.FC<{ template: DayTemplate }> = ({ template }) => {
    const isRecommended = template.bestFor.includes(travelerProfile.type);
    
    return (
      <Card className={`cursor-pointer transition-all hover:shadow-lg ${
        isRecommended ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="flex items-center gap-2">
              {isRecommended && (
                <Badge className="bg-blue-600">Recommended</Badge>
              )}
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{template.popularity}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{template.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{template.activities.length} activities</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(template.totalCost, query.destination.country)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-sm">Included Activities:</h5>
            <div className="space-y-1">
              {template.activities.slice(0, 3).map((activity, index) => (
                <div key={activity.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="flex-1">{activity.name}</span>
                  <span className="text-muted-foreground">{activity.duration}</span>
                </div>
              ))}
              {template.activities.length > 3 && (
                <div className="text-xs text-muted-foreground ml-8">
                  +{template.activities.length - 3} more activities
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onApplyTemplate(template)}
              className="flex-1"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </div>

          {template.bestFor.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Perfect for:</p>
              <div className="flex gap-1 flex-wrap">
                {template.bestFor.map((type) => (
                  <Badge 
                    key={type} 
                    variant="secondary" 
                    className={`text-xs ${type === travelerProfile.type ? 'bg-blue-100 text-blue-800' : ''}`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-auto w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Choose a Day Template</h2>
              <p className="text-muted-foreground mt-1">
                Get started quickly with curated day plans for Day {dayNumber}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          {dayTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dayTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
              <p className="text-muted-foreground">
                We couldn't generate day templates for this destination. 
                Try adding activities manually or check back later.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Templates are personalized based on your traveler profile: <strong>{travelerProfile.type}</strong>
              </div>
              <Button variant="outline" onClick={onClose}>
                Start from Scratch
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
