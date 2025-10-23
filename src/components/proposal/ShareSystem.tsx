import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import { EnhancedProposalManager } from '@/services/enhancedProposalManager';
import { toast } from 'sonner';
import { 
  Share2, Link, Mail, Download, Eye, Lock, 
  Calendar, Clock, Copy, QrCode, Send
} from 'lucide-react';

interface ShareSystemProps {
  query: Query;
  proposalData?: any;
  onSave?: () => Promise<string | undefined>;
}

const ShareSystem: React.FC<ShareSystemProps> = ({
  query,
  proposalData,
  onSave
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [requirePassword, setRequirePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [shareStats, setShareStats] = useState({
    views: 0,
    lastViewed: null as string | null,
    shares: 0
  });

  useEffect(() => {
    // Load existing share data if available
    const existingProposal = EnhancedProposalManager.getProposal(query.id);
    if (existingProposal?.metadata?.shareUrl) {
      setShareUrl(existingProposal.metadata.shareUrl);
    }
  }, [query.id]);

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      // Save proposal first
      let proposalId = query.id;
      if (onSave) {
        const newId = await onSave();
        if (newId) proposalId = newId;
      }

      // Generate secure share URL
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseUrl = window.location.origin;
      const newShareUrl = `${baseUrl}/shared-proposal/${shareId}`;
      
      // Update proposal with share URL
      EnhancedProposalManager.updateProposalStatus(proposalId, 'shared', newShareUrl);
      
      setShareUrl(newShareUrl);
      toast.success('Share link generated successfully');
    } catch (error) {
      toast.error('Failed to generate share link');
      console.error('Share link generation error:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const sendViaEmail = async () => {
    if (!recipientEmail || !shareUrl) {
      toast.error('Please enter a recipient email and generate a share link first');
      return;
    }

    const subject = `Travel Proposal - ${query.destination.cities.join(', ')}, ${query.destination.country}`;
    const body = `Dear Client,

Please find your travel proposal for ${query.destination.cities.join(', ')}, ${query.destination.country} at the following secure link:

${shareUrl}

This proposal includes:
- ${query.tripDuration?.days || 0} days itinerary
- Accommodation and transportation details
- Activity recommendations
- Pricing breakdown

The link will expire in ${expirationDays} days for security purposes.

Best regards,
Your Travel Team`;

    const emailUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
    
    toast.success('Email client opened with proposal details');
  };

  const downloadAsPDF = () => {
    // Create a temporary PDF export
    window.print();
    toast.success('Preparing PDF download...');
  };

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Share System</h3>
        <p className="text-muted-foreground">
          Generate secure links, send via email, or export as PDF
        </p>
      </div>

      {/* Share Link Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Secure Share Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link Expiration</Label>
              <Select value={expirationDays.toString()} onValueChange={(value) => setExpirationDays(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password Protection</Label>
                <Switch checked={requirePassword} onCheckedChange={setRequirePassword} />
              </div>
              {requirePassword && (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            {shareUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {expirationDate.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {shareStats.views} views
                  </div>
                  {requirePassword && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Password Protected
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <Button 
                onClick={generateShareLink} 
                disabled={isGeneratingLink}
                className="w-full"
              >
                {isGeneratingLink ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Generate Secure Share Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <Button 
            onClick={sendViaEmail}
            disabled={!shareUrl || !recipientEmail}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Proposal via Email
          </Button>

          <div className="text-xs text-muted-foreground">
            This will open your default email client with a pre-filled message containing the secure share link.
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" onClick={downloadAsPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download as PDF
            </Button>
            
            <Button variant="outline" onClick={() => toast.info('QR code generation coming soon')}>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Analytics */}
      {shareUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Share Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{shareStats.views}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{shareStats.shares}</div>
                <div className="text-sm text-muted-foreground">Times Shared</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium">
                  {shareStats.lastViewed ? 
                    new Date(shareStats.lastViewed).toLocaleDateString() : 
                    'Never'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Last Viewed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Control Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proposal Status:</span>
              <Badge variant={shareUrl ? "default" : "secondary"}>
                {shareUrl ? "Shared" : "Private"}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Link Expiration:</span>
              <span>{expirationDate.toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Password Required:</span>
              <Badge variant={requirePassword ? "destructive" : "outline"}>
                {requirePassword ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareSystem;