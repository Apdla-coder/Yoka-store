-- ═══════════════════════════════════════════════════════════════════════════════
-- YOKA STORE — Full Database Schema for Supabase (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- كيف تشغّل السكربت:
-- 1. افتحي مشروعك في Supabase Dashboard
-- 2. من القائمة: SQL Editor → New query
-- 3. الصقي هذا الملف كاملاً ثم Run
--
-- الهيكل: categories → products → product_colors, product_sizes → carts → cart_items
-- السلة (carts / cart_items) مرتبطة بمستخدمي auth.users في Supabase
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  "order"    SMALLINT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  image_url  TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was created earlier without them
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

COMMENT ON TABLE public.categories IS 'Product categories (makeup, fashion, skincare, accessories, etc.)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  brand        TEXT NOT NULL,
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  old_price    NUMERIC(12,2) CHECK (old_price IS NULL OR old_price >= 0),
  description  TEXT,
  image_url    TEXT,
  badge        TEXT,
  badge_type   TEXT CHECK (badge_type IS NULL OR badge_type IN ('new', 'sale', '')),
  rating       SMALLINT NOT NULL DEFAULT 5 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure column exists if table was created earlier without it
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_badge_type ON public.products(badge_type) WHERE badge_type IS NOT NULL;

COMMENT ON TABLE public.products IS 'Store products with pricing and display info';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCT COLORS (optional variants per product)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_colors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, color_hex)
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON public.product_colors(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PRODUCT SIZES (optional sizes per product)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON public.product_sizes(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CARTS (one per user when logged in)
-- user_id references Supabase auth.users(id)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.carts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

COMMENT ON TABLE public.carts IS 'Shopping cart per authenticated user';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CART ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id       UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
  price_at_time NUMERIC(12,2) NOT NULL CHECK (price_at_time >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

COMMENT ON TABLE public.cart_items IS 'Items in a cart with snapshot price';

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT trigger helper
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_carts_updated_at ON public.carts;
CREATE TRIGGER set_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Categories: public read + allow anon to manage (لوحة التحكم)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage categories" ON public.categories;
CREATE POLICY "Allow anon to manage categories" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

-- Products: public read active only (app filters is_active anyway)
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone" ON public.products
  FOR SELECT USING (is_active = true);

-- Products: allow all for anon (لوحة التحكم - يمكن تقييدها لاحقاً بـ auth)
DROP POLICY IF EXISTS "Allow anon to manage products" ON public.products;
CREATE POLICY "Allow anon to manage products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- Product colors/sizes: public read + allow anon to manage (لوحة التحكم)
DROP POLICY IF EXISTS "Product colors viewable by everyone" ON public.product_colors;
CREATE POLICY "Product colors viewable by everyone" ON public.product_colors
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage product_colors" ON public.product_colors;
CREATE POLICY "Allow anon to manage product_colors" ON public.product_colors
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Product sizes viewable by everyone" ON public.product_sizes;
CREATE POLICY "Product sizes viewable by everyone" ON public.product_sizes
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon to manage product_sizes" ON public.product_sizes;
CREATE POLICY "Allow anon to manage product_sizes" ON public.product_sizes
  FOR ALL USING (true) WITH CHECK (true);

-- Carts: user can only see/edit their own
DROP POLICY IF EXISTS "Users can view own cart" ON public.carts;
CREATE POLICY "Users can view own cart" ON public.carts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

-- Optional: allow service role / admin to manage products and categories
-- (Supabase anon key won't have insert/update on products; use dashboard or service_role for admin)
DROP POLICY IF EXISTS "Allow public read categories for anon" ON public.categories;
-- already have SELECT for everyone

-- Products: if you want anon to only SELECT, we're good. For admin panel use service_role key or add authenticated-only policies later.

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Categories
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.categories (name, slug, "order", image_url, description) VALUES
  ('ميك أب', 'makeup', 1, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop', 'أحمر شفاه · بودرة · عيون · بشرة'),
  ('أزياء', 'fashion', 2, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop', 'فساتين · عبايات · إكسسوارات'),
  ('العناية بالبشرة', 'skincare', 3, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop', 'سيروم · مرطب · كريم · ماسك'),
  ('إكسسوارات', 'accessories', 4, 'https://images.unsplash.com/photo-1535633302723-99e393142281?q=80&w=800&auto=format&fit=crop', 'حقائب · مجوهرات · نظارات')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Sample Products (insert only if no products exist)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.products (
  name, brand, category_id, price, old_price, description, image_url, badge, badge_type, rating, rating_count, is_active
)
SELECT * FROM (VALUES
  (
    'Velvet Rose Lip Kit',
    'Yoka Beauty',
    (SELECT id FROM public.categories WHERE slug = 'makeup' LIMIT 1),
    290.00, NULL,
    'أحمر شفاه فاخر مع بطانة شفاه وتبت شفاه. يدوم حتى ١٢ ساعة بلا تشقق.',
    'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop',
    'Best Seller', NULL, 5, 248, true
  ),
  (
    'Glow Serum 30ml',
    'Yoka Skin',
    (SELECT id FROM public.categories WHERE slug = 'skincare' LIMIT 1),
    185.00, NULL,
    'سيروم الإشراق الفاخر بتركيبة نياسيناميد وفيتامين C. يمنح بشرتك توهجاً صحياً.',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    'New', 'new', 5, 92, true
  ),
  (
    'Midnight Palazzo Set',
    'Yoka Fashion',
    (SELECT id FROM public.categories WHERE slug = 'fashion' LIMIT 1),
    620.00, 850.00,
    'طقم بالاتزو أنيق من قماش الكريب الفاخر. مثالي للسهرات والمناسبات الراقية.',
    'https://images.unsplash.com/photo-1539109132381-31a1ba974f82?q=80&w=800&auto=format&fit=crop',
    'Sale', 'sale', 4, 67, true
  ),
  (
    'Rose Gold Eye Palette',
    'Yoka Beauty',
    (SELECT id FROM public.categories WHERE slug = 'makeup' LIMIT 1),
    340.00, NULL,
    'باليت عيون بـ ١٢ ظلال من الدرجات الدافئة والميتاليك. جودة احترافية للجميع.',
    'https://images.unsplash.com/photo-1512496011931-a2c388278ab7?q=80&w=800&auto=format&fit=crop',
    'Best Seller', NULL, 5, 315, true
  ),
  (
    'Silk Abaya - Pearl',
    'Yoka Fashion',
    (SELECT id FROM public.categories WHERE slug = 'fashion' LIMIT 1),
    890.00, NULL,
    'عباءة حريرية بلون اللؤلؤ مع تطريز يدوي رفيع. أناقة لا مثيل لها.',
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800&auto=format&fit=crop',
    'New', 'new', 5, 44, true
  ),
  (
    'Hydra-Boost Cream',
    'Yoka Skin',
    (SELECT id FROM public.categories WHERE slug = 'skincare' LIMIT 1),
    220.00, 280.00,
    'كريم مرطب فائق يعمل لـ ٤٨ ساعة. تركيبة خالية من البارابين مناسبة للبشرة الحساسة.',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    'Sale', 'sale', 4, 128, true
  ),
  (
    'Contour & Blush Duo',
    'Yoka Beauty',
    (SELECT id FROM public.categories WHERE slug = 'makeup' LIMIT 1),
    195.00, NULL,
    'ثنائي الكونتور والبلاشر لنحت الوجه بشكل طبيعي ومشرق طوال اليوم.',
    'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800&auto=format&fit=crop',
    NULL, NULL, 5, 189, true
  ),
  (
    'Crystal Mini Bag',
    'Yoka Accessories',
    (SELECT id FROM public.categories WHERE slug = 'accessories' LIMIT 1),
    450.00, NULL,
    'حقيبة ميني راقية مزينة بالكريستال. الرفيق المثالي لكل مناسبة.',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop',
    'New', 'new', 5, 36, true
  )
) AS v(name, brand, category_id, price, old_price, description, image_url, badge, badge_type, rating, rating_count, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Product colors (for products that have colors)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.product_colors (product_id, color_name, color_hex)
SELECT p.id, u.name, u.hex
FROM public.products p
CROSS JOIN LATERAL (VALUES
  ('Velvet Rouge', '#c41e3a'),
  ('Rose Nude', '#f4b8c1'),
  ('Deep Red', '#8B2252')
) AS u(name, hex)
WHERE p.name = 'Velvet Rose Lip Kit'
ON CONFLICT (product_id, color_hex) DO NOTHING;

INSERT INTO public.product_colors (product_id, color_name, color_hex)
SELECT p.id, u.name, u.hex
FROM public.products p
CROSS JOIN LATERAL (VALUES
  ('Midnight', '#1a1a2e'),
  ('Navy', '#16213e'),
  ('Purple', '#4a0e8f')
) AS u(name, hex)
WHERE p.name = 'Midnight Palazzo Set'
ON CONFLICT (product_id, color_hex) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Product sizes
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.product_sizes (product_id, size)
SELECT p.id, u.size
FROM public.products p
CROSS JOIN LATERAL unnest(ARRAY['XS', 'S', 'M', 'L', 'XL']) AS u(size)
WHERE p.name = 'Midnight Palazzo Set'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_sizes (product_id, size)
SELECT p.id, u.size
FROM public.products p
CROSS JOIN LATERAL unnest(ARRAY['S', 'M', 'L', 'XL', 'XXL']) AS u(size)
WHERE p.name = 'Silk Abaya - Pearl'
ON CONFLICT (product_id, size) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Done. Tables: categories, products, product_colors, product_sizes, carts, cart_items
-- RLS enabled; seed data for categories and sample products inserted.
-- ═══════════════════════════════════════════════════════════════════════════════
