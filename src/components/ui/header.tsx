
import React, { useState, useEffect } from 'react';
import { Bell, Search, Moon, Sun, User, MapPin, Calendar, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { searchSightseeings } from '@/pages/inventory/sightseeing/services/storageService';
import { Sightseeing } from '@/types/sightseeing';
import { appSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

interface SearchResult {
  type: 'sightseeing' | 'hotel' | 'transport';
  id: number;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [siteTitle, setSiteTitle] = useState<string>('Travel Management System');
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results: SearchResult[] = [];
      
      // Search sightseeings
      const sightseeings = searchSightseeings(searchQuery);
      sightseeings.slice(0, 5).forEach((sightseeing: Sightseeing) => {
        results.push({
          type: 'sightseeing',
          id: sightseeing.id,
          title: sightseeing.name,
          subtitle: `${sightseeing.city}, ${sightseeing.country}`,
          href: `/inventory/sightseeing/edit/${sightseeing.id}`,
          icon: MapPin
        });
      });
      
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  // Load site title and favicon from App Settings (DB-backed with localStorage fallback)
  useEffect(() => {
    let mounted = true;
    const loadBranding = async () => {
      try {
        const titleVal = await appSettingsService.getSettingValue(SETTING_CATEGORIES.SEO, 'site_title');
        const favVal = await appSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_favicon');
        if (mounted) {
          if (typeof titleVal === 'string' && titleVal.trim().length > 0) {
            setSiteTitle(titleVal.trim());
          }
          if (typeof favVal === 'string' && favVal.trim().length > 0) {
            setFaviconUrl(favVal.trim());
          }
        }
      } catch (e) {
        // non-fatal
        console.warn('Header branding load failed:', e);
      }
    };
    loadBranding();
    return () => { mounted = false; };
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    window.location.href = result.href;
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow for click events
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {siteTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search sightseeings, hotels, transport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={handleSearchBlur}
                onFocus={() => searchQuery && setShowResults(true)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <result.icon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {result.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            
            {/* No Results */}
            {showResults && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No results found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-gray-600 dark:text-gray-300"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b">
                <h4 className="font-medium">Notifications</h4>
              </div>
              <DropdownMenuItem className="flex items-start space-x-3 p-3">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New sightseeing added</p>
                  <p className="text-xs text-muted-foreground">Phi Phi Island Tour in Phuket</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start space-x-3 p-3">
                <Calendar className="h-4 w-4 mt-0.5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Expiring soon</p>
                  <p className="text-xs text-muted-foreground">2 sightseeings expire within 7 days</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start space-x-3 p-3">
                <Building2 className="h-4 w-4 mt-0.5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Hotel inventory updated</p>
                  <p className="text-xs text-muted-foreground">5 new hotels added to Bangkok</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
