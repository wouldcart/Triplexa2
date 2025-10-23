
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, DollarSign, Star, Layout, ArrowRight } from 'lucide-react';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';
import ProposalTemplateService, { EnhancedProposalTemplate } from '@/services/proposalTemplateService';

interface TemplateRecommendationsProps {
  query: Query;
  onSelectTemplate: (template: EnhancedProposalTemplate) => void;
  onShowAllTemplates: () => void;
}

export const TemplateRecommendations: React.FC<TemplateRecommendationsProps> = ({
  query,
  onSelectTemplate,
  onShowAllTemplates
}) => {
  const [recommendations, setRecommendations] = useState<EnhancedProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [query]);

  const loadRecommendations = () => {
    try {
      setLoading(true);
      const templateService = ProposalTemplateService.getInstance();
      const recommended = templateService.getRecommendedTemplates(query);
      setRecommendations(recommended.slice(0, 3)); // Show top 3 recommendations
    } catch (error) {
      console.error('Error loading template recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTemplatePrice = (template: EnhancedProposalTemplate): number => {
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    const pricingTier = template.pricingMatrix.find(p => p.paxCount <= totalPax) || 
                       template.pricingMatrix[template.pricingMatrix.length - 1];
    
    if (pricingTier) {
      return pricingTier.basePrice * (1 + pricingTier.markup);
    }
    
    return template.dayPlan.reduce((sum, day) => sum + day.totalCost, 0);
  };

  const handleSelectTemplate = (template: EnhancedProposalTemplate) => {
    const templateService = ProposalTemplateService.getInstance();
    templateService.incrementUsage(template.id);
    onSelectTemplate(template);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Budget': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Standard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Luxury': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCompatibilityScore = (template: EnhancedProposalTemplate): { score: number; matches: string[] } => {
    const matches: string[] = [];
    let score = 0;

    // Destination match
    if (template.destination.country.toLowerCase() === query.destination.country.toLowerCase()) {
      matches.push('Destination');
      score += 40;
    }

    // Duration match (within 1 day)
    const queryDays = Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24));
    if (Math.abs(template.duration.days - queryDays) <= 1) {
      matches.push('Duration');
      score += 30;
    }

    // Cities match
    const commonCities = template.destination.cities.filter(city => 
      query.destination.cities.some(qCity => city.toLowerCase().includes(qCity.toLowerCase()))
    );
    if (commonCities.length > 0) {
      matches.push('Cities');
      score += 20;
    }

    // Usage popularity
    if (template.metadata.usageCount > 10) {
      matches.push('Popular');
      score += 10;
    }

    return { score, matches };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Recommended Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-2">Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Layout className="h-5 w-5" />
            Quick Start with Templates
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onShowAllTemplates} className="gap-2">
            View All Templates
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Start your proposal faster with these templates matching your query requirements
        </p>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((template) => {
              const compatibility = getCompatibilityScore(template);
              const estimatedPrice = calculateTemplatePrice(template);
              
              return (
                <Card key={template.id} className="bg-white dark:bg-gray-900 hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Template Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{template.destination.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{template.duration.days}D/{template.duration.nights}N</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{template.metadata.usageCount} uses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{template.metadata.averageRating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Compatibility Matches */}
                    {compatibility.matches.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {compatibility.matches.map((match, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            ✓ {match}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Estimated Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          {formatCurrency(estimatedPrice, query.destination.country)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Total for {query.paxDetails.adults + query.paxDetails.children} PAX
                      </span>
                    </div>

                    {/* Use Template Button */}
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleSelectTemplate(template)}
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No recommended templates found for your query parameters
            </p>
            <Button variant="outline" onClick={onShowAllTemplates} className="gap-2">
              <Layout className="h-4 w-4" />
              Browse All Templates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
