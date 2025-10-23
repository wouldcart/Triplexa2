import { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VisaService, EnhancedVisa } from '@/services/visaService';
import { useToast } from '@/hooks/use-toast';

type BookingRow = {
  id: string;
  applicant_name: string;
  email: string;
  phone: string;
  country: string;
  visa_type: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
};

const VisaDashboard = () => {
  const { toast } = useToast();
  const [visas, setVisas] = useState<EnhancedVisa[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const v = await VisaService.getAllVisas();
        setVisas(v.data?.visas || []);
        // Try to load bookings from Supabase if table exists
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          // Cast Supabase client to allow querying tables not present in generated types
          const sb: any = supabase;
          const { data, error } = await sb
            .from('visa_booking')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn('Visa bookings table not available:', error.message);
            setBookings([]);
          } else {
            setBookings(((data || []) as unknown) as BookingRow[]);
          }
        } catch (err) {
          console.warn('Failed to fetch visa bookings:', err);
          setBookings([]);
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [toast]);

  const filteredVisas = useMemo(() => {
    const q = search.toLowerCase();
    return (Array.isArray(visas) ? visas : []).filter(v =>
      v.country.toLowerCase().includes(q) || v.visa_type.toLowerCase().includes(q)
    );
  }, [visas, search]);

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Visa Dashboard</h1>
            <p className="text-gray-500">Manage visas and monitor bookings</p>
          </div>
          <Button onClick={() => window.location.assign('/inventory/visa/wizard')}>Start Booking</Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 flex gap-4 items-center">
                <Input placeholder="Search visas by country or type" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Processing</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                  ) : filteredVisas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">No visas found</TableCell></TableRow>
                  ) : filteredVisas.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.country}</TableCell>
                      <TableCell>{v.visa_type}</TableCell>
                      <TableCell>{v.processing_time || 'N/A'}</TableCell>
                      <TableCell>${v.price ?? 0}</TableCell>
                      <TableCell><Badge variant={v.status === 'active' ? 'default' : 'secondary'}>{v.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="p-4">
                <h2 className="text-lg font-semibold">Recent Bookings</h2>
                <p className="text-sm text-gray-500">Latest visa booking submissions</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Visa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">No bookings yet</TableCell></TableRow>
                  ) : bookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.applicant_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{b.email}</div>
                        <div className="text-sm text-gray-600">{b.phone}</div>
                      </TableCell>
                      <TableCell>{b.country} - {b.visa_type}</TableCell>
                      <TableCell><Badge>{b.status}</Badge></TableCell>
                      <TableCell>{b.created_at ? new Date(b.created_at).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VisaDashboard;