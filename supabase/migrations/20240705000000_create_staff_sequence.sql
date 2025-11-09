-- Staff Sequence table for auto-assignment order
-- Creates a persistent sequence for staff used by the /queries/assign module

-- Table
CREATE TABLE IF NOT EXISTS public.staff_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  auto_assign_enabled BOOLEAN DEFAULT true,

  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_staff_sequence UNIQUE(staff_id),
  CONSTRAINT valid_sequence_order CHECK (sequence_order > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_sequence_order ON public.staff_sequence(sequence_order);
CREATE INDEX IF NOT EXISTS idx_staff_sequence_staff ON public.staff_sequence(staff_id);

-- RLS
ALTER TABLE public.staff_sequence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can view staff sequence" ON public.staff_sequence
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'super_admin')
  );

CREATE POLICY "Admins can manage staff sequence" ON public.staff_sequence
  FOR ALL USING (
    get_current_user_role() IN ('manager', 'super_admin')
  );

-- Trigger to update updated_at
CREATE TRIGGER update_staff_sequence_updated_at BEFORE UPDATE ON public.staff_sequence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE public.staff_sequence IS 'Persistent staff sequence order for auto-assignment with RLS policies';