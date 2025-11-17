
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';
import { Query } from '@/types/query';
import ProposalTemplateService, { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import { useToast } from '@/hooks/use-toast';

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalDays: ProposalDay[];
  query: Query;
}

export const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
  isOpen,
  onClose,
  proposalDays,
  query
}) => {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EnhancedProposalTemplate['category']>('Standard');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const templateService = ProposalTemplateService.getInstance();
      const templateId = templateService.saveProposalAsTemplate(
        proposalDays,
        query,
        templateName.trim(),
        category
      );

      // Update with additional details
      if (description || tags) {
        const template = templateService.getAllTemplates().find(t => t.id === templateId);
        if (template) {
          template.description = description || template.description;
          if (tags) {
            const tagList = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            template.metadata.tags = [...new Set([...template.metadata.tags, ...tagList])];
          }
          templateService.saveTemplate(template);
        }
      }

      toast({
        title: "Template saved successfully",
        description: `"${templateName}" has been saved and can be reused for future proposals`,
      });

      // Reset form
      setTemplateName('');
      setDescription('');
      setCategory('Standard');
      setTags('');
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error saving template",
        description: "Failed to save template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const totalCost = proposalDays.reduce((sum, day) => sum + day.totalCost, 0);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this proposal as a template for future use with similar client requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">Template Preview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Destination:</span>
                <span className="ml-2">{query.destination.country}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2">{proposalDays.length} Days</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cities:</span>
                <span className="ml-2">{query.destination.cities.join(', ')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Base Cost:</span>
                <span className="ml-2">${totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-muted-foreground text-sm">Day Plan:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {proposalDays.map((day) => (
                  <Badge key={day.id} variant="outline" className="text-xs">
                    Day {day.dayNumber}: {day.city}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Template Details Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Thailand Beach Adventure - 4D/3N"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Budget">Budget</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what makes this template special..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., beach, adventure, family-friendly, honeymoon"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tags help categorize and find templates easier
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
