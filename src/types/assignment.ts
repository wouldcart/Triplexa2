import { Query } from "./query";

// Staff expertise and proficiency
export type ExpertiseArea = {
  country: string;
  proficiency: "beginner" | "intermediate" | "expert";
};

// Staff availability schedule
export type AvailabilitySchedule = {
  day: string;
  isAvailable: boolean;
  workingHours?: {
    start: string;
    end: string;
  };
};

// Enhanced staff member type
export interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  active: boolean;
  assigned: number;
  avatar: string;
  expertise: string[];
  expertiseDetails?: ExpertiseArea[];
  workloadCapacity: number;
  availability: AvailabilitySchedule[];
  autoAssignEnabled: boolean;
  sequenceOrder?: number;
  department?: string;
  experience?: number;
  specializations?: string[];
  operationalCountries?: string[]; // Added the missing operationalCountries property
}

// Agent-Staff relationship
export interface AgentStaffRelationship {
  agentId: number;
  staffId: number;
  isPrimary: boolean;
  createdAt: string;
}

// Assignment rule types
export type AssignmentRuleType = 
  | "agent-staff-relationship" 
  | "expertise-match"
  | "workload-balance"
  | "round-robin"
  | "manual";

// Assignment rules configuration
export interface AssignmentRule {
  id: number;
  name: string;
  type: AssignmentRuleType;
  priority: number;
  enabled: boolean;
  conditions?: Record<string, any>;
}

// Assignment history entry
export interface AssignmentHistory {
  id: number;
  queryId: string;
  staffId: number;
  assignedBy: number | "system";
  assignedAt: string;
  reason: string;
  ruleApplied?: AssignmentRuleType;
}

// Assignment stats for reporting
export interface AssignmentStats {
  totalAssigned: number;
  averageProcessingTime: number;
  staffPerformance: Record<number, {
    assigned: number;
    completed: number;
    averageTime: number;
  }>;
  ruleEffectiveness: Record<AssignmentRuleType, number>;
}
