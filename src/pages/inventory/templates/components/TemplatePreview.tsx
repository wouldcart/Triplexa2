
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, DollarSign, Clock, Star, Users } from 'lucide-react';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';

interface TemplatePreviewProps {
  template: EnhancedProposalTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, isOpen, onClose }) => {
  const totalCost = template.dayPlan.reduce((sum, day) => sum + day.totalCost, 0);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            Preview of template details and day-by-day itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Template Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>{template.destination.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>{template.duration.days}D/{template.duration.nights}N</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span>${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>{template.metadata.usageCount} uses</span>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-muted-foreground">{template.description}</p>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline">{template.category}</Badge>
                {template.metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Day-by-Day Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.dayPlan.map((day) => (
                  <div key={day.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>Day {day.dayNumber}</Badge>
                          <h4 className="font-semibold">{day.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{day.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">${day.totalCost}</div>
                        <div className="text-xs text-muted-foreground">{day.city}</div>
                      </div>
                    </div>
                    
                    {day.activities.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Activities:</h5>
                        {day.activities.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{activity.name}</span>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{activity.duration}</span>
                              <span className="font-medium">${activity.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreview;
