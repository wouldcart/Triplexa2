import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Settings } from 'lucide-react';
import { Query } from '@/types/query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Business' | 'Luxury' | 'Adventure' | 'Cultural';
  preview: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface PDFTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query;
  onTemplateSelect: (templateId: string) => void;
}

const PDFTemplateSelector: React.FC<PDFTemplateSelectorProps> = ({
  isOpen,
  onClose,
  query,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    // Load from localStorage or use defaults
    const savedTemplates = localStorage.getItem('pdf_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(getDefaultTemplates());
    }
  };

  const getDefaultTemplates = (): PDFTemplate[] => [
    {
      id: 'colorful-itinerary',
      name: 'Colorful Day Itinerary',
      description: 'Vibrant multi-day travel layout with day cards and activity timeline',
      category: 'Adventure',
      preview: '/lovable-uploads/79564cdd-4fa6-4197-b720-0d6746f2c3d7.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'japan-cities',
      name: 'Japan Cities Layout',
      description: 'City-focused itinerary with circular images and clean timeline',
      category: 'Cultural',
      preview: '/lovable-uploads/b26c6765-730b-434f-8ae7-c1e43c122015.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'elegant-wedding',
      name: 'Elegant Event Timeline',
      description: 'Sophisticated wedding and event timeline with floral elements',
      category: 'Luxury',
      preview: '/lovable-uploads/b1f7e964-7234-473b-84eb-248ecf49f241.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'professional-business',
      name: 'Professional Business Travel',
      description: 'Corporate travel itinerary with detailed sections and clean layout',
      category: 'Business',
      preview: '/lovable-uploads/5d51837c-411c-4aaa-9891-a3ab2df8d16a.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'mountain-adventure',
      name: 'Mountain Adventure',
      description: 'Outdoor adventure layout with route details and highlights',
      category: 'Adventure',
      preview: '/lovable-uploads/e640fe16-6ad5-4ac3-a9e6-232b2f8fafb0.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'global-horizons',
      name: 'Global Horizons Professional',
      description: 'Corporate branded template with company header and traveler info',
      category: 'Business',
      preview: '/lovable-uploads/047a1192-3594-4871-966c-df71a37c568d.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'minimal-japan',
      name: 'Minimal Japan Style',
      description: 'Clean Japanese-inspired design with hero image and timeline',
      category: 'Cultural',
      preview: '/lovable-uploads/fa4520d7-f9be-426e-8c32-e613e2a25d12.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'paris-detailed',
      name: 'Paris Detailed Schedule',
      description: 'Detailed hourly itinerary with landmark imagery and timeline',
      category: 'Cultural',
      preview: '/lovable-uploads/e9bace32-2639-4c11-b03a-d4c6d0a4cabd.png',
      isActive: true,
      isDefault: true
    },
    {
      id: 'week-timeline',
      name: 'Week Timeline Layout',
      description: 'Multi-day itinerary with detailed daily breakdown and images',
      category: 'Business',
      preview: '/lovable-uploads/7caa93d2-53da-4d29-ac5d-edbeb710a6fc.png',
      isActive: true,
      isDefault: true
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleDownload = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    onTemplateSelect(selectedTemplate);
    onClose();
    toast.success('Generating PDF with selected template...');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Business': return 'bg-blue-100 text-blue-800';
      case 'Luxury': return 'bg-purple-100 text-purple-800';
      case 'Adventure': return 'bg-green-100 text-green-800';
      case 'Cultural': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeTemplates = templates.filter(t => t.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quotation Template (PDF)
          </DialogTitle>
          <DialogDescription>
            Select a template to apply when generating the quotation PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Available Documents ({activeTemplates.length})
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
            >
              <Settings className="h-4 w-4" />
              Manage Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Template Preview */}
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Preview functionality
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant={selectedTemplate === template.id ? "default" : "outline"}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        {selectedTemplate === template.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={!selectedTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFTemplateSelector;