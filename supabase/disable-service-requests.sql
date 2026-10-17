-- Apply in live Supabase SQL Editor to disable service requests from older clients.
-- Historical records are preserved.
create or replace function public.submit_service_request(p_table_code text, p_request_type text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'Service requests are no longer available. Please speak to staff.';
end;
$$;
