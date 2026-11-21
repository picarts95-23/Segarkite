// SegarKite API (Supabase Edge Function "api"). Rahasia: ADMIN_PIN (wajib) dan TOKEN_SECRET (opsional).
import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULTS: any = /*__DEFAULTS__*/;
const SEED: any[] = /*__SEED__*/;
const STATUSES = ["Baru", "Dikonfirmasi", "Dikemas", "Diantar", "Selesai", "Dibatalkan"];
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

/* ---------- utilitas ---------- */
const nz = (v: any, d = 0) => { const n = Number(v); return isFinite(n) ? n : d; };
const clone = (o: any) => JSON.parse(JSON.stringify(o));
const rp = (n: number) => "Rp " + Math.round(nz(n)).toLocaleString("id-ID");
const normWa = (n: any) => { let d = String(n || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "62" + d.slice(1); return d; };
const todayWIB = () => new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
const cutoffAt = (ds: string, sl: any) => { const p = ds.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2] - nz(sl.daysBefore), nz(sl.cutoffHour, 12) - 7); };
const err = (m: string, extra: any = {}) => ({ ok: false, error: m, ...extra });
const clean = (s: any, n: number) => String(s ?? "").slice(0, n);
function parseOpts(t: any) {
  return String(t || "").split(/\r?\n|\|/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)\s*\(?\+\s*(?:Rp\.?\s*)?([\d.,]+)\)?\s*$/i);
    if (m && m[1]) return { name: m[1].trim(), fee: Math.round(nz(String(m[2]).replace(/[.,]/g, ""))) };
    return { name: s, fee: 0 };
  });
}
function flashEnd(v: any) { const m = String(v || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5]) : 0; }
const fmtTime = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Pontianak" });

/* ---------- konversi baris <-> objek API ---------- */
const toP = (r: any) => ({ id: r.id, name: r.name, cat: r.cat, price: r.price, oldPrice: r.old_price, hpp: r.hpp, kemas: r.kemas, stock: r.stock, image: r.image, emoji: r.emoji, desc: r.descr, badge: r.badge, prepText: r.prep_text, packText: r.pack_text, flashPrice: r.flash_price, flashUntil: r.flash_until, flashQuota: r.flash_quota, active: r.active, order: r.sort });
const fromP = (p: any) => ({ id: p.id, name: p.name, cat: p.cat, price: p.price, old_price: p.oldPrice, hpp: p.hpp, kemas: p.kemas, stock: p.stock, image: p.image, emoji: p.emoji, descr: p.desc, badge: p.badge, prep_text: p.prepText, pack_text: p.packText, flash_price: p.flashPrice, flash_until: p.flashUntil, flash_quota: p.flashQuota, active: p.active, sort: p.order, updated_at: new Date().toISOString() });
function pub(p: any, sm: any, admin: boolean) {
  const on = nz(p.flashPrice) > 0 && flashEnd(p.flashUntil) > Date.now();
  const o: any = { id: p.id, name: p.name, cat: p.cat, price: p.price, oldPrice: p.oldPrice, stock: p.stock, image: p.image, emoji: p.emoji, desc: p.desc, badge: p.badge, prep: parseOpts(p.prepText), packs: parseOpts(p.packText), flash: on ? { price: p.flashPrice, until: flashEnd(p.flashUntil), quota: p.flashQuota } : null, active: p.active, order: p.order, sold: sm[p.id] || 0 };
  if (admin) { o.hpp = p.hpp; o.kemas = p.kemas; o.prepText = p.prepText; o.packText = p.packText; o.flashPrice = p.flashPrice; o.flashUntil = p.flashUntil; o.flashQuota = p.flashQuota; }
  return o;
}
function toO(r: any, admin: boolean) {
  const items = (r.items || []).map((i: any) => { const c = { ...i }; if (!admin) delete c.cost; return c; });
  const o: any = { id: r.id, time: fmtTime(r.created_at), name: r.name, wa: r.wa, method: r.method, zone: r.zone, address: r.address, maps: r.maps, date: r.date, slot: r.slot, summary: r.summary, subtotal: r.subtotal, discount: r.discount, voucher: r.voucher, shipping: r.shipping, total: r.total, payment: r.payment, note: r.note, status: r.status, items };
  if (admin) o.margin = r.margin;
  return o;
}
const toC = (r: any) => ({ id: r.id, time: fmtTime(r.created_at), name: r.name, wa: r.wa, orderId: r.order_id, type: r.type, message: r.message, status: r.status, reply: r.reply });

/* ---------- data ---------- */
let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  const { data } = await sb.from("kv").select("k").eq("k", "seeded").maybeSingle();
  if (!data) {
    const { count } = await sb.from("products").select("id", { count: "exact", head: true });
    if (!count) {
      const t = Date.now() + 7 * 36e5;
      const rows = SEED.map((s: any, i: number) => fromP({ id: s.id, name: s.name, cat: s.cat, price: s.price, oldPrice: s.oldPrice || 0, hpp: s.hpp, kemas: s.kemas, stock: s.stock ?? null, image: "", emoji: s.emoji, desc: s.desc, badge: s.badge, prepText: s.prep, packText: s.packs, flashPrice: s.flash ? s.flash.price : 0, flashUntil: s.flash ? new Date(t + s.flash.hours * 36e5).toISOString().slice(0, 16) : "", flashQuota: s.flash ? s.flash.quota : 0, active: true, order: i + 1 }));
      await sb.from("products").insert(rows);
    }
    await sb.from("kv").upsert({ k: "seeded", v: true });
  }
  seeded = true;
}
async function getSettings() {
  const { data } = await sb.from("settings").select("v").eq("k", "main").maybeSingle();
  return { ...clone(DEFAULTS), ...((data && data.v) || {}) };
}
async function allProducts() { const { data } = await sb.from("products").select("*").order("sort"); return (data || []).map(toP); }
async function soldMap() {
  const { data } = await sb.from("orders").select("items").neq("status", "Dibatalkan");
  const m: any = {}; (data || []).forEach((o: any) => (o.items || []).forEach((i: any) => { if (!i.tebus) m[i.id] = (m[i.id] || 0) + i.qty; }));
  return m;
}
async function usageMap() {
  const { data } = await sb.from("orders").select("date,slot").neq("status", "Dibatalkan").neq("slot", "").gte("date", todayWIB());
  const u: any = {}; (data || []).forEach((o: any) => { const k = o.date + "|" + o.slot; u[k] = (u[k] || 0) + 1; });
  return u;
}
function pubSettings(S: any) {
  const o = clone(S); delete o.finance;
  o.vouchers = (o.vouchers || []).filter((v: any) => v.active !== false);
  if (o.tebus) o.tebus.items = (o.tebus.items || []).map((i: any) => ({ id: i.id, name: i.name, price: i.price, normalPrice: i.normalPrice, emoji: i.emoji }));
  return o;
}

/* ---------- admin: token dan PIN ---------- */
const enc = new TextEncoder();
async function hmac(msg: string) {
  const secret = (Deno.env.get("TOKEN_SECRET") || SERVICE_KEY) + (Deno.env.get("ADMIN_PIN") || "");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, "");
}
async function okToken(t: any) { const [e, s] = String(t || "").split("."); return !!e && !!s && +e > Date.now() && s === (await hmac(e)); }
async function login(pin: any) {
  const PIN = Deno.env.get("ADMIN_PIN");
  if (!PIN || PIN.length < 4) return err("PIN admin belum diatur di Supabase (secret ADMIN_PIN).");
  const { data } = await sb.from("kv").select("v").eq("k", "fails").maybeSingle();
  const f = (data && data.v) || { n: 0, until: 0 };
  if (f.until > Date.now()) return err("Terlalu banyak percobaan salah. Coba lagi 10 menit lagi.");
  if (String(pin) !== PIN) {
    const n = (f.until && f.until <= Date.now() ? 0 : f.n) + 1;
    await sb.from("kv").upsert({ k: "fails", v: { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + 600000 : 0 } });
    return err("PIN salah.");
  }
  await sb.from("kv").upsert({ k: "fails", v: { n: 0, until: 0 } });
  const exp = Date.now() + 6 * 3600e3;
  return { ok: true, token: exp + "." + (await hmac(String(exp))), sheetUrl: "" };
}

/* ---------- pesanan ---------- */
const lineText = (l: any) => { let opt = [l.prep, l.pack].filter(Boolean).join(" | "); if (l.note) opt += (opt ? " | " : "") + "Catatan: " + l.note; return l.qty + "x " + l.name + (opt ? " [" + opt + "]" : ""); };
const sigOf = (arr: any[]) => arr.filter((l) => !l.tebus).map((l) => l.id + "|" + l.prep + "|" + l.pack + "x" + l.qty).sort().join(",");

async function createOrder(d: any) {
  const S = await getSettings(), now = Date.now();
  if (!S.storeOpen) return err(S.closedMessage);
  const wa = normWa(d.wa), name = clean(d.name, 80).trim();
  if (!name || wa.length < 9 || wa.length > 15) return err("Isi nama dan nomor WhatsApp dengan benar.");
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 60) return err("Keranjang kosong.");
  const prods = await allProducts();
  const lines: any[] = []; let sub = 0; const need: any = {};
  for (const rq of d.items) {
    const q = Math.floor(nz(rq.qty)), p = prods.find((x: any) => x.id === rq.id && x.active);
    if (!p) return err("Ada produk yang sudah tidak dijual. Muat ulang halaman.");
    if (q < 1 || q > 99) return err("Jumlah barang tidak valid.");
    const pl = parseOpts(p.prepText), kl = parseOpts(p.packText); let prep = "", pack = "", fee = 0;
    if (pl.length) { const o1 = pl.find((x) => x.name === (rq.prep || pl[0].name)); if (!o1) return err('Pilihan potongan "' + p.name + '" sudah berubah. Muat ulang halaman.'); prep = o1.name; fee += o1.fee; }
    if (kl.length) { const o2 = kl.find((x) => x.name === (rq.pack || kl[0].name)); if (!o2) return err('Pilihan kemasan "' + p.name + '" sudah berubah. Muat ulang halaman.'); pack = o2.name; fee += o2.fee; }
    const flashOn = nz(p.flashPrice) > 0 && flashEnd(p.flashUntil) > now;
    const unit = (flashOn ? p.flashPrice : p.price) + fee;
    lines.push({ id: p.id, name: p.name, price: unit, qty: q, prep, pack, note: clean(rq.note, 200), cost: nz(p.hpp) + nz(p.kemas) });
    sub += unit * q; need[p.id] = (need[p.id] || 0) + q;
  }
  for (const pid in need) { const pr = prods.find((x: any) => x.id === pid); if (pr.stock !== null && need[pid] > pr.stock) return err('Stok "' + pr.name + '" tersisa ' + pr.stock + "."); }
  const T = S.tebus || {}, productSub = sub;
  if (Array.isArray(d.tebus) && d.tebus.length) {
    if (!T.enabled || productSub < nz(T.min)) return err("Syarat Tebus Murah belum terpenuhi.");
    for (const tid of d.tebus) { const it = (T.items || []).find((x: any) => x.id === tid); if (it && !lines.some((l) => l.id === tid)) { lines.push({ id: it.id, name: it.name, price: nz(it.price), qty: 1, prep: "", pack: "", note: "", cost: nz(it.hpp), tebus: true }); sub += nz(it.price); } }
  }
  const vcode = String(d.voucher || "").trim().toUpperCase(); let voucher: any = null;
  if (vcode) {
    voucher = (S.vouchers || []).find((v: any) => String(v.code).toUpperCase() === vcode && v.active !== false);
    if (!voucher) return err("Kode voucher " + vcode + " tidak berlaku.");
    if (sub < nz(voucher.min)) return err("Voucher " + vcode + " butuh belanja minimal " + rp(voucher.min) + ".");
    if (voucher.newOnly) { const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("wa", wa).neq("status", "Dibatalkan"); if (count) return err("Voucher " + vcode + " hanya untuk pelanggan baru."); }
    if (nz(voucher.maxUses) > 0) { const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("voucher", voucher.code).neq("status", "Dibatalkan"); if ((count || 0) >= nz(voucher.maxUses)) return err("Kuota voucher " + vcode + " sudah habis."); }
  }
  const Dl = S.delivery; let ship = 0, method = "", zone = "", slot = "", date = "", cap = 0; const m = d.method;
  if (m === "pickup") { if (!Dl.pickup.enabled) return err("Ambil sendiri tidak tersedia."); method = Dl.pickup.label; zone = Dl.pickup.address; }
  else if (m === "courier") {
    const opt = Dl.courier.options.find((o: any) => o.name === d.courier);
    if (!Dl.courier.enabled || !opt) return err("Pilih kurir online."); if (!String(d.address || "").trim()) return err("Isi alamat pengiriman.");
    method = Dl.courier.label; zone = opt.name; ship = nz(opt.fee);
  } else if (m === "scheduled") {
    const sc = Dl.scheduled, z = sc.zones.find((x: any) => x.name === d.zone), sl = sc.slots.find((x: any) => x.name === d.slot);
    if (!sc.enabled || !z || !sl) return err("Pilih rute dan sesi antar."); if (!String(d.address || "").trim()) return err("Isi alamat pengiriman.");
    const today = todayWIB(), last = new Date(Date.parse(today) + nz(sc.daysAhead, 3) * 864e5).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date)) || d.date < today || d.date > last) return err("Tanggal antar tidak valid.");
    if (now >= cutoffAt(d.date, sl)) return err("Batas pesan untuk " + sl.name + " sudah lewat. Pilih sesi atau tanggal lain.");
    method = sc.label; zone = z.name; slot = sl.name; date = d.date; cap = nz(sl.capacity);
    ship = nz(sc.freeFrom) > 0 && sub >= nz(sc.freeFrom) ? 0 : nz(z.fee);
  } else return err("Pilih cara menerima pesanan.");
  let discount = 0;
  if (voucher) { if (voucher.type === "ongkir") { if (m !== "scheduled") return err("Voucher gratis ongkir hanya berlaku untuk Kurir toko."); ship = 0; } else discount = Math.min(nz(voucher.value), sub); }
  const pay = S.payment.methods.find((x: any) => x.name === d.payment);
  if (!pay) return err("Pilih metode pembayaran.");
  const lineMargin = lines.reduce((s, l) => s + (l.price - l.cost) * l.qty, 0);
  const margin = lineMargin - discount + (m === "scheduled" ? ship - nz((S.finance || {}).courierCost) : 0);
  const o = { name, wa, method, zone, address: clean(d.address, 300).trim(), maps: clean(d.maps, 300).trim(), date, slot, summary: lines.map(lineText).join("; "), subtotal: sub, discount, voucher: voucher ? voucher.code : "", shipping: ship, total: sub + ship - discount, margin: Math.round(margin), payment: pay.name, note: clean(d.note, 300), status: "Baru", items: lines, key: clean(d.key, 80) || null, sig: sigOf(lines), ts: now };
  const dec = Object.keys(need).map((id) => ({ id, qty: need[id] }));
  const { data, error } = await sb.rpc("commit_order", { o, dl: dec, cap });
  if (error) { console.error(error); return err("Pesanan gagal disimpan. Coba lagi."); }
  if (!data.ok) return data;
  if (!data.duplicate) sheetPush({ tab: "Pesanan", row: orderRow(data.order) });
  return { ok: true, duplicate: !!data.duplicate, order: toO(data.order, false) };
}

/* ---------- cadangan otomatis ke Google Sheet (opsional) ---------- */
// Aktif bila secret SHEET_WEBHOOK_URL (dan SHEET_TOKEN) diisi. Kegagalan tidak menggagalkan pesanan.
function sheetPush(payload: any) {
  const url = Deno.env.get("SHEET_WEBHOOK_URL");
  if (!url) return;
  const p = fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ token: Deno.env.get("SHEET_TOKEN") || "", ...payload }), signal: AbortSignal.timeout(8000) }).then((r) => r.text()).catch((e) => console.error("sheetPush", String(e)));
  const er = (globalThis as any).EdgeRuntime;
  if (er && er.waitUntil) er.waitUntil(p);
}
function wib(t: any) { return new Date(new Date(t).getTime() + 7 * 36e5).toISOString().slice(0, 16).replace("T", " "); }
function orderRow(o: any) { return [o.id, wib(o.created_at), o.name, o.wa, o.method, o.zone, o.address, o.date, o.slot, o.summary, o.subtotal, o.discount, o.voucher, o.shipping, o.total, o.margin, o.payment, o.note, o.status]; }

/* ---------- penanganan aksi ---------- */
async function handle(r: any): Promise<any> {
  await ensureSeed();
  const a = r.action || "public";
  if (a === "public") {
    const [S, ps, sm, usage] = await Promise.all([getSettings(), allProducts(), soldMap(), usageMap()]);
    return { ok: true, now: Date.now(), settings: pubSettings(S), products: ps.filter((p: any) => p.active).map((p: any) => pub(p, sm, false)), usage };
  }
  if (a === "track") {
    const { data } = await sb.from("orders").select("*").eq("id", String(r.id || "").trim().toUpperCase()).maybeSingle();
    if (!data || normWa(data.wa) !== normWa(r.wa)) return err("Pesanan tidak ditemukan. Periksa nomor pesanan dan nomor WhatsApp.");
    return { ok: true, order: { id: data.id, status: data.status, total: data.total, method: data.method, zone: data.zone, date: data.date, slot: data.slot, summary: data.summary, time: fmtTime(data.created_at) } };
  }
  if (a === "order") return await createOrder(r);
  if (a === "complaint") {
    const S = await getSettings();
    if (!S.complaintEnabled) return err("Fitur aduan sedang dinonaktifkan.");
    if (!r.name || normWa(r.wa).length < 9 || String(r.message || "").length < 5) return err("Isi nama, nomor WhatsApp, dan isi aduan.");
    const cid = "AD-" + Date.now().toString(36).toUpperCase();
    await sb.from("complaints").insert({ id: cid, name: clean(r.name, 80), wa: normWa(r.wa), order_id: clean(r.orderId, 30), type: clean(r.type, 40), message: clean(r.message, 800) });
    sheetPush({ tab: "Aduan", row: [cid, wib(Date.now()), clean(r.name, 80), normWa(r.wa), clean(r.orderId, 30), clean(r.type, 40), clean(r.message, 800), "Baru", ""] });
    return { ok: true };
  }
  if (a === "adminLogin") return await login(r.pin);
  if (!(await okToken(r.token))) return { ok: false, auth: false, error: "Sesi admin berakhir. Silakan login lagi." };

  if (a === "adminData") {
    const [S, ps, sm, os, cs] = await Promise.all([getSettings(), allProducts(), soldMap(), sb.from("orders").select("*").order("created_at", { ascending: false }).limit(500), sb.from("complaints").select("*").order("created_at", { ascending: false }).limit(300)]);
    return { ok: true, now: Date.now(), orders: (os.data || []).map((o: any) => toO(o, true)), complaints: (cs.data || []).map(toC), products: ps.map((p: any) => pub(p, sm, true)), settings: S };
  }
  if (a === "adminOrderStatus") {
    if (!STATUSES.includes(r.status)) return err("Status tidak valid.");
    const { data, error } = await sb.rpc("set_order_status", { p_id: r.id, p_status: r.status });
    if (!error && data && data.ok) sheetPush({ action: "status", id: r.id, status: r.status });
    return error ? err("Gagal mengubah status.") : data;
  }
  if (a === "adminProductSave") {
    const pr = r.product || {};
    if (!String(pr.name || "").trim()) return err("Nama produk wajib diisi.");
    if (nz(pr.flashPrice) > 0 && !flashEnd(pr.flashUntil)) return err("Isi tanggal dan jam berakhir flash sale.");
    const all = await allProducts(), cur = all.find((x: any) => x.id === pr.id);
    const rec: any = { id: pr.id, name: clean(pr.name, 120).trim(), cat: clean(pr.cat || "Lainnya", 60).trim(), price: Math.max(0, Math.floor(nz(pr.price))), oldPrice: Math.max(0, Math.floor(nz(pr.oldPrice))), hpp: Math.max(0, Math.round(nz(pr.hpp))), kemas: Math.max(0, Math.round(nz(pr.kemas))), stock: pr.stock === "" || pr.stock == null ? null : Math.max(0, Math.floor(nz(pr.stock))), image: clean(pr.image, 1000), emoji: clean(pr.emoji, 8), desc: clean(pr.desc, 1500), badge: clean(pr.badge, 60), prepText: clean(pr.prepText, 600), packText: clean(pr.packText, 600), flashPrice: nz(pr.flashPrice) > 0 ? Math.floor(nz(pr.flashPrice)) : 0, flashUntil: nz(pr.flashPrice) > 0 ? clean(pr.flashUntil, 20) : "", flashQuota: Math.max(0, nz(pr.flashQuota)), active: pr.active !== false, order: pr.order ? Math.floor(nz(pr.order)) : cur ? cur.order : all.length + 1 };
    if (!cur) rec.id = "P" + ("0" + (all.reduce((mx: number, x: any) => Math.max(mx, parseInt(String(x.id).replace(/\D/g, ""), 10) || 0), 0) + 1)).slice(-2);
    const { error } = await sb.from("products").upsert(fromP(rec));
    return error ? err("Produk gagal disimpan.") : { ok: true, id: rec.id };
  }
  if (a === "adminPricingSave") {
    let n = 0;
    for (const x of r.rows || []) { const { error } = await sb.from("products").update({ price: Math.max(0, Math.floor(nz(x.price))), hpp: Math.max(0, Math.round(nz(x.hpp))), kemas: Math.max(0, Math.round(nz(x.kemas))), updated_at: new Date().toISOString() }).eq("id", x.id); if (!error) n++; }
    return { ok: true, saved: n };
  }
  if (a === "adminProductDelete") { await sb.from("products").delete().eq("id", r.id); return { ok: true }; }
  if (a === "adminUpload") {
    const mime = String(r.mime || "");
    if (!/^image\/(jpeg|png|webp)$/.test(mime)) return err("File harus gambar JPG, PNG, atau WebP.");
    const bin = Uint8Array.from(atob(String(r.data || "")), (c) => c.charCodeAt(0));
    if (bin.length > 3 * 1024 * 1024) return err("Ukuran foto maksimal 3 MB.");
    const path = Date.now().toString(36) + "-" + String(r.filename || "foto.jpg").replace(/[^\w.-]/g, "_").slice(-40);
    const { error } = await sb.storage.from("produk").upload(path, bin, { contentType: mime });
    if (error) return err("Foto gagal diunggah.");
    return { ok: true, url: sb.storage.from("produk").getPublicUrl(path).data.publicUrl };
  }
  if (a === "adminSettingsSave") {
    if (!r.settings || typeof r.settings !== "object") return err("Pengaturan tidak valid.");
    await sb.from("settings").upsert({ k: "main", v: r.settings });
    return { ok: true };
  }
  if (a === "adminComplaintUpdate") { await sb.from("complaints").update({ status: clean(r.status, 20), reply: clean(r.reply, 500) }).eq("id", r.id); return { ok: true }; }
  if (a === "adminBackupNow") {
    const url = Deno.env.get("SHEET_WEBHOOK_URL");
    if (!url) return err("Google Sheet belum disambungkan. Isi secret SHEET_WEBHOOK_URL di Supabase (lihat panduan). Sementara itu gunakan unduh CSV.");
    const [ps, os, cs] = await Promise.all([allProducts(), sb.from("orders").select("*").order("created_at", { ascending: true }).limit(5000), sb.from("complaints").select("*").order("created_at", { ascending: true }).limit(2000)]);
    const body = { token: Deno.env.get("SHEET_TOKEN") || "", action: "replaceAll",
      produk: ps.map((p: any) => [p.id, p.name, p.cat, p.price, p.oldPrice, p.hpp, p.kemas, p.stock ?? "", p.active ? "Ya" : "Tidak", p.badge]),
      pesanan: (os.data || []).map(orderRow),
      aduan: (cs.data || []).map((c: any) => [c.id, wib(c.created_at), c.name, c.wa, c.order_id, c.type, c.message, c.status, c.reply]) };
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
      const j = JSON.parse(await res.text());
      if (!j.ok) return err("Google Sheet menolak data: " + (j.error || "tidak diketahui"));
      return { ok: true, orders: (os.data || []).length, products: ps.length };
    } catch (e) { console.error(e); return err("Tidak bisa menghubungi Google Sheet. Periksa alamat webhook dan pengaturan akses Apps Script."); }
  }
  return err("Aksi tidak dikenal.");
}

Deno.serve(async (req: Request) => {
  const json = (o: any) => new Response(JSON.stringify(o), { headers: { ...CORS, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    let r: any;
    if (req.method === "GET") { r = Object.fromEntries(new URL(req.url).searchParams); }
    else r = JSON.parse(await req.text());
    return json(await handle(r));
  } catch (e) {
    console.error(e);
    return json(err("Terjadi kesalahan server. Coba lagi."));
  }
});
