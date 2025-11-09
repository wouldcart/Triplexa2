import { Query } from '@/types/query';

export type DateRange = { from: string; to: string };

// Compute the previous calendar month range in YYYY-MM-DD
export function computeLastMonthRange(now = new Date()): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const lastMonth = month === 0 ? 11 : month - 1;
  const lastMonthYear = month === 0 ? year - 1 : year;
  const start = new Date(lastMonthYear, lastMonth, 1);
  const end = new Date(lastMonthYear, lastMonth + 1, 0); // last day of last month

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(start), to: fmt(end) };
}

export function buildExportFilename(scope: 'current' | 'last-month', format: 'csv' | 'xlsx', now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const base = scope === 'last-month' ? 'queries-last-month' : 'queries-current';
  return `${base}-${y}-${m}-${d}.${format}`;
}

// Flatten a Query into an export-friendly row
export function mapQueryToExportRow(q: Query) {
  const fromDate = q.travelDates?.from ? new Date(q.travelDates.from) : null;
  const toDate = q.travelDates?.to ? new Date(q.travelDates.to) : null;
  const fmt = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

  return {
    EnquiryID: q.id,
    AgentName: q.agentName || '',
    AgentCompany: q.agentCompany || '',
    Country: q.destination?.country || '',
    Cities: Array.isArray(q.destination?.cities) ? q.destination!.cities.join(', ') : '',
    Nights: q.tripDuration?.nights ?? 0,
    Days: q.tripDuration?.days ?? 0,
    TravelFrom: fmt(fromDate),
    TravelTo: fmt(toDate),
    Adults: q.paxDetails?.adults ?? 0,
    Children: q.paxDetails?.children ?? 0,
    Infants: q.paxDetails?.infants ?? 0,
    PackageType: q.packageType || '',
    Status: q.status || '',
    BudgetMin: q.budget?.min ?? '',
    BudgetMax: q.budget?.max ?? '',
    BudgetCurrency: q.budget?.currency || '',
    CreatedAt: q.createdAt || '',
    UpdatedAt: q.updatedAt || '',
  } as Record<string, any>;
}