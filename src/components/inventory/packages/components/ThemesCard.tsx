
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { PackageComponentProps } from '../types/packageTypes';

// Package themes
const packageThemes = ["Family", "Adventure", "Luxury", "Beach", "Cultural", "Wildlife", "Honeymoon", "Business"];

const ThemesCard: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  const [themeValue, setThemeValue] = useState('');
  
  const handleThemeAdd = (theme: string) => {
    if (!theme || (packageData.themes && packageData.themes.includes(theme))) return;
    
    updatePackageData({ 
      themes: [...(packageData.themes || []), theme] 
    });
    setThemeValue('');
  };
  
  const handleThemeRemove = (theme: string) => {
    updatePackageData({ 
      themes: (packageData.themes || []).filter(t => t !== theme) 
    });
  };
  
  // Filter out themes that have already been added
  const availableThemes = packageThemes.filter(theme => 
    !(packageData.themes || []).includes(theme)
  );
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Package Themes</h3>
        
        <div className="flex space-x-2 mb-4">
          <Select value={themeValue} onValueChange={setThemeValue}>
            <SelectTrigger id="theme">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {availableThemes.length > 0 ? (
                availableThemes.map(theme => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-themes-available" disabled>
                  All themes have been added
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Button 
            type="button" 
            size="icon" 
            onClick={() => handleThemeAdd(themeValue)}
            disabled={!themeValue || (packageData.themes || []).includes(themeValue)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {(packageData.themes && packageData.themes.length > 0) ? (
          <div className="flex flex-wrap gap-2">
            {packageData.themes.map((theme, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {theme}
                <button 
                  onClick={() => handleThemeRemove(theme)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No themes selected. Themes help categorize your package.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemesCard;
