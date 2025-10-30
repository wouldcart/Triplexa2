import { supabase, adminSupabase, isAdminClientConfigured, authHelpers } from '@/lib/supabaseClient';
import { departments as sampleDepartments } from '@/data/departmentData';
import type { Department } from '@/types/staff';

// Storage keys for local fallback
const STORAGE_KEY = 'departments:storage';

// Allowed roles for write operations
const ALLOWED_WRITE_ROLES = ['super_admin', 'manager'];

// Feature flag: allow disabling localStorage fallback entirely
// Set VITE_USE_DEPARTMENTS_FALLBACK=false in your .env to force DB-only behavior
const USE_DEPARTMENTS_FALLBACK = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  ? String((import.meta as any).env.VITE_USE_DEPARTMENTS_FALLBACK ?? 'true').toLowerCase() !== 'false'
  : true;

// Utility: read/write local storage fallback
function readDepartmentsFromStorage(): Department[] {
  try {
    if (!USE_DEPARTMENTS_FALLBACK) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return sampleDepartments;
}

function writeDepartmentsToStorage(list: Department[]) {
  try {
    if (!USE_DEPARTMENTS_FALLBACK) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

// Raw read for legacy migration (ignores fallback flag)
function readLegacyDepartmentsFallback(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function isMissingTableError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || '';
  return (
    msg.includes('does not exist') ||
    msg.includes('not acceptable') ||
    msg.includes('permission denied') ||
    code === '406' ||
    code === 'PGRST301' ||
    code === 'PGRST116'
  );
}

async function getCurrentUserRole(): Promise<string | null> {
  try {
    const { user } = await authHelpers.getUser();
    const userId = user?.id;
    if (!userId) {
      const { session } = await authHelpers.getSession();
      if (!session?.user?.id) return null;
    }
    // Prefer reading role from profiles table for the current user
    const { data, error } = await (supabase as any)
      .from('profiles' as any)
      .select('role')
      .eq('id', (userId || (await authHelpers.getSession()).session.user.id))
      .maybeSingle();
    if (!error && data && (data as any).role) {
      return String((data as any).role);
    }
    // Fallback: attempt RPC if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_role');
      if (!rpcError && rpcData) return String(rpcData);
    } catch {}
  } catch {}
  return null;
}

// Best-effort table existence check (no DDL here; we log guidance when missing)
async function checkTableAccessible(): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('departments' as any)
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Recommended SQL to create the table (for operators to run via Supabase SQL editor)
export const recommendedDepartmentTableSQL = `
-- Create departments table
create table if not exists public.departments (
  id text primary key,
  name text not null,
  code text unique not null,
  description text,
  staff_count int default 0,
  features jsonb default '[]'::jsonb,
  workflow jsonb default '{}'::jsonb,
  permissions jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure a relation: profiles.department references departments.id (optional if already text)
-- alter table public.profiles add column if not exists department text;
-- You may also add a foreign key if desired:
-- alter table public.profiles add constraint profiles_department_fkey foreign key (department) references public.departments(id) on update cascade on delete set null;

-- RLS policies (example):
-- alter table public.departments enable row level security;
-- create policy "allow read for all" on public.departments for select using (true);
-- create policy "allow write for admins" on public.departments for all to authenticated using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','manager'))) with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','manager')));
`;

export const departmentService = {
  // Load all departments from DB or fallback
  async getDepartments(): Promise<{ data: Department[]; error: any | null; source: 'db' | 'fallback' }> {
    try {
      const { data, error } = await (supabase as any)
        .from('departments' as any)
        .select('id,name,code,description,staff_count,features,workflow,permissions')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = (data as any[]).map((row) => ({
          id: row.id || row.code?.toLowerCase() || String(row.name || '').toLowerCase().replace(/\s+/g, '-'),
          name: row.name || '',
          code: row.code || (row.id || ''),
          description: row.description || '',
          staffCount: Number(row.staff_count || 0),
          features: Array.isArray(row.features) ? row.features : [],
          workflow: row.workflow || { stages: [], autoAssignment: false, escalationRules: [] },
          permissions: Array.isArray(row.permissions) ? row.permissions : [],
        })) as Department[];

        // Persist fallback copy for offline
        writeDepartmentsToStorage(mapped);
        return { data: mapped, error: null, source: 'db' };
      }

      if (error && isMissingTableError(error)) {
        console.warn('Departments table not accessible. Using local fallback.');
      } else if (error) {
        console.warn('Departments fetch error. Using local fallback:', error);
      }
    } catch (err) {
      console.warn('Departments fetch exception. Using local fallback:', err);
    }
    if (USE_DEPARTMENTS_FALLBACK) {
      const fallback = readDepartmentsFromStorage();
      return { data: fallback, error: null, source: 'fallback' };
    }

    return { data: [], error: 'Database not accessible and fallback disabled', source: 'db' };
  },

  // Create a department (DB preferred, fallback to local)
  async createDepartment(payload: Omit<Department, 'staffCount' | 'features' | 'workflow' | 'permissions'> & Partial<Pick<Department, 'features' | 'workflow' | 'permissions'>>): Promise<{ data: Department | null; error: any | null; source: 'db' | 'fallback' }> {
    // Role check
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { data: null, error: 'Insufficient permissions', source: 'fallback' };
    }

    const newDept: Department = {
      id: payload.id || payload.code?.toLowerCase() || (payload.name || '').toLowerCase().replace(/\s+/g, '-'),
      name: payload.name,
      code: payload.code,
      description: payload.description || '',
      staffCount: 0,
      features: payload.features || [],
      workflow: payload.workflow || { stages: [], autoAssignment: false, escalationRules: [] },
      permissions: payload.permissions || []
    };

    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data, error } = await client
        .from('departments' as any)
        .insert({
          id: newDept.id,
          name: newDept.name,
          code: newDept.code,
          description: newDept.description,
          staff_count: newDept.staffCount,
          features: newDept.features,
          workflow: newDept.workflow,
          permissions: newDept.permissions
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return { data: newDept, error: null, source: 'db' };
      }

      if (error && isMissingTableError(error)) {
        console.warn('Departments table missing; writing to local storage.');
      } else if (error) {
        console.warn('Departments insert error; writing to local storage:', error);
      }
    } catch (err) {
      console.warn('Departments insert exception; writing to local storage:', err);
    }
    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updated = [...list, newDept];
      writeDepartmentsToStorage(updated);
      return { data: newDept, error: null, source: 'fallback' };
    }

    return { data: null, error: 'Database write failed and fallback disabled', source: 'db' };
  },

  // Update department
  async updateDepartment(id: string, updates: Partial<Pick<Department, 'name' | 'code' | 'description' | 'features' | 'workflow' | 'permissions'>>): Promise<{ error: any | null; source: 'db' | 'fallback' }> {
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { error: 'Insufficient permissions', source: 'fallback' };
    }

    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('departments' as any)
        .update({
          name: updates.name,
          code: updates.code,
          description: updates.description,
          features: updates.features,
          workflow: updates.workflow,
          permissions: updates.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        return { error: null, source: 'db' };
      }

      if (isMissingTableError(error)) {
        console.warn('Departments table missing; updating local storage.');
      } else {
        console.warn('Departments update error; updating local storage:', error);
      }
    } catch (err) {
      console.warn('Departments update exception; updating local storage:', err);
    }
    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updatedList = list.map((d) => (d.id === id ? { ...d, ...updates } as Department : d));
      writeDepartmentsToStorage(updatedList);
      return { error: null, source: 'fallback' };
    }

    return { error: 'Database update failed and fallback disabled', source: 'db' };
  },

  // Initialize department features from sample data when missing
  async initializeDepartmentFeatures(id: string): Promise<{ error: any | null; source: 'db' | 'fallback' }> {
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { error: 'Insufficient permissions', source: 'fallback' };
    }

    // Find default features from sample data
    const sample = sampleDepartments.find((d) => d.id === id);
    const defaultFeatures = sample?.features || [];

    if (!defaultFeatures || defaultFeatures.length === 0) {
      // Nothing to initialize
      return { error: null, source: 'db' };
    }

    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('departments' as any)
        .update({
          features: defaultFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        // Also update local fallback copy
        if (USE_DEPARTMENTS_FALLBACK) {
          const list = readDepartmentsFromStorage();
          const updatedList = list.map((d) => (d.id === id ? { ...d, features: defaultFeatures } : d));
          writeDepartmentsToStorage(updatedList as Department[]);
        }
        return { error: null, source: 'db' };
      }

      if (isMissingTableError(error)) {
        console.warn('Departments table missing; initializing features in local storage.');
      } else {
        console.warn('Initialize features error; updating local storage:', error);
      }
    } catch (err) {
      console.warn('Initialize features exception; updating local storage:', err);
    }

    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updatedList = list.map((d) => (d.id === id ? { ...d, features: defaultFeatures } : d));
      writeDepartmentsToStorage(updatedList as Department[]);
      return { error: null, source: 'fallback' };
    }

    return { error: 'Database update failed and fallback disabled', source: 'db' };
  },

  // Add or update a single feature in a department
  async addFeatureToDepartment(id: string, feature: Department['features'][number]): Promise<{ error: any | null; source: 'db' | 'fallback' }> {
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { error: 'Insufficient permissions', source: 'fallback' };
    }

    // Fetch current features
    let currentFeatures: Department['features'] = [];
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data, error } = await client
        .from('departments' as any)
        .select('features')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        currentFeatures = Array.isArray((data as any).features) ? (data as any).features : [];
      } else if (error && !isMissingTableError(error)) {
        console.warn('Read features error before add:', error);
      }
    } catch (err) {
      console.warn('Read features exception before add:', err);
    }

    // If DB read failed or table missing, try local fallback
    if (currentFeatures.length === 0 && USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const target = list.find((d) => d.id === id);
      currentFeatures = target?.features || [];
    }

    // Upsert feature by id
    const idx = currentFeatures.findIndex((f) => String(f.id) === String(feature.id));
    let updatedFeatures: Department['features'] = [];
    if (idx >= 0) {
      updatedFeatures = currentFeatures.map((f, i) => (i === idx ? { ...f, ...feature } : f));
    } else {
      updatedFeatures = [...currentFeatures, feature];
    }

    // Write to DB
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('departments' as any)
        .update({
          features: updatedFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        // Mirror to local fallback
        if (USE_DEPARTMENTS_FALLBACK) {
          const list = readDepartmentsFromStorage();
          const updatedList = list.map((d) => (d.id === id ? { ...d, features: updatedFeatures } : d));
          writeDepartmentsToStorage(updatedList as Department[]);
        }
        return { error: null, source: 'db' };
      }

      if (isMissingTableError(error)) {
        console.warn('Departments table missing; adding feature in local storage.');
      } else {
        console.warn('Add feature error; updating local storage:', error);
      }
    } catch (err) {
      console.warn('Add feature exception; updating local storage:', err);
    }

    // Fallback write
    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updatedList = list.map((d) => (d.id === id ? { ...d, features: updatedFeatures } : d));
      writeDepartmentsToStorage(updatedList as Department[]);
      return { error: null, source: 'fallback' };
    }

    return { error: 'Database update failed and fallback disabled', source: 'db' };
  },

  // Remove a single feature from a department
  async removeFeatureFromDepartment(id: string, featureId: string): Promise<{ error: any | null; source: 'db' | 'fallback' }> {
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { error: 'Insufficient permissions', source: 'fallback' };
    }

    // Fetch current features
    let currentFeatures: Department['features'] = [];
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data, error } = await client
        .from('departments' as any)
        .select('features')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        currentFeatures = Array.isArray((data as any).features) ? (data as any).features : [];
      } else if (error && !isMissingTableError(error)) {
        console.warn('Read features error before remove:', error);
      }
    } catch (err) {
      console.warn('Read features exception before remove:', err);
    }

    // If DB read failed or table missing, try local fallback
    if (currentFeatures.length === 0 && USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const target = list.find((d) => d.id === id);
      currentFeatures = target?.features || [];
    }

    // Filter out the feature by id
    const updatedFeatures: Department['features'] = (currentFeatures || []).filter((f) => String(f.id) !== String(featureId));

    // Write to DB
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('departments' as any)
        .update({
          features: updatedFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        // Mirror to local fallback
        if (USE_DEPARTMENTS_FALLBACK) {
          const list = readDepartmentsFromStorage();
          const updatedList = list.map((d) => (d.id === id ? { ...d, features: updatedFeatures } : d));
          writeDepartmentsToStorage(updatedList as Department[]);
        }
        return { error: null, source: 'db' };
      }

      if (isMissingTableError(error)) {
        console.warn('Departments table missing; removing feature in local storage.');
      } else {
        console.warn('Remove feature error; updating local storage:', error);
      }
    } catch (err) {
      console.warn('Remove feature exception; updating local storage:', err);
    }

    // Fallback write
    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updatedList = list.map((d) => (d.id === id ? { ...d, features: updatedFeatures } : d));
      writeDepartmentsToStorage(updatedList as Department[]);
      return { error: null, source: 'fallback' };
    }

    return { error: 'Database update failed and fallback disabled', source: 'db' };
  },

  // Delete department (prevent deletion if staff assigned)
  async deleteDepartment(id: string): Promise<{ error: any | null; source: 'db' | 'fallback' }> {
    const role = await getCurrentUserRole();
    if (!ALLOWED_WRITE_ROLES.includes(String(role || '')) && !isAdminClientConfigured) {
      return { error: 'Insufficient permissions', source: 'fallback' };
    }

    // Check assigned staff in profiles
    try {
      const { data: staffCountData, error: countError } = await (supabase as any)
        .from('profiles' as any)
        .select('id', { count: 'exact', head: true })
        .eq('department', id);

      const assignedCount = (staffCountData as any)?.length || 0; // Some clients return array; count with head:true often is in response.count
      const count = (countError ? 0 : ((staffCountData as any)?.count ?? assignedCount));
      if (!countError && Number(count) > 0) {
        return { error: `Department has ${count} staff assigned`, source: 'db' };
      }
    } catch {}

    // Try DB delete
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { error } = await client
        .from('departments' as any)
        .delete()
        .eq('id', id);

      if (!error) {
        return { error: null, source: 'db' };
      }

      if (isMissingTableError(error)) {
        console.warn('Departments table missing; deleting in local storage.');
      } else {
        console.warn('Departments delete error; deleting in local storage:', error);
      }
    } catch (err) {
      console.warn('Departments delete exception; deleting in local storage:', err);
    }
    if (USE_DEPARTMENTS_FALLBACK) {
      const list = readDepartmentsFromStorage();
      const updatedList = list.filter((d) => d.id !== id);
      writeDepartmentsToStorage(updatedList);
      return { error: null, source: 'fallback' };
    }

    return { error: 'Database delete failed and fallback disabled', source: 'db' };
  },

  // One-time migration: push localStorage fallback departments into Supabase
  async migrateDepartmentsFallbackToSupabase(): Promise<{ migrated: number; error: any | null }> {
    try {
      const legacy = readLegacyDepartmentsFallback();
      if (!Array.isArray(legacy) || legacy.length === 0) {
        return { migrated: 0, error: null };
      }

      // Verify table is accessible before attempting upserts
      const accessible = await checkTableAccessible();
      if (!accessible) {
        return { migrated: 0, error: 'Departments table not accessible. Please create it and configure RLS.' };
      }

      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      let migrated = 0;
      for (const d of legacy) {
        const payload: any = {
          id: d.id,
          name: d.name,
          code: d.code,
          description: d.description ?? null,
          staff_count: Number(d.staffCount || 0),
          features: Array.isArray(d.features) ? d.features : [],
          workflow: d.workflow || { stages: [], autoAssignment: false, escalationRules: [] },
          permissions: Array.isArray(d.permissions) ? d.permissions : []
        };
        const { error } = await client
          .from('departments' as any)
          .upsert(payload, { onConflict: 'id' } as any);
        if (error) {
          return { migrated, error };
        }
        migrated += 1;
      }

      return { migrated, error: null };
    } catch (error) {
      return { migrated: 0, error };
    }
  },

  // Staff count map by department from profiles table (best-effort)
  async getStaffCountsByDepartment(): Promise<Record<string, number>> {
    const map: Record<string, number> = {};
    try {
      const { data, error } = await (supabase as any)
        .from('profiles' as any)
        .select('department', { count: 'exact' });

      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
          const dept = String(row.department || '').trim();
          if (!dept) continue;
          map[dept] = (map[dept] || 0) + 1;
        }
      }
    } catch {}
    return map;
  }
};

export default departmentService;