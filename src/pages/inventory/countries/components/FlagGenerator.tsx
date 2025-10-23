import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, Download, Copy, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FlagGeneratorProps {
  onFlagUrlGenerated?: (url: string) => void;
  initialCountryCode?: string;
  initialCountryName?: string;
}

type FlagSize = 'w20' | 'w40' | 'w80' | 'w160' | 'w320' | 'w640' | 'w1280';

const FlagGenerator: React.FC<FlagGeneratorProps> = ({
  onFlagUrlGenerated,
  initialCountryCode = '',
  initialCountryName = ''
}) => {
  const { toast } = useToast();
  
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [countryName, setCountryName] = useState(initialCountryName);
  const [flagSize, setFlagSize] = useState<FlagSize>('w320');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [flagError, setFlagError] = useState(false);

  // Common country codes for quick selection
  const commonCountries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'RU', name: 'Russia' },
    { code: 'KR', name: 'South Korea' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'CH', name: 'Switzerland' }
  ];

  const flagSizeOptions = [
    { value: 'w20', label: '20px width', description: 'Very small' },
    { value: 'w40', label: '40px width', description: 'Small' },
    { value: 'w80', label: '80px width', description: 'Medium' },
    { value: 'w160', label: '160px width', description: 'Large' },
    { value: 'w320', label: '320px width', description: 'Extra Large' },
    { value: 'w640', label: '640px width', description: 'HD' },
    { value: 'w1280', label: '1280px width', description: 'Full HD' }
  ];

  // Generate flag URL using flagcdn.com API
  const generateFlagUrl = (code: string, size: FlagSize = 'w320'): string => {
    if (!code || code.length !== 2) {
      throw new Error('Valid 2-letter country code is required');
    }
    return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`;
  };

  // Convert image URL to base64 data URL for database storage
  const convertToDataUrl = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch flag: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert flag to data URL: ${error}`);
    }
  };

  // Validate country code and generate flag
  const generateDataUrl = async (): Promise<string> => {
    if (!countryCode.trim()) {
      throw new Error('Country code is required');
    }

    if (countryCode.length !== 2) {
      throw new Error('Country code must be exactly 2 letters (ISO 3166-1 alpha-2)');
    }

    const flagUrl = generateFlagUrl(countryCode, flagSize);
    return await convertToDataUrl(flagUrl);
  };

  const handleGenerate = async () => {
    if (!countryCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a country code",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setFlagError(false);
    
    try {
      const dataUrl = await generateDataUrl();
      setGeneratedUrl(dataUrl);
      
      if (onFlagUrlGenerated) {
        onFlagUrlGenerated(dataUrl);
      }
      
      toast({
        title: "Success",
        description: `Flag for ${countryCode.toUpperCase()} generated successfully!`,
      });
    } catch (error) {
      setFlagError(true);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flag",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCountrySelect = (selectedCountry: { code: string; name: string }) => {
    setCountryCode(selectedCountry.code);
    setCountryName(selectedCountry.name);
    
    // Auto-generate when country is selected
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  // Auto-generate when country code changes (if valid)
  useEffect(() => {
    if (countryCode.length === 2 && !isGenerating) {
      const timeoutId = setTimeout(() => {
        handleGenerate();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [countryCode, flagSize]);

  const handleCopyUrl = async () => {
    if (!generatedUrl) return;
    
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast({
        title: "URL Copied",
        description: "Flag URL has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFlag = () => {
    if (!generatedUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedUrl;
    link.download = `flag-${countryCode.toLowerCase()}-${flagSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Flag image download has started",
    });
  };



  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Flag Generator
        </CardTitle>
        <CardDescription>
          Generate real flag images using flagcdn.com API and get data URLs for database storage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Country Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country Code (ISO 3166-1 alpha-2)</Label>
            <Input
              id="countryCode"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              placeholder="e.g., US, GB, FR"
              maxLength={2}
              className="uppercase"
            />
            {flagError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid country code. Please use a valid 2-letter ISO code.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryName">Country Name (Optional)</Label>
            <Input
              id="countryName"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
              placeholder="e.g., United States"
            />
          </div>
        </div>

        {/* Flag Size Selection */}
        <div className="space-y-2">
          <Label>Flag Size</Label>
          <Select value={flagSize} onValueChange={(value: FlagSize) => setFlagSize(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {flagSizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Country Selection */}
        <div className="space-y-3">
          <Label>Quick Country Selection</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {commonCountries.map((country) => (
              <Button
                key={country.code}
                variant="outline"
                size="sm"
                onClick={() => handleCountrySelect(country)}
                className="text-xs justify-start"
                title={country.name}
              >
                <Flag className="h-3 w-3 mr-1" />
                {country.code}
              </Button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {generatedUrl && (
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <img 
                src={generatedUrl} 
                alt={`Flag of ${countryCode}`}
                className="max-w-xs border shadow-sm"
                style={{ aspectRatio: '3/2' }}
              />
            </div>
          </div>
        )}

        {/* Generated URL */}
        {generatedUrl && (
          <div className="space-y-2">
            <Label htmlFor="generatedUrl">Generated Flag URL</Label>
            <div className="flex gap-2">
              <Input
                id="generatedUrl"
                value={generatedUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadFlag}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              This data URL can be stored directly in your database as the flag_url field.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !countryCode.trim() || countryCode.length !== 2}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading Flag...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Generate Flag from flagcdn.com
            </>
          )}
        </Button>

        {/* Preview and Results */}
        {generatedUrl && (
          <div className="space-y-4">
            <Label>Generated Flag</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col items-center space-y-4">
                <img 
                  src={generatedUrl} 
                  alt={`Flag of ${countryName || countryCode}`}
                  className="max-w-xs border border-gray-200 rounded shadow-sm"
                />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy URL
                  </Button>
                  
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={handleDownloadFlag}
                     className="flex items-center gap-1"
                   >
                     <Download className="h-3 w-3" />
                     Download
                   </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Data URL (for database)</Label>
              <div className="p-3 bg-gray-100 rounded border text-xs font-mono break-all max-h-32 overflow-y-auto">
                {generatedUrl}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlagGenerator;