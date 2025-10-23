import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

interface GenerationProgressDialogProps {
  isOpen: boolean;
  steps: GenerationStep[];
  currentProgress: number;
  title?: string;
}

const GenerationProgressDialog: React.FC<GenerationProgressDialogProps> = ({
  isOpen,
  steps,
  currentProgress,
  title = "Generating Proposal"
}) => {
  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-600" />;
    }
  };

  const getStepColor = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'active':
        return 'text-blue-700 font-medium';
      case 'pending':
        return 'text-gray-500';
      case 'error':
        return 'text-red-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Please wait while we generate your proposal...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                {getStepIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getStepColor(step.status)}`}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerationProgressDialog;