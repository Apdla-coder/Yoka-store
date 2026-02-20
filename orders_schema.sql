-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ORDERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number   TEXT UNIQUE,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipping', 'done', 'cancel')),
  total_amount   NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL,
  
  -- Customer Details
  customer_name  TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  city           TEXT NOT NULL,
  area           TEXT,
  address        TEXT NOT NULL,
  
  -- Tracking / External
  payment_id     TEXT,
  transaction_id TEXT,
  
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ORDER ITEMS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  price_at_time NUMERIC(12,2) NOT NULL CHECK (price_at_time >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUTOMATIC ORDER NUMBER GENERATOR
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INT;
  new_number TEXT;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
      NULLIF(SUBSTRING(order_number FROM 10), '')::INT
    ), 0) + 1
    INTO seq_num
    FROM public.orders
    WHERE order_number LIKE 'YOK-' || year_part || '-%';
    
    new_number := 'YOK-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.order_number := new_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Anonymous users (guests) can insert orders
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

-- Admin (Anon for now as per project style) can manage everything
CREATE POLICY "Allow anon management for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon management for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
