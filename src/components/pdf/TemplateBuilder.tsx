import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Move, 
  Copy,
  Settings,
  Type,
  Image,
  Layout,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Hotel,
  Car,
  Camera,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Download
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface TemplateComponent {
  id: string;
  type: 'header' | 'day-plan' | 'hotel' | 'transport' | 'sightseeing' | 'pricing' | 'footer' | 'text' | 'image' | 'spacer';
  name: string;
  data: any;
  style: any;
  position: { x: number; y: number; width: number; height: number };
}

interface TemplateBuilderProps {
  template?: any;
  onClose: () => void;
  onSave: (template: any) => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ template, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState(template?.name || 'New Template');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [components, setComponents] = useState<TemplateComponent[]>([
    {
      id: 'header-1',
      type: 'header',
      name: 'Header Section',
      data: {
        logoUrl: '',
        companyName: '{{company.name}}',
        title: '{{proposal.title}}',
        subtitle: '{{destination.name}} Travel Proposal'
      },
      style: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: '24px',
        textAlign: 'center'
      },
      position: { x: 0, y: 0, width: 100, height: 15 }
    }
  ]);
  
  const [selectedComponent, setSelectedComponent] = useState<TemplateComponent | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [previewMode, setPreviewMode] = useState(false);

  // Component library
  const componentLibrary = [
    { type: 'header', icon: Type, name: 'Header Section', description: 'Company logo, title, and branding' },
    { type: 'day-plan', icon: Calendar, name: 'Day Plan', description: 'Daily itinerary with activities' },
    { type: 'hotel', icon: Hotel, name: 'Hotel Stay', description: 'Accommodation details and images' },
    { type: 'transport', icon: Car, name: 'Transport', description: 'Transfer and vehicle information' },
    { type: 'sightseeing', icon: Camera, name: 'Sightseeing', description: 'Activities and attractions' },
    { type: 'pricing', icon: DollarSign, name: 'Pricing Table', description: 'Cost breakdown and totals' },
    { type: 'text', icon: FileText, name: 'Text Block', description: 'Custom text content' },
    { type: 'image', icon: Image, name: 'Image Block', description: 'Photos and graphics' },
    { type: 'footer', icon: Layout, name: 'Footer', description: 'Contact info and terms' }
  ];

  const addComponent = (type: string) => {
    const newComponent: TemplateComponent = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
      data: getDefaultData(type),
      style: getDefaultStyle(type),
      position: { x: 0, y: components.length * 20, width: 100, height: 10 }
    };
    setComponents([...components, newComponent]);
  };

  const getDefaultData = (type: string) => {
    switch (type) {
      case 'header':
        return {
          logoUrl: '',
          companyName: '{{company.name}}',
          title: '{{proposal.title}}',
          subtitle: '{{destination.name}} Travel Proposal'
        };
      case 'day-plan':
        return {
          dayNumber: '{{day.number}}',
          dayTitle: '{{day.title}}',
          description: '{{day.description}}',
          activities: '{{day.activities}}',
          meals: '{{day.meals}}'
        };
      case 'hotel':
        return {
          hotelName: '{{hotel.name}}',
          starRating: '{{hotel.rating}}',
          checkIn: '{{hotel.checkin}}',
          checkOut: '{{hotel.checkout}}',
          roomType: '{{hotel.roomtype}}'
        };
      case 'pricing':
        return {
          totalPrice: '{{pricing.total}}',
          currency: '{{pricing.currency}}',
          breakdown: '{{pricing.breakdown}}'
        };
      default:
        return {};
    }
  };

  const getDefaultStyle = (type: string) => {
    return {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontSize: '14px',
      textAlign: 'left',
      padding: '16px',
      border: '1px solid #e5e7eb'
    };
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setComponents(items);
  };

  const updateComponent = (id: string, updates: Partial<TemplateComponent>) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  const handleSave = () => {
    const templateData = {
      id: template?.id || `tmpl_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      components,
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(templateData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <Input 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-semibold border-none bg-transparent p-0 h-auto"
              />
              <p className="text-sm text-muted-foreground">PDF Template Builder</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save Template
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Components & Properties */}
        <div className="w-80 border-r bg-muted/30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            {/* Components Tab */}
            <TabsContent value="components" className="h-full mt-0">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="font-semibold mb-3">Add Components</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {componentLibrary.map((comp) => (
                        <Card 
                          key={comp.type}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addComponent(comp.type)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <comp.icon className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{comp.name}</div>
                                <div className="text-xs text-muted-foreground">{comp.description}</div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Component Tree</h3>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="components">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {components.map((component, index) => (
                              <Draggable key={component.id} draggableId={component.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-2 bg-background border rounded cursor-pointer ${
                                      selectedComponent?.id === component.id ? 'border-primary' : ''
                                    }`}
                                    onClick={() => setSelectedComponent(component)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Move className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm font-medium">{component.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Duplicate component
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteComponent(component.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs mt-1">{component.type}</Badge>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="h-full mt-0">
              <ScrollArea className="h-full px-4">
                {selectedComponent ? (
                  <div className="space-y-4 py-4">
                    <h3 className="font-semibold">Design Properties</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Background Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            type="color" 
                            value={selectedComponent.style.backgroundColor}
                            onChange={(e) => updateComponent(selectedComponent.id, {
                              style: { ...selectedComponent.style, backgroundColor: e.target.value }
                            })}
                            className="w-12"
                          />
                          <Input 
                            value={selectedComponent.style.backgroundColor}
                            onChange={(e) => updateComponent(selectedComponent.id, {
                              style: { ...selectedComponent.style, backgroundColor: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Text Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            type="color" 
                            value={selectedComponent.style.textColor}
                            onChange={(e) => updateComponent(selectedComponent.id, {
                              style: { ...selectedComponent.style, textColor: e.target.value }
                            })}
                            className="w-12"
                          />
                          <Input 
                            value={selectedComponent.style.textColor}
                            onChange={(e) => updateComponent(selectedComponent.id, {
                              style: { ...selectedComponent.style, textColor: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Font Size</Label>
                        <Input 
                          value={selectedComponent.style.fontSize}
                          onChange={(e) => updateComponent(selectedComponent.id, {
                            style: { ...selectedComponent.style, fontSize: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Text Alignment</Label>
                        <div className="flex items-center gap-1 mt-1">
                          {['left', 'center', 'right'].map((align) => (
                            <Button
                              key={align}
                              size="sm"
                              variant={selectedComponent.style.textAlign === align ? 'default' : 'outline'}
                              onClick={() => updateComponent(selectedComponent.id, {
                                style: { ...selectedComponent.style, textAlign: align }
                              })}
                            >
                              {align === 'left' && <AlignLeft className="h-3 w-3" />}
                              {align === 'center' && <AlignCenter className="h-3 w-3" />}
                              {align === 'right' && <AlignRight className="h-3 w-3" />}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Padding</Label>
                        <Input 
                          value={selectedComponent.style.padding}
                          onChange={(e) => updateComponent(selectedComponent.id, {
                            style: { ...selectedComponent.style, padding: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Select a component to edit its properties
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="h-full mt-0">
              <ScrollArea className="h-full px-4">
                {selectedComponent ? (
                  <div className="space-y-4 py-4">
                    <h3 className="font-semibold">Data Properties</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(selectedComponent.data).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <Textarea
                            value={value as string}
                            onChange={(e) => updateComponent(selectedComponent.id, {
                              data: { ...selectedComponent.data, [key]: e.target.value }
                            })}
                            className="mt-1"
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use merge tags like {`{{company.name}}`} for dynamic content
                          </p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Available Merge Tags</h4>
                      <div className="space-y-1 text-xs">
                        <Badge variant="outline">{`{{company.name}}`}</Badge>
                        <Badge variant="outline">{`{{proposal.title}}`}</Badge>
                        <Badge variant="outline">{`{{destination.name}}`}</Badge>
                        <Badge variant="outline">{`{{day.number}}`}</Badge>
                        <Badge variant="outline">{`{{hotel.name}}`}</Badge>
                        <Badge variant="outline">{`{{pricing.total}}`}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Select a component to edit its data
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-50">
          <div className="p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-[800px] relative">
              {/* Template Canvas */}
              <div className="p-8">
                {previewMode ? (
                  // Preview mode - render with sample data
                  <div className="space-y-6">
                    {components.map((component) => (
                      <div
                        key={component.id}
                        style={{
                          backgroundColor: component.style.backgroundColor,
                          color: component.style.textColor,
                          fontSize: component.style.fontSize,
                          textAlign: component.style.textAlign as any,
                          padding: component.style.padding
                        }}
                        className="border rounded"
                      >
                        {/* Render component based on type */}
                        {component.type === 'header' && (
                          <div>
                            <h1 className="text-2xl font-bold">
                              {component.data.companyName?.replace(/\{\{.*?\}\}/g, 'Travel Agency')}
                            </h1>
                            <h2 className="text-xl">
                              {component.data.title?.replace(/\{\{.*?\}\}/g, 'Amazing Thailand Tour')}
                            </h2>
                            <p>{component.data.subtitle?.replace(/\{\{.*?\}\}/g, 'Thailand Travel Proposal')}</p>
                          </div>
                        )}
                        {component.type === 'day-plan' && (
                          <div>
                            <h3 className="font-bold">Day 1 - Arrival in Bangkok</h3>
                            <p>Welcome to Thailand! Transfer to hotel and explore local markets.</p>
                          </div>
                        )}
                        {/* Add more component renderings */}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Edit mode - draggable components
                  <div className="space-y-4">
                    {components.map((component) => (
                      <div
                        key={component.id}
                        onClick={() => setSelectedComponent(component)}
                        className={`p-4 border-2 rounded cursor-pointer ${
                          selectedComponent?.id === component.id 
                            ? 'border-primary border-dashed' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          backgroundColor: component.style.backgroundColor,
                          color: component.style.textColor
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{component.type}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => deleteComponent(component.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {component.name} - Click to edit
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;