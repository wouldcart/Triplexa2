
import { useState, useEffect } from 'react';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import ProposalTemplateService from '@/services/proposalTemplateService';

interface TemplateStats {
  total: number;
  active: number;
  inactive: number;
  mostUsed: number;
  avgRating: number;
}

export const useTemplateData = () => {
  const [templates, setTemplates] = useState<EnhancedProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TemplateStats>({
    total: 0,
    active: 0,
    inactive: 0,
    mostUsed: 0,
    avgRating: 0
  });

  const templateService = ProposalTemplateService.getInstance();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = templateService.getAllTemplates();
      setTemplates(allTemplates);
      
      // Calculate stats
      const activeTemplates = allTemplates.filter(t => t.metadata.isActive);
      const inactiveTemplates = allTemplates.filter(t => !t.metadata.isActive);
      const mostUsed = Math.max(...allTemplates.map(t => t.metadata.usageCount), 0);
      const avgRating = allTemplates.length > 0 
        ? allTemplates.reduce((sum, t) => sum + t.metadata.averageRating, 0) / allTemplates.length
        : 0;

      setStats({
        total: allTemplates.length,
        active: activeTemplates.length,
        inactive: inactiveTemplates.length,
        mostUsed,
        avgRating
      });
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    // Implementation would depend on service capabilities
    console.log('Delete template:', templateId);
    await loadTemplates(); // Refresh after delete
  };

  const duplicateTemplate = async (templateId: string) => {
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
      
      templateService.saveTemplate(duplicated);
      await loadTemplates();
    }
  };

  const toggleTemplateStatus = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      template.metadata.isActive = !template.metadata.isActive;
      templateService.saveTemplate(template);
      await loadTemplates();
    }
  };

  const refreshTemplates = () => {
    loadTemplates();
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    stats,
    refreshTemplates,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateStatus
  };
};
