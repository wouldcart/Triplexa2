import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  DollarSign,
  CalendarDays,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  UserPlus,
  UserMinus,
  AlertTriangle,
} from "lucide-react";

type MenuItem = {
  id: string;
  title: string;
  description?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
};

const menuItems: MenuItem[] = [
  { id: "overview", title: "Overview", path: "/management/hr", icon: LayoutDashboard, description: "HR dashboard overview" },
  { id: "payroll", title: "Payroll", path: "/management/hr/payroll", icon: DollarSign, description: "Run and approve payroll" },
  { id: "leaves", title: "Leaves", path: "/management/hr/leaves", icon: CalendarDays, description: "Manage leave applications" },
  { id: "attendance", title: "Attendance", path: "/management/hr/attendance", icon: Clock, description: "Track attendance records" },
  { id: "salary", title: "Salary Structure", path: "/management/hr/salary", icon: Layers, description: "Configure salary components" },
  { id: "docs", title: "Staff Docs", path: "/management/hr/staff-docs", icon: FileText, description: "Verify staff documents" },
  { id: "bank", title: "Bank Verification", path: "/management/hr/bank-verification", icon: ShieldCheck, description: "Verify bank details" },
  { id: "onboarding", title: "Onboarding", path: "/management/hr/onboarding", icon: UserPlus, description: "Onboard new employees" },
  { id: "offboarding", title: "Offboarding", path: "/management/hr/offboarding", icon: UserMinus, description: "Offboard employees" },
  { id: "compliance", title: "Compliance", path: "/management/hr/compliance", icon: AlertTriangle, description: "HR compliance center" },
];

const HRSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    const current = location.pathname.endsWith("/")
      ? location.pathname.slice(0, -1)
      : location.pathname;
    const target = path.endsWith("/") ? path.slice(0, -1) : path;
    return current === target || current.startsWith(target + "/");
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r w-full lg:w-80")}> 
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-3">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">HR Center</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          Manage HR workflows and verification tasks
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                className={cn("w-full justify-start h-auto p-3 font-normal", active && "bg-secondary")}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                  )}
                </div>
                {item.badge && (
                  <Badge variant={typeof item.badge === "number" ? "destructive" : "secondary"} className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>HR actions auto-save enabled</div>
          <div>Last updated: just now</div>
        </div>
      </div>
    </div>
  );
};

export default HRSidebar;