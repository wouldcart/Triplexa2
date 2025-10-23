
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, Save } from 'lucide-react';

interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

interface SEOSettingsProps {
  seoSettings: SEOSettings;
  onSave: (settings: SEOSettings) => void;
}

const SEOSettingsComponent: React.FC<SEOSettingsProps> = ({ seoSettings, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SEOSettings>(seoSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(seoSettings);
    setHasChanges(false);
  }, [seoSettings]);

  const handleChange = (field: keyof SEOSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
    
    // Update document title immediately
    document.title = formData.title;
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', formData.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = formData.description;
      document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', formData.keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = formData.keywords;
      document.head.appendChild(meta);
    }

    toast({
      title: "SEO settings saved",
      description: "SEO configuration has been updated successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          SEO Configuration
        </CardTitle>
        <CardDescription>
          Configure search engine optimization settings for your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo-title">Page Title</Label>
          <Input
            id="seo-title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Your Application Title"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            {formData.title.length}/60 characters (optimal: 50-60)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-description">Meta Description</Label>
          <Textarea
            id="seo-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your application for search engines"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/160 characters (optimal: 150-160)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-keywords">Keywords</Label>
          <Input
            id="seo-keywords"
            value={formData.keywords}
            onChange={(e) => handleChange('keywords', e.target.value)}
            placeholder="travel, tourism, management, booking"
          />
          <p className="text-xs text-muted-foreground">
            Separate keywords with commas
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Open Graph (Social Media)</h4>
          
          <div className="space-y-2">
            <Label htmlFor="og-title">OG Title</Label>
            <Input
              id="og-title"
              value={formData.ogTitle}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
              placeholder="Title when shared on social media"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="og-description">OG Description</Label>
            <Textarea
              id="og-description"
              value={formData.ogDescription}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              placeholder="Description when shared on social media"
              rows={2}
            />
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save SEO Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SEOSettingsComponent;
