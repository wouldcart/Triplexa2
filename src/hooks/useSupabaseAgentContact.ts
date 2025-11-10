import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AgentManagementService } from "../services/agentManagementService";
import type { Query } from "../types/query";

export interface AgentContactDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  alternateEmail?: string;
  mobileNumbers?: string[];
  profileImage?: string;
}

type HookResult = {
  contact: AgentContactDetails | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Resolve agent contact details from Supabase public.agents table.
 * Primary key lookup uses query.agentUuid when available; otherwise attempts name-based lookup.
 * Falls back gracefully if Supabase is unreachable.
 */
export function useSupabaseAgentContact(query: Query | null | undefined): HookResult {
  const [contact, setContact] = useState<AgentContactDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const agentKey = useMemo(() => {
    if (!query) return "";
    return [query.agentUuid || "", query.agentName || ""].join(":");
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAgent() {
      if (!query) {
        setContact(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Prefer direct lookup by UUID id
        let agentRecord: any | null = null;
        const candidateUuid = query.agentUuid || null;

        if (candidateUuid) {
          // Use a loosely typed client to avoid deep TS type instantiation
          const sb: any = supabase;
          const { data, error: supErr } = await sb
            .from("agents")
            .select(
              "id, user_id, name, email, agency_name, agency_code, business_phone, business_address, website, alternate_email, mobile_numbers, city, country, profile_image"
            )
            .eq("id", candidateUuid)
            .limit(1);
          if (supErr) throw supErr;
          agentRecord = (data && data[0]) || null;

          // If not found by id, attempt user_id match with same uuid
          if (!agentRecord) {
            const { data: byUser, error: supErr2 } = await sb
              .from("agents")
              .select(
                "id, user_id, name, email, agency_name, agency_code, business_phone, business_address, website, alternate_email, mobile_numbers, city, country, profile_image"
              )
              .eq("user_id", candidateUuid)
              .limit(1);
            if (supErr2) throw supErr2;
            agentRecord = (byUser && byUser[0]) || null;
          }
        }

        // If still not found and we have agentName, attempt name-based lookup
        if (!agentRecord && query.agentName) {
          const sb: any = supabase;
          const { data: byName, error: nameErr } = await sb
            .from("agents")
            .select(
              "id, user_id, name, email, agency_name, agency_code, business_phone, business_address, website, alternate_email, mobile_numbers, city, country, profile_image"
            )
            .eq("name", query.agentName)
            .limit(1);
          if (nameErr) throw nameErr;
          agentRecord = (byName && byName[0]) || null;
        }

        // Final fallback: use management service if available
        if (!agentRecord && candidateUuid) {
          try {
            const managedRes = await AgentManagementService.getAgentById(candidateUuid);
            const managed: any = managedRes && (managedRes as any).data;
            if (managed) {
              agentRecord = {
                id: managed.id,
                user_id: managed.user_id,
                name: managed.name,
                email: managed.email,
                agency_name: managed.agency_name || managed.company_name,
                business_phone: managed.business_phone || managed.phone,
                business_address: managed.business_address || managed.address,
                website: managed.website,
                alternate_email: managed.alternate_email,
                mobile_numbers: managed.mobile_numbers,
                city: managed.city,
                country: managed.country,
                profile_image: managed.profile_image,
              };
            }
          } catch (_) {
            // ignore fallback errors
          }
        }

        // Map to contact details
        const mapped: AgentContactDetails | null = agentRecord
          ? {
              name:
                agentRecord.name || query.agentName || "",
              email:
                agentRecord.email || agentRecord.alternate_email || "",
              phone:
                agentRecord.business_phone || (Array.isArray(agentRecord.mobile_numbers) ? agentRecord.mobile_numbers[0] : "") || "",
              company:
                agentRecord.agency_name || "",
              address:
                agentRecord.business_address || [agentRecord.city, agentRecord.country].filter(Boolean).join(", ") || undefined,
              alternateEmail:
                agentRecord.alternate_email || undefined,
              mobileNumbers:
                Array.isArray(agentRecord.mobile_numbers) ? agentRecord.mobile_numbers : undefined,
              profileImage:
                agentRecord.profile_image || undefined,
            }
          : query.agentName
          ? {
              name: query.agentName,
              email: "",
              phone: "",
              company: "",
              address: undefined,
              alternateEmail: undefined,
              mobileNumbers: undefined,
              profileImage: undefined,
            }
          : null;

        if (!cancelled) {
          setContact(mapped);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err);
          // Graceful fallback to minimal contact from query
          setContact(
            query?.agentName
              ? {
                  name: query.agentName,
                  email: "",
                  phone: "",
                  company: "",
                  address: undefined,
                }
              : null
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAgent();
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  return { contact, loading, error };
}