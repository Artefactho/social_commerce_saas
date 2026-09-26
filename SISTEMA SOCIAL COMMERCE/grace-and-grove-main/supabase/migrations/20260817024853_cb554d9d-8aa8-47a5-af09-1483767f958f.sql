-- Revoke default public execute privileges to resolve linter warnings
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;

-- Grant execute only to service_role (it's a security definer function used in RLS policies)
grant execute on function public.has_role(uuid, public.app_role) to service_role;
