
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { Upload, X, Image } from 'lucide-react';

interface LogoUploadProps {
  logo: string | null;
  darkLogo: string | null;
  onLogoChange: (logo: string | null, type: 'light' | 'dark') => void;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ logo, darkLogo, onLogoChange }) => {
  const { toast } = useToast();
  const { settings, updateSettings } = useApplicationSettings();
  const [dragActive, setDragActive] = useState(false);

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
    toast({
      title: "Logo size updated",
      description: `Logo size changed to ${size}`,
    });
  };

  const handleFileUpload = (file: File, type: 'light' | 'dark') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onLogoChange(result, type);
      
      // Update the settings context
      if (type === 'light') {
        updateSettings({ logo: result });
      } else {
        updateSettings({ darkLogo: result });
      }
      
      toast({
        title: "Logo uploaded",
        description: `${type === 'light' ? 'Light' : 'Dark'} logo updated successfully`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'light' | 'dark') => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleRemoveLogo = (type: 'light' | 'dark') => {
    onLogoChange(null, type);
    
    // Update the settings context
    if (type === 'light') {
      updateSettings({ logo: null });
    } else {
      updateSettings({ darkLogo: null });
    }
    
    toast({
      title: "Logo removed",
      description: `${type === 'light' ? 'Light' : 'Dark'} logo removed successfully`,
    });
  };

  const LogoSection = ({ type, currentLogo }: { type: 'light' | 'dark', currentLogo: string | null }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium capitalize">{type} Theme Logo</Label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => handleDrop(e, type)}
      >
        {currentLogo ? (
          <div className="space-y-2">
            <div className={`${getLogoSizeClasses(settings.logoSize)} mx-auto flex items-center justify-center`}>
              <img 
                src={currentLogo} 
                alt={`${type} logo`} 
                className={`${getImageSizeClasses(settings.logoSize)} object-contain rounded border`}
              />
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById(`${type}-logo-input`)?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                Change
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveLogo(type)}
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Image className="h-8 w-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              Drag & drop your logo here, or click to browse
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById(`${type}-logo-input`)?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload Logo
            </Button>
          </div>
        )}
        <Input
          id={`${type}-logo-input`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, type);
          }}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2" />
          Application Logo
        </CardTitle>
        <CardDescription>
          Upload your company logo for light and dark themes. Recommended size: 200x50px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Size Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Logo Size</Label>
          <Select value={settings.logoSize} onValueChange={handleLogoSizeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (32px)</SelectItem>
              <SelectItem value="medium">Medium (40px)</SelectItem>
              <SelectItem value="large">Large (56px)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose the size for your logo in the sidebar and throughout the application
          </p>
        </div>

        <LogoSection type="light" currentLogo={logo} />
        <LogoSection type="dark" currentLogo={darkLogo} />
      </CardContent>
    </Card>
  );
};

export default LogoUpload;
