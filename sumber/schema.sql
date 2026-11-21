-- SegarKite: skema Supabase. Semua tabel terkunci (RLS) dan hanya dibuka lewat fungsi server "api".
create table if not exists public.products (
  id text primary key, name text not null, cat text not null default 'Lainnya',
  price integer not null default 0, old_price integer not null default 0,
  hpp integer not null default 0, kemas integer not null default 0, stock integer,
  image text not null default '', emoji text not null default '', descr text not null default '', badge text not null default '',
  prep_text text not null default '', pack_text text not null default '',
  flash_price integer not null default 0, flash_until text not null default '', flash_quota integer not null default 0,
  active boolean not null default true, sort integer not null default 999,
  updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id text primary key, created_at timestamptz not null default now(),
  name text not null, wa text not null, method text not null default '', zone text not null default '',
  address text not null default '', maps text not null default '', "date" text not null default '', slot text not null default '',
  summary text not null default '', subtotal integer not null default 0, discount integer not null default 0,
  voucher text not null default '', shipping integer not null default 0, total integer not null default 0, margin integer not null default 0,
  payment text not null default '', note text not null default '', status text not null default 'Baru',
  items jsonb not null default '[]', key text unique, sig text not null default '', ts bigint not null default 0
);
create index if not exists orders_wa_idx on public.orders (wa);
create index if not exists orders_slot_idx on public.orders ("date", slot);
create table if not exists public.complaints (
  id text primary key, created_at timestamptz not null default now(),
  name text not null, wa text not null, order_id text not null default '', type text not null default '',
  message text not null, status text not null default 'Baru', reply text not null default ''
);
create table if not exists public.settings (k text primary key, v jsonb not null);
create table if not exists public.kv (k text primary key, v jsonb not null);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.complaints enable row level security;
alter table public.settings enable row level security;
alter table public.kv enable row level security;

-- Pembuatan pesanan atomik: kunci unik, anti dobel, stok, kapasitas sesi, nomor urut
create or replace function public.commit_order(o jsonb, dl jsonb, cap integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ex public.orders; rec public.orders; pre text; seq integer; oid text; d jsonb; cur integer; nm text; cnt integer;
begin
  perform pg_advisory_xact_lock(727001);
  select * into ex from public.orders where key = o->>'key' limit 1;
  if found then return jsonb_build_object('ok', true, 'duplicate', true, 'order', to_jsonb(ex)); end if;
  select * into ex from public.orders where status <> 'Dibatalkan' and wa = o->>'wa' and sig = o->>'sig'
    and ts > (o->>'ts')::bigint - 180000 limit 1;
  if found then return jsonb_build_object('ok', true, 'duplicate', true, 'order', to_jsonb(ex)); end if;
  if coalesce(o->>'slot', '') <> '' and cap > 0 then
    select count(*) into cnt from public.orders where "date" = o->>'date' and slot = o->>'slot' and status <> 'Dibatalkan';
    if cnt >= cap then return jsonb_build_object('ok', false, 'error', (o->>'slot') || ' sudah penuh. Pilih sesi lain.'); end if;
  end if;
  for d in select * from jsonb_array_elements(dl) loop
    cur := null; nm := null;
    select stock, name into cur, nm from public.products where id = d->>'id' for update;
    if cur is not null and cur < (d->>'qty')::integer then
      return jsonb_build_object('ok', false, 'error', 'Stok "' || nm || '" tersisa ' || cur || '.');
    end if;
  end loop;
  for d in select * from jsonb_array_elements(dl) loop
    update public.products set stock = stock - (d->>'qty')::integer where id = d->>'id' and stock is not null;
  end loop;
  pre := 'SK-' || to_char(now() at time zone 'Asia/Pontianak', 'YYMMDD') || '-';
  select coalesce(max(substring(id from length(pre) + 1)::integer), 0) + 1 into seq from public.orders where id like pre || '%';
  oid := pre || lpad(seq::text, 3, '0');
  rec := jsonb_populate_record(null::public.orders, (o - 'id') || jsonb_build_object('id', oid));
  rec.created_at := now();
  insert into public.orders select (rec).*;
  return jsonb_build_object('ok', true, 'order', to_jsonb(rec));
end $$;

-- Ubah status; pembatalan mengembalikan stok (kecuali barang tebus)
create or replace function public.set_order_status(p_id text, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders; it jsonb;
begin
  perform pg_advisory_xact_lock(727001);
  select * into o from public.orders where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Pesanan tidak ditemukan.'); end if;
  if o.status = 'Dibatalkan' and p_status <> 'Dibatalkan' then
    return jsonb_build_object('ok', false, 'error', 'Pesanan yang dibatalkan tidak bisa diaktifkan lagi.');
  end if;
  if p_status = 'Dibatalkan' and o.status <> 'Dibatalkan' then
    for it in select * from jsonb_array_elements(o.items) loop
      if coalesce((it->>'tebus')::boolean, false) = false then
        update public.products set stock = stock + (it->>'qty')::integer where id = it->>'id' and stock is not null;
      end if;
    end loop;
  end if;
  update public.orders set status = p_status where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.commit_order(jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.set_order_status(text, text) from public, anon, authenticated;
grant execute on function public.commit_order(jsonb, jsonb, integer) to service_role;
grant execute on function public.set_order_status(text, text) to service_role;

-- Penyimpanan foto produk (publik untuk dibaca)
insert into storage.buckets (id, name, public) values ('produk', 'produk', true) on conflict (id) do nothing;
