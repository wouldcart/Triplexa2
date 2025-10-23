import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Keyboard, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  key: string;
  description: string;
  requiresSelection?: boolean;
}

interface KeyboardShortcutsPopupProps {
  shortcuts: Shortcut[];
  selectedCount: number;
}

const KeyboardShortcutsPopup: React.FC<KeyboardShortcutsPopupProps> = ({
  shortcuts,
  selectedCount
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md border bg-background/50",
                  shortcut.requiresSelection && selectedCount === 0
                    ? "opacity-50"
                    : ""
                )}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-medium truncate">{shortcut.description}</p>
                  {shortcut.requiresSelection && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedCount === 0 ? 'Requires selection' : `${selectedCount} selected`}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className="font-mono text-xs shrink-0"
                >
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>
          
          {selectedCount > 0 && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>{selectedCount}</strong> {selectedCount === 1 ? 'city' : 'cities'} selected. 
                Selection-based shortcuts are active.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default KeyboardShortcutsPopup;