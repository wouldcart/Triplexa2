
import React from 'react';
import { useApp, Language } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LanguageSelectorProps {
  label?: boolean;
  forceShow?: boolean; // New prop to force showing the selector even when multi-language is disabled
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  label = true, 
  forceShow = false 
}) => {
  const { language, setLanguage, translate, isMultiLanguageEnabled, hasLanguageAccess, languageNames } = useApp();

  // If multi-language is disabled/no access and not forced to show, don't render
  if ((!isMultiLanguageEnabled || !hasLanguageAccess) && !forceShow) {
    return null;
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="language-selector">{translate('language')}</Label>}
      <Select 
        value={language} 
        onValueChange={(value) => setLanguage(value as Language)}
        disabled={(!isMultiLanguageEnabled || !hasLanguageAccess) && !forceShow}
      >
        <SelectTrigger id="language-selector" className="w-full">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {((!isMultiLanguageEnabled || !hasLanguageAccess) && forceShow) && (
        <p className="text-xs text-muted-foreground mt-1">
          {!isMultiLanguageEnabled 
            ? "Note: Multi-language support is currently disabled in application settings" 
            : "Note: You don't have permission to change language settings"}
        </p>
      )}
    </div>
  );
};

export default LanguageSelector;
