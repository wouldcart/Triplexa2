import React, { useState, useRef } from 'react';
import { Upload, Link2, X, Image } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { toast } from 'sonner';

interface CompanyLogoUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
}

const CompanyLogoUpload: React.FC<CompanyLogoUploadProps> = ({
  currentImage,
  onImageChange,
  onImageRemove
}) => {
  const { settings, updateSettings } = useApplicationSettings();
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLogoSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'h-8 w-8';
      case 'large':
        return 'h-14 w-14';
      default:
        return 'h-10 w-10';
    }
  };

  const getImageSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'h-8 w-auto';
      case 'large':
        return 'h-14 w-auto';
      default:
        return 'h-10 w-auto';
    }
  };

  const handleLogoSizeChange = (size: 'small' | 'medium' | 'large') => {
    updateSettings({ logoSize: size });
    toast.success('Logo size updated');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onImageChange(result);
      toast.success('Logo uploaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to upload image');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setPreviewUrl(imageUrl);
    onImageChange(imageUrl);
    toast.success('Logo URL added successfully');
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setImageUrl('');
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removed');
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Company Logo</Label>
      
      {/* Logo Size Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="logo-size">Logo Size</Label>
            <Select value={settings.logoSize} onValueChange={handleLogoSizeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (32px)</SelectItem>
                <SelectItem value="medium">Medium (40px)</SelectItem>
                <SelectItem value="large">Large (56px)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the size for your logo in the sidebar
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">Image URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleUrlSubmit} variant="outline">
                    <Link2 className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter a direct link to your company logo image
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {previewUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex items-center space-x-4">
                <div className={`relative ${getLogoSizeClasses(settings.logoSize)} flex items-center justify-center flex-shrink-0`}>
                  <img
                    src={previewUrl}
                    alt="Company Logo Preview"
                    className={`${getImageSizeClasses(settings.logoSize)} object-contain rounded-lg border`}
                    onError={() => {
                      toast.error('Failed to load image. Please check the URL or file.');
                      setPreviewUrl('');
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Company logo preview</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!previewUrl && currentImage && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Current Logo</Label>
              <div className="flex items-center space-x-4">
                <div className={`relative ${getLogoSizeClasses(settings.logoSize)} flex items-center justify-center flex-shrink-0`}>
                  <img
                    src={currentImage}
                    alt="Current Company Logo"
                    className={`${getImageSizeClasses(settings.logoSize)} object-contain rounded-lg border`}
                    onError={() => {
                      console.log('Failed to load current logo');
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Current company logo</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyLogoUpload;
