
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp, Language } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, RotateCcw, Languages, AlertCircle, Check, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveTranslatorProps {
  maxLength?: number;
  autoTranslate?: boolean;
}

const LiveTranslator: React.FC<LiveTranslatorProps> = ({
  maxLength = 500,
  autoTranslate = false
}) => {
  const { language, availableLanguages, languageNames } = useApp();
  const { translatedText, isLoading, error, translate, clearTranslation } = useTranslation();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<Language>(language);
  const [isAutoTranslate, setIsAutoTranslate] = useState<boolean>(autoTranslate);
  const [translationHistory, setTranslationHistory] = useState<Array<{ input: string, output: string, from: string, to: string }>>([]);
  const [activeTab, setActiveTab] = useState('translate');
  
  // Filter available languages to only include ones available in the app
  const availableLangs = Object.entries(languageNames)
    .filter(([code]) => availableLanguages.includes(code as Language))
    .map(([code, name]) => ({ code, name }));
  
  // Effect to auto-translate when input changes and auto-translate is enabled
  useEffect(() => {
    const translationDebounce = setTimeout(() => {
      if (isAutoTranslate && inputText.trim()) {
        handleTranslate();
      }
    }, 1000);
    
    return () => clearTimeout(translationDebounce);
  }, [inputText, targetLang, sourceLang, isAutoTranslate]);
  
  // Update target language when app language changes
  useEffect(() => {
    setTargetLang(language);
  }, [language]);
  
  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      setInputText(text);
    }
  };
  
  // Handle translation request
  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    await translate(inputText, targetLang, sourceLang);
  };
  
  // Save a translation to history
  const saveToHistory = () => {
    if (inputText && translatedText) {
      const newHistoryItem = {
        input: inputText,
        output: translatedText,
        from: sourceLang === 'auto' ? 'auto' : languageNames[sourceLang as Language] || sourceLang,
        to: languageNames[targetLang]
      };
      
      setTranslationHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
    }
  };
  
  // Copy translated text to clipboard
  const handleCopyToClipboard = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      toast({
        title: 'Copied to clipboard',
        description: 'The translated text has been copied to your clipboard.',
      });
    }
  };
  
  // Clear input and translation
  const handleClear = () => {
    setInputText('');
    clearTranslation();
  };
  
  // Load a history item
  const loadFromHistory = (item: { input: string, output: string, from: string, to: string }) => {
    setInputText(item.input);
    setActiveTab('translate');
    toast({
      title: 'Historical translation loaded',
      description: 'You can modify and retranslate the text.',
    });
  };
  
  // Render translation history tab
  const renderHistoryTab = () => {
    if (translationHistory.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Globe className="mx-auto h-12 w-12 opacity-20 mb-3" />
          <p>Your translation history will appear here.</p>
          <p className="text-sm mt-1">Recent translations are saved during your current session.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {translationHistory.map((item, index) => (
          <Card key={index} className="overflow-hidden hover:bg-accent/5 cursor-pointer" onClick={() => loadFromHistory(item)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                <div>
                  {item.from} → {item.to}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm">
                  <p className="line-clamp-2">{item.input}</p>
                </div>
                <div className="text-sm font-medium">
                  <p className="line-clamp-2">{item.output}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Languages className="mr-2 h-5 w-5" />
          Live Translator
        </CardTitle>
        <CardDescription>
          Translate text between languages in real-time
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="translate">Translate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="translate">
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-4">
              <div className="md:w-1/2">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="source-lang">From</Label>
                  <div className="text-xs text-muted-foreground">
                    {inputText.length}/{maxLength}
                  </div>
                </div>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger id="source-lang">
                    <SelectValue placeholder="Auto detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto detect</SelectItem>
                    {availableLangs.map(({ code, name }) => (
                      <SelectItem key={`source-${code}`} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Textarea
                    placeholder="Enter text to translate..."
                    value={inputText}
                    onChange={handleInputChange}
                    rows={5}
                    maxLength={maxLength}
                    className="resize-none"
                  />
                </div>
              </div>
              
              <div className="md:w-1/2">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="target-lang">To</Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyToClipboard}
                      disabled={!translatedText}
                    >
                      <Clipboard className="h-4 w-4" />
                      <span className="sr-only">Copy to clipboard</span>
                    </Button>
                  </div>
                </div>
                <Select value={targetLang} onValueChange={(value) => setTargetLang(value as Language)}>
                  <SelectTrigger id="target-lang">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLangs.map(({ code, name }) => (
                      <SelectItem key={`target-${code}`} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <div className={`border rounded-md p-3 min-h-[128px] ${isLoading ? 'opacity-50' : ''}`}>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse">Translating...</div>
                      </div>
                    ) : translatedText ? (
                      <p>{translatedText}</p>
                    ) : (
                      <p className="text-muted-foreground">Translation will appear here...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {translatedText && inputText && !isLoading && (
              <Alert variant="success">
                <Check className="h-4 w-4" />
                <AlertDescription>Translation completed successfully</AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-translate"
                checked={isAutoTranslate}
                onCheckedChange={setIsAutoTranslate}
              />
              <Label htmlFor="auto-translate">Auto translate</Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClear}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  saveToHistory();
                  toast({
                    title: 'Saved to history',
                    description: 'This translation has been saved to your history tab.',
                  });
                }}
                disabled={!translatedText || !inputText}
              >
                Save to History
              </Button>
              <Button onClick={handleTranslate} disabled={!inputText.trim() || isLoading}>
                {isLoading ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="history" className="px-6 py-4">
          {renderHistoryTab()}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default LiveTranslator;
