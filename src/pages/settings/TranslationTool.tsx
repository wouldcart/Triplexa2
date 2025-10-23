
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useApp } from '@/contexts/AppContext';
import LiveTranslator from '@/components/settings/LiveTranslator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, Globe, Book } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TranslationTool: React.FC = () => {
  const { translate, language } = useApp();
  
  return (
    <PageLayout title={translate('Translation Tool') || 'Translation Tool'}>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Languages className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{translate('Translation Tool')}</h1>
        </div>
        
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-blue-900">
            {translate('Translate text between different languages. Your recent translations will be saved in your session history.') || 
             'Translate text between different languages. Your recent translations will be saved in your session history.'}
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="translator" className="space-y-4">
          <TabsList>
            <TabsTrigger value="translator">
              <Globe className="mr-2 h-4 w-4" />
              {translate('Translator') || 'Translator'}
            </TabsTrigger>
            <TabsTrigger value="about">
              <Book className="mr-2 h-4 w-4" />
              {translate('About') || 'About'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="translator" className="space-y-4">
            <LiveTranslator />
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>{translate('About Translation Tool') || 'About Translation Tool'}</CardTitle>
                <CardDescription>
                  {translate('How the translation tool works and its limitations') || 
                   'How the translation tool works and its limitations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {translate('This translation tool uses the LibreTranslate API to provide free language translation capabilities.') || 
                   'This translation tool uses the LibreTranslate API to provide free language translation capabilities.'}
                </p>
                
                <h3 className="font-medium text-lg mt-4">
                  {translate('Features') || 'Features'}:
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>{translate('Translate text between multiple languages') || 'Translate text between multiple languages'}</li>
                  <li>{translate('Auto-detect source language') || 'Auto-detect source language'}</li>
                  <li>{translate('Automatic translation as you type') || 'Automatic translation as you type'}</li>
                  <li>{translate('Translation history tracking') || 'Translation history tracking'}</li>
                </ul>
                
                <h3 className="font-medium text-lg mt-4">
                  {translate('Limitations') || 'Limitations'}:
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    {translate('Free API has usage limitations and may occasionally fail') || 
                     'Free API has usage limitations and may occasionally fail'}
                  </li>
                  <li>
                    {translate('Some language combinations may not be available') || 
                     'Some language combinations may not be available'}
                  </li>
                  <li>
                    {translate('Translation quality may vary for complex text') || 
                     'Translation quality may vary for complex text'}
                  </li>
                </ul>
                
                <p className="mt-4 text-sm text-muted-foreground">
                  {translate('If the API translation fails, a basic translation dictionary will be used as a fallback.') || 
                   'If the API translation fails, a basic translation dictionary will be used as a fallback.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TranslationTool;
