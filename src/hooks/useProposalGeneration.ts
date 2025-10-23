import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface UseProposalGenerationProps {
  generateProposal: () => Promise<string>;
}

export const useProposalGeneration = ({ generateProposal }: UseProposalGenerationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    {
      id: 'validation',
      label: 'Validating proposal data',
      status: 'pending',
      description: 'Checking itinerary completeness and data integrity'
    },
    {
      id: 'processing',
      label: 'Processing itinerary',
      status: 'pending',
      description: 'Converting activities and calculating costs'
    },
    {
      id: 'formatting',
      label: 'Formatting proposal',
      status: 'pending',
      description: 'Creating proposal document structure'
    },
    {
      id: 'saving',
      label: 'Saving proposal',
      status: 'pending',
      description: 'Storing proposal data and generating ID'
    },
    {
      id: 'finalizing',
      label: 'Finalizing',
      status: 'pending',
      description: 'Completing proposal generation'
    }
  ]);

  const updateStepStatus = useCallback((stepId: string, status: GenerationStep['status']) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  const simulateProgressSteps = useCallback(async () => {
    const steps = ['validation', 'processing', 'formatting', 'saving', 'finalizing'];
    const totalSteps = steps.length;
    
    for (let i = 0; i < steps.length; i++) {
      const stepId = steps[i];
      
      // Mark current step as active
      updateStepStatus(stepId, 'active');
      setCurrentProgress((i / totalSteps) * 80); // 80% of progress for steps
      
      // Simulate step duration
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      // Mark step as completed
      updateStepStatus(stepId, 'completed');
    }
    
    setCurrentProgress(100);
  }, [updateStepStatus]);

  const handleGenerateWithProgress = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setCurrentProgress(0);
    
    // Reset all steps to pending
    setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    
    try {
      // Start progress simulation
      const progressPromise = simulateProgressSteps();
      
      // Actually generate the proposal
      const proposalId = await generateProposal();
      
      // Wait for progress to complete
      await progressPromise;
      
      // Small delay for final step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Proposal Generated Successfully",
        description: "Your proposal has been created and is ready to view",
      });
      
      // Navigate to proposal
      navigate(`/proposals/${proposalId}`);
      
    } catch (error) {
      console.error('Error generating proposal:', error);
      
      // Mark current active step as error
      setGenerationSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error' } : step
      ));
      
      toast({
        title: "Generation Failed",
        description: "There was an error generating your proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, generateProposal, simulateProgressSteps, navigate, toast]);

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setCurrentProgress(0);
    setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
  }, []);

  return {
    isGenerating,
    currentProgress,
    generationSteps,
    handleGenerateWithProgress,
    resetGeneration
  };
};