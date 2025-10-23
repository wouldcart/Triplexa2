
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Users, DollarSign, Star, Search, Filter } from 'lucide-react';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';
import ProposalTemplateService, { EnhancedProposalTemplate } from '@/services/proposalTemplateService';

interface TemplateSelectorProps {
  query: Query;
  onSelectTemplate: (template: EnhancedProposalTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  query,
  onSelectTemplate,
  onClose
}) => {
  const [templates, setTemplates] = useState<EnhancedProposalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EnhancedProposalTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [query]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter, durationFilter]);

  const loadTemplates = () => {
    try {
      setLoading(true);
      const templateService = ProposalTemplateService.getInstance();
      const recommendedTemplates = templateService.getRecommendedTemplates(query);
      const allTemplates = templateService.getAllTemplates();
      
      // Combine recommended with others
      const uniqueTemplates = recommendedTemplates.concat(
        allTemplates.filter(t => !recommendedTemplates.find(r => r.id === t.id))
      );
      
      setTemplates(uniqueTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.destination.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => 
        template.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (durationFilter !== 'all') {
      const days = parseInt(durationFilter);
      filtered = filtered.filter(template => template.duration.days === days);
    }

    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = (template: EnhancedProposalTemplate) => {
    const templateService = ProposalTemplateService.getInstance();
    templateService.incrementUsage(template.id);
    onSelectTemplate(template);
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select Proposal Template</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>

            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="4">4 Days</SelectItem>
                <SelectItem value="5">5 Days</SelectItem>
                <SelectItem value="6">6 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{template.destination.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{template.duration.days}D/{template.duration.nights}N</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{template.metadata.usageCount} uses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{template.metadata.averageRating.toFixed(1)}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {formatCurrency(calculateTemplatePrice(template), query.destination.country)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Total for {query.paxDetails.adults + query.paxDetails.children} PAX
                </span>
              </div>

              {/* Day Plan Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Day Plan:</h4>
                <div className="space-y-1">
                  {template.dayPlan.slice(0, 3).map((day, index) => (
                    <div key={day.id} className="text-xs text-muted-foreground">
                      Day {day.dayNumber}: {day.title} ({day.city})
                    </div>
                  ))}
                  {template.dayPlan.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{template.dayPlan.length - 3} more days...
                    </div>
                  )}
                </div>
              </div>

              {/* Select Button */}
              <Button 
                className="w-full" 
                onClick={() => handleSelectTemplate(template)}
              >
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No templates found matching your criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setDurationFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
