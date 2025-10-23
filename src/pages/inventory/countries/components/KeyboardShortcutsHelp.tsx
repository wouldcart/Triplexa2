import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, HelpCircle } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  requiresSelection?: boolean;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  selectedCount: number;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  selectedCount
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Keyboard className="w-4 h-4" />
          <HelpCircle className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to quickly perform bulk operations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                shortcut.requiresSelection && selectedCount === 0
                  ? 'bg-muted/50 opacity-60'
                  : 'bg-background'
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{shortcut.description}</p>
                {shortcut.requiresSelection && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires selection ({selectedCount} selected)
                  </p>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className="font-mono text-xs"
              >
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Shortcuts are disabled when dialogs are open or when typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;