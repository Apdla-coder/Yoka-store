-- ═══════════════════════════════════════════════════════════════════════════════
-- YOKA STORE — الأوامر الناقصة (RLS + تحسينات)
-- شغّلي هذا الملف في Supabase SQL Editor بعد تنفيذ supabase-schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. تفعيل RLS على orders و order_items (إن لم يكن مفعّلاً)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. سياسات RLS لجدول orders
-- ─────────────────────────────────────────────────────────────────────────────

-- المستخدم يرى طلباته فقط
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- أي شخص (ضيف أو مستخدم) يمكنه إنشاء طلب
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- المستخدم يحدّث طلباته فقط (للإلغاء مثلاً)
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- السماح للجميع بالقراءة (للإدارة من لوحة التحكم - أو قيّدي لاحقاً)
DROP POLICY IF EXISTS "Allow anon read orders for admin" ON public.orders;
CREATE POLICY "Allow anon read orders for admin" ON public.orders
  FOR SELECT USING (true);

-- السماح للجميع بالتحديث (لوحة التحكم - تغيير الحالة)
DROP POLICY IF EXISTS "Allow anon update orders for admin" ON public.orders;
CREATE POLICY "Allow anon update orders for admin" ON public.orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. سياسات RLS لجدول order_items
-- ─────────────────────────────────────────────────────────────────────────────

-- القراءة: من خلال الطلب المرتبط
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
    )
  );

-- الإدراج: أي شخص يمكنه إضافة عناصر طلب (عند إنشاء الطلب)
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- السماح بالقراءة للجميع (لوحة التحكم)
DROP POLICY IF EXISTS "Allow anon read order items" ON public.order_items;
CREATE POLICY "Allow anon read order items" ON public.order_items
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. إصلاح order_items.order_id ليكون NOT NULL (إن كان nullable)
-- ─────────────────────────────────────────────────────────────────────────────
-- تحذير: لا تشغّلي هذا إذا كان عندك صفوف فيها order_id = NULL
-- ALTER TABLE public.order_items ALTER COLUMN order_id SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. توليد order_number تلقائياً
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
-- 6. عمود payment_id في orders (لربط بوابة الدفع)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. عمود stock_quantity في products (للمخزون)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
COMMENT ON COLUMN public.products.stock_quantity IS 'كمية المخزون - 0 = نفد';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Trigger لـ updated_at على orders (إن لم يكن موجوداً)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. جدول wishlist (اختياري)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist(product_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. إعدادات الموقع (صورة الهيرو وغيرها)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings readable by everyone" ON public.site_settings;
CREATE POLICY "Site settings readable by everyone" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon to manage site_settings" ON public.site_settings;
CREATE POLICY "Allow anon to manage site_settings" ON public.site_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (key, value) VALUES ('hero_bg_image', '')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- تم. راجعي السياسات حسب احتياجك (مثلاً تقييد لوحة التحكم بـ auth فقط)
-- ═══════════════════════════════════════════════════════════════════════════════
