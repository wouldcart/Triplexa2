import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, Share, Mail, MessageSquare, FileText, 
  Hotel, Calendar, Car, FileCheck, Shield, Search
} from 'lucide-react';

const DocumentsSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const confirmedTrips = [
    {
      id: "P001",
      clientName: "John & Sarah Smith",
      tripName: "Romantic Phuket 4N/5D",
      destination: "Phuket, Thailand",
      departureDate: "2024-02-14",
      status: "confirmed",
      documentsGenerated: 6,
      totalDocuments: 7,
      documents: [
        { type: "Hotel Voucher", cities: ["Phuket"], status: "ready", size: "245 KB" },
        { type: "Day-wise Itinerary", status: "ready", size: "1.2 MB" },
        { type: "Transfer Schedule", status: "ready", size: "156 KB" },
        { type: "Invoice", status: "ready", size: "89 KB" },
        { type: "Visa Support Letter", status: "ready", size: "67 KB" },
        { type: "Travel Insurance", status: "pending", size: "-" },
        { type: "Emergency Contacts", status: "ready", size: "45 KB" }
      ]
    },
    {
      id: "P002",
      clientName: "Williams Family", 
      tripName: "Family Dubai Adventure 6N/7D",
      destination: "Dubai, UAE",
      departureDate: "2024-03-01",
      status: "confirmed",
      documentsGenerated: 8,
      totalDocuments: 8,
      documents: [
        { type: "Hotel Voucher", cities: ["Dubai", "Abu Dhabi"], status: "ready", size: "312 KB" },
        { type: "Day-wise Itinerary", status: "ready", size: "1.8 MB" },
        { type: "Transfer Schedule", status: "ready", size: "201 KB" },
        { type: "Invoice", status: "ready", size: "95 KB" },
        { type: "Visa Support Letter", status: "ready", size: "71 KB" },
        { type: "Travel Insurance", status: "ready", size: "134 KB" },
        { type: "Emergency Contacts", status: "ready", size: "52 KB" },
        { type: "Activity Vouchers", status: "ready", size: "445 KB" }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default">Ready</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel voucher':
        return Hotel;
      case 'day-wise itinerary':
        return Calendar;
      case 'transfer schedule':
        return Car;
      case 'travel insurance':
        return Shield;
      default:
        return FileText;
    }
  };

  const filteredTrips = confirmedTrips.filter(trip =>
    trip.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Downloadable Tour Documents
          </CardTitle>
          <CardDescription>
            Access and share final travel documents for confirmed trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList>
              <TabsTrigger value="documents">Trip Documents</TabsTrigger>
              <TabsTrigger value="sharing">Sharing Options</TabsTrigger>
              <TabsTrigger value="templates">Document Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search confirmed trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Confirmed Trips */}
              <div className="space-y-6">
                {filteredTrips.map((trip) => (
                  <Card key={trip.id} className="border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{trip.clientName}</CardTitle>
                          <CardDescription>
                            {trip.tripName} • {trip.destination} • Departure: {new Date(trip.departureDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Confirmed</Badge>
                          <Badge variant="outline">
                            {trip.documentsGenerated}/{trip.totalDocuments} Ready
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Document Grid */}
                      <div className="grid gap-3 mb-6">
                        {trip.documents.map((doc, index) => {
                          const Icon = getDocumentIcon(doc.type);
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{doc.type}</div>
                                  {doc.cities && (
                                    <div className="text-sm text-muted-foreground">
                                      {doc.cities.join(", ")}
                                    </div>
                                  )}
                                  {doc.size !== "-" && (
                                    <div className="text-xs text-muted-foreground">{doc.size}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(doc.status)}
                                {doc.status === 'ready' && (
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button>
                          <Download className="h-4 w-4 mr-2" />
                          Download All (ZIP)
                        </Button>
                        <Button variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          Email to Client
                        </Button>
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Share via WhatsApp
                        </Button>
                        <Button variant="outline">
                          <Share className="h-4 w-4 mr-2" />
                          Generate Share Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sharing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Sharing Options</CardTitle>
                  <CardDescription>
                    Choose how to share documents with your clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Mail className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                        <h3 className="font-semibold mb-2">Email Delivery</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Send documents directly to client's email
                        </p>
                        <Button variant="outline" className="w-full">
                          Setup Email Sharing
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="font-semibold mb-2">WhatsApp Sharing</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Share via WhatsApp with download links
                        </p>
                        <Button variant="outline" className="w-full">
                          Setup WhatsApp
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Share className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                        <h3 className="font-semibold mb-2">Secure Link</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate password-protected download links
                        </p>
                        <Button variant="outline" className="w-full">
                          Create Secure Link
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <FileCheck className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="font-semibold mb-2">Client Portal</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload to client portal for access
                        </p>
                        <Button variant="outline" className="w-full">
                          Upload to Portal
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Templates</CardTitle>
                  <CardDescription>
                    Customize document templates and formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {[
                      { name: "Hotel Voucher Template", description: "Customize hotel voucher format and branding", status: "active" },
                      { name: "Itinerary Template", description: "Day-wise itinerary layout and styling", status: "active" },
                      { name: "Invoice Template", description: "Commission inclusive invoice format", status: "draft" },
                      { name: "Visa Support Letter", description: "Standard visa support documentation", status: "active" },
                      { name: "Emergency Contact Sheet", description: "Emergency contacts and procedures", status: "active" }
                    ].map((template, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">{template.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(template.status)}
                          <Button variant="outline" size="sm">
                            Edit Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsSection;