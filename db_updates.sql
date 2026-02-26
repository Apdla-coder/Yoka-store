-- ======================================================
-- Fox Business - DB Updates for Collection Logic Fix
-- Date: 2026-02-23
-- Run this in Supabase SQL Editor
-- ======================================================

-- 1. إضافة حقل notes لجدول collections (ملاحظات التحصيل)
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. إضافة حقل period_label لجدول collections (لربط كل تحصيل بفترة معينة مثل "2026-02")
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS period_label TEXT;

-- 3. إنشاء index على period_label لأداء أفضل
CREATE INDEX IF NOT EXISTS idx_collections_period_label 
ON public.collections USING btree (period_label);

-- ======================================================
-- ملاحظات:
-- - due_amount في customers يُحسب مع debt_amount في الكود (لا migration مطلوب)
-- - status في customers مكرر مع collection_status - الكود يستخدم collection_status
-- ======================================================
