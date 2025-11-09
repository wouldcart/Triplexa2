import { describe, it, expect } from 'vitest';
import { computeLastMonthRange, buildExportFilename, mapQueryToExportRow } from '../exportUtils';

describe('exportUtils', () => {
  it('computes last month range correctly', () => {
    const now = new Date('2025-11-08T12:00:00Z');
    const range = computeLastMonthRange(now);
    expect(range).toEqual({ from: '2025-10-01', to: '2025-10-31' });
  });

  it('builds export filename for current scope', () => {
    const now = new Date('2025-11-08T12:00:00Z');
    const name = buildExportFilename('current', 'csv', now);
    expect(name).toBe('queries-current-2025-11-08.csv');
  });

  it('builds export filename for last-month scope', () => {
    const now = new Date('2025-11-08T12:00:00Z');
    const name = buildExportFilename('last-month', 'xlsx', now);
    expect(name).toBe('queries-last-month-2025-11-08.xlsx');
  });

  it('maps Query to export row', () => {
    const q: any = {
      id: 'ENQ20250001',
      agentName: 'Alice',
      agentCompany: 'Wonder Travels',
      destination: { country: 'France', cities: ['Paris', 'Lyon'] },
      tripDuration: { nights: 6, days: 7 },
      travelDates: { from: '2025-12-20', to: '2025-12-27' },
      paxDetails: { adults: 2, children: 1, infants: 0 },
      packageType: 'full-package',
      status: 'new',
      budget: { min: 1000, max: 3000, currency: 'EUR' },
      createdAt: '2025-11-01',
      updatedAt: '2025-11-02',
    };
    const row = mapQueryToExportRow(q);
    expect(row.EnquiryID).toBe('ENQ20250001');
    expect(row.AgentName).toBe('Alice');
    expect(row.Country).toBe('France');
    expect(row.Cities).toBe('Paris, Lyon');
    expect(row.Nights).toBe(6);
    expect(row.TravelFrom).toBe('2025-12-20');
    expect(row.TravelTo).toBe('2025-12-27');
    expect(row.BudgetCurrency).toBe('EUR');
  });
});