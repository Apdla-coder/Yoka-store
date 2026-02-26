ALTER TABLE public.customers ADD COLUMN package_price numeric(10, 2) NULL DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_package_price ON public.customers USING btree (package_price) TABLESPACE pg_default;
