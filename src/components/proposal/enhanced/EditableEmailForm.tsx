import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { formatCurrency } from '@/lib/formatters';
import { Mail, Edit3, Save, User, Phone, AtSign } from 'lucide-react';

interface EmailData {
  to: string;
  subject: string;
  message: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
}

interface EditableEmailFormProps {
  query: Query;
  days: ItineraryDay[];
  totalCost: number;
  emailData: EmailData;
  onEmailDataChange: (data: EmailData) => void;
  onSendEmail: () => void;
  readonly?: boolean;
}

const EditableEmailForm: React.FC<EditableEmailFormProps> = ({
  query,
  days,
  totalCost,
  emailData,
  onEmailDataChange,
  onSendEmail,
  readonly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EmailData>(emailData);

  useEffect(() => {
    setFormData(emailData);
  }, [emailData]);

  // Load agent data from query or set defaults
  useEffect(() => {
    if (query && (!formData.agentName || !formData.agentEmail)) {
      const agentData = {
        agentName: (query as any).agentName || 'Travel Consultant',
        agentPhone: (query as any).agentPhone || '+1 234 567 8900',
        agentEmail: (query as any).agentEmail || 'agent@travelagency.com'
      };
      
      setFormData(prev => ({
        ...prev,
        ...agentData,
        to: prev.to || (query as any).clientEmail || '',
        subject: prev.subject || `Your ${query.destination.country} Travel Proposal`,
        message: prev.message || generateDefaultMessage(query, days, totalCost, agentData.agentName)
      }));
    }
  }, [query, days, totalCost, formData.agentName, formData.agentEmail]);

  const generateDefaultMessage = (query: Query, days: ItineraryDay[], totalCost: number, agentName: string) => {
    return `Dear Valued Client,

I hope this email finds you well. I'm excited to present your personalized travel proposal for ${query.destination.cities.join(', ')}, ${query.destination.country}.

📍 Destination: ${query.destination.cities.join(', ')}, ${query.destination.country}
📅 Duration: ${days.length} days, ${query.tripDuration.nights} nights
📆 Travel Dates: ${new Date(query.travelDates.from).toLocaleDateString()} - ${new Date(query.travelDates.to).toLocaleDateString()}
👥 Travelers: ${query.paxDetails.adults} Adult(s)${query.paxDetails.children > 0 ? `, ${query.paxDetails.children} Child(ren)` : ''}
💰 Total Investment: ${formatCurrency(totalCost)}
💰 Per Person: ${formatCurrency(totalCost / (query.paxDetails.adults + query.paxDetails.children))}

Your itinerary includes:
${days.slice(0, 3).map((day, index) => 
  `• Day ${day.dayNumber}: ${day.title || day.city} - ${formatCurrency(day.totalCost)}`
).join('\n')}${days.length > 3 ? '\n• And more amazing experiences...' : ''}

This proposal includes:
✓ Carefully selected accommodations
✓ Private transportation arrangements
✓ Curated activities and experiences
✓ Professional local guidance
✓ 24/7 travel support

This proposal is valid for 30 days from the date of this email. Please feel free to reach out with any questions, modifications, or to proceed with the booking.

I'm here to make your travel dreams come true!

Best regards,
${agentName}

---
Feel free to contact me:
📞 Phone: ${formData.agentPhone}
📧 Email: ${formData.agentEmail}`;
  };

  const handleInputChange = (field: keyof EmailData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onEmailDataChange(updated);
  };

  const handleSave = () => {
    onEmailDataChange(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(emailData);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Proposal via Email
          </span>
          {!readonly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            <h4 className="font-medium">Agent Information</h4>
            <Badge variant="outline">Editable</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              {isEditing ? (
                <Input
                  id="agentName"
                  value={formData.agentName}
                  onChange={(e) => handleInputChange('agentName', e.target.value)}
                  placeholder="Your Name"
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.agentName || 'Not set'}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agentPhone">Agent Phone</Label>
              {isEditing ? (
                <Input
                  id="agentPhone"
                  value={formData.agentPhone}
                  onChange={(e) => handleInputChange('agentPhone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.agentPhone || 'Not set'}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agentEmail">Agent Email</Label>
              {isEditing ? (
                <Input
                  id="agentEmail"
                  type="email"
                  value={formData.agentEmail}
                  onChange={(e) => handleInputChange('agentEmail', e.target.value)}
                  placeholder="agent@company.com"
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.agentEmail || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Details */}
        <div className="space-y-4">
          <h4 className="font-medium">Email Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailTo">Recipient Email</Label>
              <Input
                id="emailTo"
                type="email"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="client@example.com"
                readOnly={readonly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Your Travel Proposal"
                readOnly={readonly}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailMessage">Email Message</Label>
            <Textarea
              id="emailMessage"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Email message content..."
              rows={12}
              readOnly={readonly}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={onSendEmail} 
              disabled={!formData.to || !formData.subject}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            {(!formData.to || !formData.subject) && (
              <p className="text-sm text-destructive flex items-center">
                Please fill in recipient email and subject before sending
              </p>
            )}
          </div>
        )}

        {/* Email Preview Summary */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h5 className="font-medium mb-2">Email Summary</h5>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">From:</span> {formData.agentName} &lt;{formData.agentEmail}&gt;</p>
            <p><span className="font-medium">To:</span> {formData.to || 'Not specified'}</p>
            <p><span className="font-medium">Subject:</span> {formData.subject || 'Not specified'}</p>
            <p><span className="font-medium">Message Length:</span> {formData.message.length} characters</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableEmailForm;