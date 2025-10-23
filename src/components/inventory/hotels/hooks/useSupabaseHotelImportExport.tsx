import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { hotelCombinedService, type HotelInsert, type HotelRoomTypeInsert } from '../../../../integrations/supabase/services/hotelService';

interface ImportError {
  message: string;
}

interface ImportStatistics {
  successful: number;
  failed: number;
  errors: ImportError[];
}

export const useSupabaseHotelImportExport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const importHotelsFromExcel = useCallback(async (file: File): Promise<ImportStatistics> => {
    setIsImporting(true);
    const stats: ImportStatistics = { successful: 0, failed: 0, errors: [] };

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const hotelSheet = workbook.Sheets['Hotels'] || workbook.Sheets[workbook.SheetNames[0]];
      if (!hotelSheet) throw new Error("No 'Hotels' sheet found in workbook");

      const hotelsRaw = XLSX.utils.sheet_to_json<Record<string, any>>(hotelSheet);

      let roomTypesRaw: Record<string, any>[] = [];
      if (workbook.Sheets['RoomTypes']) {
        roomTypesRaw = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets['RoomTypes']);
      }

      // Normalize hotels into Supabase inserts
      const hotelsInserts: { hotel: HotelInsert; roomTypes: Omit<HotelRoomTypeInsert, 'hotel_id'>[] }[] = hotelsRaw.map((h) => {
        // Aggregate contact info into JSON since hotels schema doesn't have email/phone/website columns
        const contactInfo = (h.email ?? h.Email ?? h.phone ?? h.Phone ?? h.website ?? h.Website)
          ? {
              email: h.email ?? h.Email ?? null,
              phone: h.phone ?? h.Phone ?? null,
              website: h.website ?? h.Website ?? null,
            }
          : null;

        const hotelInsert: any = {
          name: String(h.name ?? h.Name ?? '').trim(),
          city: String(h.city ?? h.City ?? '').trim(),
          country: String(h.country ?? h.Country ?? '').trim(),
          star_rating: Number(h.starRating ?? h.star_rating ?? h.StarRating ?? 0) || null,
          address: (h.address ?? h.Address ?? null) as any,
          status: (h.status ?? h.Status ?? 'active') as any,
          contact_info: contactInfo as any,
          description: (h.description ?? null) as any,
          amenities: (h.amenities ?? null) as any,
          check_in_time: (h.checkInTime ?? h.check_in_time ?? null) as any,
          check_out_time: (h.checkOutTime ?? h.check_out_time ?? null) as any,
          external_id: (h.external_id ?? h.ExternalId ?? null) as any,
          // Currency fields if present in import data
          currency: (h.currency ?? h.Currency ?? null) as any,
          currency_symbol: (h.currency_symbol ?? h.CurrencySymbol ?? h.Currency_Symbol ?? null) as any,
        };

        // Collect room types linked by hotel id or name
        const hotelIdentifier = h.id ?? h.ID ?? h.idHotel ?? undefined;
        const hotelName = hotelInsert.name?.toLowerCase();

        const linkedRoomTypes = roomTypesRaw.filter((rt) => {
          const rtHotelId = rt.hotelId ?? rt.hotel_id ?? rt.HotelId;
          const rtHotelName = (rt.hotelName ?? rt.hotel_name ?? rt.HotelName)?.toLowerCase?.();
          return (hotelIdentifier && rtHotelId && String(rtHotelId) === String(hotelIdentifier)) || (!!hotelName && !!rtHotelName && rtHotelName === hotelName);
        });

        const roomTypesInserts: Omit<HotelRoomTypeInsert, 'hotel_id'>[] = linkedRoomTypes.map((rt) => {
          const maxAdults = Number(rt.maxAdults ?? rt.max_adults ?? rt.MaxAdults ?? 2) || 2;
          const maxChildren = Number(rt.maxChildren ?? rt.max_children ?? rt.MaxChildren ?? 0) || 0;
          const maxOccupancy = Number(rt.maxOccupancy ?? rt.max_occupancy ?? rt.MaxOccupancy ?? maxAdults + maxChildren) || (maxAdults + maxChildren);

          return {
            name: String(rt.name ?? rt.Name ?? '').trim(),
            description: (rt.description ?? null) as any,
            adult_price: Number(rt.adultPrice ?? rt.adult_price ?? rt.AdultPrice ?? 0) || 0,
            child_price: Number(rt.childPrice ?? rt.child_price ?? rt.ChildPrice ?? 0) || 0,
            extra_bed_price: Number(rt.extraBedPrice ?? rt.extra_bed_price ?? rt.ExtraBedPrice ?? 0) || 0,
            capacity: {
              maxAdults,
              maxChildren,
              maxOccupancy,
            } as any,
            external_id: (rt.external_id ?? rt.ExternalId ?? null) as any,
          };
        });

        return { hotel: hotelInsert as HotelInsert, roomTypes: roomTypesInserts };
      });

      const results = await hotelCombinedService.bulkCreateHotelsWithRoomTypes(hotelsInserts);
      for (const r of results) {
        if (r.success) stats.successful += 1; else { stats.failed += 1; stats.errors.push({ message: r.error instanceof Error ? r.error.message : 'Unknown error' }); }
      }

      return stats;
    } catch (err) {
      stats.failed = (stats.failed || 0) + 1;
      stats.errors.push({ message: err instanceof Error ? err.message : 'Import failed' });
      return stats;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const exportHotelsToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const hotelsWithRoomTypes = await hotelCombinedService.getAllHotelsWithRoomTypes();

      // Prepare Hotels sheet
      const hotelsRows = hotelsWithRoomTypes.map((h: any) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        country: h.country,
        starRating: h.star_rating ?? '',
        status: h.status ?? '',
        email: h.contact_info?.email ?? '',
        phone: h.contact_info?.phone ?? '',
        website: h.contact_info?.website ?? '',
        description: h.description ?? '',
      }));

      // Prepare RoomTypes sheet
      const roomTypesRows = hotelsWithRoomTypes.flatMap((h: any) =>
        (h.roomTypes || []).map((rt: any) => {
          const cap = rt.capacity || {};
          return {
            id: rt.id,
            hotelId: h.id,
            hotelName: h.name,
            name: rt.name,
            adultPrice: rt.adult_price ?? 0,
            childPrice: rt.child_price ?? 0,
            maxAdults: cap.maxAdults ?? cap.max_adults ?? cap.adults ?? 2,
            maxChildren: cap.maxChildren ?? cap.max_children ?? cap.children ?? 0,
            maxOccupancy:
              cap.maxOccupancy ?? cap.max_occupancy ?? cap.total ??
              (typeof cap.adults === 'number' && typeof cap.children === 'number' ? cap.adults + cap.children : 2),
            description: rt.description ?? '',
          };
        })
      );

      const wb = XLSX.utils.book_new();
      const hotelsWs = XLSX.utils.json_to_sheet(hotelsRows);
      const roomTypesWs = XLSX.utils.json_to_sheet(roomTypesRows);
      XLSX.utils.book_append_sheet(wb, hotelsWs, 'Hotels');
      XLSX.utils.book_append_sheet(wb, roomTypesWs, 'RoomTypes');

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `hotels_export_${new Date().toISOString().slice(0,10)}.xlsx`;
      saveAs(blob, filename);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    importHotelsFromExcel,
    exportHotelsToExcel,
    isImporting,
    isExporting,
  };
};

export default useSupabaseHotelImportExport;