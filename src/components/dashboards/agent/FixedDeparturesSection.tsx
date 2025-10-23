import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, MapPin, Users, Clock, 
  BookOpen, Search, Plane, Star
} from 'lucide-react';

const FixedDeparturesSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const fixedDepartures = [
    {
      id: "FD001",
      title: "Thailand Diwali Group",
      destination: "Thailand",
      cities: ["Bangkok", "Pattaya", "Phuket"],
      departureDate: "2024-11-05",
      duration: "6D/5N",
      totalSeats: 25,
      bookedSeats: 18,
      seatsLeft: 7,
      price: "$1,299",
      rating: 4.8,
      highlights: ["Cultural Festival", "Beach Resort", "City Tour"],
      status: "open"
    },
    {
      id: "FD002", 
      title: "Dubai New Year Celebration",
      destination: "Dubai, UAE",
      cities: ["Dubai", "Abu Dhabi"],
      departureDate: "2024-12-29",
      duration: "5D/4N",
      totalSeats: 30,
      bookedSeats: 28,
      seatsLeft: 2,
      price: "$1,899",
      rating: 4.9,
      highlights: ["New Year Party", "Burj Khalifa", "Desert Safari"],
      status: "filling-fast"
    },
    {
      id: "FD003",
      title: "Bali Paradise Escape",
      destination: "Bali, Indonesia",
      cities: ["Ubud", "Seminyak", "Kuta"],
      departureDate: "2024-02-14",
      duration: "7D/6N", 
      totalSeats: 20,
      bookedSeats: 5,
      seatsLeft: 15,
      price: "$999",
      rating: 4.7,
      highlights: ["Valentine Special", "Beach Villas", "Cultural Tours"],
      status: "open"
    },
    {
      id: "FD004",
      title: "Singapore Malaysia Combo",
      destination: "Singapore & Malaysia",
      cities: ["Singapore", "Kuala Lumpur", "Genting"],
      departureDate: "2024-03-15",
      duration: "8D/7N",
      totalSeats: 35,
      bookedSeats: 35,
      seatsLeft: 0,
      price: "$1,599",
      rating: 4.6,
      highlights: ["City & Hill Station", "Shopping Paradise", "Theme Parks"],
      status: "sold-out"
    }
  ];

  const getStatusBadge = (status: string, seatsLeft: number) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-500">Available</Badge>;
      case 'filling-fast':
        return <Badge variant="destructive">Filling Fast</Badge>;
      case 'sold-out':
        return <Badge variant="secondary">Sold Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDepartures = fixedDepartures.filter(departure =>
    departure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    departure.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    departure.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Fixed Departures
          </CardTitle>
          <CardDescription>
            Browse and book from our curated fixed departure packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departures by destination, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Departures Grid */}
          <div className="grid gap-6">
            {filteredDepartures.map((departure) => (
              <Card key={departure.id} className="border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Package Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{departure.title}</h3>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{departure.rating}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              • ID: {departure.id}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(departure.status, departure.seatsLeft)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(departure.departureDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Departure</div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{departure.duration}</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{departure.destination}</div>
                            <div className="text-xs text-muted-foreground">
                              {departure.cities.join(", ")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {departure.seatsLeft} seats left
                            </div>
                            <div className="text-xs text-muted-foreground">
                              of {departure.totalSeats}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div>
                        <div className="text-sm font-medium mb-2">Package Highlights:</div>
                        <div className="flex flex-wrap gap-2">
                          {departure.highlights.map((highlight, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="lg:w-48 space-y-4">
                      <div className="text-center lg:text-right">
                        <div className="text-2xl font-bold text-primary">
                          {departure.price}
                        </div>
                        <div className="text-sm text-muted-foreground">per person</div>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          disabled={departure.status === 'sold-out'}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Book Now
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={departure.status === 'sold-out'}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Hold Seat
                        </Button>
                        <Button variant="ghost" className="w-full">
                          <Plane className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedDeparturesSection;