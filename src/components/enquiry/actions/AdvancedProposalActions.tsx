import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Send, 
  Mail, 
  MessageSquare,
  Copy,
  Download,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  DollarSign,
  Users
} from 'lucide-react';
import { Query } from '@/types/query';
import { useAgentData } from '@/hooks/useAgentData';
import { toast } from 'sonner';
import ProposalPreview from './ProposalPreview';
import GenerateProposalDialog from './GenerateProposalDialog';

interface AdvancedProposalActionsProps {
  query: Query;
  proposalData: any;
  onStatusUpdate: (status: 'draft' | 'ready' | 'sent') => void;
}

interface PreviewOptions {
  showBreakup: boolean;
  separateAdultChild: boolean;
  includeAccommodationOptions: boolean;
  selectedAccommodationOption: string;
  communicationMethod: 'email' | 'whatsapp';
  includeTerms: boolean;
}

interface AgentContactDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  additionalNotes: string;
}

const AdvancedProposalActions: React.FC<AdvancedProposalActionsProps> = ({
  query,
  proposalData,
  onStatusUpdate
}) => {
  const { getAgentById } = useAgentData();
  const [showAdvancedPreview, setShowAdvancedPreview] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);
  
  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({
    showBreakup: true,
    separateAdultChild: true,
    includeAccommodationOptions: true,
    selectedAccommodationOption: 'all',
    communicationMethod: 'email',
    includeTerms: true
  });

  const [agentDetails, setAgentDetails] = useState<AgentContactDetails>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    additionalNotes: ''
  });

  useEffect(() => {
    loadAgentData();
  }, [query.agentId]);

  const loadAgentData = () => {
    const agent = getAgentById(query.agentId);
    
    if (agent) {
      setAgentDetails({
        name: agent.name || query.agentName,
        email: agent.email || '',
        phone: agent.contact?.phone || '',
        company: agent.type === 'company' ? agent.name : '',
        address: agent.city || '',
        additionalNotes: ''
      });
    } else if (query.agentName) {
      setAgentDetails({
        name: query.agentName,
        email: '',
        phone: '',
        company: '',
        address: '',
        additionalNotes: `Agent ID: ${query.agentId} from enquiry ${query.id}`
      });
    }
    
    try {
      const savedDetails = localStorage.getItem(`agent_contact_${query.agentId}`);
      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);
        setAgentDetails(prev => ({
          ...prev,
          ...parsed,
          name: query.agentName || prev.name
        }));
      }
    } catch (error) {
      console.error('Error loading saved agent contact details:', error);
    }
  };

  const validateProposal = () => {
    const errors = [];
    
    if (!proposalData.pricing) {
      errors.push('Pricing not configured');
    }
    
    if (!proposalData.terms) {
      errors.push('Terms & conditions not set');
    }
    
    if (!agentDetails.email && previewOptions.communicationMethod === 'email') {
      errors.push('Agent email not provided for email communication');
    }
    
    if (!agentDetails.phone && previewOptions.communicationMethod === 'whatsapp') {
      errors.push('Agent phone not provided for WhatsApp communication');
    }
    
    return errors;
  };

  const generateProposalContent = () => {
    return {
      query,
      pricing: proposalData.pricing,
      terms: proposalData.terms,
      options: previewOptions,
      agentDetails,
      generatedAt: new Date().toISOString()
    };
  };

  const handleSendProposal = async () => {
    const errors = validateProposal();
    
    if (errors.length > 0) {
      toast.error(`Please fix: ${errors.join(', ')}`);
      return;
    }
    
    setSendingProposal(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sendHistory = {
        sentAt: new Date().toISOString(),
        method: previewOptions.communicationMethod,
        sentTo: previewOptions.communicationMethod === 'email' ? agentDetails.email : agentDetails.phone,
        agentDetails,
        proposalData,
        previewOptions
      };
      
      localStorage.setItem(`proposal_send_${query.id}`, JSON.stringify(sendHistory));
      onStatusUpdate('sent');
      
      toast.success(`Proposal sent via ${previewOptions.communicationMethod}`);
    } catch (error) {
      toast.error('Failed to send proposal');
      console.error('Send proposal error:', error);
    } finally {
      setSendingProposal(false);
    }
  };

  const handleCopyProposal = () => {
    const content = generateProposalContent();
    const text = `
TRAVEL PROPOSAL - ${query.id}

Destination: ${query.destination.cities.join(', ')}, ${query.destination.country}
Duration: ${query.tripDuration.days} days / ${query.tripDuration.nights} nights
Travelers: ${query.paxDetails.adults} adults, ${query.paxDetails.children} children

${previewOptions.showBreakup ? `
PRICING BREAKDOWN:
${previewOptions.separateAdultChild ? 
  `Adult Cost: ${proposalData.pricing?.currency} ${(proposalData.pricing?.adultPrice || 0).toLocaleString()}
Child Cost: ${proposalData.pricing?.currency} ${(proposalData.pricing?.childPrice || 0).toLocaleString()}` :
  `Total Cost: ${proposalData.pricing?.currency} ${(proposalData.pricing?.finalPrice || 0).toLocaleString()}`
}
` : `
TOTAL COST: ${proposalData.pricing?.currency} ${(proposalData.pricing?.finalPrice || 0).toLocaleString()}
`}

${previewOptions.includeTerms && proposalData.terms ? `
TERMS & CONDITIONS:
${proposalData.terms.paymentTerms}
${proposalData.terms.cancellationPolicy}
` : ''}

Generated: ${new Date().toLocaleString()}
    `;
    
    navigator.clipboard.writeText(text.trim());
    toast.success('Proposal copied to clipboard');
  };

  const handleDownloadProposal = () => {
    const content = generateProposalContent();
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `proposal_${query.id}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Proposal downloaded');
  };

  const errors = validateProposal();
  const canSend = errors.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Advanced Proposal Actions
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure and send proposals with advanced options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canSend ? 'default' : 'destructive'}>
            {canSend ? 'Ready to Send' : 'Configuration Needed'}
          </Badge>
        </div>
      </div>

      {/* Validation Status */}
      {errors.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview & Display Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Pricing Breakup</Label>
                <input
                  type="checkbox"
                  checked={previewOptions.showBreakup}
                  onChange={(e) => setPreviewOptions(prev => ({
                    ...prev,
                    showBreakup: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Separate Adult/Child Pricing</Label>
                <input
                  type="checkbox"
                  checked={previewOptions.separateAdultChild}
                  onChange={(e) => setPreviewOptions(prev => ({
                    ...prev,
                    separateAdultChild: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include Accommodation Options</Label>
                <input
                  type="checkbox"
                  checked={previewOptions.includeAccommodationOptions}
                  onChange={(e) => setPreviewOptions(prev => ({
                    ...prev,
                    includeAccommodationOptions: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include Terms & Conditions</Label>
                <input
                  type="checkbox"
                  checked={previewOptions.includeTerms}
                  onChange={(e) => setPreviewOptions(prev => ({
                    ...prev,
                    includeTerms: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm">Communication Method</Label>
              <Select 
                value={previewOptions.communicationMethod}
                onValueChange={(value: 'email' | 'whatsapp') => 
                  setPreviewOptions(prev => ({ ...prev, communicationMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      WhatsApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {previewOptions.includeAccommodationOptions && (
              <div className="space-y-2">
                <Label className="text-sm">Accommodation Option</Label>
                <Select 
                  value={previewOptions.selectedAccommodationOption}
                  onValueChange={(value) => 
                    setPreviewOptions(prev => ({ ...prev, selectedAccommodationOption: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Options</SelectItem>
                    <SelectItem value="standard">Standard Option</SelectItem>
                    <SelectItem value="optional">Optional Package</SelectItem>
                    <SelectItem value="alternative">Alternative Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Agent Contact
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactEdit(true)}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-medium">Name</div>
                <div className="text-muted-foreground">{agentDetails.name || 'Not provided'}</div>
              </div>
              <div>
                <div className="font-medium">Company</div>
                <div className="text-muted-foreground">{agentDetails.company || 'Individual'}</div>
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-muted-foreground">{agentDetails.email || 'Not provided'}</div>
              </div>
              <div>
                <div className="font-medium">Phone</div>
                <div className="text-muted-foreground">{agentDetails.phone || 'Not provided'}</div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Contact method: {previewOptions.communicationMethod === 'email' ? 'Email' : 'WhatsApp'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Generate Proposal */}
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Generate Proposal</span>
                </Button>
              </DialogTrigger>
            </Dialog>

            {/* Advanced Preview */}
            <Dialog open={showAdvancedPreview} onOpenChange={setShowAdvancedPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>Advanced Preview</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Advanced Proposal Preview</DialogTitle>
                </DialogHeader>
                <ProposalPreview
                  query={query}
                  proposalData={proposalData}
                  previewOptions={previewOptions}
                  agentDetails={agentDetails}
                />
              </DialogContent>
            </Dialog>

            {/* Copy */}
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={handleCopyProposal}
            >
              <Copy className="h-6 w-6 mb-2" />
              <span>Copy</span>
            </Button>

            {/* Send */}
            <Button
              className="h-20 flex-col"
              onClick={handleSendProposal}
              disabled={!canSend || sendingProposal}
            >
              {sendingProposal ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
              ) : previewOptions.communicationMethod === 'email' ? (
                <Mail className="h-6 w-6 mb-2" />
              ) : (
                <MessageSquare className="h-6 w-6 mb-2" />
              )}
              <span>{sendingProposal ? 'Sending...' : `Send via ${previewOptions.communicationMethod}`}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Edit Dialog */}
      <Dialog open={showContactEdit} onOpenChange={setShowContactEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent Contact Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={agentDetails.name}
                  onChange={(e) => setAgentDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={agentDetails.company}
                  onChange={(e) => setAgentDetails(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={agentDetails.email}
                  onChange={(e) => setAgentDetails(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={agentDetails.phone}
                  onChange={(e) => setAgentDetails(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={agentDetails.address}
                onChange={(e) => setAgentDetails(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContactEdit(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                localStorage.setItem(`agent_contact_${query.agentId}`, JSON.stringify(agentDetails));
                setShowContactEdit(false);
                toast.success('Contact details updated');
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Proposal Dialog */}
      <GenerateProposalDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        query={query}
        proposalData={proposalData}
        onGenerate={(generatedData) => {
          console.log('Generated proposal:', generatedData);
          toast.success('Proposal generated successfully');
          setShowGenerateDialog(false);
        }}
      />
    </div>
  );
};

export default AdvancedProposalActions;