import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Link2, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { appSettingsService, SETTING_CATEGORIES, AppSettingsService } from '@/services/appSettingsService_database';
import { AppSettingsHelpers } from '@/services/appSettingsService_database';

const FaviconUpload: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // Force single storage mode: local filesystem via upload server
  const storageMode: 'filesystem' = 'filesystem';
  const uploadServerUrl = (import.meta.env.VITE_UPLOAD_SERVER_URL as string) || 'http://localhost:4000';
  // Optional nested path for Local Filesystem mode
  const [nestedRole, setNestedRole] = useState<string>('');
  const [nestedEntityId, setNestedEntityId] = useState<string>('');
  const [nestedSubfolder, setNestedSubfolder] = useState<string>('');

  useEffect(() => {
    const loadCurrentFavicon = async () => {
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
      if (storageMode === 'filesystem') {
        const form = new FormData();
        form.append('file', file);
        const endpoint = nestedRole && nestedEntityId
          ? `/upload/${encodeURIComponent(nestedRole)}/${encodeURIComponent(nestedEntityId)}${nestedSubfolder ? `/${encodeURIComponent(nestedSubfolder)}` : ''}`
          : `/upload/branding-favicons`;
        const resp = await fetch(`${uploadServerUrl}${endpoint}`, {
          method: 'POST',
          body: form
        });
        if (!resp.ok) throw new Error(`Upload server error: ${resp.status}`);
        const json = await resp.json();
        const fileUrl = json?.url;
        if (!fileUrl) throw new Error('Upload server did not return URL');
        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.BRANDING,
          setting_key: 'company_favicon',
          setting_value: fileUrl
        });
        setPreviewUrl(fileUrl);
        setImageUrl(fileUrl);
        toast({ title: 'Favicon uploaded', description: 'Saved to local uploads folder' });
      }
    } catch (err: any) {
      console.error('Favicon upload failed:', err);
      if (storageMode === 'filesystem') {
        toast({ title: 'Upload failed', description: err?.message || 'Could not upload to local filesystem', variant: 'destructive' });
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
        {/* Storage mode fixed: Local Filesystem */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Label className="text-sm">Storage Mode:</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant={'default'} size="sm" disabled>Local Filesystem (fixed)</Button>
          </div>
        </div>
        {/* Optional nested path inputs for Local Filesystem */}
        {storageMode === 'filesystem' && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Role</Label>
              <Input placeholder="e.g., agents" value={nestedRole} onChange={(e) => setNestedRole(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Entity ID</Label>
              <Input placeholder="e.g., agent123" value={nestedEntityId} onChange={(e) => setNestedEntityId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Subfolder</Label>
              <Input placeholder="e.g., logo" value={nestedSubfolder} onChange={(e) => setNestedSubfolder(e.target.value)} />
            </div>
            <p className="md:col-span-3 text-xs text-gray-500 mt-1">When set, files upload to /upload/&lt;role&gt;/&lt;entityId&gt;/&lt;subfolder&gt; instead of default branding folders.</p>
          </div>
        )}
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
              {isUploading ? (storageMode === 'local' ? 'Saving...' : 'Uploading...') : 'Select File'}
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