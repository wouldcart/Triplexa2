
import React from 'react';
import { useApp, Language } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, isMultiLanguageEnabled, hasLanguageAccess, translate, availableLanguages, languageNames } = useApp();
  const { toast } = useToast();
  
  // Don't render if multi-language is disabled or user doesn't have access
  if (!isMultiLanguageEnabled || !hasLanguageAccess) {
    return null;
  }
  
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    toast({
      title: translate('success'),
      description: `${translate('Language changed to') || 'Language changed to'} ${languageNames[newLanguage]}`,
    });
  };
  
  // Filter languages based on the available languages from context
  const displayLanguages = availableLanguages 
    ? Object.entries(languageNames).filter(([code]) => 
        availableLanguages.includes(code as Language)
      ) as [Language, string][]
    : (Object.entries(languageNames) as [Language, string][]);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={translate('language')}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">{translate('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {displayLanguages.map(([code, name]) => (
          <DropdownMenuItem 
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`flex items-center justify-between ${language === code ? "bg-accent text-accent-foreground" : ""}`}
          >
            <span>{name}</span>
            {language === code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
