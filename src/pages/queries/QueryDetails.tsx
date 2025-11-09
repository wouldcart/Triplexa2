import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import BreadcrumbNav from "@/components/navigation/BreadcrumbNav";
import ProposalActions from "@/components/queries/ProposalActions";
import { QueryAssignmentActions } from "@/components/queries/QueryAssignmentActions";
import { SupabaseAgentDetailsCard } from "@/components/queries/SupabaseAgentDetailsCard";
import { getEnquiryById } from "@/services/enquiriesService";
import EnquiryTimeline from "@/components/queries/workflow/EnquiryTimeline";
import EnhancedStatusBadge from "@/components/queries/status/EnhancedStatusBadge";
import EnhancedProposalService from "@/services/enhancedProposalService";
import { 
  ArrowLeft, Calendar, Clock, Edit, FileText, Hotel, Map, Plane, 
  User2, Users, MapPin, Star,
  DollarSign, Clock3, AlertTriangle, CheckCircle2, Eye, Send,
  Plus, Copy, Car, Landmark, Utensils
} from "lucide-react";
import { getProposalsByQueryId } from "@/data/queryData";
import { Query, Proposal } from "@/types/query";
import { useToast } from "@/hooks/use-toast";
import ProposalService from "@/services/proposalService";
import { formatCurrency, getCurrencyByCountry } from "@/utils/currencyUtils";

const QueryDetails: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeURIComponent(encodedId) : undefined;
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "details");
  const [query, setQuery] = useState<Query | undefined>(undefined);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [sendOptions, setSendOptions] = useState({
    method: 'email',
    recipient: '',
    subject: '',
    message: '',
    urgency: 'normal'
  });
  const [selectedModules, setSelectedModules] = useState<any[]>([]);
  const [proposalState, setProposalState] = useState<any>(null);

  // Fetch the query from Supabase (no localStorage fallback)
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    (async () => {
      const { data, error } = await getEnquiryById(id);
      if (error) {
        console.error('Error loading enquiry from Supabase:', error);
        toast({ title: 'Failed to load enquiry', description: String(error), variant: 'destructive' });
      }
      setQuery(data || undefined);
      if (data) {
        const mockProposals = getProposalsByQueryId(data.id);
        const savedProposals = ProposalService.getProposalsByQueryId(data.id);
        const allProposals = [...mockProposals, ...savedProposals];
        const uniqueProposals = allProposals.filter((proposal, index, self) => 
          index === self.findIndex(p => p.id === proposal.id)
        );
        setProposals(uniqueProposals);
        setSelectedModules(uniqueProposals.length > 0 ? (uniqueProposals[0].modules || []) : []);
      } else {
        setSelectedModules([]);
      }
      setIsLoading(false);
    })();
  }, [id]);

  const calculatePriority = (query: Query): 'low' | 'normal' | 'high' | 'urgent' => {
    const travelDate = new Date(query.travelDates.from);
    const daysUntilTravel = Math.floor((travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;

    if (daysUntilTravel <= 7) return 'urgent';
    if (query.packageType === 'luxury' || totalPax >= 8 || daysUntilTravel <= 30) return 'high';
    if (totalPax >= 4 || daysUntilTravel <= 60) return 'normal';
    return 'low';
  };

  const isNewAssignment = query?.status === 'assigned' && 
    new Date().getTime() - new Date(query.createdAt).getTime() < 24 * 60 * 60 * 1000;

  // Calculate PAX excluding infants
  const totalPax = query ? query.paxDetails.adults + query.paxDetails.children : 0;
  const estimatedRevenue = query?.budget?.max ? query.budget.max * 0.15 : 0;

  // Get proper currency based on destination country
  const currencyInfo = query ? getCurrencyByCountry(query.destination.country) : { code: 'USD' };
  const destinationCurrency = currencyInfo.code;

  const formatDestinationCurrency = (amount: number) => {
    if (!query) return amount.toFixed(2);
    return formatCurrency(amount, query.destination.country);
  };

  const handleViewProposalDetails = (proposalId: string) => {
    // Navigate to Advanced Proposal Creation section for viewing and updating
    navigate(`/queries/advanced-proposal/${encodeURIComponent(query?.id)}?proposal=${proposalId}&mode=view`);
  };

  const handleSendToAgent = (proposal: any) => {
    setSelectedProposal(proposal);
    setSendOptions({
      method: 'email',
      recipient: query?.agentName || '',
      subject: `Travel Proposal - Query ${query?.id}`,
      message: `Dear ${query?.agentName || 'Agent'},\n\nPlease find attached the travel proposal for Query ${query?.id}.\n\nProposal Details:\n- Total Amount: ${formatDestinationCurrency(proposal.totals?.total || proposal.finalPrice || 0)}\n- Modules: ${proposal.modules?.length || proposal.totals?.moduleCount || 0}\n\nBest regards,\nTravel Team`,
      urgency: 'normal'
    });
    setSendDialogOpen(true);
  };

  const handleSendProposal = () => {
    if (!sendOptions.recipient) {
      toast({
        title: "Error",
        description: "Please enter recipient details.",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending proposal
    toast({
      title: "Proposal Sent",
      description: `Proposal has been sent to ${sendOptions.recipient} via ${sendOptions.method}.`,
    });

    setSendDialogOpen(false);
    setSelectedProposal(null);
  };

  // Group modules by type for summary display
  const groupedModules = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      hotel: [],
      transport: [],
      sightseeing: [],
      restaurant: [],
      other: []
    };

    selectedModules.forEach(module => {
      if (groups[module.type]) {
        groups[module.type].push(module);
      } else {
        groups.other.push(module);
      }
    });

    return groups;
  }, [selectedModules]);

  if (isLoading) {
    return (
      <PageLayout>
        <BreadcrumbNav />
        <div className="flex flex-col items-center justify-center h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-border">
          <div className="text-center p-8">
            <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Loading Query Details...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the enquiry information.</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!query) {
    return (
      <PageLayout>
        <BreadcrumbNav />
        <div className="flex flex-col items-center justify-center h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-border">
          <div className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-foreground">Query not found</h2>
            <p className="text-muted-foreground mb-6">The query you're looking for doesn't exist or has been removed.</p>
            <p className="text-sm text-muted-foreground mb-6">Query ID: {id}</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              <Link to="/queries">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Queries
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <BreadcrumbNav 
        customPaths={{
          [id!]: `Query ${id}`
        }}
      />
      
      <div className="space-y-6">
        {/* Enhanced Header with proper dark mode */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/queries">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 dark:hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Query {query.id}
                </h1>
                <p className="text-blue-100 dark:text-blue-200 mt-1">
                  Created on {new Date(query.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <EnhancedStatusBadge 
                status={query.status}
                isNewAssignment={isNewAssignment}
                priority={calculatePriority(query)}
                showProgress={true}
                size="lg"
              />
            </div>
            <div className="flex items-center space-x-3">
              {estimatedRevenue > 0 && (
                <div className="text-right">
                  <div className="text-sm text-blue-100 dark:text-blue-200">Est. Revenue</div>
                  <div className="text-xl font-bold flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {estimatedRevenue.toLocaleString()}
                  </div>
                </div>
              )}
              <Button size="sm" variant="secondary" asChild className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Link to={`/queries/edit/${encodeURIComponent(query.id)}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats with dark mode support */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{totalPax}</div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Total PAX
                {query.paxDetails.infants > 0 && (
                  <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                    +{query.paxDetails.infants} infant{query.paxDetails.infants > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Clock3 className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{query.tripDuration.nights}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Nights</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{query.destination.cities.length}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Cities</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 capitalize">{query.packageType}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Package</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proposals ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="followups" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Follow-ups
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Query Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Travel Information with dark mode */}
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Travel Information
                      </CardTitle>
                      {query?.travelDates?.isEstimated && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1"
                        >
                          <Clock3 className="h-3 w-3" />
                          Dates are estimated
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-800 dark:text-blue-200">Departure</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {new Date(query.travelDates.from).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-800 dark:text-green-200">Return</span>
                        </div>
                        <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                          {new Date(query.travelDates.to).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-center">
                        <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">
                          {query.tripDuration.nights} Nights / {query.tripDuration.days} Days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Destination Details with dark mode */}
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                      <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Destination Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-6 rounded-lg border border-border">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">{query.destination.country}</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {query.cityAllocations && query.cityAllocations.length > 0 ? (
                            // Show cities with allocated nights if allocations exist
                            query.cityAllocations.map((allocation: any, index: number) => (
                              <Badge key={index} variant="outline" className="bg-background border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300">
                                {typeof allocation.city === 'string' ? allocation.city : (allocation.city as any)?.name || (allocation.city as any)?.city || 'City'} ({allocation.nights}N)
                              </Badge>
                            ))
                          ) : (
                            // Fallback to showing just city names for older queries
                            query.destination.cities.map((city: any, index: number) => (
                              <Badge key={index} variant="outline" className="bg-background border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300">
                                {typeof city === 'string' ? city : (city as any)?.name || (city as any)?.city || 'City'}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* PAX Details with dark mode */}
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Guest Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{query.paxDetails.adults}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Adults</div>
                      </div>
                      <div className="text-center bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{query.paxDetails.children}</div>
                        <div className="text-sm text-green-600 dark:text-green-400">Children</div>
                      </div>
                      <div className="text-center bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{query.paxDetails.infants}</div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">Infants</div>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Hotel className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="font-medium text-foreground">Accommodation</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{query.hotelDetails.rooms} Rooms</div>
                        <div className="text-sm text-muted-foreground">{query.hotelDetails.category} Hotel</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Package Information with dark mode */}
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                      <Plane className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Package Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                        <div className="font-medium text-indigo-800 dark:text-indigo-200 mb-1">Package Type</div>
                        <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 capitalize">
                          {query.packageType.replace('-', ' ')}
                        </Badge>
                      </div>
                      {query.budget && (
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                          <div className="font-medium text-green-800 dark:text-green-200 mb-1">Budget Range</div>
                          <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                            {formatDestinationCurrency(query.budget.min || 0)} - {formatDestinationCurrency(query.budget.max || 0)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium text-foreground mb-3">Inclusions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center">
                          <CheckCircle2 className={`h-4 w-4 mr-2 ${query.inclusions.sightseeing ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                          <span className={query.inclusions.sightseeing ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>
                            Sightseeing
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300 capitalize">
                            {query.inclusions.transfers} Transfers
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300 capitalize">
                            {query.inclusions.mealPlan.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {query.specialRequests && (
                      <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="font-medium text-amber-800 dark:text-amber-200 mb-2">Special Requests</div>
                        <p className="text-amber-700 dark:text-amber-300">{query.specialRequests}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Agent Details and Actions */}
              <div className="lg:col-span-1 space-y-6">
                {/* Agent Details */}
                <SupabaseAgentDetailsCard 
                  agentId={query?.agentUuid || ""}
                  agentName={query?.agentName}
                  agentCompany={query?.agentCompany}
                />

                {/* Assignment Actions */}
                <QueryAssignmentActions query={query} />

                {/* Proposal Actions */}
                <ProposalActions 
                  query={query} 
                  onProposalStateChange={setProposalState}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            <EnquiryTimeline query={query} />
          </TabsContent>
          
          <TabsContent value="proposals" className="space-y-6 mt-6">
            <div className="space-y-6">
              {/* Created Proposals Section - Show First */}
              {proposals.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Created Proposals ({proposals.length})</h3>
                    <Badge variant="outline" className="font-medium">
                      {proposals.length} proposal{proposals.length > 1 ? 's' : ''} ready
                    </Badge>
                  </div>
                  
                  {proposals.map((proposal) => (
                    <Card key={proposal.id} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-card border-border">
                      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold text-card-foreground">
                              {proposal.title || `Proposal ${proposal.id}`}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {proposal.description || 'Custom travel itinerary with selected services'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="capitalize font-medium">
                              {proposal.status || proposal.metadata?.status || 'Draft'}
                            </Badge>
                            <Badge variant="outline">
                              v{proposal.metadata?.version || '1'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6 space-y-6">
                        {/* Enhanced Services Summary */}
                        {proposal.modules && proposal.modules.length > 0 && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-3">
                              <h4 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                Service Details ({proposal.modules.length} Services)
                              </h4>
                              <Badge variant="outline" className="font-medium text-lg px-3 py-1">
                                Total: {formatDestinationCurrency(proposal.totals?.total || proposal.finalPrice || 0)}
                              </Badge>
                            </div>
                            
                            {/* Hotels Section */}
                            {groupedModules.hotel.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                                    <Hotel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                      Accommodation ({groupedModules.hotel.length})
                                    </h5>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      {groupedModules.hotel.length} hotel{groupedModules.hotel.length > 1 ? 's' : ''} selected
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid gap-4">
                                  {groupedModules.hotel.map((module: any, index: number) => (
                                    <Card key={module.id || index} className="border-blue-200 dark:border-blue-800 shadow-md">
                                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 pb-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <CardTitle className="text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                              <Hotel className="h-5 w-5" />
                                              {module.name}
                                            </CardTitle>
                                            {module.location && (
                                              <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {module.location}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                              {formatDestinationCurrency(module.pricing?.finalPrice || module.pricing?.basePrice || 0)}
                                            </div>
                                            {module.pricing?.basePrice && module.pricing?.finalPrice && module.pricing.basePrice !== module.pricing.finalPrice && (
                                              <div className="text-sm text-muted-foreground line-through">
                                                {formatDestinationCurrency(module.pricing.basePrice)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          {module.duration && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                              <span className="font-medium">Duration:</span>
                                              <span>{module.duration}</span>
                                            </div>
                                          )}
                                          {module.roomType && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Hotel className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                              <span className="font-medium">Room:</span>
                                              <span>{module.roomType}</span>
                                            </div>
                                          )}
                                          {module.roomCount && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                              <span className="font-medium">Rooms:</span>
                                              <span>{module.roomCount}</span>
                                            </div>
                                          )}
                                          {module.rating && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Star className="h-4 w-4 text-yellow-500" />
                                              <span className="font-medium">Rating:</span>
                                              <span>{module.rating}/5</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {(module.checkIn || module.checkOut || module.mealPlan) && (
                                          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                                            {module.checkIn && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 dark:text-blue-300 font-medium">Check-in:</span>
                                                <span>{module.checkIn}</span>
                                              </div>
                                            )}
                                            {module.checkOut && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 dark:text-blue-300 font-medium">Check-out:</span>
                                                <span>{module.checkOut}</span>
                                              </div>
                                            )}
                                            {module.mealPlan && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 dark:text-blue-300 font-medium">Meal Plan:</span>
                                                <span className="capitalize">{module.mealPlan}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {module.amenities && module.amenities.length > 0 && (
                                          <div>
                                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Amenities:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {module.amenities.map((amenity: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                                  {amenity}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transport Section */}
                            {groupedModules.transport.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                                    <Car className="h-6 w-6 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-green-800 dark:text-green-200">
                                      Transportation ({groupedModules.transport.length})
                                    </h5>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                      {groupedModules.transport.length} transport service{groupedModules.transport.length > 1 ? 's' : ''} arranged
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid gap-4">
                                  {groupedModules.transport.map((module: any, index: number) => (
                                    <Card key={module.id || index} className="border-green-200 dark:border-green-800 shadow-md">
                                      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 pb-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                                              <Car className="h-5 w-5" />
                                              {module.name}
                                            </CardTitle>
                                            {(module.route || (module.from && module.to)) && (
                                              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {module.route || `${module.from} → ${module.to}`}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                              {formatDestinationCurrency(module.pricing?.finalPrice || module.pricing?.basePrice || 0)}
                                            </div>
                                            {module.pricing?.basePrice && module.pricing?.finalPrice && module.pricing.basePrice !== module.pricing.finalPrice && (
                                              <div className="text-sm text-muted-foreground line-through">
                                                {formatDestinationCurrency(module.pricing.basePrice)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          {module.vehicleType && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              <span className="font-medium">Vehicle:</span>
                                              <span>{module.vehicleType}</span>
                                            </div>
                                          )}
                                          {module.duration && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              <span className="font-medium">Duration:</span>
                                              <span>{module.duration}</span>
                                            </div>
                                          )}
                                          {module.distance && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Map className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              <span className="font-medium">Distance:</span>
                                              <span>{module.distance}</span>
                                            </div>
                                          )}
                                          {module.capacity && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              <span className="font-medium">Capacity:</span>
                                              <span>{module.capacity}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {(module.pickupTime || module.pickupLocation || module.dropoffLocation) && (
                                          <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                                            {module.pickupTime && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-green-700 dark:text-green-300 font-medium">Pickup Time:</span>
                                                <span>{module.pickupTime}</span>
                                              </div>
                                            )}
                                            {module.pickupLocation && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-green-700 dark:text-green-300 font-medium">Pickup Location:</span>
                                                <span>{module.pickupLocation}</span>
                                              </div>
                                            )}
                                            {module.dropoffLocation && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-green-700 dark:text-green-300 font-medium">Drop-off Location:</span>
                                                <span>{module.dropoffLocation}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {module.driverDetails && (
                                          <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-3">
                                            <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Driver Details:</div>
                                            <div className="text-sm">{module.driverDetails}</div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sightseeing Section */}
                            {groupedModules.sightseeing.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                                    <Landmark className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                      Sightseeing & Activities ({groupedModules.sightseeing.length})
                                    </h5>
                                    <p className="text-sm text-orange-600 dark:text-orange-400">
                                      {groupedModules.sightseeing.length} attraction{groupedModules.sightseeing.length > 1 ? 's' : ''} & activities planned
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid gap-4">
                                  {groupedModules.sightseeing.map((module: any, index: number) => (
                                    <Card key={module.id || index} className="border-orange-200 dark:border-orange-800 shadow-md">
                                      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 pb-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <CardTitle className="text-lg text-orange-900 dark:text-orange-100 flex items-center gap-2">
                                              <Landmark className="h-5 w-5" />
                                              {module.name}
                                            </CardTitle>
                                            {module.location && (
                                              <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {module.location}
                                              </p>
                                            )}
                                            {module.description && (
                                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {module.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                                              {formatDestinationCurrency(module.pricing?.finalPrice || module.pricing?.basePrice || 0)}
                                            </div>
                                            {module.pricing?.basePrice && module.pricing?.finalPrice && module.pricing.basePrice !== module.pricing.finalPrice && (
                                              <div className="text-sm text-muted-foreground line-through">
                                                {formatDestinationCurrency(module.pricing.basePrice)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          {module.duration && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                              <span className="font-medium">Duration:</span>
                                              <span>{module.duration}</span>
                                            </div>
                                          )}
                                          {module.category && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                              <span className="font-medium">Category:</span>
                                              <span>{module.category}</span>
                                            </div>
                                          )}
                                          {module.difficulty && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                              <span className="font-medium">Difficulty:</span>
                                              <span>{module.difficulty}</span>
                                            </div>
                                          )}
                                          {module.groupSize && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                              <span className="font-medium">Group Size:</span>
                                              <span>Max {module.groupSize}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {(module.entryFees || module.guideCost || module.transportIncluded) && (
                                          <div className="bg-orange-50/50 dark:bg-orange-900/20 rounded-lg p-3 space-y-2">
                                            {module.entryFees && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-orange-700 dark:text-orange-300 font-medium">Entry Fees:</span>
                                                <span>{formatDestinationCurrency(module.entryFees)}</span>
                                              </div>
                                            )}
                                            {module.guideCost && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-orange-700 dark:text-orange-300 font-medium">Guide Cost:</span>
                                                <span>{formatDestinationCurrency(module.guideCost)}</span>
                                              </div>
                                            )}
                                            {module.transportIncluded && (
                                              <div className="flex items-center text-sm text-orange-700 dark:text-orange-300">
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Transport included
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {module.includes && module.includes.length > 0 && (
                                          <div>
                                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Includes:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {module.includes.map((item: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                                                  {item}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dining Section */}
                            {groupedModules.restaurant.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                                    <Utensils className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-purple-800 dark:text-purple-200">
                                      Dining ({groupedModules.restaurant.length})
                                    </h5>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                      {groupedModules.restaurant.length} dining experience{groupedModules.restaurant.length > 1 ? 's' : ''} included
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid gap-4">
                                  {groupedModules.restaurant.map((module: any, index: number) => (
                                    <Card key={module.id || index} className="border-purple-200 dark:border-purple-800 shadow-md">
                                      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 pb-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <CardTitle className="text-lg text-purple-900 dark:text-purple-100 flex items-center gap-2">
                                              <Utensils className="h-5 w-5" />
                                              {module.name}
                                            </CardTitle>
                                            {module.location && (
                                              <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {module.location}
                                              </p>
                                            )}
                                            {module.cuisine && (
                                              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                                {module.cuisine} Cuisine
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                              {formatDestinationCurrency(module.pricing?.finalPrice || module.pricing?.basePrice || 0)}
                                            </div>
                                            {module.pricing?.basePrice && module.pricing?.finalPrice && module.pricing.basePrice !== module.pricing.finalPrice && (
                                              <div className="text-sm text-muted-foreground line-through">
                                                {formatDestinationCurrency(module.pricing.basePrice)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          {module.mealType && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Utensils className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                              <span className="font-medium">Meal:</span>
                                              <span>{module.mealType}</span>
                                            </div>
                                          )}
                                          {module.rating && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Star className="h-4 w-4 text-yellow-500" />
                                              <span className="font-medium">Rating:</span>
                                              <span>{module.rating}/5</span>
                                            </div>
                                          )}
                                          {module.priceRange && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                              <span className="font-medium">Price Range:</span>
                                              <span>{module.priceRange}</span>
                                            </div>
                                          )}
                                          {module.seatingCapacity && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                              <span className="font-medium">Capacity:</span>
                                              <span>{module.seatingCapacity}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {(module.dietaryOptions || module.reservationRequired || module.dresscode) && (
                                          <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 space-y-2">
                                            {module.dietaryOptions && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-purple-700 dark:text-purple-300 font-medium">Dietary Options:</span>
                                                <span>{Array.isArray(module.dietaryOptions) ? module.dietaryOptions.join(', ') : module.dietaryOptions}</span>
                                              </div>
                                            )}
                                            {module.reservationRequired && (
                                              <div className="flex items-center text-sm text-purple-700 dark:text-purple-300">
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Reservation required
                                              </div>
                                            )}
                                            {module.dresscode && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-purple-700 dark:text-purple-300 font-medium">Dress Code:</span>
                                                <span>{module.dresscode}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {module.specialFeatures && module.specialFeatures.length > 0 && (
                                          <div>
                                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Special Features:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {module.specialFeatures.map((feature: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                                  {feature}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Other Services Section */}
                            {groupedModules.other.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                    <Star className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                      Additional Services ({groupedModules.other.length})
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {groupedModules.other.length} additional service{groupedModules.other.length > 1 ? 's' : ''} included
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid gap-3">
                                  {groupedModules.other.map((module: any, index: number) => (
                                    <Card key={module.id || index} className="border-gray-200 dark:border-gray-700">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h6 className="font-medium text-lg">{module.name}</h6>
                                            {module.description && (
                                              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                            )}
                                            {module.location && (
                                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {module.location}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <div className="font-semibold text-lg">
                                              {formatDestinationCurrency(module.pricing?.finalPrice || module.pricing?.basePrice || 0)}
                                            </div>
                                            {module.pricing?.basePrice && module.pricing?.finalPrice && module.pricing.basePrice !== module.pricing.finalPrice && (
                                              <div className="text-sm text-muted-foreground line-through">
                                                {formatDestinationCurrency(module.pricing.basePrice)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Enhanced Pricing Summary */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-6 border-2 border-slate-200 dark:border-slate-700">
                          <h4 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Pricing Summary
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border">
                              <p className="text-sm text-muted-foreground mb-1">Services</p>
                              <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                {proposal.modules?.length || proposal.totals?.moduleCount || 0}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border">
                              <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                {formatDestinationCurrency(proposal.totals?.subtotal || proposal.totalCost || 0)}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border">
                              <p className="text-sm text-muted-foreground mb-1">Discount</p>
                              <p className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                -{formatDestinationCurrency(proposal.totals?.discountAmount || 0)}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-lg border-2 border-purple-300 dark:border-purple-600">
                              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1 font-medium">Final Total</p>
                              <p className="font-bold text-xl text-purple-800 dark:text-purple-200">
                                {formatDestinationCurrency(proposal.totals?.total || proposal.finalPrice || 0)}
                              </p>
                            </div>
                          </div>

                          {/* Per Person Breakdown */}
                          {(proposal.totals?.total || proposal.finalPrice) && totalPax > 0 && (
                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Per Person:</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-blue-800 dark:text-blue-200">
                                    {formatDestinationCurrency((proposal.totals?.total || proposal.finalPrice || 0) / totalPax)}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    for {totalPax} passenger{totalPax > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created: {new Date(proposal.metadata?.createdAt || proposal.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                            {proposal.metadata?.updatedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Updated: {new Date(proposal.metadata.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons - Enhanced */}
                        <div className="flex justify-between items-center pt-4 border-t bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50 rounded-lg p-4 -mx-2">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newProposalId = EnhancedProposalService.duplicateProposal(proposal.id, query.id);
                                if (newProposalId) {
                                  toast({
                                    title: "New Proposal Created",
                                    description: `New proposal ${newProposalId} created successfully`
                                  });
                                  window.location.reload();
                                }
                              }}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create New
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const duplicateId = EnhancedProposalService.duplicateProposal(proposal.id);
                                if (duplicateId) {
                                  toast({
                                    title: "Proposal Duplicated",
                                    description: `Proposal duplicated as ${duplicateId}`
                                  });
                                  window.location.reload();
                                }
                              }}
                              className="hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </Button>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewProposalDetails(proposal.id)}
                              className="hover:bg-gray-50 dark:hover:bg-gray-900/20"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleSendToAgent(proposal)}
                              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send to Agent
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Create New Proposal Section - Show After Existing Proposals */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Create New Proposal</h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    New
                  </Badge>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                  <ProposalActions 
                    query={query} 
                    onProposalStateChange={setProposalState}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="followups" className="space-y-6 mt-6">
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-border">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Follow-ups Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                No follow-ups have been scheduled for this query. Stay organized by setting up follow-up reminders.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Follow-up
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Send to Agent Dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Proposal to Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="method">Send Method</Label>
                <Select 
                  value={sendOptions.method} 
                  onValueChange={(value) => setSendOptions(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={sendOptions.recipient}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder={sendOptions.method === 'email' ? 'agent@example.com' : 'Agent Name'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Priority</Label>
                <Select 
                  value={sendOptions.urgency} 
                  onValueChange={(value) => setSendOptions(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sendOptions.method === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={sendOptions.subject}
                    onChange={(e) => setSendOptions(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={sendOptions.message}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Additional message or instructions..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendProposal}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Proposal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default QueryDetails;
