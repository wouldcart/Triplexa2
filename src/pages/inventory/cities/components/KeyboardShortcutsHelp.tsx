import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  key: string;
  description: string;
  requiresSelection?: boolean;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
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
          className="flex items-center gap-2"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to quickly manage cities.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                shortcut.requiresSelection && selectedCount === 0
                  ? "opacity-50 bg-muted/50"
                  : "bg-background"
              )}
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className="font-mono text-xs px-2 py-1"
                >
                  {shortcut.key}
                </Badge>
                <span className="text-sm">{shortcut.description}</span>
              </div>
              {shortcut.requiresSelection && selectedCount === 0 && (
                <Info className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
          
          {selectedCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{selectedCount}</strong> {selectedCount === 1 ? 'city' : 'cities'} selected. 
                You can now use selection-based shortcuts.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;