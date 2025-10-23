import { useState, useEffect, useMemo } from 'react';

export interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  icon?: string;
}

export interface UseSearchSuggestionsOptions {
  data: any[];
  searchFields: string[];
  maxSuggestions?: number;
  minQueryLength?: number;
  categories?: string[];
}

export const useSearchSuggestions = ({
  data,
  searchFields,
  maxSuggestions = 5,
  minQueryLength = 2,
  categories = []
}: UseSearchSuggestionsOptions) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = useMemo(() => {
    if (!query || query.length < minQueryLength) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const suggestionSet = new Set<string>();
    const results: SearchSuggestion[] = [];

    data.forEach((item, index) => {
      searchFields.forEach(field => {
        const fieldValue = getNestedValue(item, field);
        if (fieldValue && typeof fieldValue === 'string') {
          const value = fieldValue.toLowerCase();
          
          // Exact match
          if (value.includes(queryLower) && !suggestionSet.has(fieldValue)) {
            suggestionSet.add(fieldValue);
            results.push({
              id: `${index}-${field}`,
              text: fieldValue,
              category: categories.find(cat => field.includes(cat.toLowerCase())) || field
            });
          }
        }
      });
    });

    // Sort by relevance (exact matches first, then partial matches)
    return results
      .sort((a, b) => {
        const aExact = a.text.toLowerCase().startsWith(queryLower);
        const bExact = b.text.toLowerCase().startsWith(queryLower);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.text.length - b.text.length;
      })
      .slice(0, maxSuggestions);
  }, [data, searchFields, query, maxSuggestions, minQueryLength, categories]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [generateSuggestions]);

  const clearSuggestions = () => {
    setSuggestions([]);
    setQuery('');
  };

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSuggestions
  };
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};