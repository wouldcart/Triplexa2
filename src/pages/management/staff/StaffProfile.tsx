import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User, Target, Clock, Star, Cake, Briefcase } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
// Local/static fallbacks removed; rely solely on Supabase
import { EnhancedStaffMember } from "@/types/staff";
import { initialCountries } from "@/pages/inventory/countries/data/countryData";
import { format } from "date-fns";
import LoginTracker from "@/components/staff/LoginTracker";
import StaffStatusManager from "@/components/staff/StaffStatusManager";
import { supabase } from "@/integrations/supabase/client";
import { adminSupabase, isAdminClientConfigured } from "@/lib/supabaseClient";
import { checkBucketExists } from "@/lib/storageChecks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStaffReferralLink, getDeterministicStaffReferralLink } from "@/services/staffReferralService";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeCountriesData } from "@/hooks/useRealTimeCountriesData";
import { listDocuments, uploadDocument, getSignedUrl, approveDocument, rejectDocument, deleteDocument } from "@/services/staffDocumentsService";
import { getBankAccount, upsertBankAccount, updateBankVerificationStatus } from "@/services/staffBankService";
import { StaffDocument, StaffBankAccount } from "@/types/staff";
import { AuthService } from "@/services/authService";
import TargetSettings from "@/components/staff/TargetSettings";
import { staffWorkingHoursService } from "@/services/staffWorkingHoursService";
import { staffTargetService } from "@/services/staffTargetService";

const StaffProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<EnhancedStaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffActive, setIsStaffActive] = useState(false);
  const [referralLink, setReferralLink] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();
  const { getCountryById } = useRealTimeCountriesData();
  const [managerDetails, setManagerDetails] = useState<{
    id: string;
    name: string;
    email?: string;
    role?: string;
    department?: string;
    position?: string;
  } | null>(null);

  // New: Verification Documents & Bank Account state
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [docType, setDocType] = useState<string>("id_proof");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNotes, setDocNotes] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  const [bank, setBank] = useState<StaffBankAccount | null>(null);
  const [bankName, setBankName] = useState<string>("");
  const [accountHolderName, setAccountHolderName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [bankCountry, setBankCountry] = useState<string>("");
  const [ifscOrSwift, setIfscOrSwift] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [savingBank, setSavingBank] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<string>("agent");

  // Working Hours & Shifts state (Supabase-backed)
  const defaultWorkingHoursUI = {
    monday: { isWorking: false, shifts: [] as any[] },
    tuesday: { isWorking: false, shifts: [] as any[] },
    wednesday: { isWorking: false, shifts: [] as any[] },
    thursday: { isWorking: false, shifts: [] as any[] },
    friday: { isWorking: false, shifts: [] as any[] },
    saturday: { isWorking: false, shifts: [] as any[] },
    sunday: { isWorking: false, shifts: [] as any[] },
  };
  const [uiWorkingHours, setUiWorkingHours] = useState<any>(defaultWorkingHoursUI);
  const [whLoading, setWhLoading] = useState<boolean>(false);
  const [whTimezone, setWhTimezone] = useState<string>((Intl.DateTimeFormat().resolvedOptions().timeZone || ""));

  // Performance Targets state (Supabase-backed)
  const [targets, setTargets] = useState<any[]>([]);
  const [targetsLoading, setTargetsLoading] = useState<boolean>(false);
  const [targetsSaving, setTargetsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Resolve current user role for HR actions
    AuthService.getCurrentSession().then(({ user }) => {
      if (user?.role) setCurrentRole(user.role);
    }).catch(() => {});

    const mapProfileToEnhancedStaff = (p: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);

      const defaultWorkingHours: any = {
        monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        saturday: { isWorking: false },
        sunday: { isWorking: false },
      };

      const defaultPerformance = {
        daily: {
          date: today,
          tasksCompleted: 0,
          responseTime: 0,
          customerSatisfaction: 0,
        },
        monthly: {
          month: today.slice(0, 7),
          totalTasks: 0,
          averageResponseTime: 0,
          averageCustomerSatisfaction: 0,
          targetAchievement: 0,
        },
        quarterly: {
          quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`,
          performanceRating: 0,
          goalsAchieved: 0,
          totalGoals: 0,
          growthPercentage: 0,
        },
        overall: {
          totalExperience: '0 years',
          performanceScore: 0,
          ranking: 0,
          badges: [],
        },
      };

      const status = ['active', 'inactive', 'on-leave'].includes(p?.status) ? p.status : 'active';

      return {
        id: p.id,
        name: p.name || (p.email ? String(p.email).split('@')[0] : 'Staff Member'),
        email: p.email || '',
        phone: p.phone || '',
        department: p.department || 'General',
        role: p.role || 'staff',
        position: p.position || undefined,
        status,
        avatar: p.avatar || undefined,
        joinDate: (p.created_at ? String(p.created_at).slice(0, 10) : today),
        createdAt: p.created_at || undefined,
        updatedAt: p.updated_at || undefined,
        dateOfBirth: undefined,
        skills: [],
        certifications: [],
        performance: defaultPerformance,
        targets: [],
        permissions: [],
        workingHours: defaultWorkingHours,
        reportingManager: undefined,
        teamMembers: undefined,
        employeeId: p.employee_id || '',
        operationalCountries: [],
        salaryStructure: undefined,
        leaveBalance: undefined,
        attendanceRecord: undefined,
      };
    };

    const mapStaffRowToEnhancedStaff = (s: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);

      const defaultWorkingHours: any = {
        monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        saturday: { isWorking: false },
        sunday: { isWorking: false },
      };

      const defaultPerformance = {
        daily: {
          date: today,
          tasksCompleted: 0,
          responseTime: 0,
          customerSatisfaction: 0,
        },
        monthly: {
          month: today.slice(0, 7),
          totalTasks: 0,
          averageResponseTime: 0,
          averageCustomerSatisfaction: 0,
          targetAchievement: 0,
        },
        quarterly: {
          quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`,
          performanceRating: 0,
          goalsAchieved: 0,
          totalGoals: 0,
          growthPercentage: 0,
        },
        overall: {
          totalExperience: '0 years',
          performanceScore: 0,
          ranking: 0,
          badges: [],
        },
      };

      const status = ['active', 'inactive', 'on-leave'].includes(s?.status) ? s.status : 'active';

      return {
        id: s.id,
        name: s.name || (s.email ? String(s.email).split('@')[0] : 'Staff Member'),
        email: s.email || '',
        phone: s.phone || '',
        department: s.department || 'General',
        role: s.role || 'staff',
        position: s.position || undefined,
        status,
        avatar: undefined,
        joinDate: (s.join_date ? String(s.join_date).slice(0, 10) : today),
        createdAt: s.created_at || undefined,
        updatedAt: s.updated_at || undefined,
        dateOfBirth: (s.date_of_birth ? String(s.date_of_birth) : undefined),
        skills: [],
        certifications: [],
        performance: defaultPerformance,
        targets: [],
        permissions: [],
        workingHours: defaultWorkingHours,
        reportingManager: s.reporting_manager || undefined,
        teamMembers: undefined,
        employeeId: s.employee_id || '',
        operationalCountries: Array.isArray(s.operational_countries) ? s.operational_countries : [],
        salaryStructure: undefined,
        leaveBalance: undefined,
        attendanceRecord: undefined,
      };
    };

    const loadStaffProfile = async () => {
      if (!id) return;
      try {
        // Load from both 'profiles' and 'staff' tables and merge
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, phone, department, role, status, employee_id, position, created_at, updated_at, avatar')
          .eq('id', id)
          .maybeSingle();

        const { data: staffData, error: staffError } = await supabase
          .from('staff' as any)
          .select('id, name, email, phone, department, role, status, employee_id, join_date, date_of_birth, reporting_manager, operational_countries, created_at, updated_at')
          .eq('id', id)
          .maybeSingle();

        if (profileError) console.warn('Supabase profile fetch failed:', profileError);
        if (staffError) console.warn('Supabase staff fetch failed:', staffError);

        const prof = profileData ? mapProfileToEnhancedStaff(profileData) : undefined;
        const staffMapped = staffData ? mapStaffRowToEnhancedStaff(staffData) : undefined;

        if (prof || staffMapped) {
          let merged = prof || (staffMapped as EnhancedStaffMember);
          if (staffMapped) {
            merged = {
              ...merged,
              // Prefer richer fields from staff table when available
              joinDate: staffMapped.joinDate || merged.joinDate,
              dateOfBirth: staffMapped.dateOfBirth || merged.dateOfBirth,
              reportingManager: staffMapped.reportingManager || merged.reportingManager,
              operationalCountries:
                staffMapped.operationalCountries && staffMapped.operationalCountries.length > 0
                  ? staffMapped.operationalCountries
                  : merged.operationalCountries || [],
              createdAt: merged.createdAt || staffMapped.createdAt,
              updatedAt: staffMapped.updatedAt || merged.updatedAt,
            };
          }
          setStaff(merged);
        } else {
          setStaff(null);
        }
      } catch (err) {
        console.warn('Error loading staff profile:', err);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    loadStaffProfile();
  }, [id]);

  // Load documents and bank when staff is available
  useEffect(() => {
    const loadDocsAndBank = async () => {
      if (!staff?.id) return;
      try {
        setDocLoading(true);
        const docs = await listDocuments(staff.id);
        // attach signed URL for quick preview/download
        const withUrls: StaffDocument[] = await Promise.all(docs.map(async (d) => {
          const url = await getSignedUrl(d.storagePath, 3600);
          return { ...d, signedUrl: url || undefined };
        }));
        setDocuments(withUrls);
      } catch (e: any) {
        console.warn('Failed to load documents:', e?.message || e);
      } finally {
        setDocLoading(false);
      }
      try {
        const ba = await getBankAccount(staff.id);
        setBank(ba);
        if (ba) {
          setBankName(ba.bankName || '');
          setAccountHolderName(ba.accountHolderName || '');
          setBankCountry(ba.country || '');
          setIfscOrSwift(ba.ifscOrSwift || '');
          setBranch(ba.branch || '');
        }
      } catch (e: any) {
        console.warn('Failed to load bank account:', e?.message || e);
      }
    };
    loadDocsAndBank();
  }, [staff?.id]);

  // Ensure shifts have stable IDs for UI operations
  const ensureShiftIds = (hours: any) => {
    const withIds: any = {};
    const dayKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    dayKeys.forEach((day) => {
      const dayData = hours?.[day] || { isWorking: false, shifts: [] };
      const shifts = Array.isArray(dayData.shifts) ? dayData.shifts.map((s: any, idx: number) => ({
        id: s.id || `shift_${day}_${Date.now()}_${idx}`,
        startTime: s.startTime || s.start_time || "09:00",
        endTime: s.endTime || s.end_time || "17:00",
        breakStart: s.breakStart || s.break_start || undefined,
        breakEnd: s.breakEnd || s.break_end || undefined,
        label: s.label || undefined,
      })) : [];
      withIds[day] = { isWorking: !!dayData.isWorking, shifts };
    });
    return withIds;
  };

  // Load working hours & targets when staff is available
  useEffect(() => {
    const loadWorkingHours = async () => {
      if (!staff?.id) return;
      try {
        setWhLoading(true);
        const { data } = await staffWorkingHoursService.getWorkingHoursByStaff(staff.id);
        const prepared = ensureShiftIds(data);
        setUiWorkingHours(prepared);
        // Load timezone separately for view-only display
        const tzRes = await staffWorkingHoursService.getTimezoneByStaff(staff.id);
        if (tzRes && tzRes.timezone) {
          setWhTimezone(String(tzRes.timezone));
        }
      } catch (e: any) {
        console.warn("Failed to load working hours:", e?.message || e);
        setUiWorkingHours(defaultWorkingHoursUI);
      } finally {
        setWhLoading(false);
      }
    };

    const loadTargets = async () => {
      if (!staff?.id) return;
      try {
        setTargetsLoading(true);
        const { data } = await staffTargetService.listTargetsByStaff(staff.id);
        setTargets(data || []);
      } catch (e: any) {
        console.warn("Failed to load targets:", e?.message || e);
        setTargets([]);
      } finally {
        setTargetsLoading(false);
      }
    };

    loadWorkingHours();
    loadTargets();
  }, [staff?.id]);

  // View mode: editing is handled in Edit Profile page

  const handleSaveTargets = async () => {
    if (!staff?.id) return;
    setTargetsSaving(true);
    try {
      const { error } = await staffTargetService.replaceTargetsForStaff(staff.id, targets as any);
      if (error) throw error;
      toast({ title: "Targets updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Could not save targets", variant: "destructive" });
    } finally {
      setTargetsSaving(false);
    }
  };

  const refreshDocuments = async () => {
    if (!staff?.id) return;
    const docs = await listDocuments(staff.id);
    const withUrls: StaffDocument[] = await Promise.all(docs.map(async (d) => {
      const url = await getSignedUrl(d.storagePath, 3600);
      return { ...d, signedUrl: url || undefined };
    }));
    setDocuments(withUrls);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDocFile(file);
  };

  const handleDocumentUpload = async () => {
    if (!staff?.id || !docFile) return;
    setUploadingDoc(true);
    try {
      const inserted = await uploadDocument(staff.id, docFile, docType, docNotes);
      const url = await getSignedUrl(inserted.storagePath, 3600);
      setDocuments((prev) => [{ ...inserted, signedUrl: url || undefined }, ...prev]);
      setDocFile(null);
      setDocNotes('');
      toast({ title: 'Document uploaded', description: inserted.fileName });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Error uploading document', variant: 'destructive' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      await approveDocument(docId);
      await refreshDocuments();
      toast({ title: 'Document approved' });
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Could not approve', variant: 'destructive' });
    }
  };

  const handleRejectDoc = async (docId: string) => {
    try {
      await rejectDocument(docId, 'Rejected by HR');
      await refreshDocuments();
      toast({ title: 'Document rejected' });
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Could not reject', variant: 'destructive' });
    }
  };

  const handleDeleteDoc = async (doc: StaffDocument) => {
    try {
      await deleteDocument(doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast({ title: 'Document deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete', variant: 'destructive' });
    }
  };

  const handleBankSave = async () => {
    if (!staff?.id) return;
    if (!bankName || !accountHolderName || !accountNumber) {
      toast({ title: 'Missing required fields', description: 'Bank name, account holder, and account number are required', variant: 'destructive' });
      return;
    }
    setSavingBank(true);
    try {
      const updated = await upsertBankAccount(staff.id, {
        bankName,
        accountHolderName,
        accountNumber,
        country: bankCountry || undefined,
        ifscOrSwift: ifscOrSwift || undefined,
        branch: branch || undefined,
      });
      setBank(updated);
      setAccountNumber('');
      toast({ title: 'Bank details saved', description: `•••• ${updated.accountNumberLast4}` });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save bank details', variant: 'destructive' });
    } finally {
      setSavingBank(false);
    }
  };

  const handleBankVerify = async (status: 'verified' | 'rejected') => {
    if (!bank?.id) return;
    try {
      await updateBankVerificationStatus(bank.id, status);
      const ba = await getBankAccount(staff!.id);
      setBank(ba);
      toast({ title: status === 'verified' ? 'Bank verified' : 'Bank rejected' });
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Could not update verification', variant: 'destructive' });
    }
  };

  useEffect(() => {
    const updateReferral = async () => {
      if (staff?.id) {
        try {
          const link = await getStaffReferralLink(staff.id);
          setReferralLink(link);
        } catch (e) {
          setReferralLink(getDeterministicStaffReferralLink(staff.id));
        }
      }
    };
    updateReferral();
  }, [staff?.id]);

  const getCountryName = (countryId: string) => {
    const real = getCountryById(countryId);
    if (real?.name) return real.name;
    const fallback = initialCountries.find(c => c.id === countryId);
    return fallback ? fallback.name : `Country ${countryId}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return dateString;
    }
  };

  const isUUID = (str: string) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  };

  useEffect(() => {
    const fetchManagerDetails = async () => {
      const rm = staff?.reportingManager;
      if (!rm) {
        setManagerDetails(null);
        return;
      }

      // If reportingManager is already a name (not a UUID), use it directly
      if (!isUUID(rm)) {
        setManagerDetails({ id: rm, name: rm });
        return;
      }

      try {
        const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
        // Try profiles first
        const { data: prof, error: profErr } = await client
          .from('profiles')
          .select('id, name, email, role, department, position')
          .eq('id', rm)
          .maybeSingle();

        if (prof) {
          setManagerDetails({
            id: prof.id,
            name: prof.name || 'Unknown',
            email: prof.email || undefined,
            role: prof.role || undefined,
            department: prof.department || undefined,
            position: prof.position || undefined,
          });
          return;
        }

        if (profErr) {
          console.warn('Failed to load reporting manager from profiles:', profErr);
        }

        // Fallback to staff table
        const { data: srow, error: sErr } = await client
          .from('staff' as any)
          .select('id, name, email, role, department, position')
          .eq('id', rm)
          .maybeSingle();

        if (srow) {
          setManagerDetails({
            id: srow.id,
            name: srow.name || 'Unknown',
            email: srow.email || undefined,
            role: srow.role || undefined,
            department: srow.department || undefined,
            position: srow.position || undefined,
          });
          return;
        }

        if (sErr) {
          console.warn('Failed to load reporting manager from staff:', sErr);
        }

        // If all lookups fail, just show the raw value
        setManagerDetails({ id: rm, name: rm });
      } catch (e) {
        console.warn('Error fetching reporting manager details:', e);
        setManagerDetails({ id: rm, name: rm });
      }
    };

    fetchManagerDetails();
  }, [staff?.reportingManager]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !staff?.id) return;
      setUploadingAvatar(true);
      // Ensure bucket exists
      const { exists } = await checkBucketExists('agent_branding');
      if (!exists) {
        toast({ title: 'Branding bucket missing', description: 'Create bucket "agent_branding" or run migrations.', variant: 'destructive' });
        return;
      }
      const storage = (isAdminClientConfigured && adminSupabase) ? adminSupabase.storage : supabase.storage;
      const client = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const safeName = `${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, '_');
      const path = `agents/${staff.id}/avatar/${safeName}`;
      // Resolve content type
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let contentType = file.type || '';
      if (!contentType) {
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'webp') contentType = 'image/webp';
        else contentType = 'image/png';
      }
      const res = await storage.from('agent_branding').upload(path, file, { upsert: true, contentType });
      if ((res as any)?.error) throw (res as any).error;
      const { data: pub } = storage.from('agent_branding').getPublicUrl(path);
      const { error } = await client.from('profiles').update({ avatar: pub?.publicUrl, updated_at: new Date().toISOString() }).eq('id', staff.id);
      if (error) throw error;
      setStaff(prev => prev ? { ...prev, avatar: pub?.publicUrl } : prev);
      toast({ title: 'Profile image updated' });
    } catch (err: any) {
      console.error('Profile image upload failed', err);
      toast({ title: 'Upload failed', description: err?.message || 'Could not upload profile image', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      // Reset the input if any
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleStatusUpdate = async (newStatus: 'active' | 'inactive') => {
    if (!staff) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', staff.id);
      if (error) {
        console.warn('Supabase status update failed, applying locally:', error);
      }
      setStaff({ ...staff, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleLoginStatusChange = (isActive: boolean) => {
    setIsStaffActive(isActive);
  };

  const renderWorkingHours = (workingHours: any) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return days.map(day => {
      const dayData = workingHours[day];
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      
      // Handle both legacy and new format
      if (dayData?.shifts && dayData.shifts.length > 0) {
        // New shift-based format
        return (
          <div key={day} className="flex justify-between items-start">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="text-right">
              {dayData.shifts.map((shift: any, index: number) => (
                <div key={shift.id || index} className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {shift.label && `${shift.label}: `}
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  {shift.breakStart && shift.breakEnd && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                      Break: {shift.breakStart} - {shift.breakEnd}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      } else if (dayData?.isWorking && dayData?.startTime && dayData?.endTime) {
        // Legacy format
        return (
          <div key={day} className="flex justify-between items-center">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {dayData.startTime} - {dayData.endTime}
              </span>
            </div>
          </div>
        );
      } else {
        // Not working
        return (
          <div key={day} className="flex justify-between items-center">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
            </div>
          </div>
        );
      }
    });
  };

  if (loading) {
    return (
      <PageLayout
        title="Loading..."
        breadcrumbItems={[
          { title: "Home", href: "/" },
          { title: "Staff Management", href: "/management/staff" },
          { title: "Profile", href: "#" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-900 dark:text-gray-100">Loading staff profile...</div>
        </div>
      </PageLayout>
    );
  }

  if (!staff) {
    return (
      <PageLayout
        title="Staff Not Found"
        breadcrumbItems={[
          { title: "Home", href: "/" },
          { title: "Staff Management", href: "/management/staff" },
          { title: "Profile", href: "#" },
        ]}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Staff member not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The staff member you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/management/staff">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff List
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={staff.name}
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: staff.name, href: "#" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link to="/management/staff">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff List
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/management/staff/edit/${staff.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="lg:col-span-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback className="text-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isStaffActive && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{staff.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{staff.role}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      variant={staff.status === "active" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {staff.status === "active" ? "Active" : staff.status === "inactive" ? "Inactive" : "On Leave"}
                    </Badge>
                    {isStaffActive && (
                      <Badge variant="outline" className="mt-2 border-green-500 text-green-600">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <label className="inline-flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      id="staff-avatar-input"
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('staff-avatar-input')?.click()} disabled={uploadingAvatar}>
                      {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{staff.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{staff.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Employee ID: {staff.employeeId}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Joined: {formatDate(staff.joinDate)}</span>
              </div>
              {staff.dateOfBirth && (
                <div className="flex items-center space-x-2">
                  <Cake className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">DOB: {formatDate(staff.dateOfBirth)}</span>
                </div>
              )}
              {staff.department && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Department: {staff.department}</span>
                </div>
              )}
              {staff.position && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Position: {staff.position}</span>
                </div>
              )}
              {staff.role && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Role: {staff.role}</span>
                </div>
              )}
              {staff.reportingManager && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Reporting Manager: {managerDetails ? (
                      <>
                        <Link to={`/management/staff/profile/${managerDetails.id}`} className="underline">
                          {managerDetails.name}
                        </Link>
                        {(managerDetails.role || managerDetails.department || managerDetails.position) && (
                          <> — {[managerDetails.role, managerDetails.department, managerDetails.position].filter(Boolean).join(', ')}</>
                        )}
                      </>
                    ) : (
                      staff.reportingManager
                    )}
                  </span>
                </div>
              )}
              {staff.createdAt && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Created: {formatDate(staff.createdAt)}</span>
                </div>
              )}
              {staff.updatedAt && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Updated: {formatDate(staff.updatedAt)}</span>
                </div>
              )}
              {staff.operationalCountries && staff.operationalCountries.length > 0 && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Operational Countries: {staff.operationalCountries.map((cId) => getCountryName(cId)).join(', ')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Staff Status Management */}
            <StaffStatusManager 
              staff={staff} 
              onStatusUpdate={handleStatusUpdate}
            />

            {/* Login Tracker */}
            <LoginTracker 
              staffId={staff.id}
              staffName={staff.name}
              onStatusChange={handleLoginStatusChange}
            />

            {/* Staff Referral Link */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Staff Referral Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input value={referralLink || (staff ? `https://tripoex.com/signup/agent?ref=staff_${staff.id}` : '')} readOnly />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => referralLink && navigator.clipboard.writeText(referralLink)}>Copy</Button>
                    <Button asChild>
                      <a href={referralLink || (staff ? `https://tripoex.com/signup/agent?ref=staff_${staff.id}` : '#')} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Share to onboard new agents.
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {staff.performance.overall.performanceScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Performance Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {staff.performance.daily.customerSatisfaction}/5
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {staff.performance.overall.ranking}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Ranking</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {staff.performance.overall.badges.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Badges</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Documents */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Verification Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="w-full md:w-48">
                    <Label className="text-sm">Document Type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id_proof">ID Proof</SelectItem>
                        <SelectItem value="address_proof">Address Proof</SelectItem>
                        <SelectItem value="bank_statement">Bank Statement</SelectItem>
                        <SelectItem value="education_certificate">Education Certificate</SelectItem>
                        <SelectItem value="employment_letter">Employment Letter</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:flex-1">
                    <Label className="text-sm">Notes (optional)</Label>
                    <Textarea className="mt-1" value={docNotes} onChange={(e) => setDocNotes(e.target.value)} rows={2} />
                  </div>
                  <div className="w-full md:w-64">
                    <Label className="text-sm">File</Label>
                    <Input type="file" accept="application/pdf,image/*" onChange={handleDocFileChange} />
                  </div>
                  <Button onClick={handleDocumentUpload} disabled={uploadingDoc || !docFile}>
                    {uploadingDoc ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>

                <Separator className="my-2" />

                {docLoading ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading documents...</div>
                ) : (
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300">No documents uploaded yet.</div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="capitalize">{doc.docType.replace('_',' ')}</Badge>
                            <a href={doc.signedUrl || '#'} target="_blank" rel="noopener noreferrer" className="underline">
                              {doc.fileName}
                            </a>
                            <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {(currentRole === 'hr_manager' || currentRole === 'manager' || currentRole === 'super_admin') ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApproveDoc(doc.id)} disabled={doc.status === 'approved'}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectDoc(doc.id)} disabled={doc.status === 'rejected'}>
                                  Reject
                                </Button>
                              </>
                            ) : null}
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteDoc(doc)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Account Details */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Bank Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bank ? (
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    <div className="flex flex-wrap gap-4 mb-2">
                      <Badge variant="outline">{bank.bankName}</Badge>
                      <Badge variant="outline">{bank.accountHolderName}</Badge>
                      <Badge variant="outline">•••• {bank.accountNumberLast4}</Badge>
                      {bank.country && <Badge variant="outline">{bank.country}</Badge>}
                      {bank.ifscOrSwift && <Badge variant="outline">{bank.ifscOrSwift}</Badge>}
                      {bank.branch && <Badge variant="outline">{bank.branch}</Badge>}
                    </div>
                    <div>
                      <span className="mr-2">Verification:</span>
                      <Badge variant={bank.verifiedStatus === 'verified' ? 'default' : bank.verifiedStatus === 'rejected' ? 'destructive' : 'secondary'}>
                        {bank.verifiedStatus}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-300">No bank details found. Add below.</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Bank Name</Label>
                    <Input className="mt-1" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Account Holder Name</Label>
                    <Input className="mt-1" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Account Number</Label>
                    <Input className="mt-1" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter full number (will be encrypted)" />
                  </div>
                  <div>
                    <Label className="text-sm">Country</Label>
                    <Input className="mt-1" value={bankCountry} onChange={(e) => setBankCountry(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">IFSC/SWIFT</Label>
                    <Input className="mt-1" value={ifscOrSwift} onChange={(e) => setIfscOrSwift(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Branch</Label>
                    <Input className="mt-1" value={branch} onChange={(e) => setBranch(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleBankSave} disabled={savingBank}>
                    {savingBank ? 'Saving...' : (bank ? 'Update Bank Details' : 'Add Bank Details')}
                  </Button>
                  {(currentRole === 'hr_manager' || currentRole === 'manager' || currentRole === 'super_admin') && bank?.id ? (
                    <>
                      <Button variant="outline" onClick={() => handleBankVerify('verified')}>Mark Verified</Button>
                      <Button variant="destructive" onClick={() => handleBankVerify('rejected')}>Reject</Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Certifications */}
            {(staff.skills && staff.skills.length > 0) || (staff.certifications && staff.certifications.length > 0) ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Skills & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {staff.skills && staff.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {staff.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {staff.certifications && staff.certifications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {staff.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Operational Countries */}
            {staff.operationalCountries && staff.operationalCountries.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Operational Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {staff.operationalCountries.map((countryId) => (
                      <Badge key={countryId} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {getCountryName(countryId)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Targets (Supabase-backed CRUD) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
                  <span>Performance Targets</span>
                  {targetsLoading && (
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TargetSettings
                  department={staff.department || "General"}
                  role={staff.role || "staff"}
                  targets={targets as any}
                  onTargetsChange={(next) => setTargets(next as any)}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveTargets} disabled={targetsSaving}>
                    {targetsSaving ? "Saving…" : "Save Targets"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours & Shifts (View Mode) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
                  <span>Working Hours & Shifts</span>
                  {whLoading && (
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => {
                    const dayLabelMap: Record<string, string> = {
                      monday: 'Monday',
                      tuesday: 'Tuesday',
                      wednesday: 'Wednesday',
                      thursday: 'Thursday',
                      friday: 'Friday',
                      saturday: 'Saturday',
                      sunday: 'Sunday',
                    };
                    const d = (uiWorkingHours as any)?.[day] || { isWorking: false, shifts: [] };
                    return (
                      <div key={day} className="rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{dayLabelMap[day]}</span>
                          <Badge variant="outline">{d.isWorking ? 'Working' : 'Off'}</Badge>
                        </div>
                        <div className="px-3 pb-3 space-y-1">
                          {d.isWorking && Array.isArray(d.shifts) && d.shifts.length > 0 ? (
                            d.shifts.map((s: any, idx: number) => (
                              <div key={s.id || idx} className="text-sm text-muted-foreground">
                                {s.startTime || s.start_time} – {s.endTime || s.end_time}
                                {s.breakStart || s.break_start ? (
                                  <span> (Break {s.breakStart || s.break_start}-{s.breakEnd || s.break_end})</span>
                                ) : null}
                                {s.label ? <span> • {s.label}</span> : null}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No shifts</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">To update working hours, use the Edit Profile button above.</div>
              </CardContent>
            </Card>

            {/* Timezone (View Mode) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Timezone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{whTimezone || 'Not set'}</span>
                </div>
                <div className="text-xs text-muted-foreground">Manage timezone in Edit Profile.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffProfile;
