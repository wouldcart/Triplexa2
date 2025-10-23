import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Send, 
  Mail, 
  Phone, 
  User, 
  Edit, 
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { Query } from '@/types/query';
import { useAgentData } from '@/hooks/useAgentData';
import { toast } from 'sonner';

interface ProposalActionsProps {
  query: Query;
  proposalData: any;
  onStatusUpdate: (status: 'draft' | 'ready' | 'sent') => void;
}

interface AgentContactDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  additionalNotes: string;
}

const ProposalActions: React.FC<ProposalActionsProps> = ({
  query,
  proposalData,
  onStatusUpdate
}) => {
  const { getAgentById } = useAgentData();
  const [showPreview, setShowPreview] = useState(false);
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [agentDetails, setAgentDetails] = useState<AgentContactDetails>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    additionalNotes: ''
  });
  const [sendingProposal, setSendingProposal] = useState(false);

  useEffect(() => {
    // Load agent data from enquiry
    loadAgentData();
  }, [query.agentId]);

  const loadAgentData = () => {
    // First, try to load detailed agent data from agent database
    const agent = getAgentById(query.agentId);
    
    if (agent) {
      // Use detailed agent data if available
      setAgentDetails({
        name: agent.name || query.agentName,
        email: agent.email || '',
        phone: agent.contact?.phone || '',
        company: agent.type === 'company' ? agent.name : '',
        address: agent.city || '',
        additionalNotes: ''
      });
    } else if (query.agentName) {
      // Fallback to basic agent info from enquiry
      setAgentDetails({
        name: query.agentName,
        email: '', // Will need to be filled manually
        phone: '',
        company: '',
        address: '',
        additionalNotes: `Agent ID: ${query.agentId} from enquiry ${query.id}`
      });
    }
    
    // Try to load previously saved contact details for this agent
    try {
      const savedDetails = localStorage.getItem(`agent_contact_${query.agentId}`);
      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);
        setAgentDetails(prev => ({
          ...prev,
          ...parsed,
          // Always keep the name from enquiry if available
          name: query.agentName || prev.name
        }));
      }
    } catch (error) {
      console.error('Error loading saved agent contact details:', error);
    }
  };

  const handleContactDetailUpdate = (field: keyof AgentContactDetails, value: string) => {
    setAgentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveContactDetails = () => {
    // Save updated contact details
    localStorage.setItem(`agent_contact_${query.agentId}`, JSON.stringify(agentDetails));
    setShowContactEdit(false);
    toast.success('Contact details updated');
  };

  const validateProposal = () => {
    const errors = [];
    
    if (!proposalData.accommodations || proposalData.accommodations.length === 0) {
      errors.push('No accommodations selected');
    }
    
    if (!proposalData.pricing) {
      errors.push('Pricing not configured');
    }
    
    if (!proposalData.terms) {
      errors.push('Terms & conditions not set');
    }
    
    if (!agentDetails.email) {
      errors.push('Agent email not provided');
    }
    
    return errors;
  };

  const handleSendProposal = async () => {
    const errors = validateProposal();
    
    if (errors.length > 0) {
      toast.error(`Please fix the following: ${errors.join(', ')}`);
      return;
    }
    
    setSendingProposal(true);
    
    try {
      // Simulate sending proposal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update proposal status
      onStatusUpdate('sent');
      
      // Save send history
      const sendHistory = {
        sentAt: new Date().toISOString(),
        sentTo: agentDetails.email,
        agentDetails: agentDetails,
        proposalData: proposalData
      };
      
      localStorage.setItem(`proposal_send_${query.id}`, JSON.stringify(sendHistory));
      
      toast.success('Proposal sent successfully');
    } catch (error) {
      toast.error('Failed to send proposal');
      console.error('Send proposal error:', error);
    } finally {
      setSendingProposal(false);
    }
  };

  const downloadProposal = () => {
    // Create and download proposal as PDF/document
    const proposalContent = {
      query: query,
      accommodations: proposalData.accommodations,
      pricing: proposalData.pricing,
      terms: proposalData.terms,
      agentDetails: agentDetails,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(proposalContent, null, 2);
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
            Proposal Actions
          </h3>
          <p className="text-sm text-muted-foreground">
            Preview and send your proposal to the agent
          </p>
        </div>
        <Badge variant={canSend ? 'default' : 'destructive'}>
          {canSend ? 'Ready to Send' : 'Not Ready'}
        </Badge>
      </div>

      {/* Validation Status */}
      {errors.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Issues to Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Agent Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Agent Contact Details
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactEdit(true)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Agent ID</div>
              <div className="text-sm text-muted-foreground">{query.agentId}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Name</div>
              <div className="text-sm text-muted-foreground">{agentDetails.name || query.agentName || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{agentDetails.email || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Phone</div>
              <div className="text-sm text-muted-foreground">{agentDetails.phone || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Company</div>
              <div className="text-sm text-muted-foreground">{agentDetails.company || 'Individual'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Address</div>
              <div className="text-sm text-muted-foreground">{agentDetails.address || 'Not provided'}</div>
            </div>
          </div>
          
          {/* Source Information */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Agent details loaded from Enquiry Management (ID: {query.id})
              {agentDetails.additionalNotes && (
                <div className="mt-1">
                  <span className="font-medium">Notes:</span> {agentDetails.additionalNotes}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preview */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>Preview</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Proposal Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm">
                    <strong>Enquiry ID:</strong> {query.id}
                  </div>
                  <div className="text-sm">
                    <strong>Destination:</strong> {query.destination.cities.join(', ')}, {query.destination.country}
                  </div>
                  <div className="text-sm">
                    <strong>Duration:</strong> {query.tripDuration.days} days / {query.tripDuration.nights} nights
                  </div>
                  <div className="text-sm">
                    <strong>Travelers:</strong> {query.paxDetails.adults} adults, {query.paxDetails.children} children
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Accommodations</h4>
                    {proposalData.accommodations?.map((acc: any, index: number) => (
                      <div key={index} className="text-sm mb-1">• {acc.name}</div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Pricing</h4>
                    {proposalData.pricing && (
                      <div className="text-sm space-y-1">
                        <div>Total Price: {proposalData.pricing.currency} {proposalData.pricing.finalPrice?.toLocaleString()}</div>
                        <div>Per Person: {proposalData.pricing.currency} {proposalData.pricing.perPersonPrice?.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                    {proposalData.terms && (
                      <div className="text-sm space-y-2">
                        {proposalData.terms.paymentTerms && (
                          <div>
                            <strong>Payment Terms:</strong>
                            <div className="whitespace-pre-wrap">{proposalData.terms.paymentTerms}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Download */}
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={downloadProposal}
            >
              <Download className="h-6 w-6 mb-2" />
              <span>Download</span>
            </Button>

            {/* Send */}
            <Button
              className="h-20 flex-col"
              onClick={handleSendProposal}
              disabled={!canSend || sendingProposal}
            >
              {sendingProposal ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
              ) : (
                <Send className="h-6 w-6 mb-2" />
              )}
              <span>{sendingProposal ? 'Sending...' : 'Send Proposal'}</span>
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={agentDetails.name}
                  onChange={(e) => handleContactDetailUpdate('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={agentDetails.email}
                  onChange={(e) => handleContactDetailUpdate('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={agentDetails.phone}
                  onChange={(e) => handleContactDetailUpdate('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={agentDetails.company}
                  onChange={(e) => handleContactDetailUpdate('company', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={agentDetails.address}
                onChange={(e) => handleContactDetailUpdate('address', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={agentDetails.additionalNotes}
                onChange={(e) => handleContactDetailUpdate('additionalNotes', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContactEdit(false)}>
                Cancel
              </Button>
              <Button onClick={saveContactDetails}>
                <Save className="h-3 w-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalActions;