-- إضافة عمود إيصال الدفع لجدول الطلبات
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- إضافة إعدادات الشحن والدفع لـ site_settings (إن لم تكن موجودة)
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
