# Plan: Phase 6 - Plans and Subscriptions (START/PRO/MASTER)

This phase implements the subscription infrastructure, including plan definitions, store association, and trial management.

## User Review Required

> [!IMPORTANT]
> The current templates (Minimal, Bold, Premium) will be linked to the plans (START, PRO, MASTER) as per the instruction. If a store chooses a plan, it automatically gains access to the corresponding template.

## Technical Details

### 1. Database Schema
We will create the `plans` table and update the `stores` table to track the active plan and trial expiration.

#### SQL Migration
```sql
-- 1. Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    included_template_id UUID REFERENCES public.templates(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Grant permissions
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;

-- 3. Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for plans" ON public.plans
    FOR SELECT USING (true);

-- 4. Update stores table
ALTER TABLE public.stores 
ADD COLUMN plan_id UUID REFERENCES public.plans(id),
ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');

-- 5. Seed plans (Linking to existing templates)
-- Note: UUIDs will be fetched dynamically from the templates table during execution
```

### 2. Dashboard Integration
We will add a new "Planos" tab to the Seller Panel:
- Fetch plans from the database.
- Display cards for START, PRO, and MASTER.
- Implement selection logic that updates the store's `plan_id`.
- Auto-activate the template associated with the plan in `store_templates` and `active_template_id`.

### 3. Onboarding Update
- Ensure new stores are created with `trial_ends_at` set to 7 days from creation.

### 4. Verification
- Manual test script to create a store, verify the trial period, select a plan, and confirm template activation.

## Implementation Steps

1. **Database Migration**: Create `plans` table and seed data linking templates.
2. **Backend Logic**: Create a function to handle plan selection and template activation.
3. **Frontend Dashboard**:
   - Update `src/pages/Dashboard.tsx` to include the "Planos" tab.
   - Create a `PlanSelection` component.
4. **Validation**: Run automated checks for the new RLS and data persistence.
