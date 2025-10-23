
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Filter, Download, Upload, BookTemplate, 
  Calendar, MapPin, Users, DollarSign, Star, Trash2, 
  Edit, Copy, Eye, BarChart3, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import ProposalTemplateService from '@/services/proposalTemplateService';
import TemplateEditor from './templates/components/TemplateEditor';
import TemplatePreview from './templates/components/TemplatePreview';
import TemplateFilters from './templates/components/TemplateFilters';
import { useTemplateData } from './templates/hooks/useTemplateData';

const Templates: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedProposalTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    templates,
    loading,
    stats,
    refreshTemplates,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateStatus
  } = useTemplateData();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.destination.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && template.metadata.isActive;
    if (activeTab === 'inactive') return matchesSearch && !template.metadata.isActive;
    if (activeTab === 'popular') return matchesSearch && template.metadata.usageCount > 5;
    
    return matchesSearch && template.category.toLowerCase() === activeTab;
  });

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEdit = (template: EnhancedProposalTemplate) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handlePreview = (template: EnhancedProposalTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleDuplicate = async (template: EnhancedProposalTemplate) => {
    try {
      await duplicateTemplate(template.id);
      toast({
        title: "Template Duplicated",
        description: `${template.name} has been duplicated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (template: EnhancedProposalTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
        toast({
          title: "Template Deleted",
          description: `${template.name} has been deleted`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (template: EnhancedProposalTemplate) => {
    try {
      await toggleTemplateStatus(template.id);
      toast({
        title: "Status Updated",
        description: `${template.name} is now ${template.metadata.isActive ? 'inactive' : 'active'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Proposal Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your proposal templates for efficient proposal creation
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BookTemplate className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Most Used</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.mostUsed}</p>
                </div>
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.avgRating.toFixed(1)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Template Library</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex flex-1 items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name, description, or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <TemplateFilters onFilterChange={(filters) => console.log('Filters:', filters)} />
            </div>

            {/* Template Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="luxury">Luxury</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Template Grid/List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        </div>
                        <Badge variant={template.metadata.isActive ? 'default' : 'secondary'}>
                          {template.metadata.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{template.destination.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span>{template.duration.days}D/{template.duration.nights}N</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{template.category}</Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{template.metadata.averageRating.toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Used {template.metadata.usageCount} times
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDuplicate(template)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(template)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredTemplates.length === 0 && !loading && (
              <div className="text-center py-12">
                <BookTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first template to get started
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Editor Dialog */}
        {showEditor && (
          <TemplateEditor
            template={selectedTemplate}
            isOpen={showEditor}
            onClose={() => {
              setShowEditor(false);
              setSelectedTemplate(null);
            }}
            onSave={() => {
              setShowEditor(false);
              setSelectedTemplate(null);
              refreshTemplates();
            }}
          />
        )}

        {/* Template Preview Dialog */}
        {showPreview && selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            isOpen={showPreview}
            onClose={() => {
              setShowPreview(false);
              setSelectedTemplate(null);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Templates;
