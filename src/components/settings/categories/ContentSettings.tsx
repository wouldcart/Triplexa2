import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, RefreshCw, Clock } from 'lucide-react';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { AppSettingsHelpers } from '@/services/appSettingsService_database';

interface ContentSettingsState {
  terms_last_updated: string; // ISO string
  privacy_last_updated: string; // ISO string
}

// Helpers to translate ISO <-> input[type="date"] value
const isoToDateInput = (iso: string): string => {
  try {
    if (!iso) return '';
    // Expect ISO like 2024-05-08T00:00:00.000Z
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const dateInputToISO = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  // Store as UTC midnight to keep consistent format
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return d.toISOString();
};

export const ContentSettings: React.FC = () => {
  const [settings, setSettings] = useState<ContentSettingsState>({
    terms_last_updated: '',
    privacy_last_updated: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal] = useState<ContentSettingsState>({ terms_last_updated: '', privacy_last_updated: '' });
  const { toast } = useToast();

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Ensure defaults exist to avoid empty UI on first load
      const defaultISO = new Date().toISOString();
      await AppSettingsHelpers.ensureSettingValue(SETTING_CATEGORIES.CONTENT, 'terms_last_updated', defaultISO);
      await AppSettingsHelpers.ensureSettingValue(SETTING_CATEGORIES.CONTENT, 'privacy_last_updated', defaultISO);

      const res = await AppSettingsService.getSettingsByCategory(SETTING_CATEGORIES.CONTENT);
      if (res.success && res.data) {
        const map = res.data.reduce((acc, s) => {
          acc[s.setting_key] = (s.setting_value || '') as string;
          return acc;
        }, {} as Record<string, string>);

        const loaded: ContentSettingsState = {
          terms_last_updated: map['terms_last_updated'] || defaultISO,
          privacy_last_updated: map['privacy_last_updated'] || defaultISO,
        };
        setSettings(loaded);
        setOriginal(loaded);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Error loading content settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to load content settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleDateChange = (key: keyof ContentSettingsState, dateStr: string) => {
    const iso = dateInputToISO(dateStr);
    const next = { ...settings, [key]: iso };
    setSettings(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(original));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.CONTENT,
        setting_key: 'terms_last_updated',
        setting_value: settings.terms_last_updated,
        description: 'Last updated date for Terms of Service (ISO)'
      });
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.CONTENT,
        setting_key: 'privacy_last_updated',
        setting_value: settings.privacy_last_updated,
        description: 'Last updated date for Privacy Policy (ISO)'
      });

      setOriginal(settings);
      setHasChanges(false);
      toast({ title: 'Saved', description: 'Content settings saved successfully' });
    } catch (err) {
      console.error('Error saving content settings:', err);
      toast({ title: 'Error', description: 'Failed to save content settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading content settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Content Settings</h2>
          <Badge variant="secondary">Legal Pages</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Terms & Privacy Last Updated */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Legal Page Dates</CardTitle>
          </div>
          <CardDescription>Manage "Last updated" dates for public legal pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="terms_last_updated">Terms of Service — Last Updated</Label>
              <Input
                id="terms_last_updated"
                type="date"
                value={isoToDateInput(settings.terms_last_updated)}
                onChange={(e) => handleDateChange('terms_last_updated', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stored as ISO UTC in settings: <code>terms_last_updated</code>
              </p>
            </div>

            <div>
              <Label htmlFor="privacy_last_updated">Privacy Policy — Last Updated</Label>
              <Input
                id="privacy_last_updated"
                type="date"
                value={isoToDateInput(settings.privacy_last_updated)}
                onChange={(e) => handleDateChange('privacy_last_updated', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stored as ISO UTC in settings: <code>privacy_last_updated</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentSettings;