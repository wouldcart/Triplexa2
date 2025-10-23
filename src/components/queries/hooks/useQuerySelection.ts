
import { useState, useMemo, useCallback } from 'react';
import { Query } from '@/types/query';

export const useQuerySelection = (currentPageQueries: Query[], allFilteredQueries: Query[]) => {
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');

  // Check selection status
  const selectionStatus = useMemo(() => {
    const currentPageIds = currentPageQueries.map(q => q.id);
    const selectedOnPage = selectedQueries.filter(id => currentPageIds.includes(id));
    
    return {
      selectedCount: selectedQueries.length,
      selectedOnPageCount: selectedOnPage.length,
      isPageFullySelected: currentPageIds.length > 0 && selectedOnPage.length === currentPageIds.length,
      isAllSelected: selectedQueries.length === allFilteredQueries.length,
      hasSelection: selectedQueries.length > 0
    };
  }, [selectedQueries, currentPageQueries, allFilteredQueries]);

  // Handle individual query selection
  const toggleQuerySelection = useCallback((queryId: string) => {
    setSelectedQueries(prev => {
      if (prev.includes(queryId)) {
        const newSelection = prev.filter(id => id !== queryId);
        if (newSelection.length === 0) {
          setSelectAllMode('none');
        }
        return newSelection;
      } else {
        return [...prev, queryId];
      }
    });
  }, []);

  // Handle page select all
  const togglePageSelection = useCallback(() => {
    const currentPageIds = currentPageQueries.map(q => q.id);
    
    if (selectionStatus.isPageFullySelected) {
      // Deselect all on current page
      setSelectedQueries(prev => prev.filter(id => !currentPageIds.includes(id)));
      setSelectAllMode('none');
    } else {
      // Select all on current page
      setSelectedQueries(prev => {
        const newSelection = [...new Set([...prev, ...currentPageIds])];
        return newSelection;
      });
      setSelectAllMode('page');
    }
  }, [currentPageQueries, selectionStatus.isPageFullySelected]);

  // Handle select all filtered results
  const selectAllFiltered = useCallback(() => {
    const allFilteredIds = allFilteredQueries.map(q => q.id);
    setSelectedQueries(allFilteredIds);
    setSelectAllMode('all');
  }, [allFilteredQueries]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedQueries([]);
    setSelectAllMode('none');
  }, []);

  // Get selected query objects
  const selectedQueryObjects = useMemo(() => {
    return allFilteredQueries.filter(query => selectedQueries.includes(query.id));
  }, [selectedQueries, allFilteredQueries]);

  return {
    selectedQueries,
    selectionStatus,
    selectAllMode,
    toggleQuerySelection,
    togglePageSelection,
    selectAllFiltered,
    clearSelection,
    selectedQueryObjects
  };
};
