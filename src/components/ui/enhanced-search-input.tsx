import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchSuggestions, SearchSuggestion } from '@/hooks/useSearchSuggestions';

export interface EnhancedSearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  data?: any[];
  searchFields?: string[];
  className?: string;
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  maxSuggestions?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  placeholder = "Search...",
  value = "",
  onChange,
  onSearch,
  data = [],
  searchFields = [],
  className,
  showSuggestions = true,
  showRecentSearches = true,
  maxSuggestions = 5,
  disabled = false,
  autoFocus = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading } = useSearchSuggestions({
    data,
    searchFields,
    maxSuggestions,
    minQueryLength: 1
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setIsOpen(newValue.length > 0 && showSuggestions);
  };

  const handleSearch = (query: string = inputValue) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearch?.(query.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    onChange?.(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    onSearch?.('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.text.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showRecentSection = showRecentSearches && recentSearches.length > 0 && inputValue.length === 0;
  const showSuggestionsSection = showSuggestions && filteredSuggestions.length > 0 && inputValue.length > 0;

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-10"
              disabled={disabled}
              autoFocus={autoFocus}
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          side="bottom"
        >
          <Command>
            <CommandList>
              {!showRecentSection && !showSuggestionsSection && (
                <CommandEmpty>
                  {isLoading ? "Searching..." : "No results found."}
                </CommandEmpty>
              )}
              
              {showRecentSection && (
                <CommandGroup>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </Button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleSuggestionSelect(search)}
                      className="cursor-pointer"
                    >
                      <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                      {search}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {showSuggestionsSection && (
                <CommandGroup>
                  <div className="px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Suggestions
                    </span>
                  </div>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSuggestionSelect(suggestion.text)}
                      className="cursor-pointer"
                    >
                      <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span>{suggestion.text}</span>
                      {suggestion.category && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {suggestion.category}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};