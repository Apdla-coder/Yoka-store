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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;

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

INSERT INTO public.site_settings (key, value) VALUES ('category_hero_bg_image', '')
ON CONFLICT (key) DO NOTHING;

-- Per-category hero background images (used by admin panel)
INSERT INTO public.site_settings (key, value) VALUES ('hero_bg_makeup', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES ('hero_bg_fashion', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES ('hero_bg_skincare', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES ('hero_bg_accessories', '')
ON CONFLICT (key) DO NOTHING;

-- إعدادات الشحن والدفع
INSERT INTO public.site_settings (key, value) VALUES ('shipping_fee', '25')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('free_shipping_min', '200')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('payment_visa', '1')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('payment_apple', '1')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('payment_cod', '1')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('payment_instapay', '1')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('payment_ewallet', '1')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('instapay_link', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('ewallet_number', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('cloudinary_cloud_name', '')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('cloudinary_upload_preset', '')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. جدول الكوبونات (coupons)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  min_order   NUMERIC(12,2) DEFAULT 0 CHECK (min_order >= 0),
  usage_limit INTEGER,
  used_count  INTEGER NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupons readable by everyone" ON public.coupons;
CREATE POLICY "Coupons readable by everyone" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage coupons" ON public.coupons;
CREATE POLICY "Allow anon to manage coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. جدول البانرات (banners)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  position   TEXT NOT NULL DEFAULT 'hero',
  image_url  TEXT,
  color_hex  TEXT DEFAULT '#cccccc',
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_status ON public.banners(status);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners readable by everyone" ON public.banners;
CREATE POLICY "Banners readable by everyone" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage banners" ON public.banners;
CREATE POLICY "Allow anon to manage banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. جدول التقييمات (reviews)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  rating      SMALLINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews readable by everyone" ON public.reviews;
CREATE POLICY "Reviews readable by everyone" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage reviews" ON public.reviews;
CREATE POLICY "Allow anon to manage reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- تم. راجعي السياسات حسب احتياجك (مثلاً تقييد لوحة التحكم بـ auth فقط)
-- ═══════════════════════════════════════════════════════════════════════════════
