
import { useState, useMemo } from 'react';
import { Query } from '@/types/query';

export interface UseQueryPaginationProps {
  queries: Query[];
  itemsPerPage?: number;
}

export const useQueryPagination = ({ queries, itemsPerPage: initialItemsPerPage = 10 }: UseQueryPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(queries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedQueries = useMemo(() => {
    return queries.slice(startIndex, endIndex);
  }, [queries, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when queries change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedQueries,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    totalItems: queries.length
  };
};
