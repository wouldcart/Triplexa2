import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';
import { fetchActiveStaffSessions, fetchLoginRecords } from '@/services/loginRecordService';
import type { ActiveSession, LoginRecord, LoginFilters } from '@/services/loginRecordService';
import { formatDate, formatTime } from '@/lib/formatters';
import { RefreshCw, Activity, Users, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const timeAgo = (iso: string): string => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const StaffLoginReport: React.FC = () => {
  // Tracking is always on
  const [trackingEnabled] = useState<boolean>(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [daysRange, setDaysRange] = useState<number>(7);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filtersReady, setFiltersReady] = useState<boolean>(false);

  const STORAGE_KEY = 'staffLoginReport:filters';

  const loadData = async () => {
    setLoading(true);
    try {
      // Build server-side filters (omit "all" and "Unknown")
      const filters: LoginFilters = {
        department: departmentFilter !== 'all' && departmentFilter !== 'Unknown' ? departmentFilter : undefined,
        country: countryFilter !== 'all' && countryFilter !== 'Unknown' ? countryFilter : undefined,
        city: cityFilter !== 'all' && cityFilter !== 'Unknown' ? cityFilter : undefined,
      };
      // Prefer database records; fallback handled in service
      const sessions = await fetchActiveStaffSessions(filters);
      const records = await fetchLoginRecords(1000, filters);
      // Sort for display
      setActiveSessions(
        [...sessions].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      );
      setLoginRecords(
        [...records].sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
      );
    } catch (e) {
      // Fail silently, page still renders with defaults
      console.warn('Login report load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load persisted filters, then trigger initial fetch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { department?: string; country?: string; city?: string };
        if (saved.department) setDepartmentFilter(saved.department);
        if (saved.country) setCountryFilter(saved.country);
        if (saved.city) setCityFilter(saved.city);
      }
    } catch {}
    setFiltersReady(true);
  }, []);

  // Persist filters on change
  useEffect(() => {
    if (!filtersReady) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ department: departmentFilter, country: countryFilter, city: cityFilter })
      );
    } catch {}
  }, [departmentFilter, countryFilter, cityFilter, filtersReady]);

  // Refetch when filters change
  useEffect(() => {
    if (!filtersReady) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFilter, countryFilter, cityFilter, filtersReady]);

  // Subscribe to Supabase realtime changes and refresh with current filters
  useEffect(() => {
    const channel = supabase.channel('staff-login-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_login_records' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_active_sessions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  const totalActive = useMemo(() => activeSessions.length, [activeSessions]);
  const totalRecords = useMemo(() => loginRecords.length, [loginRecords]);

  const departmentOptions = useMemo(() => {
    const vals = new Set<string>();
    loginRecords.forEach(r => { if (r.department) vals.add(r.department); });
    return Array.from(vals).sort();
  }, [loginRecords]);
  const countryOptions = useMemo(() => {
    const vals = new Set<string>();
    loginRecords.forEach(r => { if (r.country) vals.add(r.country); });
    return Array.from(vals).sort();
  }, [loginRecords]);
  const cityOptions = useMemo(() => {
    const vals = new Set<string>();
    loginRecords.forEach(r => { if (r.city) vals.add(r.city); });
    return Array.from(vals).sort();
  }, [loginRecords]);

  const filteredLoginRecords = useMemo(() => {
    return loginRecords.filter(r => (
      (departmentFilter === 'all' || (r.department || 'Unknown') === departmentFilter) &&
      (countryFilter === 'all' || (r.country || 'Unknown') === countryFilter) &&
      (cityFilter === 'all' || (r.city || 'Unknown') === cityFilter)
    ));
  }, [loginRecords, departmentFilter, countryFilter, cityFilter]);

  const chartData = useMemo(() => {
    const days = daysRange;
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(end.getDate() - (days - 1));
    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    loginRecords.forEach((r) => {
      const key = new Date(r.loginTime).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    });
    return Object.entries(buckets).map(([date, value]) => ({ date, value, label: 'Logins' }));
  }, [loginRecords, daysRange]);

  return (
    <PageLayout title="Staff Login Report" description="View active staff sessions and recent login history">
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          {/* Login Activity Chart */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Login Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">Daily login count over selected range.</div>
                <Select value={String(daysRange)} onValueChange={(v) => setDaysRange(parseInt(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ChartContainer config={{ value: { label: 'Logins' } }} className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Staff Login Report</h2>
              <div className="flex items-center gap-2">
                <Badge className={trackingEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}>
                  {trackingEnabled ? 'Always On' : 'Tracking Disabled'}
                </Badge>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {loading ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">Login tracking is always on and persists in Supabase.</p>
          </div>

          {/* Active Sessions */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Staff Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalActive === 0 ? (
                <div className="text-sm text-muted-foreground py-6">No active staff sessions.</div>
              ) : (
                <Table compact hoverable>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((s) => (
                      <TableRow key={`${s.staffId}-${s.loginTime}`} highlight>
                        <TableCell truncate>{s.staffName}</TableCell>
                        <TableCell truncate>{s.department || '—'}</TableCell>
                        <TableCell truncate>{s.country || '—'}</TableCell>
                        <TableCell truncate>{s.city || '—'}</TableCell>
                        <TableCell>{formatDate(s.loginTime)} {formatTime(s.loginTime)}</TableCell>
                        <TableCell>{timeAgo(s.lastActivity)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>{totalActive} active session{totalActive > 1 ? 's' : ''}.</TableCaption>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Login History */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {departmentOptions.length === 0 && <SelectItem value="Unknown">Unknown</SelectItem>}
                      {departmentOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Country</span>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {countryOptions.length === 0 && <SelectItem value="Unknown">Unknown</SelectItem>}
                      {countryOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">City</span>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="City" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {cityOptions.length === 0 && <SelectItem value="Unknown">Unknown</SelectItem>}
                      {cityOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalRecords === 0 ? (
                <div className="text-sm text-muted-foreground py-6">No login records found.</div>
              ) : (
                <Table compact hoverable>
                  <TableHeader sticky>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Logout</TableHead>
                      <TableHead>Duration (min)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoginRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell truncate>{r.staffName}</TableCell>
                        <TableCell truncate>{r.department || '—'}</TableCell>
                        <TableCell truncate>{r.country || '—'}</TableCell>
                        <TableCell truncate>{r.city || '—'}</TableCell>
                        <TableCell>{formatDate(r.loginTime)} {formatTime(r.loginTime)}</TableCell>
                        <TableCell>{r.logoutTime ? (<span>{formatDate(r.logoutTime)} {formatTime(r.logoutTime)}</span>) : '—'}</TableCell>
                        <TableCell align="right">{r.duration ?? '—'}</TableCell>
                        <TableCell>
                          <Badge className={r.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}>
                            {r.status === 'active' ? 'Active' : 'Logged out'}
                          </Badge>
                        </TableCell>
                        <TableCell truncate>{r.ipAddress ?? '—'}</TableCell>
                        <TableCell truncate>{r.userAgent ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>{totalRecords} record{totalRecords > 1 ? 's' : ''} loaded.</TableCaption>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffLoginReport;