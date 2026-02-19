-- Insert sample products into Supabase
-- Run this in the Supabase SQL Editor

-- Get category IDs first
WITH category_ids AS (
  SELECT 
    'makeup' as slug, (SELECT id FROM categories WHERE slug = 'makeup') as id
  UNION ALL
  SELECT 
    'skincare' as slug, (SELECT id FROM categories WHERE slug = 'skincare') as id
  UNION ALL
  SELECT 
    'fashion' as slug, (SELECT id FROM categories WHERE slug = 'fashion') as id
  UNION ALL
  SELECT 
    'accessories' as slug, (SELECT id FROM categories WHERE slug = 'accessories') as id
)

-- Insert sample products
INSERT INTO products (name, brand, category_id, price, old_price, description, image_url, badge, badge_type, rating, rating_count) VALUES
-- Makeup products
('Velvet Rose Lip Kit', 'Yoka Beauty', (SELECT id FROM category_ids WHERE slug = 'makeup'), 290.00, NULL, 'أحمر شفاه فاخر مع بطانة شفاه وتبت شفاه. يدوم حتى ١٢ ساعة بلا تشقق.', 'https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=800&auto=format&fit=crop', 'Best Seller', NULL, 5, 248),
('Rose Gold Eye Palette', 'Yoka Beauty', (SELECT id FROM category_ids WHERE slug = 'makeup'), 340.00, NULL, 'باليت عيون بـ ١٢ ظلال من الدرجات الدافئة والميتاليك. جودة احترافية للجميع.', 'https://images.unsplash.com/photo-1512496011931-a2c388278ab7?q=80&w=800&auto=format&fit=crop', 'Best Seller', NULL, 5, 315),
('Contour & Blush Duo', 'Yoka Beauty', (SELECT id FROM category_ids WHERE slug = 'makeup'), 195.00, NULL, 'ثنائي الكونتور والبلاشر لنحت الوجه بشكل طبيعي ومشرق طوال اليوم.', 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800&auto=format&fit=crop', NULL, NULL, 5, 189),

-- Skincare products
('Glow Serum 30ml', 'Yoka Skin', (SELECT id FROM category_ids WHERE slug = 'skincare'), 185.00, NULL, 'سيروم الإشراق الفاخر بتركيبة نياسيناميد وفيتامين C. يمنح بشرتك توهجاً صحياً.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop', 'New', 'new', 5, 92),
('Hydra-Boost Cream', 'Yoka Skin', (SELECT id FROM category_ids WHERE slug = 'skincare'), 220.00, 280.00, 'كريم مرطب فائق يعمل لـ ٤٨ ساعة. تركيبة خالية من البارابين مناسبة للبشرة الحساسة.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop', 'Sale', 'sale', 4, 128),

-- Fashion products
('Midnight Palazzo Set', 'Yoka Fashion', (SELECT id FROM category_ids WHERE slug = 'fashion'), 620.00, 850.00, 'طقم بالاتزو أنيق من قماش الكريب الفاخر. مثالي للسهرات والمناسبات الراقية.', 'https://images.unsplash.com/photo-1539109132381-31a1ba974f82?q=80&w=800&auto=format&fit=crop', 'Sale', 'sale', 4, 67),
('Silk Abaya - Pearl', 'Yoka Fashion', (SELECT id FROM category_ids WHERE slug = 'fashion'), 890.00, NULL, 'عباءة حريرية بلون اللؤلؤ مع تطريز يدوي رفيع. أناقة لا مثيل لها.', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800&auto=format&fit=crop', 'New', 'new', 5, 44),

-- Accessories products
('Crystal Mini Bag', 'Yoka Accessories', (SELECT id FROM category_ids WHERE slug = 'accessories'), 450.00, NULL, 'حقيبة ميني راقية مزينة بالكريستال. الرفيق المثالي لكل مناسبة.', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop', 'New', 'new', 5, 36)

ON CONFLICT DO NOTHING;

-- Insert some product colors
INSERT INTO product_colors (product_id, color_name, color_hex) 
SELECT 
  p.id, 
  unnest(ARRAY['Velvet Rouge', 'Rose Nude', 'Deep Red']),
  unnest(ARRAY['#c41e3a', '#f4b8c1', '#8B2252'])
FROM products p 
WHERE p.name = 'Velvet Rose Lip Kit'
LIMIT 3;

INSERT INTO product_colors (product_id, color_name, color_hex) 
SELECT 
  p.id, 
  unnest(ARRAY['Midnight', 'Navy', 'Purple']),
  unnest(ARRAY['#1a1a2e', '#16213e', '#4a0e8f'])
FROM products p 
WHERE p.name = 'Midnight Palazzo Set'
LIMIT 3;

-- Insert some product sizes
INSERT INTO product_sizes (product_id, size)
SELECT p.id, unnest(ARRAY['XS', 'S', 'M', 'L', 'XL'])
FROM products p 
WHERE p.name = 'Midnight Palazzo Set'
LIMIT 5;

INSERT INTO product_sizes (product_id, size)
SELECT p.id, unnest(ARRAY['S', 'M', 'L', 'XL', 'XXL'])
FROM products p 
WHERE p.name = 'Silk Abaya - Pearl'
LIMIT 5;
