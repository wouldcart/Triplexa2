import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  key: string;
  description: string;
  requiresSelection?: boolean;
}

interface KeyboardShortcutsDisplayProps {
  shortcuts: Shortcut[];
  selectedCount: number;
}

const KeyboardShortcutsDisplay: React.FC<KeyboardShortcutsDisplayProps> = ({
  shortcuts,
  selectedCount
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border bg-background",
                shortcut.requiresSelection && selectedCount === 0
                  ? "opacity-50"
                  : ""
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{shortcut.description}</p>
                {shortcut.requiresSelection && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCount === 0 ? 'Requires selection' : `${selectedCount} selected`}
                  </p>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className="font-mono text-xs ml-2 shrink-0"
              >
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>
        
        {selectedCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{selectedCount}</strong> {selectedCount === 1 ? 'city' : 'cities'} selected. 
              Selection-based shortcuts are now active.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeyboardShortcutsDisplay;