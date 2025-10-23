
import React from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp, Language } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

// Comprehensive list of global languages with their codes and names
export const globalLanguages: Record<string, string> = {
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'am': 'Amharic',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'as': 'Assamese',
  'az': 'Azerbaijani',
  'eu': 'Basque',
  'be': 'Belarusian',
  'bn': 'Bengali',
  'bs': 'Bosnian',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'ceb': 'Cebuano',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'co': 'Corsican',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'nl': 'Dutch',
  'en': 'English',
  'eo': 'Esperanto',
  'et': 'Estonian',
  'fi': 'Finnish',
  'fr': 'French',
  'fy': 'Frisian',
  'gl': 'Galician',
  'ka': 'Georgian',
  'de': 'German',
  'el': 'Greek',
  'gu': 'Gujarati',
  'ht': 'Haitian Creole',
  'ha': 'Hausa',
  'haw': 'Hawaiian',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hmn': 'Hmong',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'ig': 'Igbo',
  'id': 'Indonesian',
  'ga': 'Irish',
  'it': 'Italian',
  'ja': 'Japanese',
  'jv': 'Javanese',
  'kn': 'Kannada',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'ko': 'Korean',
  'ku': 'Kurdish',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'la': 'Latin',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'lb': 'Luxembourgish',
  'mk': 'Macedonian',
  'mg': 'Malagasy',
  'ms': 'Malay',
  'ml': 'Malayalam',
  'mt': 'Maltese',
  'mi': 'Maori',
  'mr': 'Marathi',
  'mn': 'Mongolian',
  'my': 'Myanmar (Burmese)',
  'ne': 'Nepali',
  'no': 'Norwegian',
  'ny': 'Nyanja (Chichewa)',
  'or': 'Odia (Oriya)',
  'ps': 'Pashto',
  'fa': 'Persian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'pa': 'Punjabi',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sm': 'Samoan',
  'gd': 'Scots Gaelic',
  'sr': 'Serbian',
  'st': 'Sesotho',
  'sn': 'Shona',
  'sd': 'Sindhi',
  'si': 'Sinhala (Sinhalese)',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'so': 'Somali',
  'es': 'Spanish',
  'su': 'Sundanese',
  'sw': 'Swahili',
  'sv': 'Swedish',
  'tl': 'Tagalog (Filipino)',
  'tg': 'Tajik',
  'ta': 'Tamil',
  'tt': 'Tatar',
  'te': 'Telugu',
  'th': 'Thai',
  'tr': 'Turkish',
  'tk': 'Turkmen',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'ug': 'Uyghur',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'cy': 'Welsh',
  'xh': 'Xhosa',
  'yi': 'Yiddish',
  'yo': 'Yoruba',
  'zu': 'Zulu'
};

interface AdvancedLanguageSelectorProps {
  selectedLanguage: string;
  onSelect: (code: string) => void;
  existingLanguageCodes?: string[];
}

const AdvancedLanguageSelector: React.FC<AdvancedLanguageSelectorProps> = ({
  selectedLanguage,
  onSelect,
  existingLanguageCodes = []
}) => {
  const { translate } = useApp();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter languages based on search query
  const filteredLanguages = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.entries(globalLanguages)
      .filter(([code, name]) => {
        // Filter out already added languages
        if (existingLanguageCodes.includes(code)) return false;
        
        // Filter by search query
        return !query || 
          name.toLowerCase().includes(query) || 
          code.toLowerCase().includes(query);
      })
      .sort((a, b) => a[1].localeCompare(b[1])); // Sort alphabetically
  }, [searchQuery, existingLanguageCodes]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={translate('Search languages...') || 'Search languages...'}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <ScrollArea className="h-[300px] border rounded-md p-2">
        {filteredLanguages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {translate('No languages found') || 'No languages found'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLanguages.map(([code, name]) => (
              <button
                key={code}
                onClick={() => onSelect(code)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md",
                  selectedLanguage === code
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2">{code}</span>
                  <span>{name}</span>
                </div>
                {selectedLanguage === code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default AdvancedLanguageSelector;
