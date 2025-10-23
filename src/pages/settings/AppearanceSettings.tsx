
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ThemeSelector from '@/components/settings/ThemeSelector';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

const AppearanceSettings: React.FC = () => {
  const { translate } = useApp();
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: translate('success'),
      description: translate('appearanceSettingsSaved'),
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">{translate('appearance')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{translate('appearance')}</CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ThemeSelector />
                
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch id="compact-mode" />
                <Label htmlFor="compact-mode">Compact Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Use less space between elements for a more compact view
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="animations" defaultChecked />
              <Label htmlFor="animations">Enable Animations</Label>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Label>Font Size</Label>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="sm" className="bg-primary/10">Medium</Button>
                <Button variant="outline" size="sm">Large</Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Label>Navigation Style</Label>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="bg-primary/10">Sidebar</Button>
                <Button variant="outline" size="sm">Top Navigation</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave}>{translate('save')}</Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AppearanceSettings;
