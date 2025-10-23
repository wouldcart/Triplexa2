import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Query } from '@/types/query';
import { 
  Eye, EyeOff, Download, Printer, Mail, Share2,
  MapPin, Calendar, Users, DollarSign, Clock
} from 'lucide-react';

interface ProposalPreviewProps {
  query: Query;
  proposalData?: any;
}

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  query,
  proposalData
}) => {
  const [viewMode, setViewMode] = useState<'client' | 'internal'>('client');
  const [showPricing, setShowPricing] = useState(true);

  const handleExportPDF = () => {
    window.print();
  };

  const handleEmailShare = () => {
    const subject = `Travel Proposal - ${query.destination.cities.join(', ')}, ${query.destination.country}`;
    const body = `Please find attached your travel proposal for ${query.destination.cities.join(', ')}, ${query.destination.country}.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;
  const duration = query.tripDuration?.days || 0;

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Proposal Preview</h3>
          <p className="text-muted-foreground">
            Preview your proposal in client or internal view
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value: 'client' | 'internal') => setViewMode(value)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="client">Client View</TabsTrigger>
              <TabsTrigger value="internal">Internal View</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPricing(!showPricing)}
            className="flex items-center gap-1"
          >
            {showPricing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPricing ? 'Hide' : 'Show'} Pricing
          </Button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmailShare}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share Link
        </Button>
      </div>

      {/* Proposal Preview Content */}
      <Card className="proposal-preview">
        <CardHeader className="text-center border-b">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Travel Proposal</h1>
            <Badge variant="outline" className="text-sm">
              Query ID: {query.id}
            </Badge>
            {viewMode === 'internal' && (
              <Badge variant="secondary" className="ml-2">
                Internal View
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Destination Summary */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              {query.destination.cities.join(', ')}, {query.destination.country}
            </h2>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {duration} Days
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalPax} Travelers
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
              </div>
            </div>
          </div>

          <Separator />

          {/* Travel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Travel Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span>{query.destination.cities.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span>{query.destination.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{duration} days, {duration - 1} nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package Type:</span>
                  <span className="capitalize">{query.packageType}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Traveler Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adults:</span>
                  <span>{query.paxDetails.adults}</span>
                </div>
                {query.paxDetails.children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Children:</span>
                    <span>{query.paxDetails.children}</span>
                  </div>
                )}
                {query.paxDetails.infants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Infants:</span>
                    <span>{query.paxDetails.infants}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Travelers:</span>
                  <span className="font-medium">{totalPax}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary Overview */}
          {proposalData?.days && proposalData.days.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">Itinerary Overview</h3>
                <div className="space-y-3">
                  {proposalData.days.slice(0, 3).map((day: any, index: number) => (
                    <div key={day.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Day {day.day}: {day.title}</h4>
                        {showPricing && viewMode === 'internal' && (
                          <Badge variant="outline">${day.totalCost}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {day.description || `Explore ${day.location?.city || 'destination'}`}
                      </p>
                    </div>
                  ))}
                  {proposalData.days.length > 3 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {proposalData.days.length - 3} more days
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Pricing Summary */}
          {showPricing && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Summary
                </h3>
                
                {viewMode === 'client' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Package Price:</span>
                      <span className="font-medium">
                        ${proposalData?.pricing?.finalPrice?.toLocaleString() || proposalData?.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Per Person:</span>
                      <span className="font-medium">
                        ${((proposalData?.pricing?.finalPrice || proposalData?.totalCost || 0) / totalPax).toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-primary">
                        ${proposalData?.pricing?.finalPrice?.toLocaleString() || proposalData?.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="font-medium">
                        ${proposalData?.pricing?.basePrice?.toLocaleString() || proposalData?.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Markup:</span>
                      <span className="font-medium text-green-600">
                        +${proposalData?.pricing?.markup?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">
                        {proposalData?.pricing?.currency || 'USD'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Final Price:</span>
                      <span className="font-bold text-primary">
                        ${proposalData?.pricing?.finalPrice?.toLocaleString() || proposalData?.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p>This proposal is valid for 30 days from the date of issue.</p>
            <p className="mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalPreview;