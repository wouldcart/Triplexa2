
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Query } from '@/types/query';
import { cn } from '@/lib/utils';

interface ProposalBasicInfoProps {
  query: Query;
  proposalData: any;
  onUpdateProposalData: (data: any) => void;
}

const ProposalBasicInfo: React.FC<ProposalBasicInfoProps> = ({
  query,
  proposalData,
  onUpdateProposalData
}) => {
  const currencies = [
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const paymentTermsOptions = [
    '30% advance, 70% before travel',
    '50% advance, 50% before travel',
    '100% advance payment',
    'Pay on arrival',
    'Custom payment terms'
  ];

  const defaultInclusions = [
    'Accommodation as per itinerary',
    'Daily breakfast',
    'Airport transfers',
    'Sightseeing as mentioned',
    'English speaking guide',
    'All taxes and service charges'
  ];

  const defaultExclusions = [
    'International airfare',
    'Visa fees',
    'Personal expenses',
    'Travel insurance',
    'Tips and gratuities',
    'Meals not mentioned'
  ];

  const updateField = (field: string, value: any) => {
    onUpdateProposalData({
      ...proposalData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Query Information Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Query Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Destination</Label>
              <div>
                <p className="font-medium">{query.destination.country}</p>
                <p className="text-sm text-muted-foreground">
                  {query.destination.cities.join(', ')}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Travel Dates</Label>
              <div>
                <p className="text-sm">
                  {format(new Date(query.travelDates.from), 'MMM dd, yyyy')} - 
                  {format(new Date(query.travelDates.to), 'MMM dd, yyyy')}
                </p>
                <Badge variant="outline" className="mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {query.tripDuration.days} Days, {query.tripDuration.nights} Nights
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Passengers</Label>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {query.paxDetails.adults} Adults
                </Badge>
                {query.paxDetails.children > 0 && (
                  <Badge variant="outline">
                    {query.paxDetails.children} Children
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                value={proposalData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter proposal title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select 
                value={proposalData.currency} 
                onValueChange={(value) => updateField('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !proposalData.validUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {proposalData.validUntil ? (
                      format(proposalData.validUntil, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={proposalData.validUntil}
                    onSelect={(date) => updateField('validUntil', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select 
                value={proposalData.paymentTerms} 
                onValueChange={(value) => updateField('paymentTerms', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={proposalData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any special notes or requirements for this proposal..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Package Inclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {defaultInclusions.map((inclusion, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`inclusion-${index}`}
                    defaultChecked
                    className="rounded"
                  />
                  <label htmlFor={`inclusion-${index}`} className="text-sm">
                    {inclusion}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Package Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {defaultExclusions.map((exclusion, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`exclusion-${index}`}
                    defaultChecked
                    className="rounded"
                  />
                  <label htmlFor={`exclusion-${index}`} className="text-sm">
                    {exclusion}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalBasicInfo;
