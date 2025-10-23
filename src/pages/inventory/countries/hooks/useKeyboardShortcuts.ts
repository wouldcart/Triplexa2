import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  selectedCountries: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkEdit: () => void;
  onBulkToggleStatus: () => void;
  isDialogOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  selectedCountries,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkToggleStatus,
  isDialogOpen = false
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when dialogs are open or when typing in inputs
      if (
        isDialogOpen ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd + A - Select All
      if (isCtrlOrCmd && event.key === 'a') {
        event.preventDefault();
        onSelectAll();
        return;
      }

      // Escape - Clear Selection
      if (event.key === 'Escape') {
        event.preventDefault();
        onClearSelection();
        return;
      }

      // Only proceed with other shortcuts if countries are selected
      if (selectedCountries.length === 0) {
        return;
      }

      // Ctrl/Cmd + E - Bulk Edit
      if (isCtrlOrCmd && event.key === 'e') {
        event.preventDefault();
        onBulkEdit();
        return;
      }

      // Delete - Bulk Delete
      if (event.key === 'Delete') {
        event.preventDefault();
        onBulkDelete();
        return;
      }

      // Ctrl/Cmd + T - Bulk Toggle Status
      if (isCtrlOrCmd && event.key === 't') {
        event.preventDefault();
        onBulkToggleStatus();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedCountries,
    onSelectAll,
    onClearSelection,
    onBulkDelete,
    onBulkEdit,
    onBulkToggleStatus,
    isDialogOpen
  ]);

  // Return keyboard shortcuts info for display
  return {
    shortcuts: [
      { key: 'Ctrl/Cmd + A', description: 'Select all countries' },
      { key: 'Escape', description: 'Clear selection', requiresSelection: true },
      { key: 'Delete', description: 'Delete selected countries', requiresSelection: true },
      { key: 'Ctrl/Cmd + E', description: 'Edit selected countries', requiresSelection: true },
      { key: 'Ctrl/Cmd + T', description: 'Toggle status of selected countries', requiresSelection: true }
    ]
  };
};