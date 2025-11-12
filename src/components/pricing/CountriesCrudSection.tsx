import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CountriesService, CountryRow, CountryInsert, CountryUpdate } from '@/services/countriesService';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

type EditableCountry = Partial<CountryRow> & { id?: string };

interface CountriesCrudSectionProps {
  onDataChanged?: () => void;
}

const CONTINENTS = [
  'Africa',
  'Antarctica',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
];

const CountriesCrudSection: React.FC<CountriesCrudSectionProps> = ({ onDataChanged }) => {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newCountry, setNewCountry] = useState<EditableCountry>({
    name: '',
    code: '',
    region: '',
    continent: 'Asia',
    currency: '',
    currency_symbol: '',
    status: 'active',
    is_popular: false,
    visa_required: false,
    flag_url: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableCountry>({});
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.region || '').toLowerCase().includes(q) ||
      (c.continent || '').toLowerCase().includes(q)
    );
  }, [countries, search]);

  const loadCountries = async () => {
    setLoading(true);
    setError(null);
    const res = await CountriesService.getAllCountries();
    if (res.success && res.data) {
      setCountries(res.data);
    } else {
      setError(res.error || 'Failed to fetch countries');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const resetNewCountry = () => {
    setNewCountry({
      name: '',
      code: '',
      region: '',
      continent: 'Asia',
      currency: '',
      currency_symbol: '',
      status: 'active',
      is_popular: false,
      visa_required: false,
      flag_url: ''
    });
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload: CountryInsert = {
        name: String(newCountry.name || '').trim(),
        code: String(newCountry.code || '').trim().toUpperCase(),
        region: String(newCountry.region || '').trim(),
        continent: String(newCountry.continent || '').trim(),
        currency: String(newCountry.currency || '').trim().toUpperCase(),
        currency_symbol: String(newCountry.currency_symbol || '').trim(),
        status: (newCountry.status as any) || 'active',
        flag_url: newCountry.flag_url || null,
        is_popular: !!newCountry.is_popular,
        visa_required: !!newCountry.visa_required,
      } as CountryInsert;

      // Basic required field check
      const required = ['name','code','region','continent','currency','currency_symbol','status'] as const;
      for (const f of required) {
        if (!(payload as any)[f]) {
          toast({ title: 'Missing Field', description: `Please provide ${f}.`, variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      const res = await CountriesService.createCountry(payload);
      if (res.success) {
        toast({ title: 'Country Added', description: `${payload.name} (${payload.code}) created.` });
        await loadCountries();
        onDataChanged?.();
        setAdding(false);
        resetNewCountry();
      } else {
        toast({ title: 'Create Failed', description: res.error || 'Unable to create country', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: CountryRow) => {
    setEditingId(c.id);
    setEditData({
      id: c.id,
      name: c.name,
      code: c.code,
      region: c.region,
      continent: c.continent,
      currency: c.currency,
      currency_symbol: c.currency_symbol,
      status: c.status,
      is_popular: c.is_popular ?? false,
      visa_required: c.visa_required ?? false,
      flag_url: c.flag_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      const updates: CountryUpdate = {
        name: String(editData.name || '').trim(),
        code: String(editData.code || '').trim().toUpperCase(),
        region: String(editData.region || '').trim(),
        continent: String(editData.continent || '').trim(),
        currency: String(editData.currency || '').trim().toUpperCase(),
        currency_symbol: String(editData.currency_symbol || '').trim(),
        status: (editData.status as any) || 'active',
        flag_url: (editData.flag_url as string) || null,
        is_popular: !!editData.is_popular,
        visa_required: !!editData.visa_required,
        updated_at: new Date().toISOString()
      } as CountryUpdate;

      const res = await CountriesService.updateCountry(editingId, updates);
      if (res.success) {
        toast({ title: 'Country Updated', description: `${updates.name} (${updates.code}) saved.` });
        await loadCountries();
        onDataChanged?.();
        cancelEdit();
      } else {
        toast({ title: 'Update Failed', description: res.error || 'Unable to update country', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm('Delete this country? This cannot be undone.')) return;
      setLoading(true);
      const res = await CountriesService.deleteCountry(id);
      if (res.success) {
        toast({ title: 'Country Deleted', description: 'Country has been removed.' });
        await loadCountries();
        onDataChanged?.();
      } else {
        toast({ title: 'Delete Failed', description: res.error || 'Unable to delete country', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Countries (Supabase)</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadCountries} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="default" size="sm" onClick={() => setAdding(s => !s)}>
              <Plus className="h-4 w-4 mr-1" /> Add Country
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <Input placeholder="Search by name, code, region" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Total Countries</Label>
            <div className="text-sm text-muted-foreground pt-2">{countries.length}</div>
          </div>
        </div>

        {adding && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newCountry.name as string} onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={newCountry.code as string} onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={newCountry.region as string} onChange={(e) => setNewCountry({ ...newCountry, region: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Continent</Label>
                <Select value={String(newCountry.continent || '')} onValueChange={(v) => setNewCountry({ ...newCountry, continent: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTINENTS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={newCountry.currency as string} onChange={(e) => setNewCountry({ ...newCountry, currency: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input value={newCountry.currency_symbol as string} onChange={(e) => setNewCountry({ ...newCountry, currency_symbol: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={String(newCountry.status || 'active')} onValueChange={(v) => setNewCountry({ ...newCountry, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch checked={!!newCountry.is_popular} onCheckedChange={(v) => setNewCountry({ ...newCountry, is_popular: v })} />
                <span className="text-sm">Popular</span>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={!!newCountry.visa_required} onCheckedChange={(v) => setNewCountry({ ...newCountry, visa_required: v })} />
                <span className="text-sm">Visa Required</span>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Flag URL (optional)</Label>
                <Input value={newCountry.flag_url as string} onChange={(e) => setNewCountry({ ...newCountry, flag_url: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={handleCreate} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" /> Create
              </Button>
              <Button variant="outline" onClick={() => { setAdding(false); resetNewCountry(); }} disabled={loading}>Cancel</Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Region</th>
                <th className="py-2 pr-4">Continent</th>
                <th className="py-2 pr-4">Currency</th>
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Popular</th>
                <th className="py-2 pr-4">Visa</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Input value={String(editData.name || '')} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                    ) : c.name}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Input value={String(editData.code || '')} onChange={(e) => setEditData({ ...editData, code: e.target.value })} />
                    ) : c.code}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Input value={String(editData.region || '')} onChange={(e) => setEditData({ ...editData, region: e.target.value })} />
                    ) : c.region}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Select value={String(editData.continent || '')} onValueChange={(v) => setEditData({ ...editData, continent: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTINENTS.map(x => (<SelectItem key={x} value={x}>{x}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    ) : c.continent}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Input value={String(editData.currency || '')} onChange={(e) => setEditData({ ...editData, currency: e.target.value })} />
                    ) : c.currency}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Input value={String(editData.currency_symbol || '')} onChange={(e) => setEditData({ ...editData, currency_symbol: e.target.value })} />
                    ) : c.currency_symbol}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <Select value={String(editData.status || 'active')} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : c.status}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Switch checked={!!editData.is_popular} onCheckedChange={(v) => setEditData({ ...editData, is_popular: v })} />
                      </div>
                    ) : (c.is_popular ? 'Yes' : 'No')}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Switch checked={!!editData.visa_required} onCheckedChange={(v) => setEditData({ ...editData, visa_required: v })} />
                      </div>
                    ) : (c.visa_required ? 'Yes' : 'No')}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleUpdate} disabled={loading}>
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEdit} disabled={loading}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(c)}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={10}>No countries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountriesCrudSection;