import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Mail, Phone, User, Building, ExternalLink, MapPin, Activity, Globe, Info, FileText } from "lucide-react";
import { AgentManagementService } from "@/services/agentManagementService";
import type { ManagedAgent } from "@/types/agentManagement";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SupabaseAgentDetailsCardProps {
  agentId: string;
  agentName?: string;
  agentCompany?: string;
}

export const SupabaseAgentDetailsCard: React.FC<SupabaseAgentDetailsCardProps> = ({ agentId, agentName = "", agentCompany = "" }) => {
  const [agent, setAgent] = useState<ManagedAgent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize heterogeneous list fields from Supabase (string[], string, JSON)
  const formatListField = (val: unknown): string => {
    if (Array.isArray(val)) {
      const items = val.map((item) => (item == null ? "" : String(item))).filter(Boolean);
      return items.length ? items.join(", ") : "—";
    }
    if (val == null) return "—";
    if (typeof val === "string") {
      const s = val.trim();
      // Handle JSON array strings: "[\"a\",\"b\"]"
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            const items = parsed.map((item: any) => (item == null ? "" : String(item))).filter(Boolean);
            return items.length ? items.join(", ") : "—";
          }
        } catch {}
      }
      // Handle Postgres array literal: "{a,b,c}" (possibly quoted items)
      if (s.startsWith("{") && s.endsWith("}")) {
        const inner = s.slice(1, -1);
        const rawItems = inner.length ? inner.split(",") : [];
        const items = rawItems
          .map((item) => item.trim().replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"'))
          .filter(Boolean);
        return items.length ? items.join(", ") : "—";
      }
      return s || "—";
    }
    if (typeof val === "object") {
      const values = Object.values(val as Record<string, unknown>)
        .map((v) => (v == null ? "" : String(v)))
        .filter(Boolean);
      return values.length ? values.join(", ") : "—";
    }
    return String(val);
  };

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      if (!agentId) {
        setAgent(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await AgentManagementService.getAgentById(agentId);
        if (error) throw error;
        if (active) setAgent(data || null);
      } catch (e: any) {
        if (active) {
          // Graceful: record error internally but avoid noisy UI; rely on props fallback
          setError(null);
          setAgent(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [agentId]);

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status || "unknown"}</Badge>;
    }
  };

  const getTypeIcon = (type?: string) => {
    return (type || '').toLowerCase() === "company" ? (
      <Building className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!agent) {
    // Graceful fallback when details are unavailable; provide lightweight quick actions
    const initial = (agentName || "?").charAt(0).toUpperCase();
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{agentName || "Unknown Agent"}</div>
              <div className="text-xs text-muted-foreground">{agentCompany || "—"}</div>
            </div>
          </div>
          {/* Quick Actions removed; handled separately in dedicated section */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getTypeIcon(agent.type)}
            Agent Information
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/management/agents/${agent.id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions removed; implemented in dedicated page section */}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                {agent.profile_image && (
                  <AvatarImage src={agent.profile_image} alt={agent.name || agent.company_name || agentName || "Agent"} />
                )}
                <AvatarFallback>
                  {(agent.name || agent.company_name || agentName || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{agent.name || agent.company_name || agentName || "Unknown Agent"}</div>
                <div className="text-xs text-muted-foreground capitalize">{agent.type || "individual"}</div>
              </div>
            </div>
            {getStatusBadge(agent.status)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{agent.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{agent.business_phone || agent.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{[agent.city, agent.country].filter(Boolean).join(", ") || "—"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t">
          <div className="space-y-3">
            <h4 className="font-medium">Company</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{agent.company_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Code</span>
              <span className="font-medium">{agent.agency_code || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Business type</span>
              <span className="font-medium capitalize">{agent.type || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Website</span>
              {agent.website ? (
                <a href={agent.website} target="_blank" rel="noreferrer" className="font-medium inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <Globe className="h-4 w-4" />
                  {agent.website}
                </a>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right">{agent.business_address || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Preferred language</span>
              <span className="font-medium">{agent.preferred_language || "—"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Compliance</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">License number</span>
              <span className="font-medium">{agent.license_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IATA number</span>
              <span className="font-medium">{agent.iata_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Specializations</span>
              <span className="font-medium text-right">{formatListField(agent.specializations)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t">
            <div className="space-y-3">
            <h4 className="font-medium">Contact</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Alternate email</span>
              <span className="font-medium">{agent.alternate_email || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mobile numbers</span>
              <span className="font-medium text-right">{formatListField(agent.mobile_numbers)}</span>
            </div>
          </div>
          {/* <div className="space-y-3">
            <h4 className="font-medium">Commission</h4>
            {(() => {
              const typeDisplay = agent.commission_type || agent.commission_structure?.type || '—';
              const rawVal: any = agent.commission_value ?? agent.commission_structure?.value;
              const valueDisplay = (rawVal !== undefined && rawVal !== null)
                ? (String(typeDisplay).toLowerCase() === 'percentage' ? `${rawVal}%` : String(rawVal))
                : '—';
              return (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{typeDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium">{valueDisplay}</span>
                  </div>
                </>
              );
            })()}
          </div> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2"><Info className="h-4 w-4" />Source</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Source type</span>
              <span className="font-medium capitalize">{agent.source_type || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Source details</span>
              <span className="font-medium text-right">{agent.source_details || '—'}</span>
            </div>
          </div>

          {/* <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" />Documents</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Files</span>
              <span className="font-medium text-right">{formatListField(agent.documents)}</span>
            </div>
          </div> */}
        </div>



        <div className="pt-3 border-t">
          <h4 className="font-medium mb-2 flex items-center gap-2"><Activity className="h-4 w-4" />Activity</h4>
          <div className="text-sm text-muted-foreground">Created: {agent.created_at ? new Date(agent.created_at).toLocaleString() : "—"}</div>
          <div className="text-sm text-muted-foreground">Last update: {agent.updated_at ? new Date(agent.updated_at).toLocaleString() : "—"}</div>
          {(agent.suspension_reason || agent.suspended_at || agent.suspended_by) && (
            <div className="text-sm text-muted-foreground mt-2">
              <div>Suspended: {agent.suspended_at ? new Date(agent.suspended_at).toLocaleString() : '—'}</div>
              <div>Reason: {agent.suspension_reason || '—'}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseAgentDetailsCard;