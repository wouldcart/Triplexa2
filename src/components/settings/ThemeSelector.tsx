
import React from 'react';
import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ThemeSelectorProps {
  label?: boolean;
  variant?: 'radio' | 'dropdown';
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ label = true, variant = 'radio' }) => {
  const { theme, setTheme } = useTheme();
  const { translate } = useApp();

  if (variant === 'dropdown') {
    return (
      <div className="space-y-2">
        {label && <Label>{translate('theme')}</Label>}
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span>{translate('light')}</span>
              </div>
            </SelectItem>
            <SelectItem value="dark" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span>{translate('dark')}</span>
              </div>
            </SelectItem>
            <SelectItem value="system" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>{translate('system')}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{translate('theme')}</Label>}
      <RadioGroup 
        value={theme} 
        onValueChange={setTheme}
        className="flex space-x-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
            <Sun className="h-4 w-4" />
            <span>{translate('light')}</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
            <Moon className="h-4 w-4" />
            <span>{translate('dark')}</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="system" id="system" />
          <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
            <Monitor className="h-4 w-4" />
            <span>{translate('system')}</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ThemeSelector;
