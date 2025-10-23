import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Phone, Mail, Plane, Upload, 
  User, Calendar, MapPin, FileText, Camera
} from 'lucide-react';

const ClientDetailsSection: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clients = [
    {
      id: "C001",
      name: "John & Sarah Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      tripId: "P001",
      tripName: "Romantic Phuket 4N/5D",
      status: "documents-pending",
      adults: 2,
      children: 0,
      infants: 0,
      departureDate: "2024-02-14",
      flightDetails: {
        airline: "Emirates",
        pnr: "ABC123",
        arrival: "2024-02-14 10:30",
        departure: "2024-02-18 23:45"
      },
      specialNotes: "Vegetarian meals, Anniversary celebration",
      documentsUploaded: 3,
      documentsRequired: 6
    },
    {
      id: "C002",
      name: "Williams Family",
      email: "mike.williams@email.com", 
      phone: "+1-555-0456",
      tripId: "P002",
      tripName: "Family Dubai Adventure 6N/7D",
      status: "confirmed",
      adults: 2,
      children: 2,
      infants: 0,
      departureDate: "2024-03-01",
      flightDetails: {
        airline: "Qatar Airways",
        pnr: "QR789",
        arrival: "2024-03-01 08:15",
        departure: "2024-03-07 14:20"
      },
      specialNotes: "Kids meal required, First time UAE visit",
      documentsUploaded: 8,
      documentsRequired: 8
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'documents-pending':
        return <Badge variant="destructive">Documents Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'in-progress':
        return <Badge variant="outline">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const documentTypes = [
    { name: "Passport Copy", required: true, uploaded: false },
    { name: "Visa Copy", required: true, uploaded: false },
    { name: "Flight Tickets", required: true, uploaded: true },
    { name: "Travel Insurance", required: false, uploaded: false },
    { name: "Photo ID", required: true, uploaded: true },
    { name: "Medical Certificate", required: false, uploaded: false }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Client Details & Document Management
          </CardTitle>
          <CardDescription>
            Manage client information and upload required travel documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client-list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="client-list">Client List</TabsTrigger>
              <TabsTrigger value="add-client">Add New Client</TabsTrigger>
              <TabsTrigger value="bulk-upload">Bulk Document Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="client-list" className="space-y-6">
              {/* Client Cards */}
              <div className="grid gap-4">
                {clients.map((client) => (
                  <Card key={client.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Client Info */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{client.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {client.tripName} • Trip ID: {client.tripId}
                              </p>
                            </div>
                            {getStatusBadge(client.status)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.email}</div>
                                <div className="text-xs text-muted-foreground">Email</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.phone}</div>
                                <div className="text-xs text-muted-foreground">Phone</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {client.adults}A {client.children > 0 && `${client.children}C`} {client.infants > 0 && `${client.infants}I`}
                                </div>
                                <div className="text-xs text-muted-foreground">Travelers</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {new Date(client.departureDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Departure</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{client.flightDetails.airline}</div>
                                <div className="text-xs text-muted-foreground">
                                  PNR: {client.flightDetails.pnr}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {client.documentsUploaded}/{client.documentsRequired}
                                </div>
                                <div className="text-xs text-muted-foreground">Documents</div>
                              </div>
                            </div>
                          </div>

                          {client.specialNotes && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-sm font-medium mb-1">Special Notes:</div>
                              <div className="text-sm text-muted-foreground">{client.specialNotes}</div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="lg:w-48 space-y-2">
                          <Button className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Documents
                          </Button>
                          <Button variant="outline" className="w-full">
                            <User className="h-4 w-4 mr-2" />
                            Edit Details
                          </Button>
                          <Button variant="outline" className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            View All Docs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="add-client" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Client</CardTitle>
                  <CardDescription>
                    Enter client details for trip booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Lead Traveler Name</Label>
                      <Input id="clientName" placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email Address</Label>
                      <Input id="clientEmail" type="email" placeholder="john@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Phone Number</Label>
                      <Input id="clientPhone" placeholder="+1-555-0123" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tripId">Related Trip ID</Label>
                      <Input id="tripId" placeholder="P001" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adults">Adults</Label>
                      <Input id="adults" type="number" placeholder="2" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="children">Children</Label>
                      <Input id="children" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="infants">Infants</Label>
                      <Input id="infants" type="number" placeholder="0" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Flight Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="airline">Airline</Label>
                        <Input id="airline" placeholder="Emirates" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pnr">PNR/Booking Reference</Label>
                        <Input id="pnr" placeholder="ABC123" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrival">Arrival Date & Time</Label>
                        <Input id="arrival" type="datetime-local" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departure">Departure Date & Time</Label>
                        <Input id="departure" type="datetime-local" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialNotes">Special Notes</Label>
                    <Textarea 
                      id="specialNotes" 
                      placeholder="Vegetarian meals, anniversary celebration, medical requirements, etc."
                      rows={3}
                    />
                  </div>

                  <Button className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk-upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Document Upload</CardTitle>
                  <CardDescription>
                    Upload multiple documents for selected clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Support for PDF, JPG, PNG files up to 10MB each
                    </p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Document Types Checklist</h4>
                    {documentTypes.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.name}</span>
                          {doc.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                        </div>
                        <Badge variant={doc.uploaded ? "default" : "secondary"}>
                          {doc.uploaded ? "Uploaded" : "Pending"}
                        </Badge>
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

export default ClientDetailsSection;