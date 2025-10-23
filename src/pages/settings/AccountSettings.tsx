
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

const AccountSettings: React.FC = () => {
  const { translate } = useApp();
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: translate('success'),
      description: translate('accountSettingsSaved'),
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Heading hidden as requested */}
        
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" defaultValue="Admin User" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="admin@tripoex.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" defaultValue="********" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-image">Profile Image</Label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <span className="text-lg text-gray-600">AU</span>
                </div>
                <Button variant="outline" size="sm">Change Image</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave}>Update Account</Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AccountSettings;
