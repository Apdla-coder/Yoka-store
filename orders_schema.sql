-- ═══════════════════════════════════════════════════════════════════════════════
-- YOKA STORE — هيكل جداول الطلبات (مطابق لقاعدة البيانات الفعلية)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ORDERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number     TEXT NOT NULL UNIQUE,
  status           TEXT DEFAULT 'pending',
  payment_method   TEXT,
  payment_id       TEXT,
  transaction_id   TEXT,

  -- المبالغ (كلها مطلوبة للدعم)
  subtotal         NUMERIC(12,2) NOT NULL,
  total            NUMERIC(12,2) NOT NULL,
  total_amount     NUMERIC(12,2),
  discount_amount  NUMERIC(12,2) DEFAULT 0,
  shipping_cost    NUMERIC(12,2) DEFAULT 0,

  -- بيانات العميل
  customer_name    TEXT,
  customer_email   TEXT,
  customer_phone   TEXT,
  city             TEXT,
  area             TEXT,
  address          TEXT NOT NULL,

  -- إضافي
  shipping_address JSONB,
  notes            TEXT,

  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ORDER ITEMS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name   TEXT NOT NULL,
  product_image  TEXT,
  quantity       INTEGER NOT NULL,
  price_at_time  NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. توليد order_number تلقائياً
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

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon management for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon management for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
