-- Apply this once to an existing Supabase project to make song artist optional.
alter table public.song_requests alter column artist drop not null;
alter table public.song_requests drop constraint if exists song_requests_artist_check;
alter table public.song_requests
  add constraint song_requests_artist_check
  check (artist is null or char_length(artist) between 1 and 100);

create or replace function public.submit_song_request(p_table_code text, p_title text, p_artist text, p_dedication text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.venue_tables where code = p_table_code and active) then
    raise exception 'This table QR is not active.';
  end if;
  if length(trim(p_title)) not between 1 and 100 then
    raise exception 'Enter a song title.';
  end if;
  if p_artist is not null and length(trim(p_artist)) > 100 then
    raise exception 'Artist name is too long.';
  end if;
  if p_dedication is not null and length(p_dedication) > 280 then
    raise exception 'Dedication is too long.';
  end if;
  insert into public.song_requests(table_code,title,artist,dedication)
  values (p_table_code,trim(p_title),nullif(trim(p_artist),''),nullif(trim(p_dedication),''))
  returning id into v_id;
  return jsonb_build_object('id',v_id,'status','pending');
end;
$$;
