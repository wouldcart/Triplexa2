
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Copy, BarChart3, Users, Clock, DollarSign } from 'lucide-react';
import ProposalTemplateService, { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import { useToast } from '@/hooks/use-toast';

export const TemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EnhancedProposalTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      setLoading(true);
      const templateService = ProposalTemplateService.getInstance();
      const allTemplates = templateService.getAllTemplates()
        .filter(t => !t.id.startsWith('default_')); // Exclude default templates from management
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load template data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplateStatus = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      template.metadata.isActive = !template.metadata.isActive;
      const templateService = ProposalTemplateService.getInstance();
      templateService.saveTemplate(template);
      setTemplates([...templates]);
      
      toast({
        title: template.metadata.isActive ? "Template activated" : "Template deactivated",
        description: `"${template.name}" is now ${template.metadata.isActive ? 'active' : 'inactive'}`,
      });
    }
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const duplicated = {
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        metadata: {
          ...template.metadata,
          usageCount: 0,
          createdFrom: template.id
        }
      };
      
      const templateService = ProposalTemplateService.getInstance();
      const newId = templateService.saveTemplate(duplicated);
      loadTemplates();
      
      toast({
        title: "Template duplicated",
        description: `Created copy of "${template.name}"`,
      });
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.destination.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Template Management</h2>
        <Button onClick={loadTemplates}>
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className={template.metadata.isActive ? '' : 'opacity-75'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    {!template.metadata.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.metadata.isActive}
                    onCheckedChange={() => toggleTemplateStatus(template.id)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{template.metadata.usageCount} uses</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span>{template.metadata.averageRating.toFixed(1)} rating</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{template.duration.days}D/{template.duration.nights}N</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    ${template.pricingMatrix[0]?.basePrice?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Destination:</span>
                  <span className="ml-2">{template.destination.country}</span>
                  <span className="text-muted-foreground ml-2">
                    ({template.destination.cities.join(', ')})
                  </span>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Last used:</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(template.metadata.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => duplicateTemplate(template.id)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'No templates found matching your search' : 'No custom templates created yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
