
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApp, Language } from '@/contexts/AppContext';
import LanguageSelector from '@/components/settings/LanguageSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Globe, ToggleLeft, Plus, Trash2, Power, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import AddLanguageDialog from '@/components/settings/AddLanguageDialog';
import { globalLanguages } from '@/components/settings/AdvancedLanguageSelector';
import { Badge } from '@/components/ui/badge';

type LanguageStatus = {
  code: Language;
  name: string;
  enabled: boolean;
  isDefault?: boolean;
};

const LanguageManager: React.FC = () => {
  const { translate, language, setLanguage, isMultiLanguageEnabled, setMultiLanguageEnabled, currentUser, availableLanguages, setAvailableLanguages, languageNames } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user has admin privileges (super_admin or manager)
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'manager';
  
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: translate("Access denied") || "Access denied",
        description: translate("You don't have permission to manage language settings") || "You don't have permission to manage language settings",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAdmin, navigate, toast, translate]);

  const [activeTab, setActiveTab] = useState<string>('general');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddLanguageDialogOpen, setIsAddLanguageDialogOpen] = useState(false);

  // Initialize language status list using availableLanguages from context
  const [languageStatusList, setLanguageStatusList] = useState<LanguageStatus[]>(() => {
    // Create language status entries for all languages in languageNames
    return Object.entries(languageNames).map(([code, name]) => {
      const langCode = code as Language;
      return {
        code: langCode,
        name,
        enabled: availableLanguages.includes(langCode), // Set enabled based on availableLanguages
        isDefault: langCode === 'en'
      };
    });
  });

  // Effect to sync languageStatusList with availableLanguages in context
  useEffect(() => {
    // Update availableLanguages in context when languageStatusList changes
    const enabledLanguages = languageStatusList
      .filter(lang => lang.enabled)
      .map(lang => lang.code);
    
    setAvailableLanguages(enabledLanguages);
  }, [languageStatusList, setAvailableLanguages]);

  // Handle language toggle
  const handleLanguageToggle = (languageCode: Language, enabled: boolean) => {
    setLanguageStatusList(prev => 
      prev.map(lang => 
        lang.code === languageCode 
          ? { ...lang, enabled }
          : lang
      )
    );
    
    toast({
      title: translate('success') || 'Success',
      description: `${languageNames[languageCode]} ${enabled ? 
        (translate('enabled') || 'enabled') : 
        (translate('disabled') || 'disabled')}`,
    });
  };

  // Handle removing a language
  const handleRemoveLanguage = (languageCode: Language) => {
    if (languageCode === 'en') {
      toast({
        title: translate('Error') || 'Error',
        description: translate('Cannot remove English as it is the default language') || 'Cannot remove English as it is the default language',
        variant: 'destructive'
      });
      return;
    }

    if (languageCode === language) {
      // If removing the currently active language, switch to English
      setLanguage('en');
      toast({
        title: translate('Information') || 'Information',
        description: translate('Switched to English because the current language was removed') || 'Switched to English because the current language was removed',
      });
    }

    setLanguageStatusList(prev => prev.filter(lang => lang.code !== languageCode));
    
    toast({
      title: translate('success') || 'Success',
      description: `${languageNames[languageCode]} ${translate('removed from language list') || 'removed from language list'}`,
    });
  };

  // Add a new language
  const handleAddLanguage = (code: string, name: string) => {
    // Check if language already exists
    if (languageStatusList.some(lang => lang.code === code)) {
      toast({
        title: translate('Warning') || 'Warning',
        description: `${name} ${translate('is already in your language list') || 'is already in your language list'}`,
        variant: "default"
      });
      return;
    }
    
    const newLanguage: LanguageStatus = {
      code: code as Language,
      name,
      enabled: true
    };
    
    setLanguageStatusList(prev => [...prev, newLanguage]);
    
    toast({
      title: translate('success') || 'Success',
      description: `${name} ${translate('added to language list') || 'added to language list'}`,
    });
    
    setIsAddLanguageDialogOpen(false);
  };

  // Filter languages based on search query
  const filteredLanguages = languageStatusList.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Effect to update the AppContext when multi-language setting changes
  useEffect(() => {
    // This would normally make an API call to save settings to the server
    console.log("Multi-language enabled:", isMultiLanguageEnabled);
    
    // When multi-language is disabled, we could potentially set the app to use English only
    if (!isMultiLanguageEnabled) {
      // This could be enhanced to save this setting to backend or localStorage
      console.log("Language set to English only");
    }
  }, [isMultiLanguageEnabled]);

  const renderMultiLanguageToggle = () => {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{translate('Multi-language Support') || 'Multi-language Support'}</CardTitle>
              <CardDescription>{translate('Enable or disable multi-language functionality for the entire application') || 'Enable or disable multi-language functionality for the entire application'}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="multi-language-toggle" className="font-medium">
                {isMultiLanguageEnabled ? translate('Enabled') || 'Enabled' : translate('Disabled') || 'Disabled'}
              </Label>
              <Switch
                id="multi-language-toggle"
                checked={isMultiLanguageEnabled}
                onCheckedChange={(checked) => {
                  setMultiLanguageEnabled(checked);
                  toast({
                    title: translate('success') || 'Success',
                    description: checked ? 
                      (translate('Multi-language support enabled') || 'Multi-language support enabled') : 
                      (translate('Multi-language support disabled') || 'Multi-language support disabled'),
                  });
                }}
                disabled={!isAdmin}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 text-sm">
            {isMultiLanguageEnabled ? (
              <>
                <Globe size={18} className="text-green-500" />
                <span>{translate('Multiple languages are currently available to users') || 'Multiple languages are currently available to users'}</span>
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="text-gray-500" />
                <span>{translate('The application is using English only') || 'The application is using English only'}</span>
              </>
            )}
          </div>
          
          {!isMultiLanguageEnabled && (
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{translate('Note') || 'Note'}</AlertTitle>
              <AlertDescription>
                {translate('When multi-language support is disabled, the language switcher will be hidden from the header and all users will see content in English only.') || 
                'When multi-language support is disabled, the language switcher will be hidden from the header and all users will see content in English only.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLanguageManagement = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{translate('Language Management') || 'Language Management'}</CardTitle>
              <CardDescription>
                {translate('Manage available languages, enable/disable them, and add new languages') || 'Manage available languages, enable/disable them, and add new languages'}
              </CardDescription>
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsAddLanguageDialogOpen(true)}
            >
              <Plus size={16} />
              {translate('Add Language') || 'Add Language'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Language Stats */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="secondary" className="px-3 py-1.5">
                {translate('Total Languages') || 'Total Languages'}: <strong className="ml-1">{languageStatusList.length}</strong>
              </Badge>
              <Badge variant="success" className="px-3 py-1.5">
                {translate('Enabled') || 'Enabled'}: <strong className="ml-1">
                  {languageStatusList.filter(lang => lang.enabled).length}
                </strong>
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                {translate('Disabled') || 'Disabled'}: <strong className="ml-1">
                  {languageStatusList.filter(lang => !lang.enabled).length}
                </strong>
              </Badge>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
              <Search size={16} className="text-gray-500" />
              <Input
                placeholder={translate('Search languages...') || 'Search languages...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Languages Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate('Language') || 'Language'}</TableHead>
                    <TableHead>{translate('Code') || 'Code'}</TableHead>
                    <TableHead>{translate('Status') || 'Status'}</TableHead>
                    <TableHead>{translate('Default') || 'Default'}</TableHead>
                    <TableHead className="text-right">{translate('Actions') || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => (
                      <TableRow key={lang.code} className={lang.code === language ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{lang.name}</TableCell>
                        <TableCell className="text-muted-foreground uppercase">{lang.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={lang.enabled}
                              onCheckedChange={(enabled) => handleLanguageToggle(lang.code, enabled)}
                              disabled={lang.isDefault}
                            />
                            <span className={`text-sm ${lang.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                              {lang.enabled ? translate('Enabled') || 'Enabled' : translate('Disabled') || 'Disabled'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lang.isDefault && (
                            <Badge variant="secondary" className="inline-flex items-center px-2 py-1 rounded-full text-xs">
                              {translate('Default') || 'Default'}
                            </Badge>
                          )}
                          {lang.code === language && !lang.isDefault && (
                            <Badge variant="outline" className="inline-flex items-center px-2 py-1 rounded-full text-xs">
                              {translate('Current') || 'Current'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLanguage(lang.code)}
                            disabled={lang.isDefault}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {translate('No languages found') || 'No languages found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredLanguages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {translate('No languages found') || 'No languages found'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render the AddLanguageDialog component
  const renderAddLanguageDialog = () => {
    return (
      <AddLanguageDialog
        open={isAddLanguageDialogOpen}
        onClose={() => setIsAddLanguageDialogOpen(false)}
        onAddLanguage={handleAddLanguage}
        existingLanguageCodes={languageStatusList.map(lang => lang.code)}
      />
    );
  };

  return (
    <PageLayout title="Languages">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{translate('General') || 'General'}</TabsTrigger>
            <TabsTrigger value="management">{translate('Language Management') || 'Language Management'}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {renderMultiLanguageToggle()}
            
            <Card>
              <CardHeader>
                <CardTitle>{translate('Current Language Settings') || 'Current Language Settings'}</CardTitle>
                <CardDescription>
                  {translate('Test the language switching functionality') || 'Test the language switching functionality'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{translate('Current Application Language') || 'Current Application Language'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {translate('Currently displaying in') || 'Currently displaying in'}: <strong>{languageNames[language]}</strong>
                      </p>
                    </div>
                    <LanguageSelector forceShow={true} />
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{translate('Live Translation Test') || 'Live Translation Test'}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>{translate('dashboard') || 'Dashboard'}:</strong> {translate('dashboard')}</p>
                        <p><strong>{translate('settings') || 'Settings'}:</strong> {translate('settings')}</p>
                        <p><strong>{translate('search') || 'Search'}:</strong> {translate('search')}</p>
                      </div>
                      <div>
                        <p><strong>{translate('save') || 'Save'}:</strong> {translate('save')}</p>
                        <p><strong>{translate('cancel') || 'Cancel'}:</strong> {translate('cancel')}</p>
                        <p><strong>{translate('language') || 'Language'}:</strong> {translate('language')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            {renderLanguageManagement()}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Language Dialog */}
      <AddLanguageDialog
        open={isAddLanguageDialogOpen}
        onClose={() => setIsAddLanguageDialogOpen(false)}
        onAddLanguage={handleAddLanguage}
        existingLanguageCodes={languageStatusList.map(lang => lang.code)}
      />
    </PageLayout>
  );
};

export default LanguageManager;
