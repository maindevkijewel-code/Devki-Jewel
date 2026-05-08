-- ============================================================
-- DEVKI JEWELS — METAL RATES SYSTEM
-- Execute this in your Supabase SQL Editor
-- ============================================================

-- 1. CURRENT METAL RATES TABLE
-- Stores the latest price for each metal type
CREATE TABLE IF NOT EXISTS public.metal_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metal_type text NOT NULL,           -- 'Gold 22K', 'Gold 24K', 'Silver', 'Platinum'
    purity text,                        -- '22K', '24K', '999', '950'
    unit text NOT NULL DEFAULT '10 Gram', -- '10 Gram', '1 KG', '1 Gram'
    current_price numeric NOT NULL DEFAULT 0,
    price_change numeric DEFAULT 0,      -- absolute change from yesterday
    percentage_change numeric DEFAULT 0, -- percentage change from yesterday
    icon_emoji text DEFAULT '🥇',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(metal_type)
);

-- 2. METAL RATE HISTORY TABLE
-- Stores daily price history for graphs
CREATE TABLE IF NOT EXISTS public.metal_rate_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metal_type text NOT NULL,
    price numeric NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(metal_type, date)
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.metal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_rate_history ENABLE ROW LEVEL SECURITY;

-- Everyone can read rates
DO $$ BEGIN
  CREATE POLICY "Metal rates are viewable by everyone" ON public.metal_rates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Metal rate history is viewable by everyone" ON public.metal_rate_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin can insert/update/delete
DO $$ BEGIN
  CREATE POLICY "Staff can insert metal rates" ON public.metal_rates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update metal rates" ON public.metal_rates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete metal rates" ON public.metal_rates FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert rate history" ON public.metal_rate_history FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update rate history" ON public.metal_rate_history FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete rate history" ON public.metal_rate_history FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_metal_rate_history_type_date ON public.metal_rate_history(metal_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_metal_rates_type ON public.metal_rates(metal_type);

-- 5. SEED DEFAULT METAL TYPES
INSERT INTO public.metal_rates (metal_type, purity, unit, current_price, price_change, percentage_change, icon_emoji, display_order)
VALUES
    ('Gold 22K', '22K', '10 Gram', 62500, 350, 0.56, '🥇', 1),
    ('Gold 24K', '24K', '10 Gram', 67600, -200, -0.30, '✨', 2),
    ('Silver', '999', '1 KG', 78000, 950, 1.23, '🥈', 3),
    ('Platinum', '950', '1 Gram', 3200, 0, 0, '💎', 4)
ON CONFLICT (metal_type) DO UPDATE
SET
    current_price = EXCLUDED.current_price,
    price_change = EXCLUDED.price_change,
    percentage_change = EXCLUDED.percentage_change,
    updated_at = now();
