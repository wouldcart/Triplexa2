import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { 
  Search, 
  Plus, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Shield,
  QrCode,
  Eye,
  FileText,
  Edit,
  PauseCircle,
  Trash
} from 'lucide-react';
import { AgentManagementService } from '../../services/agentManagementService';
import AgentApprovalModal from '@/components/modals/AgentApprovalModal';
import type { ManagedAgent, StaffMember, AgentStatus } from '@/types/agentManagement';
import { toast } from '../../hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { getStoredStaff } from '@/services/staffStorageService';
import { QRCodeCanvas } from 'qrcode.react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { getDeterministicStaffReferralLink, getStaffReferralLink, decodeReferralCodeToStaffId } from '@/services/staffReferralService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface Agent {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'rejected';
  performance_score: number;
  total_bookings: number;
  revenue_generated: number;
  join_date: string;
  last_active: string;
  avatar?: string;
  location?: string;
  specializations?: string[];
  languages?: string[];
  rating?: number;
  commission_rate?: number;
  // Display-only: human-readable creator name or descriptor
  source?: string;
  // Detailed attribution text (e.g., "Created by Admin: Jane Doe")
  source_details?: string;
  source_type?: string;
  created_by?: string;
  // Suspension metadata (for tooltip)
  suspension_reason?: string;
}

interface AgentStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  totalRevenue: number;
  averageRating: number;
}

export default function AgentManagement() {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useApp();
  const isStaff = (currentUser?.role || '').toLowerCase() === 'staff';
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState<'all' | 'mine' | 'staff'>('all');
  const [referralStaffId, setReferralStaffId] = useState<string>('');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ManagedAgent | null>(null);
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  // Pagination state and derived slice
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));
  const paginatedAgents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, referralFilter, referralStaffId]);

  // QR Module state
  const [qrMode, setQrMode] = useState<'staff' | 'event'>('staff');
  const [staffIdInput, setStaffIdInput] = useState('');
  const [eventCodeInput, setEventCodeInput] = useState('');
  const [qrLink, setQrLink] = useState('');
  const [qrSize, setQrSize] = useState(300);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Suspend dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<Agent | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);
  const canSuspend = (hasPermission ? hasPermission('agents.manage.all') : false) || (currentUser?.role === 'super_admin') || (currentUser?.role === 'manager');

  // Helper: resolve staff name by ID from loaded staff members
  const resolveStaffNameById = (id?: string | null) => {
    if (!id) return undefined;
    const member = staffMembers.find(m => String(m.id) === String(id));
    return member?.name;
  };

  // Helper: best-effort current staff ID resolution
  const getCurrentStaffId = (): string | null => {
    const id = currentUser?.id ? String(currentUser.id) : null;
    if (id) return id;
    // fallback by email
    const email = (currentUser as any)?.email;
    if (email) {
      const byEmail = staffMembers.find((m: any) => m?.email && String(m.email).toLowerCase() === String(email).toLowerCase());
      if (byEmail?.id) return String(byEmail.id);
    }
    // fallback by name
    const name = currentUser?.name;
    if (name) {
      const byName = staffMembers.find(m => m?.name && String(m.name).toLowerCase() === String(name).toLowerCase());
      if (byName?.id) return String(byName.id);
    }
    return null;
  };

  // Helper: get referral owner staff ID from source_details
  const getReferralOwnerId = (a: Agent): string | null => {
    const raw = (a.source_details || '').trim();
    if (!raw) return null;
    // try to decode referral code
    try {
      const decoded = decodeReferralCodeToStaffId(raw);
      if (decoded) return String(decoded);
    } catch {}
    // fallback: raw is staff UUID
    const uuidLike = /^[0-9a-fA-F-]{36}$/;
    if (uuidLike.test(raw)) return raw;
    // fallback: matches a known staff id
    const match = staffMembers.find(m => String(m.id) === raw);
    if (match) return String(match.id);
    return null;
  };

  // Helper: render source type/details with staff name decoding
  const renderSourceTypeDetails = (a: Agent) => {
    const type = (a.source_type || '').toLowerCase();
    const raw = a.source_details || '';
    if (!type && !raw) return '';

    switch (type) {
      case 'staff_referral': {
        const ownerId = getReferralOwnerId(a);
        const staffName = resolveStaffNameById(ownerId);
        const myId = getCurrentStaffId();
        const isMine = ownerId && myId && String(ownerId) === String(myId);
        if (isMine) {
          const myName = currentUser?.name || staffName;
          return myName ? `Referral: ${myName}` : 'Referral: You';
        }
        if (staffName) return `Referral: ${staffName}`;
        if (ownerId) return `Referral: ${ownerId}`;
        return raw ? `Referral: ${raw}` : 'Referral';
      }
      case 'event':
        return raw ? `Event: ${raw}` : 'Event';
      case 'ad_campaign':
        return raw ? `Campaign: ${raw}` : 'Campaign';
      case 'organic':
        return 'Organic signup';
      default:
        return type ? `Source: ${type}${raw ? ` (${raw})` : ''}` : (raw ? `Source: ${raw}` : '');
    }
  };

  // Helper: render created-by details if admin-created
  const renderCreatedByLine = (a: Agent) => {
    if (a.source === 'admin') {
      const name = resolveStaffNameById(a.created_by) || 'Admin/Staff';
      return `Created by: ${name}`;
    }
    if (a.source === 'self-registered') {
      return 'Public Self-Registration';
    }
    return undefined;
  };

  const getSignupBase = () => {
    const publicUrl = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL || (import.meta as any)?.env?.VITE_SITE_URL;
    const origin = typeof window !== 'undefined' && window?.location?.origin ? window.location.origin : (publicUrl || '');
    const base = (publicUrl || origin || '').replace(/\/$/, '');
    return `${base}/signup/agent`;
  };

  const generateStaffQR = async () => {
    const id = staffIdInput.trim();
    if (!id) return;
    const link = await getStaffReferralLink(id);
    setQrLink(link);
  };

  const handleSelectStaff = async (val: string) => {
    setStaffIdInput(val);
    const link = await getStaffReferralLink(val);
    setQrLink(link);
  };

  const generateEventQR = () => {
    const code = eventCodeInput.trim();
    if (!code) return;
    const link = `${getSignupBase()}?event=${encodeURIComponent(code)}`;
    setQrLink(link);
  };

  const copyLinkToClipboard = async () => {
    if (!qrLink) return;
    try {
      await navigator.clipboard.writeText(qrLink);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const downloadPng = () => {
    try {
      const canvas = document.getElementById('agent-qr-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent_referral_qr.png';
      a.click();
    } catch (err) {
      console.error('Failed to download PNG:', err);
    }
  };

  const normalizeStatus = (status: AgentStatus): 'active' | 'inactive' | 'pending' | 'suspended' | 'rejected' => {
    switch (status) {
      case 'active': return 'active';
      case 'inactive': return 'inactive';
      case 'pending': return 'pending';
      case 'suspended': return 'suspended';
      case 'rejected': return 'rejected';
      default: return 'inactive';
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, searchTerm, statusFilter, sourceFilter, referralFilter, referralStaffId]);

  useEffect(() => {
    // Preload staff members for assignment in modal
    (async () => {
      const { data } = await AgentManagementService.getStaffMembers();
      setStaffMembers(data || []);
    })();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await AgentManagementService.getAgents();
      if (error) {
        setError('Failed to load agents');
        console.error('Error loading agents:', error);
      } else {
        const agentData: Agent[] = (data || []).map((agent: ManagedAgent) => ({
          id: agent.id,
          user_id: (agent as any).user_id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone || '',
          department: 'General',
          role: agent.role,
          status: normalizeStatus(agent.status),
          performance_score: 0,
          total_bookings: 0,
          revenue_generated: 0,
          join_date: agent.created_at || new Date().toISOString(),
          last_active: agent.updated_at || new Date().toISOString(),
          source_type: agent.source_type,
          source_details: agent.source_details,
          source: agent.created_by ? 'admin' : 'self-registered',
          created_by: agent.created_by,
          suspension_reason: (agent as any)?.suspension_reason
        }));
        // Enrich with local storage creator/assignment info and enforce staff-only visibility
        const getLocalAccessMaps = (): { creatorMap: Map<string, string>; assignedMap: Map<string, Set<string>> } => {
          const creatorMap = new Map<string, string>();
          const assignedMap = new Map<string, Set<string>>();

          // Source 1: staff-managed local agents store
          try {
            const rawStaffAgents = localStorage.getItem('agents');
            const staffAgents = rawStaffAgents ? JSON.parse(rawStaffAgents) : [];
            (staffAgents || []).forEach((a: any) => {
              const id = String(a?.id ?? '');
              if (!id) return;
              const creatorId = a?.createdBy?.staffId;
              if (creatorId != null) {
                creatorMap.set(id, String(creatorId));
              }
              const assignments = Array.isArray(a?.staffAssignments) ? a.staffAssignments : [];
              const set = assignedMap.get(id) || new Set<string>();
              assignments.forEach((asgn: any) => {
                const sid = asgn?.staffId;
                if (sid != null) set.add(String(sid));
              });
              if (set.size > 0) assignedMap.set(id, set);
            });
          } catch {}

          // Source 2: managed agents fallback store
          try {
            const rawFallback = localStorage.getItem('managed_agents_fallback');
            const fallbackAgents = rawFallback ? JSON.parse(rawFallback) : [];
            (fallbackAgents || []).forEach((a: any) => {
              const id = String(a?.id ?? '');
              if (!id) return;
              const creatorId = a?.created_by;
              if (creatorId != null) {
                creatorMap.set(id, String(creatorId));
              }
              const assignments = Array.isArray(a?.assigned_staff) ? a.assigned_staff : [];
              const set = assignedMap.get(id) || new Set<string>();
              assignments.forEach((sid: any) => {
                if (sid != null) set.add(String(sid));
              });
              if (set.size > 0) assignedMap.set(id, set);
            });
          } catch {}

          return { creatorMap, assignedMap };
        };

        const { creatorMap, assignedMap } = getLocalAccessMaps();
        const enrichedAgents = agentData.map(a => ({
          ...a,
          created_by: creatorMap.get(String(a.id)) ?? a.created_by
        }));

        let finalAgents = isStaff && (currentUser?.id || staffMembers.length > 0)
          ? enrichedAgents.filter(a => {
              const me = getCurrentStaffId();
              const id = String(a.id);
              const isCreator = me ? String(creatorMap.get(id) || '') === String(me) : false;
              const isAssigned = me ? (assignedMap.get(id)?.has(String(me)) || false) : false;
              const type = (a.source_type || '').toLowerCase();
              const refOwnerId = type === 'staff_referral' ? getReferralOwnerId(a) : null;
              const isMyReferral = me && refOwnerId && String(refOwnerId) === String(me);
              return isCreator || isAssigned || isMyReferral;
            })
          : enrichedAgents;

        // Resolve creator names (Source) from profiles or local staff storage
        const creatorIds = Array.from(new Set(
          finalAgents.map(a => String(a.created_by || '')).filter(Boolean)
        ));

        const creatorNameMap = new Map<string, string>();

        // Try Supabase profiles first
        if (creatorIds.length > 0) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('id,name')
              .in('id', creatorIds);
            (data || []).forEach((row: any) => {
              if (row?.id && row?.name) {
                creatorNameMap.set(String(row.id), String(row.name));
              }
            });
          } catch (err) {
            console.warn('Failed to resolve creator names from DB, will use local storage:', err);
          }
        }

        // Fallback: local staff storage
        try {
          const staff = await getStoredStaff();
          (staff || []).forEach(member => {
            if (member?.id && member?.name) {
              creatorNameMap.set(String(member.id), String(member.name));
            }
          });
        } catch {}

        // Additional fallback: use current user name if applicable
        if (currentUser?.id && currentUser?.name) {
          creatorNameMap.set(String(currentUser.id), String(currentUser.name));
        }

        // Map Source classification and include source_details for display
        finalAgents = finalAgents.map(a => {
          const createdBy = String(a.created_by || '');
          const isAdminOrStaffCreated = !!createdBy && createdBy !== 'public_signup';
          const sourceLabel = isAdminOrStaffCreated ? 'admin' : 'self-registered';
          const details = a.source_details
            || (createdBy === 'public_signup'
                  ? 'Public Self-Registration'
                  : isAdminOrStaffCreated
                    ? `Created by: ${creatorNameMap.get(createdBy) || 'Admin/Staff'}`
                    : 'Created internally');
          return { ...a, source: sourceLabel, source_details: details };
        });

        const hydratedAgents = await computeBookingsAndRevenue(finalAgents);
        setAgents(hydratedAgents);
        calculateStats(hydratedAgents);
      }
    } catch (err) {
      setError('Failed to load agents');
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute total bookings and revenue per agent using sales_bookings
  const computeBookingsAndRevenue = async (agentList: Agent[]): Promise<Agent[]> => {
    try {
      const userIds = Array.from(new Set(
        agentList.map(a => a.user_id).filter((id): id is string => !!id)
      ));

      if (userIds.length === 0) {
        return agentList.map(a => ({ ...a, total_bookings: 0, revenue_generated: 0 }));
      }

      const { data, error } = await supabase
        .from('sales_bookings')
        .select('created_by,total_amount,status')
        .in('created_by', userIds);

      if (error) {
        console.warn('Failed to fetch bookings for aggregation:', error);
        return agentList;
      }

      const statsMap = new Map<string, { count: number; revenue: number }>();
      (data || []).forEach((row: any) => {
        const createdBy = row?.created_by as string | null;
        if (!createdBy) return;
        const status = String(row?.status || '').toLowerCase();
        // Count only realized bookings
        if (status !== 'confirmed' && status !== 'completed') return;
        const entry = statsMap.get(createdBy) || { count: 0, revenue: 0 };
        entry.count += 1;
        const amt = Number(row?.total_amount ?? 0) || 0;
        entry.revenue += amt;
        statsMap.set(createdBy, entry);
      });

      return agentList.map(a => {
        const stat = a.user_id ? statsMap.get(a.user_id) : undefined;
        return {
          ...a,
          total_bookings: stat?.count || 0,
          revenue_generated: stat?.revenue || 0,
        };
      });
    } catch (err) {
      console.warn('Aggregation failed, returning original agent list:', err);
      return agentList;
    }
  };

  const calculateStats = (agentData: Agent[]) => {
    const total = agentData.length;
    const active = agentData.filter(agent => agent.status === 'active').length;
    const inactive = agentData.filter(agent => agent.status === 'inactive').length;
    const pending = 0;
    const totalRevenue = agentData.reduce((sum, agent) => sum + agent.revenue_generated, 0);
    const averageRating = agentData.length > 0 
      ? agentData.reduce((sum, agent) => sum + (agent.rating || 0), 0) / agentData.length 
      : 0;

    setStats({
      total,
      active,
      inactive,
      pending,
      totalRevenue,
      averageRating
    });
  };

  const filterAgents = () => {
    let filtered = agents;

    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(agent => agent.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(agent => agent.source === sourceFilter);
    }

    if (referralFilter === 'mine') {
      const meId = getCurrentStaffId();
      filtered = filtered.filter(agent => {
        const type = (agent.source_type || '').toLowerCase();
        if (type !== 'staff_referral') return false;
        const refOwnerId = getReferralOwnerId(agent);
        return meId && refOwnerId && String(refOwnerId) === String(meId);
      });
    } else if (referralFilter === 'staff' && referralStaffId) {
      filtered = filtered.filter(agent => {
        const type = (agent.source_type || '').toLowerCase();
        if (type !== 'staff_referral') return false;
        const refOwnerId = getReferralOwnerId(agent);
        return refOwnerId && String(refOwnerId) === String(referralStaffId);
      });
    }

    setFilteredAgents(filtered);
  };

  const handleViewAgent = (id: string) => {
    navigate(`/management/agents/${id}`);
  };

  const handleEditAgent = (id: string) => {
    navigate(`/management/agents/${id}/edit`);
  };

  const handleDeleteAgent = async (id: string) => {
    const { error } = await AgentManagementService.deleteAgent(id);
    if (!error) {
      loadAgents();
      toast.success({
        title: 'Agent deleted',
        description: 'The agent has been removed successfully.'
      });
    } else {
      console.error('Failed to delete agent', error);
      toast.error({
        title: 'Delete failed',
        description: 'Could not delete the agent. Please try again.'
      });
    }
  };

  const handleApproveAgent = async (id: string) => {
    try {
      // Load full managed agent details and open modal for approval actions
      const { data, error } = await AgentManagementService.getAgentById(id);
      if (error || !data) {
        console.error('Failed to load agent for approval', error);
        toast.error({ title: 'Load failed', description: 'Could not load agent details.' });
        return;
      }
      setSelectedAgent(data);
      setApprovalModalOpen(true);
    } catch (err) {
      console.error('Error opening approval modal:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await AgentManagementService.updateAgent({ id, status: newStatus });
      if (!error) {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      } else {
        console.error('Failed to update status', error);
      }
    } catch (err) {
      console.error('Error updating agent status:', err);
    }
  };

  const handleOpenSuspendDialog = (agent: Agent) => {
    if (!canSuspend) {
      toast.error({ title: 'Access denied', description: "You don't have permission to suspend agents." });
      return;
    }
    setSuspendTarget(agent);
    setSuspendReason('');
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    const reason = suspendReason.trim();
    if (!reason) {
      toast.error({ title: 'Reason required', description: 'Please enter a reason for suspension.' });
      return;
    }
    try {
      setIsSuspending(true);
      const idForUpdate = suspendTarget.user_id || suspendTarget.id;
      const { error } = await AgentManagementService.suspendAgent(idForUpdate, reason);
      if (!error) {
        await loadAgents();
        toast.success({ title: 'Agent suspended', description: 'The agent has been suspended.' });
        setSuspendDialogOpen(false);
        setSuspendTarget(null);
        setSuspendReason('');
      } else {
        toast.error({ title: 'Suspend failed', description: 'Could not suspend the agent.' });
      }
    } catch (err) {
      console.error('Error suspending agent:', err);
      toast.error({ title: 'Suspend failed', description: 'Unexpected error occurred.' });
    } finally {
      setIsSuspending(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'suspended':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <PageLayout title="Agent Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Agent Management">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Agents</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadAgents} className="mt-4">
            Try Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Agent Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="admin">Admin Created</SelectItem>
            <SelectItem value="self-registered">Self Registered</SelectItem>
          </SelectContent>
        </Select>

        <Select value={referralFilter} onValueChange={(val) => setReferralFilter(val as 'all' | 'mine' | 'staff')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Referrals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Referrals</SelectItem>
            <SelectItem value="mine" disabled={!isStaff}>{`My Referrals${(currentUser?.name || resolveStaffNameById(getCurrentStaffId())) ? ` (${currentUser?.name || resolveStaffNameById(getCurrentStaffId())})` : ''}`}</SelectItem>
            <SelectItem value="staff">By Staff</SelectItem>
          </SelectContent>
        </Select>

        <Select value={referralStaffId} onValueChange={(val) => setReferralStaffId(val)} disabled={referralFilter !== 'staff'}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent>
            {staffMembers.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => navigate('/management/agents/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>

        {/* QR sheet trigger remains */}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Codes
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>QR Code Generation (Event or Staff)</SheetTitle>
            <SheetDescription>Generate QR codes for staff or events.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-1 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <Select value={qrMode} onValueChange={(val) => setQrMode(val as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff Referral</SelectItem>
                  <SelectItem value="event">Event Referral</SelectItem>
                </SelectContent>
              </Select>

              {qrMode === 'staff' ? (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Select Staff</label>
                  <Select value={staffIdInput} onValueChange={handleSelectStaff}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="text-sm text-muted-foreground">Staff ID</label>
                  <Input
                    placeholder="Paste staff UUID"
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                  />
                  <Button onClick={generateStaffQR} className="w-full">Generate Staff QR</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Event Code</label>
                  <Input
                    placeholder="e.g. OTM2025, SATTE2025"
                    value={eventCodeInput}
                    onChange={(e) => setEventCodeInput(e.target.value)}
                  />
                  <Button onClick={generateEventQR} className="w-full">Generate Event QR</Button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">QR Size (px)</label>
                <Input
                  type="number"
                  value={qrSize}
                  min={120}
                  max={1024}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyLinkToClipboard} disabled={!qrLink}>Copy Link</Button>
                <Button variant="outline" onClick={downloadPng} disabled={!qrLink}>Download PNG</Button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="text-sm text-muted-foreground">Referral URL</div>
              <div className="text-xs break-all border rounded p-2 w-full bg-muted/30">
                {qrLink || 'No link generated yet'}
              </div>
              <div className="mt-2">
                {qrLink ? (
                  <QRCodeCanvas
                    id="agent-qr-canvas"
                    ref={qrCanvasRef}
                    value={qrLink}
                    size={qrSize}
                    level="H"
                    includeMargin
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Generate a QR to preview</div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="text-sm text-muted-foreground">
              <ul className="list-disc ml-6 space-y-2">
                <li>Staff QR links embed a short, decodable ref tied to the staff ID.</li>
                <li>Event QR links use the source parameter like <code>qr_OTM2025</code>.</li>
                <li>Use the PNG download for printing at booths and kiosks.</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first agent.'}
          </p>
          <Button onClick={() => navigate('/management/agents/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      )}

      {/* Agents Table */}
      {filteredAgents.length > 0 && (
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Agents List</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <Table hoverable>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgents.map((agent) => (
                    <TableRow key={`row-${agent.id}`}>
                      <TableCell truncate>
                        <div className="font-medium">{agent.name}</div>
                      </TableCell>
                      <TableCell truncate>{agent.email}</TableCell>
                      <TableCell truncate>{agent.phone}</TableCell>
                      <TableCell>{agent.role}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge
                            variant={agent.source === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                            title={agent.source_details || ''}
                          >
                            {agent.source === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <UserPlus className="h-3 w-3" />
                            )}
                            {agent.source === 'admin' ? 'Admin' : 'Self-Reg'}
                          </Badge>
                          {renderSourceTypeDetails(agent) && (
                            <div className="text-xs text-muted-foreground mt-1" data-testid="source-details">
                              {renderSourceTypeDetails(agent)}
                            </div>
                          )}
                          {renderCreatedByLine(agent) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {renderCreatedByLine(agent)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={agent.status === 'active'}
                            onCheckedChange={(checked) => handleStatusChange(agent.id, (checked ? 'active' : 'inactive') as any)}
                            disabled={!(agent.status === 'active' || agent.status === 'inactive')}
                            aria-label="Toggle agent status"
                          />
                          <span className="text-sm capitalize">
                            {agent.status === 'active' ? 'Active' : agent.status === 'inactive' ? 'Inactive' : agent.status}
                          </span>
                          {agent.status === 'suspended' && agent.suspension_reason && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" aria-label="Suspended reason" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Suspended: {agent.suspension_reason}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{agent.total_bookings}</TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => handleViewAgent(agent.id)} title="Profile" aria-label="View profile">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => navigate(`/reports?type=agent&id=${agent.id}`)} title="Report" aria-label="View report">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => handleEditAgent(agent.id)} title="Edit" aria-label="Edit agent">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* Pending status removed from DB-supported states; approval flow disabled */}
                          {agent.status === 'active' && canSuspend && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleOpenSuspendDialog(agent)}
                              title="Suspend"
                              aria-label="Suspend agent"
                            >
                              <PauseCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(agent.status === 'suspended' || agent.status === 'rejected') && (
                            <Button
                              size="icon"
                              variant="default"
                              onClick={async () => {
                                const { error } = await AgentManagementService.reactivateAgent(agent.id);
                                if (!error) {
                                  await loadAgents();
                                  toast.success({ title: 'Agent reactivated', description: 'The agent is now active.' });
                                } else {
                                  toast.error({ title: 'Reactivate failed', description: 'Could not reactivate the agent.' });
                                }
                              }}
                              title="Reactivate"
                              aria-label="Reactivate agent"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {/* <Button size="icon" variant="destructive" onClick={() => handleDeleteAgent(agent.id)} title="Delete" aria-label="Delete agent">
                            <Trash className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TooltipProvider>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={`${pageSize}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Suspending this agent will restrict their access. Please enter a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {suspendTarget && (
              <div className="text-sm text-muted-foreground">
                Agent: <span className="font-medium text-foreground">{suspendTarget.name}</span> ({suspendTarget.email})
              </div>
            )}
            <Textarea
              placeholder="Enter suspension reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuspendDialogOpen(false)} disabled={isSuspending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSuspend} disabled={isSuspending || !suspendReason.trim()}>
              {isSuspending ? 'Suspending…' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Approval/Reject Modal */}
      {selectedAgent && (
        <AgentApprovalModal
          agent={selectedAgent}
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false);
            setSelectedAgent(null);
          }}
          onAgentUpdated={() => {
            loadAgents();
          }}
          staffMembers={staffMembers}
        />
      )}
    </PageLayout>
  );
}



/* DUPLICATE BLOCK REMOVED */
