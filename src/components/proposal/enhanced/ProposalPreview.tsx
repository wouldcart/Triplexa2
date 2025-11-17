import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { formatCurrency } from '@/lib/formatters';
import { 
  Eye, Printer, Download, Share, Save,
  MapPin, Calendar, Users, DollarSign,
  Hotel, Car, Camera, Utensils,
  Clock, Star, ChevronRight
} from 'lucide-react';
import { OptionalRecords } from '@/types/optionalRecords';
import EnhancedProposalSummary from '@/components/proposal/EnhancedProposalSummary';
import { UniversalPDFService } from '@/services/universalPDFService';
import { useToast } from '@/hooks/use-toast';

interface ProposalPreviewProps {
  query: Query;
  days: ItineraryDay[];
  totalCost: number;
  onSave: () => void;
  onShare: () => void;
  optionalRecords?: OptionalRecords;
}

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  query,
  days,
  totalCost,
  onSave,
  onShare,
  optionalRecords
}) => {
  const [previewMode, setPreviewMode] = useState<'client' | 'internal'>('client');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const pdfService = new UniversalPDFService();

  // Helper function to check if a country is optional (derived from its cities)
  const isCountryOptional = (countryName: string) => {
    if (!optionalRecords?.cities || !query?.destination.cities) return false;
    
    // If any city in the country is optional, consider the country optional
    const optionalCities = optionalRecords.cities.filter((city: any) => city.isOptional);
    return optionalCities.length > 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalPax = () => query.paxDetails.adults + query.paxDetails.children;

  // PDF Export function that respects optional toggles
  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Filter days to only include non-optional items based on current toggle state
      const filteredDays = days.map(day => {
        // Filter activities, transport, and accommodations based on optional status
        const filteredActivities = day.activities?.filter(activity => {
          if (!optionalRecords?.activities) return true; // Include if no optional records
          const activityOptional = optionalRecords.activities.find(opt => opt.itemId === activity.id);
          return !activityOptional || activityOptional.isSelected !== false; // Include if not optional or if optional but selected
        }) || [];

        const filteredTransport = day.transport?.filter(transport => {
          if (!optionalRecords?.transport) return true;
          const transportOptional = optionalRecords.transport.find(opt => opt.itemId === transport.id);
          return !transportOptional || transportOptional.isSelected !== false;
        }) || [];

        const filteredAccommodations = day.accommodations?.filter(accommodation => {
          if (!optionalRecords?.accommodations) return true;
          const accommodationOptional = optionalRecords.accommodations.find(opt => opt.itemId === accommodation.id);
          return !accommodationOptional || accommodationOptional.isSelected !== false;
        }) || [];

        // Recalculate day total cost without optional items
        const recalculatedTotal = [
          ...filteredActivities.map(a => a.price || 0),
          ...filteredTransport.map(t => t.price || 0),
          ...filteredAccommodations.map(a => a.price || 0),
          day.accommodation?.price || 0
        ].reduce((sum, price) => sum + price, 0);

        return {
          ...day,
          activities: filteredActivities,
          transport: filteredTransport,
          accommodations: filteredAccommodations,
          totalCost: recalculatedTotal
        };
      });

      // Calculate new total cost without optional items
      const newTotalCost = filteredDays.reduce((sum, day) => sum + day.totalCost, 0);

      // Create PDF data with filtered content
      const pdfData = {
        query,
        days: filteredDays,
        totalCost: newTotalCost,
        optionalRecords,
        generatedAt: new Date().toISOString(),
        previewMode
      };

      // Generate PDF using the universal PDF service
      const pdfBlob = await pdfService.generatePDF('business-proposal', pdfData, {
        format: 'pdf',
        compression: true
      });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${query.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "Proposal PDF exported successfully with current optional selections",
      });

    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderDayCard = (day: ItineraryDay) => (
    <Card key={day.id} className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{day.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(day.date)} • {day.city}
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(day.totalCost)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {day.description && (
          <p className="text-sm text-muted-foreground">{day.description}</p>
        )}

        {/* Accommodation */}
        {day.accommodation && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Hotel className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">{day.accommodation.name}</h4>
              <p className="text-sm text-blue-700">
                {day.accommodation.roomType} • {formatCurrency(day.accommodation.price)}
              </p>
            </div>
          </div>
        )}

        {/* Transport */}
        {day.transport && day.transport.length > 0 && (
          <div className="space-y-2">
            {day.transport.map((transport, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Car className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">{transport.name}</h4>
                  <p className="text-sm text-green-700">
                    {typeof transport.from === 'string' ? transport.from : (transport.from as any)?.city || (transport.from as any)?.name || 'Origin'} <ChevronRight className="h-3 w-3 inline mx-1" /> {typeof transport.to === 'string' ? transport.to : (transport.to as any)?.city || (transport.to as any)?.name || 'Destination'}
                  </p>
                  <p className="text-sm text-green-700">{formatCurrency(transport.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activities */}
        {day.activities && day.activities.length > 0 && (
          <div className="space-y-2">
            {day.activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Camera className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900">{activity.name}</h4>
                  <p className="text-sm text-orange-700">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-orange-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.duration}
                    </span>
                    <span className="text-sm text-orange-700">
                      {formatCurrency(activity.cost)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meals */}
        {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Utensils className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900">Meals Included</h4>
              <div className="flex gap-2 mt-1">
                {day.meals.breakfast && <Badge variant="secondary" className="text-xs">Breakfast</Badge>}
                {day.meals.lunch && <Badge variant="secondary" className="text-xs">Lunch</Badge>}
                {day.meals.dinner && <Badge variant="secondary" className="text-xs">Dinner</Badge>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode === 'client' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('client')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Client View
          </Button>
          <Button
            variant={previewMode === 'internal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('internal')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Internal View
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
          >
            <Download className="h-4 w-4 mr-1" />
            {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" onClick={onShare}>
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-2">Travel Proposal</h1>
          <p className="text-lg text-muted-foreground">
            {query.destination.country} Experience
            {isCountryOptional(query.destination.country) && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ml-2">
                Optional Country
              </Badge>
            )}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              {query.destination.cities.join(', ')}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              {query.tripDuration.days} Days
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              {getTotalPax()} Travelers
            </div>
          </div>
        </div>

        {/* Trip Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trip Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Travel Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Destination:</span> {query.destination.country}
                    {isCountryOptional(query.destination.country) && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ml-1">
                        Optional
                      </Badge>
                    )}
                  </p>
                  <p><span className="font-medium">Cities:</span> {query.destination.cities.join(', ')}</p>
                  <p><span className="font-medium">Duration:</span> {query.tripDuration.days} days, {query.tripDuration.nights} nights</p>
                  <p><span className="font-medium">Dates:</span> {formatDate(query.travelDates.from)} - {formatDate(query.travelDates.to)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Travelers</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Adults:</span> {query.paxDetails.adults}</p>
                  {query.paxDetails.children > 0 && (
                    <p><span className="font-medium">Children:</span> {query.paxDetails.children}</p>
                  )}
                  <p><span className="font-medium">Package Type:</span> {query.packageType}</p>
                  <p><span className="font-medium">Budget Range:</span> {(query as any).budgetRange || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Proposal Summary with Optional Controls */}
        <div className="mb-6">
          <EnhancedProposalSummary
            query={query}
            accommodations={days.flatMap(day => day.accommodations || [])}
            transportRoutes={days.flatMap(day => day.transport || [])}
            activities={days.flatMap(day => day.activities || [])}
            proposalId={query.id}
            showToggleControls={true}
            optionalRecords={optionalRecords}
          />
        </div>

        {/* Daily Itinerary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Day-by-Day Itinerary</h2>
          {days.length > 0 ? (
            days.map(renderDayCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No itinerary days configured yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewMode === 'internal' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Cost:</span>
                    <span>{formatCurrency(totalCost * 0.85)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markup (15%):</span>
                    <span className="text-green-600">+{formatCurrency(totalCost * 0.15)}</span>
                  </div>
                  <Separator />
                </div>
              )}
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Investment:</span>
                <span className="text-2xl text-primary">{formatCurrency(totalCost)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Per Person:</span>
                <span>{formatCurrency(totalCost / getTotalPax())}</span>
              </div>

              {previewMode === 'client' && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    * Price includes all mentioned services, accommodations, and activities.
                    Additional charges may apply for optional services.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Generated on {new Date().toLocaleDateString()} • Query ID: {query.id}</p>
        </div>
      </div>
    </div>
  );
};

export default ProposalPreview;