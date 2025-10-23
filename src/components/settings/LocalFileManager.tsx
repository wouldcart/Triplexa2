import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, FileText, Image as ImageIcon, RefreshCcw, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CategoryKey = 'branding-logos' | 'images' | 'pdfs' | 'documents';

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  'branding-logos': 'Logos',
  'images': 'Images',
  'pdfs': 'PDFs',
  'documents': 'Documents'
};

type ListedFile = { filename: string; url: string };

const LocalFileManager: React.FC = () => {
  const { toast } = useToast();
  const uploadServerUrl = (import.meta.env.VITE_UPLOAD_SERVER_URL as string) || 'http://localhost:4000';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CategoryKey>('branding-logos');
  const [files, setFiles] = useState<ListedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');

  const fetchFiles = async (selected?: CategoryKey) => {
    const cat = selected || category;
    setIsLoading(true);
    try {
      const resp = await fetch(`${uploadServerUrl}/files/${encodeURIComponent(cat)}`);
      if (!resp.ok) throw new Error(`List error: ${resp.status}`);
      const json = await resp.json();
      setFiles(Array.isArray(json?.files) ? json.files : []);
    } catch (err: any) {
      console.error('Failed to list files:', err);
      toast({ title: 'Failed to list files', description: err?.message || 'Could not list files in folder', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = `/upload/${encodeURIComponent(category)}`;
      const resp = await fetch(`${uploadServerUrl}${endpoint}`, { method: 'POST', body: form });
      if (!resp.ok) throw new Error(`Upload error: ${resp.status}`);
      await resp.json();
      toast({ title: 'Uploaded', description: 'File stored in local uploads folder' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFiles();
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast({ title: 'Upload failed', description: err?.message || 'Could not upload file', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const resp = await fetch(`${uploadServerUrl}/files/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`Delete error: ${resp.status}`);
      toast({ title: 'Deleted', description: 'File removed from local folder' });
      fetchFiles();
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete file', variant: 'destructive' });
    }
  };

  const isImage = (name: string) => /\.(png|jpe?g|gif|svg|webp)$/i.test(name);
  const isPdf = (name: string) => /\.(pdf)$/i.test(name);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Local File Manager</CardTitle>
        <CardDescription>Upload and manage files in the local folder under <code>/public/upload</code></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-sm">Folder</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as CategoryKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_LABELS).map((key) => (
                  <SelectItem key={key} value={key}>{CATEGORY_LABELS[key as CategoryKey]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Upload File</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" />
                {isUploading ? 'Uploading...' : 'Choose file'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => fetchFiles()} disabled={isLoading}>
                <RefreshCcw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
            </div>
            <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Link a URL</Label>
            <div className="flex items-center gap-2">
              <Input placeholder="https://example.com/file.pdf" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => {
                if (!linkUrl) return;
                toast({ title: 'URL noted', description: 'Use this as a reference; local manager stores uploaded files.' });
              }}>
                <Link2 className="h-4 w-4 mr-1.5" />
                Save URL
              </Button>
            </div>
          </div>
        </div>

        {/* Files list */}
        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map(({ filename, url }) => (
              <div key={filename} className="border rounded-md p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" title={filename}>{filename}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(filename)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  {isImage(filename) ? (
                    <img src={url} alt={filename} className="h-32 w-full object-contain bg-muted rounded" />
                  ) : isPdf(filename) ? (
                    <div className="h-32 w-full flex items-center justify-center bg-muted rounded">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  ) : (
                    <div className="h-32 w-full flex items-center justify-center bg-muted rounded">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </a>
                <div className="flex items-center justify-between">
                  <a className="text-xs text-blue-600 hover:underline truncate" href={url} target="_blank" rel="noreferrer">{url}</a>
                </div>
              </div>
            ))}
          </div>
          {files.length === 0 && (
            <div className="text-sm text-muted-foreground py-6">No files in this folder yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalFileManager;