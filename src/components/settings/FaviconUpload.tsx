import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Link2, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { checkBucketExists } from '@/lib/storageChecks';
import { appSettingsService, SETTING_CATEGORIES, AppSettingsService } from '@/services/appSettingsService_database';
import { AppSettingsHelpers } from '@/services/appSettingsService_database';

const FaviconUpload: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // Storage mode fixed: Supabase
  const storageMode: 'supabase' = 'supabase';
  const [brandingBucketExists, setBrandingBucketExists] = useState<boolean>(true);

  useEffect(() => {
    const loadCurrentFavicon = async () => {
      // Preflight: verify branding bucket exists
      const res = await checkBucketExists('branding');
      setBrandingBucketExists(res.exists);
      if (!res.exists) {
        toast({ title: 'Branding storage missing', description: 'Supabase bucket "branding" is not found. Create a public bucket named "branding" in Supabase Studio or via migrations.', variant: 'destructive' });
      }
      const current = await AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_favicon');
      if (typeof current === 'string') {
        setPreviewUrl(current);
        setImageUrl(current);
      }
    };
    loadCurrentFavicon();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      if (storageMode === 'supabase') {
        if (!brandingBucketExists) {
          toast({ title: 'Branding bucket missing', description: 'Create the public storage bucket "branding" and re-try.', variant: 'destructive' });
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        // Align with Supabase RLS policy for branding bucket (allows logos/* writes)
        const filename = `logos/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('branding').upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png'
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('branding').getPublicUrl(filename);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) throw new Error('Failed to obtain public URL for favicon');

        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.BRANDING,
          setting_key: 'company_favicon',
          setting_value: publicUrl
        });
        setPreviewUrl(publicUrl);
        setImageUrl(publicUrl);
        toast({ title: 'Favicon uploaded', description: 'Saved to branding storage and settings' });
      }
    } catch (err: any) {
      console.error('Favicon upload failed:', err);
      if (storageMode === 'supabase') {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('bucket') || msg.includes('not found')) {
          toast({ title: 'Branding bucket not found', description: 'Create the public storage bucket "branding" and re-try.', variant: 'destructive' });
        } else {
          toast({ title: 'Upload failed', description: err?.message || 'Could not upload favicon', variant: 'destructive' });
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_favicon',
        setting_value: imageUrl.trim()
      });
      setPreviewUrl(imageUrl.trim());
      toast({ title: 'Favicon updated', description: 'Favicon URL saved to settings' });
    } catch (err: any) {
      console.error('Favicon URL save failed:', err);
      toast({ title: 'Save failed', description: err?.message || 'Could not save favicon URL', variant: 'destructive' });
    }
  };

  const handleRemove = async () => {
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_favicon',
        setting_value: ''
      });
      setPreviewUrl('');
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Favicon removed', description: 'The favicon setting has been cleared' });
    } catch (err: any) {
      console.error('Favicon remove failed:', err);
      toast({ title: 'Remove failed', description: err?.message || 'Could not clear favicon', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favicon</CardTitle>
        <CardDescription>Upload or link your site favicon (.ico or .png)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage mode fixed: Supabase */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Label className="text-sm">Storage Mode:</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant={'default'} size="sm" disabled>Supabase (fixed)</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm">Upload File</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <div className="mt-2 text-xs text-gray-600">
                Click to upload or drag and drop (.ico, .png)
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.ico" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? 'Uploading...' : 'Select File'}
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Image URL</Label>
            <div className="flex space-x-2">
              <Input placeholder="https://example.com/favicon.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <Button onClick={handleUrlSubmit} variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                Save URL
              </Button>
            </div>
            <p className="text-xs text-gray-500">Recommended sizes: 32x32 PNG or 16x16 ICO</p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label className="text-sm">Preview</Label>
          {previewUrl ? (
            <div className="flex items-center space-x-3">
              <img src={previewUrl} alt="Favicon" className="h-8 w-8 rounded" onError={() => console.log('Failed to load favicon')} />
              <Button variant="outline" size="sm" onClick={handleRemove}>
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-gray-500">
              <Image className="h-6 w-6" />
              <span className="text-sm">No favicon set</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FaviconUpload;