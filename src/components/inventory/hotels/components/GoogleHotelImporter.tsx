import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseHotelsData } from '../hooks/useSupabaseHotelsData';
import { Hotel, RoomType } from '../types/hotel';
import { toast } from 'sonner';
import { Search, MapPin, Star, Building, Loader2, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface GoogleHotelImporterProps {
  onClose?: () => void;
}

interface GoogleHotelData {
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  description: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  images: string[];
  priceRange: {
    min: number;
    max: number;
  };
  totalReviews: number;
  rating: number;
}

const GoogleHotelImporter: React.FC<GoogleHotelImporterProps> = ({ onClose }) => {
  const [hotelName, setHotelName] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleHotelData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'search' | 'url'>('search');
  const { addHotel } = useSupabaseHotelsData();

  // Enhanced Mock Google search function with comprehensive hotel types
  const searchGoogleHotels = async (searchQuery: string): Promise<GoogleHotelData[]> => {
    // Simulate API delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return empty array - Google API integration should be added here
    // For now, users should add hotels manually through the hotel management interface
    return [];
    
    /*
    // Commented out mock data - Google API integration should be added here
    // For now, users should add hotels manually through the hotel management interface
    const mockResults: GoogleHotelData[] = [];
    const query = searchQuery.toLowerCase();
    
    // Enhanced Bangkok hotels search with focus on 3-star and 4-star hotels
    if (query.includes('bangkok') || query.includes('thailand')) {
      mockResults.push(
        // Bangkok Palace Hotel (4-star)
        {
          name: 'Bangkok Palace Hotel',
          address: '1091/343 New Phetchaburi Road, Makkasan, Ratchathewi, Bangkok 10400',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 4,
          description: 'Elegant 4-star hotel in Bangkok offering modern amenities with traditional Thai hospitality. Perfect location for business and leisure travelers.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center', 'Laundry Service', 'Airport Transfer'],
          latitude: 13.7563,
          longitude: 100.5618,
          phone: '+66 2 203 3000',
          website: 'https://www.bangkokpalacehotel.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
          ],
          priceRange: { min: 2500, max: 8000 },
          totalReviews: 1547,
          rating: 4.2
        },
        // The Continent Hotel Bangkok (4-star)
        {
          name: 'The Continent Hotel Bangkok',
          address: '413 Sukhumvit Road, Klongtoey, Bangkok 10110',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 4,
          description: 'Contemporary 4-star hotel located in the heart of Bangkok\'s business district. Features modern rooms and excellent facilities.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', 'Restaurant', 'Meeting Rooms', 'Concierge', 'Valet Parking'],
          latitude: 13.7308,
          longitude: 100.5418,
          phone: '+66 2 262 7000',
          website: 'https://www.continentbangkok.com',
          images: [
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 3200, max: 9500 },
          totalReviews: 2134,
          rating: 4.4
        },
        // Bangkok City Hotel (3-star)
        {
          name: 'Bangkok City Hotel',
          address: '13 Ratchadapisek Road, Huai Khwang, Bangkok 10310',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 3,
          description: 'Comfortable 3-star hotel offering great value for money in Bangkok. Clean rooms with essential amenities for budget-conscious travelers.',
          amenities: ['Free WiFi', 'Restaurant', 'Coffee Shop', '24-hour Reception', 'Laundry Service', 'Tour Desk', 'Airport Shuttle'],
          latitude: 13.7678,
          longitude: 100.5692,
          phone: '+66 2 277 1000',
          website: 'https://www.bangkokcityhotel.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
          ],
          priceRange: { min: 1200, max: 3500 },
          totalReviews: 892,
          rating: 4.0
        },
        // Royal Bangkok Hotel (4-star)
        {
          name: 'Royal Bangkok Hotel',
          address: '2 Ratchadamnoen Klang Road, Phra Nakhon, Bangkok 10200',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 4,
          description: 'Historic 4-star hotel near the Grand Palace and major attractions. Combines traditional charm with modern comfort.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Restaurant', 'Bar', 'Spa', 'Fitness Center', 'Business Center', 'Cultural Tours'],
          latitude: 13.7520,
          longitude: 100.5016,
          phone: '+66 2 222 9111',
          website: 'https://www.royalbangkokhotel.com',
          images: [
            'https://images.unsplash.com/photo-1587316117555-19acf9c4b4f4?w=800',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
          ],
          priceRange: { min: 2800, max: 7500 },
          totalReviews: 1823,
          rating: 4.3
        },
        // Bangkok Garden Hotel (3-star)
        {
          name: 'Bangkok Garden Hotel',
          address: '33/1 Silom Road, Bang Rak, Bangkok 10500',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 3,
          description: 'Cozy 3-star hotel in the bustling Silom area. Perfect for exploring Bangkok\'s nightlife and business district.',
          amenities: ['Free WiFi', 'Restaurant', 'Coffee Lounge', 'Meeting Room', '24-hour Security', 'Laundry Service'],
          latitude: 13.7245,
          longitude: 100.5343,
          phone: '+66 2 234 5678',
          website: 'https://www.bangkokgardenhotel.com',
          images: [
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 1500, max: 4200 },
          totalReviews: 654,
          rating: 3.9
        },
        // Bangkok Metro Hotel (4-star)
        {
          name: 'Bangkok Metro Hotel',
          address: '1485 New Petchburi Road, Makkasan, Ratchathewi, Bangkok 10400',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 4,
          description: 'Modern 4-star hotel with excellent connectivity to BTS and MRT stations. Ideal for business and leisure travelers.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Business Center', 'Meeting Rooms', 'Spa Services'],
          latitude: 13.7594,
          longitude: 100.5587,
          phone: '+66 2 318 8888',
          website: 'https://www.bangkokmetrohotel.com',
          images: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
          ],
          priceRange: { min: 3000, max: 8500 },
          totalReviews: 1965,
          rating: 4.1
        }
      );
    }
    
    // Advanced Phuket hotels search
    if (query.includes('phuket') || query.includes('beach') || query.includes('resort')) {
      mockResults.push(
        {
          name: 'The Pavilions Phuket',
          address: '31/1 Moo 6, Cherngtalay, Phuket 83110',
          city: 'Phuket',
          country: 'Thailand',
          starRating: 5,
          description: 'Luxury hillside resort offering stunning views and private pool villas. Each villa features traditional Thai architecture with modern luxury.',
          amenities: ['Private Pool', 'Spa', 'Restaurant', 'Bar', 'Free WiFi', 'Butler Service', 'Fitness Center', 'Beach Access', 'Golf Course Nearby'],
          latitude: 7.9919,
          longitude: 98.2968,
          phone: '+66 76 317 600',
          website: 'https://www.pavilionshotels.com/phuket',
          images: [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
          ],
          priceRange: { min: 15000, max: 45000 },
          totalReviews: 1287,
          rating: 4.6
        }
      );
    }
    
    // Advanced Dubai hotels search
    if (query.includes('dubai') || query.includes('uae') || query.includes('emirates')) {
      mockResults.push(
        {
          name: 'Burj Al Arab Jumeirah',
          address: 'Jumeirah Beach Road, Dubai, UAE',
          city: 'Dubai',
          country: 'UAE',
          starRating: 5,
          description: 'The world\'s most luxurious hotel, offering unparalleled service and amenities. An iconic sail-shaped structure standing on its own artificial island.',
          amenities: ['Private Beach', 'Helicopter Landing', 'Butler Service', 'Multiple Restaurants', 'Spa', 'Kids Club', 'Rolls-Royce Fleet', 'Private Shopping'],
          latitude: 25.1413,
          longitude: 55.1856,
          phone: '+971 4 301 7777',
          website: 'https://www.jumeirah.com/burj-al-arab',
          images: [
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
          ],
          priceRange: { min: 6000, max: 25000 },
          totalReviews: 4521,
          rating: 4.9
        }
      );
    }
    
    // Business Hotels
    if (query.includes('business') || query.includes('corporate') || query.includes('conference')) {
      mockResults.push(
        {
          name: 'Grand Business Hotel',
          address: 'Financial District, Business Center',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 4,
          description: 'Modern business hotel with state-of-the-art conference facilities and executive services.',
          amenities: ['Business Center', 'Conference Rooms', 'Executive Lounge', 'Free WiFi', 'Fitness Center', 'Restaurant', 'Valet Parking'],
          latitude: 13.7563,
          longitude: 100.5018,
          phone: '+66 2 xxx xxxx',
          website: 'https://www.grandbusiness.com',
          images: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
          ],
          priceRange: { min: 4500, max: 12000 },
          totalReviews: 1234,
          rating: 4.4
        }
      );
    }
    
    // Boutique Hotels
    if (query.includes('boutique') || query.includes('design') || query.includes('artistic')) {
      mockResults.push(
        {
          name: 'The Design Boutique Hotel',
          address: 'Arts District, Creative Quarter',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 4,
          description: 'Unique boutique hotel featuring contemporary design, local art, and personalized service.',
          amenities: ['Art Gallery', 'Rooftop Bar', 'Designer Rooms', 'Free WiFi', 'Pet Friendly', 'Local Art Tours', 'Craft Cocktails'],
          latitude: 13.7500,
          longitude: 100.4900,
          phone: '+66 2 yyy yyyy',
          website: 'https://www.designboutique.com',
          images: [
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
          ],
          priceRange: { min: 3500, max: 9000 },
          totalReviews: 567,
          rating: 4.2
        }
      );
    }
    
    // Budget Hotels
    if (query.includes('budget') || query.includes('cheap') || query.includes('affordable') || query.includes('economy')) {
      mockResults.push(
        {
          name: 'Smart Budget Inn',
          address: 'City Center, Main Street',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 3,
          description: 'Clean, comfortable, and affordable accommodation with essential amenities for budget-conscious travelers.',
          amenities: ['Free WiFi', 'Air Conditioning', '24/7 Reception', 'Luggage Storage', 'Tourist Information', 'Shared Kitchen'],
          latitude: 13.7400,
          longitude: 100.5200,
          phone: '+66 2 zzz zzzz',
          website: 'https://www.smartbudget.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 800, max: 2500 },
          totalReviews: 892,
          rating: 4.0
        }
      );
    }
    
    // Airport Hotels
    if (query.includes('airport') || query.includes('transit') || query.includes('layover')) {
      mockResults.push(
        {
          name: 'Airport Transit Hotel',
          address: 'International Airport, Terminal Area',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 4,
          description: 'Convenient airport hotel perfect for transit passengers and early flights with shuttle service.',
          amenities: ['Airport Shuttle', 'Free WiFi', '24/7 Check-in', 'Fitness Center', 'Business Center', 'Restaurant', 'Luggage Storage'],
          latitude: 13.6900,
          longitude: 100.7500,
          phone: '+66 2 aaa aaaa',
          website: 'https://www.airporttransit.com',
          images: [
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
          ],
          priceRange: { min: 3000, max: 8000 },
          totalReviews: 1456,
          rating: 4.1
        }
      );
    }
    
    // Family Hotels
    if (query.includes('family') || query.includes('kids') || query.includes('children')) {
      mockResults.push(
        {
          name: 'Family Paradise Resort',
          address: 'Family District, Entertainment Zone',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 4,
          description: 'Family-friendly hotel with kids activities, family rooms, and entertainment facilities.',
          amenities: ['Kids Club', 'Family Pool', 'Playground', 'Baby Sitting', 'Family Rooms', 'Game Room', 'Free WiFi', 'Restaurant'],
          latitude: 13.7600,
          longitude: 100.4800,
          phone: '+66 2 bbb bbbb',
          website: 'https://www.familyparadise.com',
          images: [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800'
          ],
          priceRange: { min: 4000, max: 12000 },
          totalReviews: 2134,
          rating: 4.3
        }
      );
    }
    
    // Spa & Wellness Hotels
    if (query.includes('spa') || query.includes('wellness') || query.includes('health') || query.includes('retreat')) {
      mockResults.push(
        {
          name: 'Wellness Spa Retreat',
          address: 'Tranquil Gardens, Wellness District',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 5,
          description: 'Luxury wellness retreat offering comprehensive spa treatments, yoga, and holistic health programs.',
          amenities: ['Full Service Spa', 'Yoga Studio', 'Meditation Garden', 'Healthy Cuisine', 'Fitness Center', 'Wellness Programs', 'Organic Garden'],
          latitude: 13.7300,
          longitude: 100.4700,
          phone: '+66 2 ccc cccc',
          website: 'https://www.wellnessretreat.com',
          images: [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
          ],
          priceRange: { min: 8000, max: 20000 },
          totalReviews: 987,
          rating: 4.7
        }
      );
    }
    
    // Luxury Hotels
    if (query.includes('luxury') || query.includes('premium') || query.includes('deluxe') || query.includes('5 star')) {
      mockResults.push(
        {
          name: 'The Luxury Collection',
          address: 'Premium District, Elite Avenue',
          city: searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery,
          country: 'Thailand',
          starRating: 5,
          description: 'Ultra-luxury hotel offering world-class amenities, personalized service, and exclusive experiences.',
          amenities: ['Butler Service', 'Private Pool', 'Michelin Restaurant', 'Spa', 'Helicopter Service', 'Personal Shopping', 'Yacht Charter'],
          latitude: 13.7563,
          longitude: 100.5018,
          phone: '+66 2 ddd dddd',
          website: 'https://www.luxurycollection.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
          ],
          priceRange: { min: 15000, max: 50000 },
          totalReviews: 1542,
          rating: 4.8
        }
      );
    }
    
    // Generic comprehensive results for any search term
    if (mockResults.length === 0) {
      const city = searchQuery.includes(' ') ? searchQuery.split(' ')[0] : searchQuery;
      
      // Always include multiple hotel types for comprehensive results
      mockResults.push(
        {
          name: `${city} Grand Hotel & Resort`,
          address: `123 Main Street, ${city}`,
          city: city,
          country: 'Thailand',
          starRating: 4,
          description: `Premium hotel in ${city} offering modern amenities and excellent service with panoramic city views.`,
          amenities: ['Free WiFi', 'Swimming Pool', 'Restaurant', 'Fitness Center', 'Room Service', 'Business Center', 'Spa'],
          latitude: 13.7563,
          longitude: 100.5018,
          phone: '+66 2 xxx xxxx',
          website: `https://www.${city.toLowerCase()}-grand.com`,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 3500, max: 12000 },
          totalReviews: 892,
          rating: 4.3
        },
        {
          name: `${city} Boutique Inn`,
          address: `456 Central Avenue, ${city}`,
          city: city,
          country: 'Thailand',
          starRating: 3,
          description: `Charming boutique hotel in ${city} with personalized service and unique design elements.`,
          amenities: ['Free WiFi', 'Rooftop Bar', 'Restaurant', 'Pet Friendly', 'Local Tours', 'Art Gallery'],
          latitude: 13.7500,
          longitude: 100.4900,
          phone: '+66 2 yyy yyyy',
          website: `https://www.${city.toLowerCase()}-boutique.com`,
          images: [
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
          ],
          priceRange: { min: 2500, max: 8000 },
          totalReviews: 456,
          rating: 4.1
        },
        {
          name: `${city} Business Center Hotel`,
          address: `789 Business District, ${city}`,
          city: city,
          country: 'Thailand',
          starRating: 4,
          description: `Modern business hotel in ${city} with executive facilities and corporate amenities.`,
          amenities: ['Business Center', 'Conference Rooms', 'Executive Lounge', 'Free WiFi', 'Fitness Center', 'Valet Parking'],
          latitude: 13.7600,
          longitude: 100.5100,
          phone: '+66 2 zzz zzzz',
          website: `https://www.${city.toLowerCase()}-business.com`,
          images: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
          ],
          priceRange: { min: 4000, max: 11000 },
          totalReviews: 1123,
          rating: 4.2
        },
        {
          name: `${city} Budget Stay`,
          address: `321 Economy Street, ${city}`,
          city: city,
          country: 'Thailand',
          starRating: 2,
          description: `Affordable accommodation in ${city} with clean rooms and essential amenities for budget travelers.`,
          amenities: ['Free WiFi', 'Air Conditioning', '24/7 Reception', 'Luggage Storage', 'Shared Kitchen'],
          latitude: 13.7400,
          longitude: 100.4800,
          phone: '+66 2 aaa aaaa',
          website: `https://www.${city.toLowerCase()}-budget.com`,
          images: [
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
          ],
          priceRange: { min: 800, max: 3000 },
          totalReviews: 678,
          rating: 3.8
        }
      );
    }
    
    // return mockResults;
    */
  };

  // Parse Google Travel URL to extract hotel data - supports ALL hotel types
  const parseGoogleTravelUrl = (url: string): GoogleHotelData[] => {
    // Return empty array - Google API integration should be added here
    // For now, users should add hotels manually through the hotel management interface
    return [];
    
    /*
    // Commented out mock data - Google API integration should be added here
    // Detect location from URL to provide relevant hotels
    const urlLower = url.toLowerCase();
    let mockHotels: GoogleHotelData[] = [];

    // Bangkok hotels
    if (urlLower.includes('bangkok') || (!urlLower.includes('phuket') && !urlLower.includes('dubai'))) {
      mockHotels.push(
        // 5-Star Luxury Hotels
        {
          name: 'The Sukhothai Bangkok',
          address: '13/3 South Sathorn Road, Bangkok 10120',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 5,
          description: 'An elegant luxury hotel in the heart of Bangkok, featuring traditional Thai architecture and world-class amenities.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', 'Multiple Restaurants', 'Butler Service', 'Concierge', 'Valet Parking'],
          latitude: 13.7244,
          longitude: 100.5316,
          phone: '+66 2 344 8888',
          website: 'https://www.sukhothai.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
          ],
          priceRange: { min: 8500, max: 25000 },
          totalReviews: 2847,
          rating: 4.8
        },
        // 4-Star Hotels
        {
          name: 'Bangkok Palace Hotel',
          address: '1091/343 New Phetchaburi Road, Makkasan, Ratchathewi, Bangkok 10400',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 4,
          description: 'Elegant 4-star hotel in Bangkok offering modern amenities with traditional Thai hospitality.',
          amenities: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center'],
          latitude: 13.7563,
          longitude: 100.5618,
          phone: '+66 2 203 3000',
          website: 'https://www.bangkokpalacehotel.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
          ],
          priceRange: { min: 2500, max: 8000 },
          totalReviews: 1547,
          rating: 4.2
        },
        // 3-Star Hotels
        {
          name: 'Bangkok City Hotel',
          address: '13 Ratchadapisek Road, Huai Khwang, Bangkok 10310',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 3,
          description: 'Comfortable 3-star hotel offering great value for money in Bangkok.',
          amenities: ['Free WiFi', 'Restaurant', 'Coffee Shop', '24-hour Reception', 'Laundry Service'],
          latitude: 13.7678,
          longitude: 100.5692,
          phone: '+66 2 277 1000',
          website: 'https://www.bangkokcityhotel.com',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
          ],
          priceRange: { min: 1200, max: 3500 },
          totalReviews: 892,
          rating: 4.0
        },
        // 2-Star Budget Hotels
        {
          name: 'Bangkok Budget Inn',
          address: '45 Khao San Road, Phra Nakhon, Bangkok 10200',
          city: 'Bangkok',
          country: 'Thailand',
          starRating: 2,
          description: 'Clean and affordable accommodation in the heart of Bangkok\'s backpacker district.',
          amenities: ['Free WiFi', 'Air Conditioning', '24-hour Reception', 'Shared Kitchen', 'Luggage Storage'],
          latitude: 13.7588,
          longitude: 100.4983,
          phone: '+66 2 282 9999',
          website: 'https://www.bangkokbudgetinn.com',
          images: [
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 800, max: 2000 },
          totalReviews: 456,
          rating: 3.8
        }
      );
    }

    // Phuket luxury resorts (including Anantara example)
    if (urlLower.includes('phuket') || urlLower.includes('luxury') || urlLower.includes('resort')) {
      mockHotels.push(
        // 5-Star Luxury Resorts
        {
          name: 'Anantara Layan Phuket Resort',
          address: '168 Moo 6, Layan Beach, Choeng Thale, Phuket 83110',
          city: 'Phuket',
          country: 'Thailand',
          starRating: 5,
          description: 'Ultra-luxury beachfront resort with private pool villas and world-class spa facilities. Perfect for romantic getaways and family vacations.',
          amenities: ['Private Pool Villas', 'Beachfront', 'World-Class Spa', 'Multiple Restaurants', 'Kids Club', 'Butler Service', 'Golf Course', 'Water Sports'],
          latitude: 8.0157,
          longitude: 98.2919,
          phone: '+66 76 336 100',
          website: 'https://www.anantara.com/en/layan-phuket',
          images: [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800'
          ],
          priceRange: { min: 15000, max: 50000 },
          totalReviews: 1876,
          rating: 4.9
        },
        {
          name: 'The Pavilions Phuket',
          address: '31/1 Moo 6, Cherngtalay, Phuket 83110',
          city: 'Phuket',
          country: 'Thailand',
          starRating: 5,
          description: 'Luxury hillside resort offering stunning views and private pool villas.',
          amenities: ['Private Pool', 'Spa', 'Restaurant', 'Bar', 'Free WiFi', 'Butler Service', 'Fitness Center', 'Beach Access'],
          latitude: 7.9919,
          longitude: 98.2968,
          phone: '+66 76 317 600',
          website: 'https://www.pavilionshotels.com/phuket',
          images: [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
          ],
          priceRange: { min: 12000, max: 35000 },
          totalReviews: 1287,
          rating: 4.6
        },
        // 4-Star Beach Hotels
        {
          name: 'Phuket Beach Resort',
          address: '99 Moo 3, Kamala Beach, Phuket 83150',
          city: 'Phuket',
          country: 'Thailand',
          starRating: 4,
          description: 'Beautiful beachfront resort with modern amenities and stunning ocean views.',
          amenities: ['Beachfront', 'Swimming Pool', 'Spa', 'Restaurant', 'Bar', 'Water Sports', 'Free WiFi'],
          latitude: 7.9644,
          longitude: 98.2789,
          phone: '+66 76 385 200',
          website: 'https://www.phuketbeachresort.com',
          images: [
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
          ],
          priceRange: { min: 4500, max: 12000 },
          totalReviews: 2341,
          rating: 4.3
        },
        // 3-Star Beach Hotels
        {
          name: 'Phuket Island View Hotel',
          address: '123 Patong Beach Road, Patong, Phuket 83150',
          city: 'Phuket',
          country: 'Thailand',
          starRating: 3,
          description: 'Comfortable beach hotel with great location near Patong\'s attractions.',
          amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Free WiFi', 'Tour Desk'],
          latitude: 7.8971,
          longitude: 98.2968,
          phone: '+66 76 344 100',
          website: 'https://www.phuketislandview.com',
          images: [
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
          ],
          priceRange: { min: 2200, max: 6500 },
          totalReviews: 987,
          rating: 4.1
        }
      );
    }

    // Dubai luxury hotels
    if (urlLower.includes('dubai') || urlLower.includes('uae')) {
      mockHotels.push(
        {
          name: 'Burj Al Arab Jumeirah',
          address: 'Jumeirah Beach Road, Dubai, UAE',
          city: 'Dubai',
          country: 'UAE',
          starRating: 5,
          description: 'The world\'s most luxurious hotel, offering unparalleled service and amenities.',
          amenities: ['Private Beach', 'Helicopter Landing', 'Butler Service', 'Multiple Restaurants', 'Spa', 'Kids Club'],
          latitude: 25.1413,
          longitude: 55.1856,
          phone: '+971 4 301 7777',
          website: 'https://www.jumeirah.com/burj-al-arab',
          images: [
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
          ],
          priceRange: { min: 6000, max: 25000 },
          totalReviews: 4521,
          rating: 4.9
        }
      );
    }

    // Return ALL hotel types (no filtering by star rating)
    // return mockHotels;
    */
  };

  const handleSearch = async () => {
    if (!hotelName.trim()) {
      toast.error('Please enter a hotel name to search');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchGoogleHotels(hotelName);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No hotels found for your search query');
      } else {
        toast.success(`Found ${results.length} hotel(s) matching your search`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search hotels. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!googleUrl.trim()) {
      toast.error('Please enter a Google Travel URL');
      return;
    }
    
    setIsSearching(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = parseGoogleTravelUrl(googleUrl);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No compatible hotels found in this Google Travel link.');
      } else {
        toast.success(`Found ${results.length} hotels from Google Travel link (all hotel types included)`);
      }
    } catch (error) {
      console.error('URL import error:', error);
      toast.error('Failed to import from Google Travel URL. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const createRoomTypesForHotel = (hotelData: GoogleHotelData): RoomType[] => {
    const now = new Date().toISOString();
    const currency = hotelData.country === 'UAE' ? 'AED' : 'THB';
    const currencySymbol = hotelData.country === 'UAE' ? 'د.إ' : '฿';
    
    // Base price multiplier based on star rating
    const basePriceMultiplier = hotelData.starRating * 1000;
    
    return [
      {
        id: `room_${Date.now()}_deluxe`,
        name: 'Deluxe Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed or 2 Twin Beds',
        mealPlan: 'Bed & Breakfast' as const,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        adultPrice: basePriceMultiplier * (hotelData.country === 'UAE' ? 0.8 : 1),
        childPrice: basePriceMultiplier * 0.5 * (hotelData.country === 'UAE' ? 0.8 : 1),
        extraBedPrice: basePriceMultiplier * 0.3 * (hotelData.country === 'UAE' ? 0.8 : 1),
        description: 'Elegant room with modern amenities and beautiful views',
        amenities: ['Free WiFi', 'Air Conditioning', 'Minibar', 'Coffee Machine', 'Safe'],
        images: [],
        status: 'active' as const,
        maxOccupancy: 3,
        bedType: 'King/Twin',
        inventory: 15,
        currency,
        currencySymbol
      },
      {
        id: `room_${Date.now()}_suite`,
        name: 'Executive Suite',
        capacity: { adults: 3, children: 2 },
        configuration: '1 King Bed + Living Area',
        mealPlan: 'Bed & Breakfast' as const,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        adultPrice: basePriceMultiplier * 1.8 * (hotelData.country === 'UAE' ? 0.8 : 1),
        childPrice: basePriceMultiplier * 0.9 * (hotelData.country === 'UAE' ? 0.8 : 1),
        extraBedPrice: basePriceMultiplier * 0.5 * (hotelData.country === 'UAE' ? 0.8 : 1),
        description: 'Spacious suite with separate living area and premium amenities',
        amenities: ['Free WiFi', 'Air Conditioning', 'Minibar', 'Coffee Machine', 'Safe', 'Butler Service'],
        images: [],
        status: 'active' as const,
        maxOccupancy: 5,
        bedType: 'King',
        inventory: 8,
        currency,
        currencySymbol
      }
    ];
  };

  const handleImportHotel = async (googleHotel: GoogleHotelData) => {
    setIsImporting(true);
    try {
      const currency = googleHotel.country === 'UAE' ? 'AED' : 'THB';
      const currencySymbol = googleHotel.country === 'UAE' ? 'د.إ' : '฿';
      
      const hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'> = {
        name: googleHotel.name,
        brand: googleHotel.name.split(' ')[0],
        starRating: googleHotel.starRating as any,
        category: 'Luxury Hotel',
        description: googleHotel.description,
        country: googleHotel.country,
        city: googleHotel.city,
        location: googleHotel.address.split(',')[0] || 'City Center',
        address: {
          street: googleHotel.address,
          city: googleHotel.city,
          state: googleHotel.city,
          zipCode: '00000',
          country: googleHotel.country
        },
        latitude: googleHotel.latitude || 0,
        longitude: googleHotel.longitude || 0,
        googleMapLink: `https://maps.google.com/?q=${googleHotel.latitude || 0},${googleHotel.longitude || 0}`,
        contactInfo: {
          phone: googleHotel.phone || '+1 xxx xxx xxxx',
          email: `info@${googleHotel.name.toLowerCase().replace(/\s+/g, '')}.com`,
          website: googleHotel.website
        },
        facilities: googleHotel.amenities,
        amenities: googleHotel.amenities,
        roomTypes: createRoomTypesForHotel(googleHotel),
        images: googleHotel.images.map((url, index) => ({
          id: `img_${Date.now()}_${index}`,
          url,
          isPrimary: index === 0,
          alt: `${googleHotel.name} - Image ${index + 1}`
        })),
        minRate: googleHotel.starRating * 1000,
        checkInTime: '15:00',
        checkOutTime: '12:00',
        policies: {
          cancellation: 'Free cancellation up to 24 hours before check-in',
          children: 'Children under 12 stay free when using existing bedding',
          pets: 'Pets not allowed',
          payment: 'All major credit cards accepted'
        },
        status: 'active',
        lastUpdated: new Date().toISOString(),
        currency,
        currencySymbol
      };

      const newHotel = addHotel(hotelData);
      
      toast.success(`${googleHotel.name} has been imported successfully!`, {
        description: `Added with ${hotelData.roomTypes.length} room types in ${currency}`
      });
      
      // Remove the imported hotel from results
      setSearchResults(prev => prev.filter(h => h.name !== googleHotel.name));
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import hotel. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <CardTitle>Import Hotel from Google</CardTitle>
        </div>
        <CardDescription>
          Search for hotels using Google data and import them with automatic room type generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Mode Toggle */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Import Method:</Label>
          <div className="flex gap-2">
            <Button
              variant={importMode === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('search')}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Hotels
            </Button>
            <Button
              variant={importMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('url')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Google Travel URL
            </Button>
          </div>
        </div>

        {/* Search Section */}
        {importMode === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="hotel-search">Hotel Name or Location</Label>
                <Input
                  id="hotel-search"
                  placeholder="e.g., Bangkok hotels, Mandarin Oriental Bangkok..."
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !hotelName.trim()}
                  className="min-w-[100px]"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> Search for "Phuket luxury resorts" to get all hotel types 
                including luxury resorts like Anantara, or "Bangkok hotels" for city options.
              </p>
            </div>
          </div>
        )}

        {/* Google URL Section */}
        {importMode === 'url' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="google-url">Google Travel URL</Label>
                <Input
                  id="google-url"
                  placeholder="Paste Google Travel search URL here..."
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleImportFromUrl()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleImportFromUrl}
                  disabled={isSearching || !googleUrl.trim()}
                  className="min-w-[120px]"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Import from URL
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                🔗 <strong>Google Travel URL Import:</strong> Paste your Google Travel search URL 
                to automatically import ALL types of hotels (2-star to 5-star luxury resorts).
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Supports budget hotels, business hotels, luxury resorts like Anantara Layan Phuket Resort, and everything in between.
              </p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search Results ({searchResults.length} found)</h3>
              <div className="grid gap-4">
                {searchResults.map((hotel, index) => (
                  <Card key={index} className="overflow-hidden">
                     <CardContent className="p-0">
                       <div className="flex gap-4">
                         {/* Hotel Image Preview */}
                         {hotel.images.length > 0 && (
                           <div className="w-48 h-32 flex-shrink-0">
                             <img 
                               src={hotel.images[0]} 
                               alt={hotel.name}
                               className="w-full h-full object-cover rounded-l-lg"
                               onError={(e) => {
                                 e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                               }}
                             />
                           </div>
                         )}
                         
                         {/* Hotel Details */}
                         <div className="flex-1 p-4 space-y-3">
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <div className="flex items-start justify-between mb-2">
                                 <h4 className="text-lg font-semibold">{hotel.name}</h4>
                                 <Button
                                   onClick={() => handleImportHotel(hotel)}
                                   disabled={isImporting}
                                   className="min-w-[100px] ml-4"
                                 >
                                   {isImporting ? (
                                     <>
                                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                       Importing...
                                     </>
                                   ) : (
                                     <>
                                       <Plus className="h-4 w-4 mr-2" />
                                       Import
                                     </>
                                   )}
                                 </Button>
                               </div>
                               
                               <div className="flex items-center gap-4 mb-2">
                                 <div className="flex items-center gap-2">
                                   <div className="flex">
                                     {Array.from({ length: hotel.starRating }).map((_, i) => (
                                       <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                     ))}
                                   </div>
                                   <Badge variant="secondary">{hotel.starRating} Star</Badge>
                                 </div>
                                 
                                 <div className="flex items-center gap-1">
                                   <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                   <span className="text-sm font-medium">{hotel.rating}</span>
                                   <span className="text-xs text-muted-foreground">({hotel.totalReviews.toLocaleString()} reviews)</span>
                                 </div>
                                 
                                 <div className="text-sm font-medium text-green-600">
                                   {hotel.country === 'UAE' ? 'AED' : '฿'} {hotel.priceRange.min.toLocaleString()} - {hotel.priceRange.max.toLocaleString()}/night
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <MapPin className="h-4 w-4" />
                             <span>{hotel.address}</span>
                           </div>
                           
                           <p className="text-sm text-muted-foreground line-clamp-2">
                             {hotel.description}
                           </p>
                           
                           <div className="flex flex-wrap gap-1">
                             {hotel.amenities.slice(0, 8).map((amenity, i) => (
                               <Badge key={i} variant="outline" className="text-xs">
                                 {amenity}
                               </Badge>
                             ))}
                             {hotel.amenities.length > 8 && (
                               <Badge variant="outline" className="text-xs">
                                 +{hotel.amenities.length - 8} more
                               </Badge>
                             )}
                           </div>
                           
                           <div className="flex items-center justify-between text-xs text-muted-foreground">
                             <div className="flex items-center gap-4">
                               <span>📞 {hotel.phone}</span>
                               {hotel.website && (
                                 <span>🌐 {hotel.website}</span>
                               )}
                             </div>
                             <div className="text-xs text-muted-foreground">
                               {hotel.images.length} images available
                             </div>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Results Message */}
        {!isSearching && searchResults.length === 0 && hotelName && (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hotels found for "{hotelName}"</p>
            <p className="text-sm text-muted-foreground mt-1">Try different search terms or check spelling</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleHotelImporter;