import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { formatCurrency } from '@/lib/formatters';
import { 
  Eye, FileText, DollarSign, Users, Calendar, MapPin,
  Hotel, Car, Camera, Utensils, Clock, Calculator,
  Download, Share, Mail
} from 'lucide-react';

interface PricingBreakdown {
  adults: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    perPerson: number;
  };
  children: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    perPerson: number;
    discountPercent: number;
  };
  total: {
    basePrice: number;
    markup: number;
    finalPrice: number;
  };
}

interface TermsConditions {
  paymentTerms: string;
  cancellationPolicy: string;
  additionalTerms: string;
}

interface EnhancedPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query;
  days: ItineraryDay[];
  pricingBreakdown?: PricingBreakdown;
  termsConditions?: TermsConditions;
  onDownloadPDF: () => void;
  onShare: () => void;
  onSendEmail: () => void;
}

const EnhancedPreviewDialog: React.FC<EnhancedPreviewDialogProps> = ({
  isOpen,
  onClose,
  query,
  days,
  pricingBreakdown,
  termsConditions,
  onDownloadPDF,
  onShare,
  onSendEmail
}) => {
  const [showPricingConfig, setShowPricingConfig] = useState(false);
  const [showInternalView, setShowInternalView] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalPax = () => query.paxDetails.adults + query.paxDetails.children;
  const totalCost = pricingBreakdown?.total?.finalPrice || days.reduce((sum, day) => sum + day.totalCost, 0);

  const renderDayCard = (day: ItineraryDay) => (
    <Card key={day.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{day.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {day.date && formatDate(day.date)} • {day.city}
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(day.totalCost)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.description && (
          <p className="text-sm text-muted-foreground">{day.description}</p>
        )}

        {/* Accommodation */}
        {day.accommodations && day.accommodations.length > 0 && (
          <div className="space-y-2">
            {day.accommodations.map((acc, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Hotel className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 text-sm">{acc.name}</h4>
                  <p className="text-xs text-blue-700">
                    {acc.roomType} • {formatCurrency(acc.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transport */}
        {day.transport && day.transport.length > 0 && (
          <div className="space-y-2">
            {day.transport.map((transport, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Car className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 text-sm">{transport.name}</h4>
                  <p className="text-xs text-green-700">
                    {typeof transport.from === 'string' ? transport.from : (transport.from as any)?.city || (transport.from as any)?.name || 'Origin'} → {typeof transport.to === 'string' ? transport.to : (transport.to as any)?.city || (transport.to as any)?.name || 'Destination'} • {formatCurrency(transport.price)}
                  </p>
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
                <Camera className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900 text-sm">{activity.name}</h4>
                  <p className="text-xs text-orange-700">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-orange-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.duration}
                    </span>
                    <span className="text-xs text-orange-700">
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
            <Utensils className="h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 text-sm">Meals Included</h4>
              <div className="flex gap-1 mt-1">
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Enhanced Preview - {query.destination.country} Proposal
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="pricing-config"
                  checked={showPricingConfig}
                  onCheckedChange={setShowPricingConfig}
                />
                <Label htmlFor="pricing-config" className="text-sm">Show Pricing Config</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal-view"
                  checked={showInternalView}
                  onCheckedChange={setShowInternalView}
                />
                <Label htmlFor="internal-view" className="text-sm">Internal View</Label>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Preview proposal details, itinerary, and pricing before sharing with the client.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="proposal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proposal">Full Proposal</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Details</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>

            <TabsContent value="proposal" className="mt-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center pb-6 border-b">
                  <h1 className="text-3xl font-bold mb-2">Travel Proposal</h1>
                  <p className="text-xl text-muted-foreground">{query.destination.country} Experience</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Travel Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Destination:</span> {query.destination.country}</p>
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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Itinerary */}
                <div>
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
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <div className="space-y-6">
                {/* Pricing Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Investment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pricingBreakdown && (
                        <>
                          {/* Per Person Pricing Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Adults */}
                            <Card className="border-blue-200 bg-blue-50">
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Adults ({query.paxDetails.adults})</span>
                                  </div>
                                   <div className="text-2xl font-bold text-blue-900">
                                     {formatCurrency(pricingBreakdown.adults?.finalPrice || 0)}
                                   </div>
                                   <div className="text-sm text-blue-700">
                                     {formatCurrency(pricingBreakdown.adults?.perPerson || 0)} per person
                                   </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Children */}
                            {query.paxDetails.children > 0 && (
                              <Card className="border-green-200 bg-green-50">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                      <Users className="h-4 w-4 text-green-600" />
                                      <span className="font-medium text-green-800">Children ({query.paxDetails.children})</span>
                                    </div>
                                     <div className="text-2xl font-bold text-green-900">
                                       {formatCurrency(pricingBreakdown.children?.finalPrice || 0)}
                                     </div>
                                     <div className="text-sm text-green-700">
                                       {formatCurrency(pricingBreakdown.children?.perPerson || 0)} per child
                                     </div>
                                     {(pricingBreakdown.children?.discountPercent || 0) > 0 && (
                                       <Badge variant="secondary" className="text-xs mt-1">
                                         {pricingBreakdown.children?.discountPercent || 0}% discount
                                       </Badge>
                                     )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Total */}
                            <Card className="border-primary bg-primary/5">
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Total</span>
                                  </div>
                                   <div className="text-2xl font-bold text-primary">
                                     {formatCurrency(pricingBreakdown.total?.finalPrice || 0)}
                                   </div>
                                   <div className="text-sm text-muted-foreground">
                                     {formatCurrency((pricingBreakdown.total?.finalPrice || 0) / getTotalPax())} average per person
                                   </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {showPricingConfig && showInternalView && (
                            <>
                              <Separator />
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Pricing Configuration & Calculations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Adults Breakdown */}
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-blue-800">Adults ({query.paxDetails.adults} pax)</h5>
                                      <div className="space-y-2 text-sm">
                                         <div className="flex justify-between">
                                           <span>Base Price:</span>
                                           <span>{formatCurrency(pricingBreakdown.adults?.basePrice || 0)}</span>
                                         </div>
                                         <div className="flex justify-between">
                                           <span>Markup:</span>
                                           <span className="text-green-600">+{formatCurrency(pricingBreakdown.adults?.markup || 0)}</span>
                                         </div>
                                         <Separator />
                                         <div className="flex justify-between font-medium">
                                           <span>Final Price:</span>
                                           <span>{formatCurrency(pricingBreakdown.adults?.finalPrice || 0)}</span>
                                         </div>
                                      </div>
                                    </div>

                                    {/* Children Breakdown */}
                                    {query.paxDetails.children > 0 && (
                                      <div className="space-y-3">
                                        <h5 className="font-medium text-green-800">Children ({query.paxDetails.children} pax)</h5>
                                        <div className="space-y-2 text-sm">
                                           <div className="flex justify-between">
                                             <span>Base Price:</span>
                                             <span>{formatCurrency(pricingBreakdown.children?.basePrice || 0)}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span>Markup:</span>
                                             <span className="text-green-600">+{formatCurrency(pricingBreakdown.children?.markup || 0)}</span>
                                           </div>
                                           <Separator />
                                           <div className="flex justify-between font-medium">
                                             <span>Final Price:</span>
                                             <span>{formatCurrency(pricingBreakdown.children?.finalPrice || 0)}</span>
                                           </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </>
                          )}
                        </>
                      )}

                      {!showInternalView && (
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
              </div>
            </TabsContent>

            <TabsContent value="terms" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Terms & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {termsConditions ? (
                      <>
                        {termsConditions.paymentTerms && (
                          <div>
                            <h4 className="font-medium mb-2">Payment Terms</h4>
                            <div className="p-3 border rounded-md bg-gray-50">
                              <div className="whitespace-pre-wrap text-sm">{termsConditions.paymentTerms}</div>
                            </div>
                          </div>
                        )}

                        {termsConditions.cancellationPolicy && (
                          <div>
                            <h4 className="font-medium mb-2">Cancellation Policy</h4>
                            <div className="p-3 border rounded-md bg-gray-50">
                              <div className="whitespace-pre-wrap text-sm">{termsConditions.cancellationPolicy}</div>
                            </div>
                          </div>
                        )}

                        {termsConditions.additionalTerms && (
                          <div>
                            <h4 className="font-medium mb-2">Additional Terms</h4>
                            <div className="p-3 border rounded-md bg-gray-50">
                              <div className="whitespace-pre-wrap text-sm">{termsConditions.additionalTerms}</div>
                            </div>
                          </div>
                        )}

                        {!termsConditions.paymentTerms && !termsConditions.cancellationPolicy && !termsConditions.additionalTerms && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No terms and conditions have been set for this proposal.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No terms and conditions have been set for this proposal.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onSendEmail} className="gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button onClick={onShare} className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPreviewDialog;