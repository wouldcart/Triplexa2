import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Search, ChevronLeft, ChevronRight, User } from "lucide-react";

// Use a relaxed Supabase client to avoid deep generic instantiation issues
const sb = supabase as any;

type ActiveStaff = {
  id: string;
  name: string;
  email?: string;
  department?: string;
  role?: string;
  status: string;
  avatar?: string | null;
  position?: string | null;
};

interface ActiveStaffListProps {
  searchTerm?: string;
}

const PAGE_SIZE = 10;

const ActiveStaffList: React.FC<ActiveStaffListProps> = ({ searchTerm: externalSearchTerm }) => {
  const [items, setItems] = useState<ActiveStaff[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || "");

  const appliedSearchTerm = useMemo(() => externalSearchTerm ?? searchTerm, [externalSearchTerm, searchTerm]);

  useEffect(() => {
    // Reset to first page when search changes
    setPage(1);
  }, [appliedSearchTerm]);

  useEffect(() => {
    const fetchActiveStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Query profiles table which is present in typed schema
        // Avoid complex generic overloads by using a relaxed client
        let query = sb
          .from("profiles" as any)
          .select("id,name,email,department,role,status,position", { count: "exact" })
          .eq("status", "active")
          .order("name", { ascending: true })
          .range(from, to);

        if (appliedSearchTerm && appliedSearchTerm.trim().length > 0) {
          const term = `%${appliedSearchTerm.trim()}%`;
          query = query.or(`name.ilike.${term},department.ilike.${term},position.ilike.${term}`);
        }

        const { data, error, count } = (await query) as {
          data: any[] | null;
          error: any;
          count: number | null;
        };

        if (error) throw error;
        const mapped = (data || []).map((row: any): ActiveStaff => ({
          id: row.id,
          name: row.name || "Unknown",
          email: row.email,
          department: row.department,
          role: row.role,
          status: row.status || "active",
          // profiles may not have avatar; keep optional for UI fallback
          avatar: row.avatar,
          position: row.position,
        }));
        setItems(mapped);
        setTotalCount(count || 0);
      } catch (err: any) {
        const msg = String(err?.message || err || "Unknown error");
        const lower = msg.toLowerCase();
        const isAuthOrPermission = lower.includes("permission denied") || lower.includes("row level security") || lower.includes("rls") || lower.includes("not authenticated") || lower.includes("auth");
        setError(isAuthOrPermission ? "You do not have permission to view active staff. Please check your role or sign in." : msg);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveStaff();
  }, [page, appliedSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Active Staff</CardTitle>
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, department, position"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground p-4 text-center">No active staff found.</div>
                )}
                {items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        {s.avatar ? (
                          <AvatarImage src={s.avatar} />
                        ) : (
                          <AvatarFallback>{s.name?.charAt(0) || "S"}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{s.name || "Unknown"}</p>
                          {s.department && <Badge variant="outline" className="text-xs">{s.department}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {[s.position, s.role].filter(Boolean).join(" • ") || "Staff"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.email && (
                        <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[200px]">{s.email}</span>
                      )}
                      <Button asChild variant="secondary" size="sm">
                        <Link to={`/management/staff/${s.id}`}>
                          <User className="h-3 w-3 mr-1" /> View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveStaffList;