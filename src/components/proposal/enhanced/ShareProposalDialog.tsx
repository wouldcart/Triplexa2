import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import { 
  Share, Copy, Mail, Link, Download, 
  CheckCircle2, ExternalLink, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string | null;
  query: Query;
}

const ShareProposalDialog: React.FC<ShareProposalDialogProps> = ({
  isOpen,
  onClose,
  proposalId,
  query
}) => {
  const { toast } = useToast();
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'pdf'>('link');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'comment' | 'edit'>('view');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const generateShareUrl = () => {
    if (!proposalId) return '';
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      id: proposalId,
      access: accessLevel,
      expires: expirationDays,
      token: Math.random().toString(36).substring(7)
    });
    return `${baseUrl}/proposal/shared?${params.toString()}`;
  };

  const handleGenerateLink = async () => {
    if (!proposalId) return;
    
    setIsSharing(true);
    try {
      // Simulate API call to generate secure share link
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const url = generateShareUrl();
      setShareUrl(url);
      
      toast({
        title: "Share Link Generated",
        description: "Your proposal share link is ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = async () => {
    if (!recipientEmail || !proposalId) return;
    
    setIsSharing(true);
    try {
      // Simulate API call to send email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Email Sent",
        description: `Proposal shared with ${recipientEmail}`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send proposal email",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handlePdfDownload = async () => {
    setIsSharing(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "PDF Generated",
        description: "Proposal PDF download started",
      });
    } catch (error) {
      toast({
        title: "PDF Failed",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const defaultMessage = `Hi,

I'm pleased to share the travel proposal for your ${query.destination.country} trip.

This proposal includes:
- ${query.tripDuration.days} days itinerary
- Accommodation and transport arrangements
- Curated activities and experiences
- Detailed pricing breakdown

Please review and let me know if you have any questions or would like to make any adjustments.

Best regards`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Proposal
          </DialogTitle>
          <DialogDescription>
            Share this proposal with clients via email or generate a shareable link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Proposal Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Proposal Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Destination:</span> {query.destination.country}</p>
              <p><span className="font-medium">Duration:</span> {query.tripDuration.days} days</p>
              <p><span className="font-medium">Travelers:</span> {query.paxDetails.adults + query.paxDetails.children} pax</p>
              {proposalId && <p><span className="font-medium">Proposal ID:</span> {proposalId}</p>}
            </div>
          </div>

          {/* Share Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Share Method</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant={shareMethod === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('link')}
                className="flex items-center gap-1"
              >
                <Link className="h-4 w-4" />
                Share Link
              </Button>
              <Button
                variant={shareMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('email')}
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant={shareMethod === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('pdf')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                PDF Export
              </Button>
            </div>
          </div>

          <Separator />

          {/* Share Options */}
          {shareMethod === 'link' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select value={accessLevel} onValueChange={(value: 'view' | 'comment' | 'edit') => setAccessLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="comment">View & Comment</SelectItem>
                      <SelectItem value="edit">View & Edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Link Expiration</Label>
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {shareUrl ? (
                <div className="space-y-2">
                  <Label>Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Link generated successfully
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleGenerateLink} 
                  disabled={isSharing || !proposalId}
                  className="w-full"
                >
                  {isSharing ? 'Generating...' : 'Generate Share Link'}
                </Button>
              )}
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={6}
                  defaultValue={defaultMessage}
                />
              </div>

              <Button 
                onClick={handleEmailShare} 
                disabled={isSharing || !recipientEmail || !proposalId}
                className="w-full"
              >
                {isSharing ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          )}

          {shareMethod === 'pdf' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">PDF Export Options</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>✓ Complete itinerary with day-by-day breakdown</p>
                  <p>✓ Accommodation and transport details</p>
                  <p>✓ Activity descriptions and pricing</p>
                  <p>✓ Professional branding and layout</p>
                </div>
              </div>

              <Button 
                onClick={handlePdfDownload} 
                disabled={isSharing || !proposalId}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isSharing ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProposalDialog;