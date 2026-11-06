-- Documenti del cliente su Storage (6/11): dieta del nutrizionista, analisi, foto. Bucket privato "documenti",
-- un file per documento in <trainer>/<cliente>/<id>.<pdf|jpg>; la riga in public.documents ne tiene il percorso.
-- Il trainer legge, carica e toglie i file dei suoi clienti; il cliente legge i suoi, carica e toglie solo i suoi.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documenti', 'documenti', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Il percorso è di un cliente di chi è collegato (il trainer suo, o il cliente stesso), nella cartella del suo
-- trainer, e ha esattamente tre parti. Confronta testo con testo: un nome storto non fa errore, dà solo false.
create function public.can_use_document_path(p_name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select split_part(p_name, '/', 3) <> '' and split_part(p_name, '/', 4) = '' and exists (
    select 1
    from public.clients c
    where c.id::text = split_part(p_name, '/', 2)
      and c.trainer_id::text = split_part(p_name, '/', 1)
      and (c.trainer_id = public.my_trainer_id() or c.id = public.my_client_id())
  );
$$;
revoke execute on function public.can_use_document_path(text) from public, anon;
grant execute on function public.can_use_document_path(text) to authenticated, service_role;

create policy documenti_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and public.can_use_document_path(name));
create policy documenti_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and public.can_use_document_path(name));
-- il trainer toglie i file dei suoi clienti; il cliente solo quelli caricati da lui (la riga si toglie dopo il file)
create policy documenti_togli on storage.objects for delete to authenticated
  using (
    bucket_id = 'documenti' and public.can_use_document_path(name) and (
      (select public.my_trainer_id()) is not null
      -- objects.name: senza nome della tabella "name" sarebbe la colonna del documento
      or exists (select 1 from public.documents d where d.storage_path = objects.name and d.uploaded_by = 'cliente')
    )
  );

-- Le righe dei documenti puntano solo a file nella cartella giusta (prima il percorso era libero).
drop policy documents_trainer on public.documents;
create policy documents_trainer on public.documents for all to authenticated
  using (public.is_my_client(client_id))
  with check (
    public.is_my_client(client_id) and uploaded_by in ('trainer', 'nutrizionista')
    and storage_path like (select public.my_trainer_id())::text || '/' || client_id::text || '/%'
  );

drop policy documents_client_insert on public.documents;
create policy documents_client_insert on public.documents for insert to authenticated
  with check (
    client_id = (select public.my_client_id()) and uploaded_by = 'cliente'
    and storage_path like (select public.my_client_trainer_id())::text || '/' || client_id::text || '/%'
  );
