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

const AppLogoUpload: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploadingDark, setIsUploadingDark] = useState(false);
  const [darkImageUrl, setDarkImageUrl] = useState('');
  const [darkPreviewUrl, setDarkPreviewUrl] = useState('');
  const [storageMode, setStorageMode] = useState<'local' | 'filesystem' | 'supabase'>('supabase');
  const [brandingBucketExists, setBrandingBucketExists] = useState<boolean>(true);
  const uploadServerUrl = (import.meta.env.VITE_UPLOAD_SERVER_URL as string) || 'http://localhost:4000';
  // Optional nested path for Local Filesystem mode
  const [nestedRole, setNestedRole] = useState<string>('');
  const [nestedEntityId, setNestedEntityId] = useState<string>('');
  const [nestedSubfolder, setNestedSubfolder] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Preflight: verify branding bucket exists
        const res = await checkBucketExists('branding');
        if (mounted) setBrandingBucketExists(res.exists);
        if (!res.exists) {
          toast({
            title: 'Branding storage missing',
            description: 'Supabase bucket "branding" is not found. Create a public bucket named "branding" in Supabase Studio or via migrations.',
            variant: 'destructive'
          });
        }

        const [lightVal, darkVal] = await Promise.all([
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo_dark')
        ]);
        if (mounted) {
          if (typeof lightVal === 'string') {
            setPreviewUrl(lightVal);
            setImageUrl(lightVal);
          }
          if (typeof darkVal === 'string') {
            setDarkPreviewUrl(darkVal);
            setDarkImageUrl(darkVal);
          }
        }
      } catch (e) {
        // non-fatal
        console.warn('Logo load failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      if (storageMode === 'local') {
        // Save as Data URL to local settings (no Supabase)
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = String(reader.result || '');
          if (!dataUrl) throw new Error('Failed to read file');
          await AppSettingsHelpers.upsertSetting({
            category: SETTING_CATEGORIES.BRANDING,
            setting_key: 'company_logo',
            setting_value: dataUrl
          });
          setPreviewUrl(dataUrl);
          setImageUrl(dataUrl);
          toast({ title: 'Logo saved locally', description: 'Stored in browser settings (no Supabase)' });
        };
        reader.readAsDataURL(file);
      } else if (storageMode === 'filesystem') {
        // Save to local filesystem via upload server
        const form = new FormData();
        form.append('file', file);
        const endpoint = nestedRole && nestedEntityId
          ? `/upload/${encodeURIComponent(nestedRole)}/${encodeURIComponent(nestedEntityId)}${nestedSubfolder ? `/${encodeURIComponent(nestedSubfolder)}` : ''}`
          : `/upload/branding-logos`;
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
          setting_key: 'company_logo',
          setting_value: fileUrl
        });
        setPreviewUrl(fileUrl);
        setImageUrl(fileUrl);
        toast({ title: 'Logo uploaded', description: 'Saved to local uploads folder' });
      } else {
        if (!brandingBucketExists) {
          toast({
            title: 'Branding bucket missing',
            description: 'Create the public storage bucket "branding" and re-try.',
            variant: 'destructive'
          });
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `logos/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('branding').upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png'
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('branding').getPublicUrl(filename);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) throw new Error('Failed to obtain public URL for logo');

        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.BRANDING,
          setting_key: 'company_logo',
          setting_value: publicUrl
        });
        setPreviewUrl(publicUrl);
        setImageUrl(publicUrl);
        toast({ title: 'Logo uploaded', description: 'Logo saved to branding storage and settings' });
      }
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      if (storageMode === 'supabase') {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('bucket') || msg.includes('not found')) {
          toast({
            title: 'Branding bucket not found',
            description: 'Create the public storage bucket "branding" and re-try. You can run the Supabase migration or create it in Supabase Studio.',
            variant: 'destructive'
          });
        } else {
          toast({ title: 'Upload failed', description: err?.message || 'Could not upload logo', variant: 'destructive' });
        }
      } else if (storageMode === 'filesystem') {
        toast({ title: 'Upload failed', description: err?.message || 'Could not upload to local filesystem', variant: 'destructive' });
      } else {
        toast({ title: 'Save failed', description: err?.message || 'Could not save logo locally', variant: 'destructive' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUploadDark = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDark(true);
    try {
      if (storageMode === 'local') {
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = String(reader.result || '');
          if (!dataUrl) throw new Error('Failed to read file');
          await AppSettingsHelpers.upsertSetting({
            category: SETTING_CATEGORIES.BRANDING,
            setting_key: 'company_logo_dark',
            setting_value: dataUrl
          });
          setDarkPreviewUrl(dataUrl);
          setDarkImageUrl(dataUrl);
          toast({ title: 'Dark logo saved locally', description: 'Stored in browser settings (no Supabase)' });
        };
        reader.readAsDataURL(file);
      } else if (storageMode === 'filesystem') {
        const form = new FormData();
        form.append('file', file);
        const endpoint = nestedRole && nestedEntityId
          ? `/upload/${encodeURIComponent(nestedRole)}/${encodeURIComponent(nestedEntityId)}${nestedSubfolder ? `/${encodeURIComponent(nestedSubfolder)}` : ''}`
          : `/upload/branding-logos-dark`;
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
          setting_key: 'company_logo_dark',
          setting_value: fileUrl
        });
        setDarkPreviewUrl(fileUrl);
        setDarkImageUrl(fileUrl);
        toast({ title: 'Dark logo uploaded', description: 'Saved to local uploads folder' });
      } else {
        if (!brandingBucketExists) {
          toast({
            title: 'Branding bucket missing',
            description: 'Create the public storage bucket "branding" and re-try.',
            variant: 'destructive'
          });
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `logos/dark/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('branding').upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png'
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('branding').getPublicUrl(filename);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) throw new Error('Failed to obtain public URL for dark logo');

        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.BRANDING,
          setting_key: 'company_logo_dark',
          setting_value: publicUrl
        });
        setDarkPreviewUrl(publicUrl);
        setDarkImageUrl(publicUrl);
        toast({ title: 'Dark logo uploaded', description: 'Dark logo saved to branding storage and settings' });
      }
    } catch (err: any) {
      console.error('Dark logo upload failed:', err);
      if (storageMode === 'supabase') {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('bucket') || msg.includes('not found')) {
          toast({
            title: 'Branding bucket not found',
            description: 'Create the public storage bucket "branding" and re-try. You can run the Supabase migration or create it in Supabase Studio.',
            variant: 'destructive'
          });
        } else {
          toast({ title: 'Upload failed', description: err?.message || 'Could not upload dark logo', variant: 'destructive' });
        }
      } else if (storageMode === 'filesystem') {
        toast({ title: 'Upload failed', description: err?.message || 'Could not upload dark logo to local filesystem', variant: 'destructive' });
      } else {
        toast({ title: 'Save failed', description: err?.message || 'Could not save dark logo locally', variant: 'destructive' });
      }
    } finally {
      setIsUploadingDark(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_logo',
        setting_value: imageUrl.trim()
      });
      setPreviewUrl(imageUrl.trim());
      toast({ title: 'Logo URL saved', description: 'Logo URL stored in settings' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message || 'Could not save logo URL', variant: 'destructive' });
    }
  };

  const handleDarkUrlSubmit = async () => {
    if (!darkImageUrl.trim()) return;
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_logo_dark',
        setting_value: darkImageUrl.trim()
      });
      setDarkPreviewUrl(darkImageUrl.trim());
      toast({ title: 'Dark logo URL saved', description: 'Dark logo URL stored in settings' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message || 'Could not save dark logo URL', variant: 'destructive' });
    }
  };

  const handleRemove = async () => {
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_logo',
        setting_value: ''
      });
      setPreviewUrl('');
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Logo removed', description: 'The logo setting has been cleared' });
    } catch (err: any) {
      toast({ title: 'Remove failed', description: err?.message || 'Could not clear logo', variant: 'destructive' });
    }
  };

  const handleRemoveDark = async () => {
    try {
      await AppSettingsHelpers.upsertSetting({
        category: SETTING_CATEGORIES.BRANDING,
        setting_key: 'company_logo_dark',
        setting_value: ''
      });
      setDarkPreviewUrl('');
      setDarkImageUrl('');
      toast({ title: 'Dark logo removed', description: 'The dark logo setting has been cleared' });
    } catch (err: any) {
      toast({ title: 'Remove failed', description: err?.message || 'Could not clear dark logo', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Logo</CardTitle>
        <CardDescription>Upload or link your company/app logo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage mode toggle */}
        <div className="flex items-center gap-3">
          <Label className="text-sm">Storage Mode:</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant={storageMode === 'local' ? 'default' : 'outline'} size="sm" onClick={() => setStorageMode('local')}>Local (Browser)</Button>
            <Button type="button" variant={'outline'} size="sm" disabled title="Disabled: local server removed">Local Filesystem</Button>
            <Button type="button" variant={storageMode === 'supabase' ? 'default' : 'outline'} size="sm" onClick={() => setStorageMode('supabase')}>Supabase</Button>
          </div>
        </div>
        {/* Optional nested path inputs for Local Filesystem */}
        {storageMode === 'filesystem' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <p className="md:col-span-3 text-xs text-gray-500">When set, files upload to /upload/&lt;role&gt;/&lt;entityId&gt;/&lt;subfolder&gt; instead of default branding folders.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm">Upload File</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <div className="mt-2 text-xs text-gray-600">
                Click to upload or drag and drop (PNG, JPG, SVG)
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? (storageMode === 'local' ? 'Saving...' : 'Uploading...') : 'Select File'}
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Image URL</Label>
            <div className="flex space-x-2">
              <Input placeholder="https://example.com/logo.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <Button onClick={handleUrlSubmit} variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                Save URL
              </Button>
            </div>
            <p className="text-xs text-gray-500">Recommended: PNG/SVG, approx 200x50px</p>
          </div>
        </div>

        {/* Dark Logo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm">Upload Dark Logo</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('dark-logo-input')?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <div className="mt-2 text-xs text-gray-600">
                Click to upload or drag and drop (PNG, JPG, SVG)
              </div>
            </div>
            <input id="dark-logo-input" type="file" accept="image/*" onChange={handleFileUploadDark} className="hidden" />
            <Button variant="outline" size="sm" disabled={isUploadingDark} onClick={() => document.getElementById('dark-logo-input')?.click()}>
              {isUploadingDark ? (storageMode === 'local' ? 'Saving...' : 'Uploading...') : 'Select File'}
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Dark Logo URL</Label>
            <div className="flex space-x-2">
              <Input placeholder="https://example.com/logo-dark.png" value={darkImageUrl} onChange={(e) => setDarkImageUrl(e.target.value)} />
              <Button onClick={handleDarkUrlSubmit} variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                Save URL
              </Button>
            </div>
            <p className="text-xs text-gray-500">Recommended: PNG/SVG with lighter foreground on dark background</p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label className="text-sm">Preview</Label>
          {previewUrl ? (
            <div className="flex items-center space-x-3">
              <img src={previewUrl} alt="Logo" className="h-10 w-auto rounded border bg-white p-2" onError={() => console.log('Failed to load logo')} />
              <Button variant="outline" size="sm" onClick={handleRemove}>
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-gray-500">
              <Image className="h-6 w-6" />
              <span className="text-sm">No logo set</span>
            </div>
          )}
        </div>

        {/* Dark Preview */}
        <div className="space-y-3">
          <Label className="text-sm">Dark Logo Preview</Label>
          {darkPreviewUrl ? (
            <div className="flex items-center space-x-3">
              <img src={darkPreviewUrl} alt="Dark Logo" className="h-10 w-auto rounded border bg-gray-900 p-2" onError={() => console.log('Failed to load dark logo')} />
              <Button variant="outline" size="sm" onClick={handleRemoveDark}>
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-gray-500">
              <Image className="h-6 w-6" />
              <span className="text-sm">No dark logo set</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppLogoUpload;