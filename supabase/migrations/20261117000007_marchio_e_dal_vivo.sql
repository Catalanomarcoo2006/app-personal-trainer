-- Foto e logo del trainer su Storage, e messaggi dal vivo (17/11).
--
-- 1. Bucket pubblico "marchi": foto e logo si vedono anche dalla pagina d'accesso /<slug>, prima del login, e
--    nell'app dei clienti. Non sono dati dei clienti. Un file per immagine in <trainer>/<foto|logo>-<numero>.<ext>:
--    il nome cambia a ogni caricamento, così il browser non tiene quella vecchia. Scrive solo il trainer, nella sua cartella.
-- 2. trainers.photo_path (logo_path c'era già) e trainer_branding() che restituisce anche la foto.
-- 3. messages nella pubblicazione di Realtime: trainer e cliente vedono i messaggi nuovi senza ricaricare
--    (Realtime applica le stesse regole di accesso della tabella).

alter table public.trainers add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marchi', 'marchi', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Il percorso è nella cartella del trainer collegato e ha esattamente due parti.
create function public.is_my_brand_path(p_name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select split_part(p_name, '/', 2) <> '' and split_part(p_name, '/', 3) = ''
    and split_part(p_name, '/', 1) = public.my_trainer_id()::text;
$$;
revoke execute on function public.is_my_brand_path(text) from public, anon;
grant execute on function public.is_my_brand_path(text) to authenticated, service_role;

-- leggere serve a Storage per sostituire e togliere i file (la vista pubblica passa dall'indirizzo pubblico)
create policy marchi_leggi on storage.objects for select to authenticated
  using (bucket_id = 'marchi' and public.is_my_brand_path(name));
create policy marchi_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'marchi' and public.is_my_brand_path(name));
create policy marchi_cambia on storage.objects for update to authenticated
  using (bucket_id = 'marchi' and public.is_my_brand_path(name))
  with check (bucket_id = 'marchi' and public.is_my_brand_path(name));
create policy marchi_togli on storage.objects for delete to authenticated
  using (bucket_id = 'marchi' and public.is_my_brand_path(name));

-- Foto e logo nella riga del trainer puntano solo alla sua cartella.
alter table public.trainers add constraint trainers_photo_path_check
  check (photo_path is null or photo_path like id::text || '/%');
alter table public.trainers add constraint trainers_logo_path_check
  check (logo_path is null or logo_path like id::text || '/%');

-- trainer_branding con la foto: cambia ciò che restituisce, quindi si ricrea.
drop function public.trainer_branding(text);
create function public.trainer_branding(p_slug text)
returns table (name text, logo_path text, photo_path text, color text, active boolean)
language sql stable security definer set search_path = ''
as $$
  select t.name, t.logo_path, t.photo_path, t.color, t.status = 'active'
  from public.trainers t
  where t.slug = p_slug;
$$;
grant execute on function public.trainer_branding(text) to anon, authenticated;

-- Realtime sui messaggi (dove c'è: nei progetti Supabase la pubblicazione esiste già).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
