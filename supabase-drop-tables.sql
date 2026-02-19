-- ═══════════════════════════════════════════════════════════════════════════════
-- YOKA STORE — حذف كل الجداول (تنظيف قبل إعادة إنشاء الهيكل)
-- شغّلي هذا في Supabase → SQL Editor ثم شغّلي بعديه supabase-schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- حذف الجداول بالترتيب (الأبناء قبل الآباء) أو باستخدام CASCADE
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.product_sizes CASCADE;
DROP TABLE IF EXISTS public.product_colors CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- حذف الدالة المساعدة لـ updated_at (اختياري)
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- انتهى. بعدها شغّلي supabase-schema.sql لإنشاء الجداول من جديد.
-- ═══════════════════════════════════════════════════════════════════════════════
