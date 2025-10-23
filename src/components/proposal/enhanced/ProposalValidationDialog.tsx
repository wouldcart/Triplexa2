import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, SkipForward } from 'lucide-react';

interface ValidationRule {
  id: string;
  label: string;
  status: 'valid' | 'warning' | 'invalid';
  message: string;
  skippable?: boolean;
  skipped?: boolean;
}

interface ProposalValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onSkipRule?: (ruleId: string) => void;
  validationRules: ValidationRule[];
  title?: string;
}

const ProposalValidationDialog: React.FC<ProposalValidationDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
  onSkipRule,
  validationRules,
  title = "Proposal Validation"
}) => {
  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const hasErrors = validationRules.some(rule => rule.status === 'invalid');
  const hasWarnings = validationRules.some(rule => rule.status === 'warning');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : hasWarnings ? (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {hasErrors 
              ? "Please fix the following issues before generating the proposal:"
              : hasWarnings 
              ? "Please review the following warnings before proceeding:"
              : "All validation checks passed successfully."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {validationRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border ${getStatusColor(rule.status)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusIcon(rule.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {rule.label}
                      {rule.skipped && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Skipped
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs mt-1 opacity-90">{rule.message}</p>
                  </div>
                </div>
                {rule.skippable && rule.status === 'warning' && !rule.skipped && onSkipRule && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSkipRule(rule.id)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onProceed}
            disabled={hasErrors}
            variant={hasErrors ? "destructive" : hasWarnings ? "secondary" : "default"}
          >
            {hasErrors ? "Fix Issues First" : "Generate Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalValidationDialog;