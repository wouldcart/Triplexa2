import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Download,
  Settings,
  Palette,
  Layout,
  Image,
  Type,
  MapPin,
  Calendar,
  DollarSign,
  Hotel,
  Car,
  Camera
} from 'lucide-react';
import TemplateBuilder from './TemplateBuilder';
import TemplatePreview from './TemplatePreview';
import TemplateLibrary from './TemplateLibrary';

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimalist' | 'premium' | 'classic' | 'landscape' | 'dark';
  travelType: 'luxury' | 'honeymoon' | 'group' | 'mice' | 'adventure' | 'family';
  isActive: boolean;
  isCustom: boolean;
  createdAt: string;
  lastModified: string;
  usageCount: number;
  preview: string;
  structure: any;
}

const PDFTemplateManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sample templates data
  const [templates] = useState<PDFTemplate[]>([
    {
      id: 'tmpl_001',
      name: 'Premium Luxury Template',
      description: 'Elegant design for luxury travel packages with rich imagery',
      category: 'premium',
      travelType: 'luxury',
      isActive: true,
      isCustom: false,
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      usageCount: 45,
      preview: '/api/placeholder/300/400',
      structure: {}
    }
  ]);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsBuilderOpen(true);
  };

  const handleEditTemplate = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setIsBuilderOpen(true);
  };

  const handlePreviewTemplate = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            PDF Template Management
          </h2>
          <p className="text-muted-foreground">
            Create, manage, and customize PDF templates for travel proposals
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </div>

      {/* Template Builder Modal */}
      {isBuilderOpen && (
        <TemplateBuilder 
          template={selectedTemplate}
          onClose={() => setIsBuilderOpen(false)}
          onSave={(template) => {
            setIsBuilderOpen(false);
          }}
        />
      )}

      {/* Template Preview Modal */}
      {isPreviewOpen && selectedTemplate && (
        <TemplatePreview 
          template={selectedTemplate}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="library">Template Library</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={template.preview} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewTemplate(template)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="library">
          <TemplateLibrary />
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Type, name: 'Header/Footer', count: 12 },
              { icon: Calendar, name: 'Day Plan', count: 8 },
              { icon: Hotel, name: 'Accommodation', count: 6 },
              { icon: Camera, name: 'Sightseeing', count: 10 }
            ].map((component) => (
              <Card key={component.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <component.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">{component.name}</h3>
                  <p className="text-sm text-muted-foreground">{component.count} components</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultFont">Default Font Family</Label>
                  <Input id="defaultFont" defaultValue="Inter" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <Input id="primaryColor" defaultValue="#3B82F6" type="color" />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFTemplateManager;