import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useApp } from '@/contexts/AppContext';
import { emailTemplateService } from '@/services/emailTemplateService';
import { EmailTemplate, EmailTemplateVariable } from '@/types/query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Send, 
  Users, 
  Mail, 
  FileText, 
  Settings as SettingsIcon,
  Play,
  Search
} from 'lucide-react';

const EmailTemplates: React.FC = () => {
  const { translate } = useApp();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [variables, setVariables] = useState<EmailTemplateVariable[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Load templates and variables on component mount
  useEffect(() => {
    loadTemplates();
    loadVariables();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await emailTemplateService.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      toast.error('Failed to load email templates');
    }
  };

  const loadVariables = () => {
    const variableList = emailTemplateService.getAvailableVariables();
    setVariables(variableList);
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await emailTemplateService.createTemplate({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        content: editingTemplate.content,
        category: editingTemplate.category || 'lead',
        role: editingTemplate.role || 'traveller',
        trigger: editingTemplate.trigger || 'Manual',
        language: editingTemplate.language || 'en',
        variables: editingTemplate.variables || [],
        isActive: editingTemplate.isActive ?? true,
        isDefault: false,
        createdBy: 'user'
      });
      
      toast.success('Email template created successfully');
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      toast.error('Failed to create email template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await emailTemplateService.updateTemplate(selectedTemplate.id, editingTemplate);
      toast.success('Email template updated successfully');
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      toast.error('Failed to update email template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await emailTemplateService.deleteTemplate(templateId);
      toast.success('Email template deleted successfully');
      loadTemplates();
    } catch (error) {
      toast.error('Cannot delete default templates');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await emailTemplateService.duplicateTemplate(templateId);
      toast.success('Email template duplicated successfully');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to duplicate email template');
    }
  };

  const handleToggleStatus = async (templateId: string) => {
    try {
      await emailTemplateService.toggleTemplateStatus(templateId);
      toast.success('Template status updated');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to update template status');
    }
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    
    // Set default values for preview variables
    const defaultValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      const variableInfo = variables.find(v => v.name === variable);
      defaultValues[variable] = variableInfo?.example || `{${variable}}`;
    });
    setPreviewVariables(defaultValues);
    setIsPreviewDialogOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      toast.error('Please provide a test email address');
      return;
    }

    try {
      setLoading(true);
      await emailTemplateService.sendTestEmail(selectedTemplate.id, testEmail, previewVariables);
      toast.success('Test email sent successfully');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const getPreview = () => {
    if (!selectedTemplate) return { subject: '', content: '' };
    return emailTemplateService.previewTemplate(selectedTemplate, previewVariables);
  };

  const openCreateDialog = () => {
    setEditingTemplate({
      name: '',
      subject: '',
      content: '',
      category: 'lead',
      role: 'traveller',
      trigger: 'Manual',
      language: 'en',
      variables: [],
      isActive: true
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate({ ...template });
    setIsEditDialogOpen(true);
  };

  const categories = ['all', 'lead', 'quotation', 'booking', 'payment', 'account'];
  const stats = emailTemplateService.getTemplateStats();

  return (
    <PageLayout title="Email Templates">
      <div className="max-w-7xl mx-auto space-y-6">
          {/* Email Templates content */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Email Templates</h2>
                <p className="text-muted-foreground">Manage automated email templates for your CRM</p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">For Travellers</p>
                <p className="text-2xl font-bold">{stats.byRole.traveller || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <SettingsIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">For Agents</p>
                <p className="text-2xl font-bold">{stats.byRole.agent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() => handleToggleStatus(template.id)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant={template.category === 'lead' ? 'default' : 'secondary'}>
                  {template.category}
                </Badge>
                <Badge variant="outline">
                  {template.role}
                </Badge>
                {template.isDefault && (
                  <Badge variant="destructive">Default</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Variables: {template.variables.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for automated communications
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={editingTemplate?.subject || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingTemplate?.category || 'lead'}
                    onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="role">Target Role</Label>
                  <Select
                    value={editingTemplate?.role || 'traveller'}
                    onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, role: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traveller">Traveller</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="trigger">Trigger Event</Label>
                <Input
                  id="trigger"
                  value={editingTemplate?.trigger || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, trigger: e.target.value }))}
                  placeholder="e.g., Lead submission"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Available Variables</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {variables.map((variable) => (
                    <div key={variable.name} className="text-xs">
                      <code className="bg-muted px-1 rounded">{`{${variable.name}}`}</code>
                      <span className="ml-2 text-muted-foreground">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={editingTemplate?.content || ''}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter email content with variables like {ClientName}, {TripName}, etc."
              rows={8}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={loading}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the email template settings and content
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-subject">Email Subject</Label>
                <Input
                  id="edit-subject"
                  value={editingTemplate?.subject || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTemplate?.category || 'lead'}
                    onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-role">Target Role</Label>
                  <Select
                    value={editingTemplate?.role || 'traveller'}
                    onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, role: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traveller">Traveller</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Available Variables</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {variables.map((variable) => (
                    <div key={variable.name} className="text-xs">
                      <code className="bg-muted px-1 rounded">{`{${variable.name}}`}</code>
                      <span className="ml-2 text-muted-foreground">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-content">Email Content</Label>
            <Textarea
              id="edit-content"
              value={editingTemplate?.content || ''}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter email content with variables"
              rows={8}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={loading}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Email Template</DialogTitle>
            <DialogDescription>
              Preview how the email will look with variable values
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="test">Send Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Variable Values</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedTemplate?.variables.map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={`var-${variable}`}>{variable}</Label>
                        <Input
                          id={`var-${variable}`}
                          value={previewVariables[variable] || ''}
                          onChange={(e) => setPreviewVariables(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                          placeholder={`Enter ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Email Preview</Label>
                  <div className="border rounded-md p-4 bg-muted/50 space-y-4">
                    <div>
                      <Label className="text-xs">Subject:</Label>
                      <p className="font-medium">{getPreview().subject}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs">Content:</Label>
                      <div className="whitespace-pre-wrap text-sm">{getPreview().content}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to send test"
                />
              </div>
              <Button onClick={handleSendTestEmail} disabled={loading || !testEmail}>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
      </div>
    </PageLayout>
  );
};

export default EmailTemplates;