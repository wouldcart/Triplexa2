import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdvancedLanguageSelector from './AdvancedLanguageSelector';
import { useApp, Language } from '@/contexts/AppContext';
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { globalLanguages } from './AdvancedLanguageSelector';

interface AddLanguageDialogProps {
  open: boolean;
  onClose: () => void;
  onAddLanguage: (code: string, name: string) => void;
  existingLanguageCodes: string[];
}

const languageSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(5, "Code must not exceed 5 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must not exceed 50 characters"),
});

const AddLanguageDialog: React.FC<AddLanguageDialogProps> = ({
  open,
  onClose,
  onAddLanguage,
  existingLanguageCodes
}) => {
  const { translate } = useApp();
  const { toast } = useToast();
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("search");
  const [recentlyUsedLanguages, setRecentlyUsedLanguages] = useState<Array<{code: string; name: string}>>(() => {
    const stored = localStorage.getItem('recently-used-languages');
    return stored ? JSON.parse(stored) : [
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' }
    ];
  });
  const [popularLanguages] = useState<Array<{code: string; name: string}>>([
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'pt', name: 'Portuguese' }
  ].filter(lang => !existingLanguageCodes.includes(lang.code)));
  
  useEffect(() => {
    localStorage.setItem('recently-used-languages', JSON.stringify(recentlyUsedLanguages));
  }, [recentlyUsedLanguages]);
  
  const form = useForm<z.infer<typeof languageSchema>>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      code: "",
      name: ""
    },
  });

  // Update form values when a language is selected from the advanced selector
  const handleLanguageSelect = (code: string) => {
    setSelectedLanguageCode(code);
    
    form.setValue("code", code);
    form.setValue("name", globalLanguages[code] || "");
    
    // Reset form errors
    form.clearErrors();
  };

  const handleQuickAdd = (code: string, name: string) => {
    if (existingLanguageCodes.includes(code)) {
      toast({
        title: translate("Already added") || "Already added",
        description: `${name} ${translate("is already in your language list") || "is already in your language list"}`,
        variant: "destructive"
      });
      return;
    }

    // Add the language
    onAddLanguage(code, name);
    
    // Update recently used
    const newRecentlyUsed = [
      { code, name },
      ...recentlyUsedLanguages.filter(lang => lang.code !== code).slice(0, 4)
    ];
    setRecentlyUsedLanguages(newRecentlyUsed);
    
    // Reset the form
    form.reset();
    setSelectedLanguageCode("");
  };

  const onSubmit = (values: z.infer<typeof languageSchema>) => {
    // Check if language code already exists
    if (existingLanguageCodes.includes(values.code)) {
      form.setError("code", { 
        message: translate("This language code already exists") || "This language code already exists"
      });
      return;
    }

    // Add the new language
    onAddLanguage(values.code, values.name);
    
    // Update recently used languages
    const newRecentlyUsed = [
      { code: values.code, name: values.name },
      ...recentlyUsedLanguages.filter(lang => lang.code !== values.code).slice(0, 4)
    ];
    setRecentlyUsedLanguages(newRecentlyUsed);
    
    // Show success toast
    toast({
      title: translate("Language Added") || "Language Added",
      description: `${values.name} ${translate("has been added successfully") || "has been added successfully"}`,
    });
    
    // Reset form and close dialog
    form.reset();
    setSelectedLanguageCode("");
    onClose();
  };

  const renderQuickAddSection = (languages: Array<{code: string; name: string}>, title: string, emptyMessage: string) => {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{translate(title) || title}</h3>
        <div className="flex flex-wrap gap-2">
          {languages.length > 0 ? (
            languages.map(({ code, name }) => (
              <Badge 
                key={code} 
                className="px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 hover:bg-primary"
                onClick={() => handleQuickAdd(code, name)}
              >
                <span>{name}</span>
                <span className="text-xs opacity-70">({code})</span>
                <Plus className="h-3.5 w-3.5 ml-1" />
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{translate(emptyMessage) || emptyMessage}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{translate("Add New Language") || "Add New Language"}</DialogTitle>
          <DialogDescription>
            {translate("Add a new language to your translation dictionary") || "Add a new language to your translation dictionary"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="quick">{translate("Quick Add") || "Quick Add"}</TabsTrigger>
            <TabsTrigger value="search">{translate("Browse Languages") || "Browse Languages"}</TabsTrigger>
            <TabsTrigger value="custom">{translate("Custom Language") || "Custom Language"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-6">
            {renderQuickAddSection(
              popularLanguages.slice(0, 8), 
              "Popular Languages", 
              "All popular languages have been added"
            )}
            
            {renderQuickAddSection(
              recentlyUsedLanguages.filter(lang => !existingLanguageCodes.includes(lang.code)),
              "Recently Used",
              "No recently used languages available"
            )}
          </TabsContent>
          
          <TabsContent value="search">
            <div className="space-y-4">
              <AdvancedLanguageSelector
                selectedLanguage={selectedLanguageCode}
                onSelect={handleLanguageSelect}
                existingLanguageCodes={existingLanguageCodes}
              />
              
              {selectedLanguageCode && (
                <Alert variant="success" className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {translate("Selected language") || "Selected language"}: <strong>{globalLanguages[selectedLanguageCode]}</strong> ({selectedLanguageCode})
                  </AlertDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={() => handleQuickAdd(selectedLanguageCode, globalLanguages[selectedLanguageCode])}
                  >
                    {translate("Add Language") || "Add Language"}
                  </Button>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="custom">
            <div className="bg-muted p-4 rounded-md space-y-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <p className="text-sm text-muted-foreground">{translate("Use this for adding custom language codes not available in the standard list") || "Use this for adding custom language codes not available in the standard list"}</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translate("Language Code") || "Language Code"}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., fr, es, de"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translate("Language Name") || "Language Name"}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., French, Spanish, German"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                      {translate("Cancel") || "Cancel"}
                    </Button>
                    <Button type="submit" disabled={!form.formState.isValid}>
                      {translate("Add Language") || "Add Language"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddLanguageDialog;
