ALTER TABLE public.orders ALTER COLUMN phone DROP NOT NULL;
COMMENT ON COLUMN public.orders.phone IS 'DEPRECATED: phone is no longer collected; the app no longer reads or writes this column.';