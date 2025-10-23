import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  selectedCities: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkEdit: () => void;
  onBulkToggleStatus: () => void;
  onAddNew?: () => void;
  isDialogOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  selectedCities,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkToggleStatus,
  onAddNew,
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

      // Ctrl/Cmd + N - Add New City
      if (isCtrlOrCmd && event.key === 'n' && onAddNew) {
        event.preventDefault();
        onAddNew();
        return;
      }

      // Ctrl/Cmd + F - Focus Search
      if (isCtrlOrCmd && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

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

      // Only proceed with other shortcuts if cities are selected
      if (selectedCities.length === 0) {
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
    selectedCities,
    onSelectAll,
    onClearSelection,
    onBulkDelete,
    onBulkEdit,
    onBulkToggleStatus,
    onAddNew,
    isDialogOpen
  ]);

  // Return keyboard shortcuts info for display
  return {
    shortcuts: [
      { key: 'Ctrl/Cmd + N', description: 'Add new city' },
      { key: 'Ctrl/Cmd + F', description: 'Focus search input' },
      { key: 'Ctrl/Cmd + A', description: 'Select all cities' },
      { key: 'Escape', description: 'Clear selection' },
      { key: 'Delete', description: 'Delete selected cities', requiresSelection: true },
      { key: 'Ctrl/Cmd + E', description: 'Edit selected cities', requiresSelection: true },
      { key: 'Ctrl/Cmd + T', description: 'Toggle status of selected cities', requiresSelection: true }
    ]
  };
};