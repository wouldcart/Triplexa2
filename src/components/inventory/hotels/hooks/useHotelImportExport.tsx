
import { useState } from 'react';
import { Hotel, RoomType } from '../types/hotel';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const useHotelImportExport = (
  hotels: Hotel[], 
  filteredHotels: Hotel[], 
  setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>,
  saveHotels: (hotels: Hotel[]) => boolean
) => {
  const { toast } = useToast();

  // Import hotels data from Excel
  const importHotels = async (importedHotelData: any[], roomTypesData: any[] = []) => {
    try {
      if (!Array.isArray(importedHotelData) || importedHotelData.length === 0) {
        throw new Error('Invalid data format or empty data');
      }

      console.log('Importing hotels from Excel:', importedHotelData);
      console.log('Importing room types from Excel:', roomTypesData);
      
      // Process the Excel data to match the Hotel type
      const importedHotels: Hotel[] = importedHotelData.map((row, index) => {
        // Create a complete hotel structure with all required properties
        const hotel: Hotel = {
          id: `imported-${Date.now()}-${index}`,
          name: row['Hotel Name'] || `Imported Hotel ${index + 1}`,
          description: row['Description'] || '',
          starRating: (parseInt(row['Star Rating']) || 3) as any,
          category: row['Category'] || 'Standard',
          country: row['Country'] || '',
          city: row['City'] || '',
          location: row['Location'] || '',
          address: {
            street: row['Street'] || '',
            city: row['City'] || '',
            state: row['State'] || '',
            zipCode: row['Zip Code'] || '',
            country: row['Country'] || ''
          },
          latitude: parseFloat(row['Latitude'] || '0'),
          longitude: parseFloat(row['Longitude'] || '0'),
          googleMapLink: row['Google Map Link'] || '',
          contactInfo: {
            phone: row['Phone'] || '',
            email: row['Email'] || '',
            website: row['Website'] || ''
          },
          checkInTime: row['Check-in'] || '14:00',
          checkOutTime: row['Check-out'] || '12:00',
          facilities: Array.isArray(row['Facilities']) 
            ? row['Facilities'] 
            : (row['Facilities'] || '').toString().split(',').map((f: string) => f.trim()).filter(Boolean),
          amenities: Array.isArray(row['Amenities']) 
            ? row['Amenities'] 
            : (row['Amenities'] || '').toString().split(',').map((a: string) => a.trim()).filter(Boolean),
          images: [],
          status: (row['Status'] || 'draft') as 'active' | 'inactive' | 'draft',
          roomTypes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          policies: {
            cancellation: row['Cancellation Policy'] || 'Standard 24-hour cancellation policy applies',
            children: row['Children Policy'] || 'Children of all ages are welcome',
            pets: row['Pet Policy'] || 'No pets allowed',
            payment: row['Payment Policy'] || 'Credit card required for reservation'
          },
          price: parseFloat(row['Price'] || '0'),
          minRate: parseFloat(row['Min Rate'] || '0'),
          currency: row['Currency'] || 'USD',
          currencySymbol: row['Currency Symbol'] || '$'
        };
        
        return hotel;
      });
      
      // If we have separate room types data, associate them with the hotels
      if (roomTypesData.length > 0) {
        roomTypesData.forEach((roomData) => {
          const hotelName = roomData['Hotel Name'];
          if (!hotelName) return;
          
          const targetHotel = importedHotels.find(hotel => hotel.name === hotelName);
          if (!targetHotel) return;
          
          // Create a complete room type object
          const roomType: RoomType = {
            id: `imported-room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: roomData['Room Name'] || 'Standard Room',
            capacity: {
              adults: parseInt(roomData['Adult Capacity'] || '2'),
              children: parseInt(roomData['Child Capacity'] || '1')
            },
            configuration: roomData['Configuration'] || 'King Bed',
            mealPlan: (roomData['Meal Plan'] || 'Room Only') as any,
            validFrom: roomData['Valid From'] || new Date().toISOString(),
            validTo: roomData['Valid To'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            adultPrice: parseFloat(roomData['Adult Price'] || '100'),
            childPrice: parseFloat(roomData['Child Price'] || '50'),
            extraBedPrice: parseFloat(roomData['Extra Bed Price'] || '25'),
            description: roomData['Description'] || '',
            amenities: Array.isArray(roomData['Amenities']) 
              ? roomData['Amenities'] 
              : (roomData['Amenities'] || '').toString().split(',').map((a: string) => a.trim()).filter(Boolean),
            images: [],
            status: (roomData['Status'] || 'active') as 'active' | 'inactive' | 'draft',
            maxOccupancy: parseInt(roomData['Max Occupancy'] || '3'),
            bedType: roomData['Bed Type'] || 'King',
            seasonStart: roomData['Season Start'] || roomData['Valid From'] || new Date().toISOString(),
            seasonEnd: roomData['Season End'] || roomData['Valid To'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            adultRate: parseFloat(roomData['Adult Rate'] || roomData['Adult Price'] || '100'),
            childRate: parseFloat(roomData['Child Rate'] || roomData['Child Price'] || '50'),
            inventory: parseInt(roomData['Inventory'] || '10'),
            currency: roomData['Currency'] || targetHotel.currency || 'USD',
            currencySymbol: roomData['Currency Symbol'] || targetHotel.currencySymbol || '$',
          };
          
          // Add the room type to the hotel
          targetHotel.roomTypes.push(roomType);
        });
      } else {
        // If no separate room types data, try to extract from the hotel data
        importedHotels.forEach(hotel => {
          if (!hotel.roomTypes) {
            hotel.roomTypes = [];
          }
          
          // If there are room types in the data, try to parse them
          const rowData = importedHotelData.find(h => h['Hotel Name'] === hotel.name);
          if (rowData && rowData['Room Types']) {
            const roomTypeNames = (rowData['Room Types'] || '').toString()
              .split(',').map((rt: string) => rt.trim()).filter(Boolean);
            
            // Create complete room types
            hotel.roomTypes = roomTypeNames.map((name: string, rtIndex: number) => ({
              id: `imported-room-${Date.now()}-${rtIndex}`,
              name,
              description: '',
              configuration: 'King Bed',
              status: 'active',
              images: [],
              adultPrice: parseFloat(rowData['Min Price'] || '100'),
              childPrice: parseFloat(rowData['Min Price'] || '50') / 2,
              extraBedPrice: parseFloat(rowData['Extra Bed Price'] || '25'),
              capacity: {
                adults: 2,
                children: 1
              },
              amenities: [],
              validFrom: new Date().toISOString(),
              validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
              mealPlan: 'Room Only',
              maxOccupancy: 3,
              bedType: 'King',
              seasonStart: new Date().toISOString(),
              seasonEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
              adultRate: parseFloat(rowData['Adult Rate'] || '100'),
              childRate: parseFloat(rowData['Child Rate'] || '50'),
              inventory: 10,
              currency: rowData['Currency'] || 'USD',
              currencySymbol: rowData['Currency Symbol'] || '$',
            }));
          }
        });
      }
      
      // Merge with existing hotels
      const updatedHotels = [...hotels, ...importedHotels];
      setHotels(updatedHotels);
      
      // Save to localStorage
      saveHotels(updatedHotels);
      
      return importedHotels;
    } catch (error) {
      console.error('Error importing hotels:', error);
      throw error;
    }
  };

  // Export hotels data to Excel
  const exportHotels = () => {
    try {
      // Prepare hotel data for export
      const exportData = filteredHotels.map(hotel => ({
        'Hotel Name': hotel.name,
        'Star Rating': hotel.starRating,
        'Category': hotel.category,
        'Description': hotel.description,
        'Country': hotel.country,
        'City': hotel.city,
        'Location': hotel.location,
        'Street': hotel.address.street,
        'State': hotel.address.state,
        'Zip Code': hotel.address.zipCode,
        'Latitude': hotel.latitude,
        'Longitude': hotel.longitude,
        'Google Map Link': hotel.googleMapLink,
        'Phone': hotel.contactInfo.phone,
        'Email': hotel.contactInfo.email,
        'Website': hotel.contactInfo.website,
        'Check-in': hotel.checkInTime,
        'Check-out': hotel.checkOutTime,
        'Facilities': hotel.facilities.join(', '),
        'Amenities': hotel.amenities.join(', '),
        'Room Types Count': hotel.roomTypes.length,
        'Room Types': hotel.roomTypes.map(r => r.name).join(', '),
        'Min Price': Math.min(...hotel.roomTypes.map(room => room.adultPrice || 0), 10000),
        'Currency': hotel.currency || 'USD',
        'Currency Symbol': hotel.currencySymbol || '$',
        'Status': hotel.status,
        'Cancellation Policy': hotel.policies.cancellation,
        'Children Policy': hotel.policies.children,
        'Pet Policy': hotel.policies.pets,
        'Payment Policy': hotel.policies.payment,
        'Created': new Date(hotel.createdAt).toLocaleDateString(),
        'Updated': new Date(hotel.updatedAt).toLocaleDateString(),
      }));

      // Prepare room types data for export
      const roomTypesData = filteredHotels.flatMap(hotel => 
        hotel.roomTypes.map(room => ({
          'Hotel Name': hotel.name,
          'Room Name': room.name,
          'Description': room.description,
          'Adult Capacity': room.capacity.adults,
          'Child Capacity': room.capacity.children,
          'Max Occupancy': room.maxOccupancy,
          'Configuration': room.configuration,
          'Bed Type': room.bedType,
          'Adult Price': room.adultPrice,
          'Child Price': room.childPrice,
          'Extra Bed Price': room.extraBedPrice,
          'Adult Rate': room.adultRate,
          'Child Rate': room.childRate,
          'Meal Plan': room.mealPlan,
          'Valid From': room.validFrom,
          'Valid To': room.validTo,
          'Season Start': room.seasonStart,
          'Season End': room.seasonEnd,
          'Amenities': room.amenities.join(', '),
          'Inventory': room.inventory,
          'Status': room.status,
          'Currency': room.currency || hotel.currency || 'USD',
          'Currency Symbol': room.currencySymbol || hotel.currencySymbol || '$',
        }))
      );

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Add Hotels sheet
      const hotelsWorksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, hotelsWorksheet, 'Hotels');
      
      // Add Room Types sheet
      const roomTypesWorksheet = XLSX.utils.json_to_sheet(roomTypesData);
      XLSX.utils.book_append_sheet(workbook, roomTypesWorksheet, 'RoomTypes');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(data, `Hotels_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Error exporting hotels:', error);
      throw error;
    }
  };

  return {
    importHotels,
    exportHotels
  };
};
