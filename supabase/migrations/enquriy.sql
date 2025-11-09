


-- ============================================================================
-- ENHANCED ENQUIRY MANAGEMENT SYSTEM
-- Integration with existing agents, profiles, and staff tables
-- ============================================================================

-- 1. ENQUIRIES TABLE (Enhanced Query Management)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id TEXT UNIQUE NOT NULL, -- Generated ID (e.g., ENQ2025001, DEQ/2025/001)
  
  -- Agent & Assignment
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Destination Details
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  cities JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of city names
  
  -- Travel Details
  travel_from DATE NOT NULL,
  travel_to DATE NOT NULL,
  is_date_estimated BOOLEAN DEFAULT false,
  nights INTEGER NOT NULL,
  days INTEGER NOT NULL,
  
  -- Passenger Details
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  infants INTEGER NOT NULL DEFAULT 0,
  
  -- Budget & Package
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  budget_currency TEXT DEFAULT 'USD',
  package_type TEXT NOT NULL, -- 'budget', 'standard', 'luxury', 'custom'
  
  -- Hotel Requirements
  hotel_rooms INTEGER,
  hotel_category TEXT, -- '3-star', '4-star', '5-star', 'boutique'
  
  -- Inclusions
  sightseeing BOOLEAN DEFAULT true,
  transfers TEXT DEFAULT 'private', -- 'private', 'shared', 'none'
  meal_plan TEXT DEFAULT 'breakfast', -- 'none', 'breakfast', 'half-board', 'full-board'
  
  -- Additional Details
  special_requests JSONB DEFAULT '[]'::jsonb, -- Array of strings
  notes TEXT,
  
  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'assigned', 'in-progress', 'proposal-sent', 'confirmed', 'cancelled'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Communication
  communication_preference TEXT DEFAULT 'email', -- 'email', 'phone', 'whatsapp'
  
  -- City Allocations
  city_allocations JSONB DEFAULT '[]'::jsonb, -- [{city, nights, isOptional, estimatedCost}]
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (travel_to >= travel_from),
  CONSTRAINT valid_passengers CHECK (adults > 0 OR children > 0),
  CONSTRAINT valid_nights CHECK (nights > 0 AND days > 0)
);

-- 2. PROPOSALS TABLE (Linked to Enquiries)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id TEXT UNIQUE NOT NULL, -- Format: ENQ2025001-P001
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  cost_per_person NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  final_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'modified'
  
  -- Inclusions & Terms
  inclusions JSONB DEFAULT '[]'::jsonb, -- Array of strings
  exclusions JSONB DEFAULT '[]'::jsonb, -- Array of strings
  terms TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- 3. ITINERARY DAYS TABLE (Day-by-Day Plan)
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Day Info
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  
  -- Activities
  activities JSONB DEFAULT '[]'::jsonb, -- Array of activity strings
  
  -- Accommodation
  accommodation_name TEXT,
  accommodation_type TEXT, -- 'hotel', 'resort', 'guesthouse'
  accommodation_category TEXT, -- '3-star', '4-star', '5-star'
  
  -- Meals
  breakfast BOOLEAN DEFAULT false,
  lunch BOOLEAN DEFAULT false,
  dinner BOOLEAN DEFAULT false,
  
  -- Cost Breakdown
  accommodation_cost NUMERIC(10,2) DEFAULT 0,
  sightseeing_cost NUMERIC(10,2) DEFAULT 0,
  meals_cost NUMERIC(10,2) DEFAULT 0,
  transfer_cost NUMERIC(10,2) DEFAULT 0,
  other_cost NUMERIC(10,2) DEFAULT 0,
  total_day_cost NUMERIC(10,2) GENERATED ALWAYS AS (
    accommodation_cost + sightseeing_cost + meals_cost + transfer_cost + other_cost
  ) STORED,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_day_per_proposal UNIQUE(proposal_id, day_number),
  CONSTRAINT valid_day_number CHECK (day_number > 0)
);

-- 4. ASSIGNMENT RULES TABLE (Smart Assignment Logic)
CREATE TABLE IF NOT EXISTS public.assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'agent-staff', 'expertise', 'workload', 'round-robin'
  priority INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_rule_name UNIQUE(name)
);

-- 5. ASSIGNMENT HISTORY TABLE (Track All Assignments)
CREATE TABLE IF NOT EXISTS public.assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for system
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  rule_applied TEXT, -- Reference to assignment_rule type
  
  -- Auto-assignment or manual
  is_auto_assigned BOOLEAN DEFAULT false
);

-- 6. STAFF WORKLOAD TABLE (Track Current Workload)
CREATE TABLE IF NOT EXISTS public.staff_workload (
  staff_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active_enquiries INTEGER DEFAULT 0,
  total_enquiries INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0, -- in hours
  last_assignment TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENQUIRY WORKFLOW EVENTS (Activity Log)
CREATE TABLE IF NOT EXISTS public.enquiry_workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'proposal_created', 'comment_added'
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_role TEXT,
  details TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_enquiries_agent ON public.enquiries(agent_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_to ON public.enquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_country ON public.enquiries(country_code);
CREATE INDEX IF NOT EXISTS idx_enquiries_dates ON public.enquiries(travel_from, travel_to);

CREATE INDEX IF NOT EXISTS idx_proposals_enquiry ON public.proposals(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_itinerary_proposal ON public.itinerary_days(proposal_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_day ON public.itinerary_days(proposal_id, day_number);

CREATE INDEX IF NOT EXISTS idx_assignment_history_enquiry ON public.assignment_history(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_staff ON public.assignment_history(staff_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_date ON public.assignment_history(assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_events_enquiry ON public.enquiry_workflow_events(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created ON public.enquiry_workflow_events(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON public.enquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_days_updated_at BEFORE UPDATE ON public.itinerary_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update staff workload on assignment
CREATE OR REPLACE FUNCTION update_staff_workload()
RETURNS TRIGGER AS $$
BEGIN
    -- Update workload for newly assigned staff
    INSERT INTO public.staff_workload (staff_id, active_enquiries, total_enquiries, last_assignment)
    VALUES (NEW.staff_id, 1, 1, NEW.assigned_at)
    ON CONFLICT (staff_id) DO UPDATE SET
        active_enquiries = staff_workload.active_enquiries + 1,
        total_enquiries = staff_workload.total_enquiries + 1,
        last_assignment = NEW.assigned_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workload_on_assignment AFTER INSERT ON public.assignment_history
    FOR EACH ROW EXECUTE FUNCTION update_staff_workload();

-- Log workflow events on status change
CREATE OR REPLACE FUNCTION log_enquiry_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.enquiry_workflow_events (
            enquiry_id, event_type, details, metadata
        ) VALUES (
            NEW.id,
            'status_changed',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_status_change AFTER UPDATE ON public.enquiries
    FOR EACH ROW EXECUTE FUNCTION log_enquiry_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_workload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_workflow_events ENABLE ROW LEVEL SECURITY;

-- Enquiries Policies
CREATE POLICY "Staff can view assigned enquiries" ON public.enquiries
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        created_by = auth.uid() OR
        get_current_user_role() IN ('super_admin', 'manager')
    );

CREATE POLICY "Agents can view their enquiries" ON public.enquiries
    FOR SELECT USING (
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can create enquiries" ON public.enquiries
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        get_current_user_role() IN ('staff', 'manager', 'super_admin')
    );

CREATE POLICY "Staff can update assigned enquiries" ON public.enquiries
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        get_current_user_role() IN ('super_admin', 'manager')
    );

-- Proposals Policies
CREATE POLICY "View proposals for accessible enquiries" ON public.proposals
    FOR SELECT USING (
        enquiry_id IN (SELECT id FROM public.enquiries WHERE 
            assigned_to = auth.uid() OR 
            created_by = auth.uid() OR
            agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
            get_current_user_role() IN ('super_admin', 'manager')
        )
    );

CREATE POLICY "Staff can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        get_current_user_role() IN ('staff', 'manager', 'super_admin')
    );

CREATE POLICY "Staff can update their proposals" ON public.proposals
    FOR UPDATE USING (
        created_by = auth.uid() OR
        get_current_user_role() IN ('super_admin', 'manager')
    );

-- Itinerary Days Policies
CREATE POLICY "View itinerary for accessible proposals" ON public.itinerary_days
    FOR SELECT USING (
        proposal_id IN (SELECT id FROM public.proposals WHERE 
            enquiry_id IN (SELECT id FROM public.enquiries WHERE 
                assigned_to = auth.uid() OR 
                created_by = auth.uid() OR
                agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
                get_current_user_role() IN ('super_admin', 'manager')
            )
        )
    );

CREATE POLICY "Staff can manage itinerary days" ON public.itinerary_days
    FOR ALL USING (
        get_current_user_role() IN ('staff', 'manager', 'super_admin')
    );

-- Assignment Rules Policies
CREATE POLICY "Everyone can view assignment rules" ON public.assignment_rules
    FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage assignment rules" ON public.assignment_rules
    FOR ALL USING (
        get_current_user_role() IN ('super_admin', 'manager')
    );

-- Assignment History Policies
CREATE POLICY "View assignment history for accessible enquiries" ON public.assignment_history
    FOR SELECT USING (
        staff_id = auth.uid() OR
        assigned_by = auth.uid() OR
        get_current_user_role() IN ('super_admin', 'manager')
    );

CREATE POLICY "System and admins can create assignments" ON public.assignment_history
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('staff', 'manager', 'super_admin')
    );

-- Staff Workload Policies
CREATE POLICY "Staff can view their workload" ON public.staff_workload
    FOR SELECT USING (
        staff_id = auth.uid() OR
        get_current_user_role() IN ('super_admin', 'manager')
    );

CREATE POLICY "System manages workload" ON public.staff_workload
    FOR ALL USING (true);

-- Workflow Events Policies
CREATE POLICY "View events for accessible enquiries" ON public.enquiry_workflow_events
    FOR SELECT USING (
        enquiry_id IN (SELECT id FROM public.enquiries WHERE 
            assigned_to = auth.uid() OR 
            created_by = auth.uid() OR
            agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
            get_current_user_role() IN ('super_admin', 'manager')
        )
    );

CREATE POLICY "System can create workflow events" ON public.enquiry_workflow_events
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- DEFAULT ASSIGNMENT RULES
-- ============================================================================

INSERT INTO public.assignment_rules (name, rule_type, priority, enabled, conditions) VALUES
('Agent-Staff Relationship', 'agent-staff', 1, true, '{"match_type": "primary"}'::jsonb),
('Country Expertise Match', 'expertise', 2, true, '{"match_field": "country"}'::jsonb),
('Workload Balance', 'workload', 3, true, '{"max_active": 10}'::jsonb),
('Round Robin', 'round-robin', 4, true, '{"rotation": "sequential"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SUMMARY COMMENT
-- ============================================================================
COMMENT ON TABLE public.enquiries IS 'Enhanced enquiry management with full destination, travel, and passenger details';
COMMENT ON TABLE public.proposals IS 'Proposals linked to enquiries with pricing and itinerary';
COMMENT ON TABLE public.itinerary_days IS 'Day-by-day itinerary breakdown with cost tracking';
COMMENT ON TABLE public.assignment_rules IS 'Smart assignment rules for automatic staff allocation';
COMMENT ON TABLE public.assignment_history IS 'Complete history of all enquiry assignments';
COMMENT ON TABLE public.staff_workload IS 'Real-time staff workload tracking for balanced assignment';
COMMENT ON TABLE public.enquiry_workflow_events IS 'Activity log for all enquiry-related events';

