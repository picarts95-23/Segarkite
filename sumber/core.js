/* ===== Data bawaan (satu sumber untuk Code.gs dan halaman ini) ===== */
var DEFAULT_S = /*__DEFAULTS__*/;
var SEED = /*__SEED__*/;
var LOGO_SM = "__LOGO_SM__";
var LOGO_LG = "__LOGO_LG__";
var STATUSES = ['Baru', 'Dikonfirmasi', 'Dikemas', 'Diantar', 'Selesai', 'Dibatalkan'];

/* ===== Utilitas ===== */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function rp(n) { return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }
function nz(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
function imgSrc(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) || /^data:image\//i.test(u) ? u : ''; }
function normWa(n) { var d = String(n || '').replace(/\D/g, ''); if (d.indexOf('0') === 0) d = '62' + d.slice(1); return d; }
function todayWIB() { return new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10); }
function addDays(ds, n) { var p = ds.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); }
function dateLabel(ds) { return new Date(ds + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }); }
function cutoffAt(ds, sl) { var p = ds.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2] - nz(sl.daysBefore), nz(sl.cutoffHour, 12) - 7); }
function cutoffText(sl) { var h = ('0' + nz(sl.cutoffHour, 12)).slice(-2) + '.00'; var d = nz(sl.daysBefore); return d === 0 ? 'jam ' + h + ' di hari yang sama' : d === 1 ? 'jam ' + h + ' hari sebelumnya' : 'jam ' + h + ', ' + d + ' hari sebelumnya'; }
function toast(msg, bad) { var t = $('toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3400); }
function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function socialUrl(kind, v) {
  v = String(v || '').trim(); if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  v = v.replace(/^@/, '');
  return { instagram: 'https://instagram.com/' + v, tiktok: 'https://www.tiktok.com/@' + v, facebook: 'https://facebook.com/' + v }[kind] || '';
}
function embedSrc(v) {
  v = String(v || '').trim();
  var m = v.match(/src=["']([^"']+)["']/i); if (m) v = m[1];
  return /^https:\/\/www\.google\.com\/maps\/embed/i.test(v) ? v : '';
}
/* Opsi potong/kemas: satu baris satu opsi, tambahan harga di akhir, mis. "Thinwall +2000" */
function parseOpts(t) {
  return String(t || '').split(/\r?\n|\|/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
    var m = s.match(/^(.*?)\s*\(?\+\s*(?:Rp\.?\s*)?([\d.,]+)\)?\s*$/i);
    if (m && m[1]) return { name: m[1].trim(), fee: Math.round(nz(String(m[2]).replace(/[.,]/g, ''))) };
    return { name: s, fee: 0 };
  });
}
function flashEnd(v) {
  var m = String(v || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5]) : 0;
}
function marginOf(price, hpp, kemas) { var m = nz(price) - nz(hpp) - nz(kemas); return { rp: m, pct: nz(price) > 0 ? Math.round(m / nz(price) * 1000) / 10 : 0 }; }
function mgClass(m, hasCost) { return !hasCost ? 'none' : m.rp < 0 ? 'neg' : m.pct < 15 ? 'low' : ''; }
var NOW_OFF = 0;
function nowMs() { return Date.now() + NOW_OFF; }
function logoSm(S) { return imgSrc(S && S.logoUrl) || LOGO_SM; }
function logoLg(S) { return imgSrc(S && S.logoUrl) || LOGO_LG; }

/* ===== Lapisan API (server nyata atau demo) ===== */
var API = {
  demo: !CONFIG.apiUrl,
  get: function (params) {
    if (this.demo) return Promise.resolve(Demo.handle(Object.assign({ method: 'GET' }, params)));
    var qs = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(CONFIG.apiUrl + '?' + qs).then(function (r) { return r.json(); }).catch(function () { return { ok: false, error: 'Koneksi gagal. Periksa internet lalu coba lagi.', network: true }; });
  },
  post: function (body) {
    if (this.demo) return Promise.resolve(Demo.handle(body));
    return fetch(CONFIG.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, error: 'Koneksi gagal. Periksa internet lalu coba lagi.', network: true }; });
  }
};

/* ===== Server tiruan untuk mode demo (meniru logika Code.gs) ===== */
var Demo = (function () {
  var KEY = 'sk_demo_v3', db = null, tokens = {};
  function seedProducts() {
    var t = Date.now() + 7 * 36e5;
    return SEED.map(function (s, i) {
      var fl = s.flash;
      return { id: s.id, name: s.name, cat: s.cat, price: s.price, oldPrice: s.oldPrice || 0, hpp: s.hpp, kemas: s.kemas, stock: s.stock == null ? null : s.stock, image: '', emoji: s.emoji, desc: s.desc, badge: s.badge, prepText: s.prep, packText: s.packs, flashPrice: fl ? fl.price : 0, flashUntil: fl ? new Date(t + fl.hours * 36e5).toISOString().slice(0, 16) : '', flashQuota: fl ? fl.quota : 0, active: true, order: i + 1 };
    });
  }
  function load() {
    if (db) return db;
    var saved = lsGet(KEY, null);
    db = saved || { settings: {}, products: seedProducts(), orders: [], complaints: [] };
    db.settings = Object.assign(clone(DEFAULT_S), db.settings);
    return db;
  }
  function save() { lsSet(KEY, db); }
  function err(m) { return { ok: false, error: m }; }
  function sold() { var m = {}; load().orders.forEach(function (o) { if (o.status !== 'Dibatalkan') o.items.forEach(function (i) { if (!i.tebus) m[i.id] = (m[i.id] || 0) + i.qty; }); }); return m; }
  function usage() { var u = {}; load().orders.forEach(function (o) { if (o.status !== 'Dibatalkan' && o.date && o.slot) { var k = o.date + '|' + o.slot; u[k] = (u[k] || 0) + 1; } }); return u; }
  function flashOnP(p, now) { return nz(p.flashPrice) > 0 && flashEnd(p.flashUntil) > now; }
  function pub(p, sm, admin) {
    var now = Date.now(), on = flashOnP(p, now);
    var o = { id: p.id, name: p.name, cat: p.cat, price: p.price, oldPrice: p.oldPrice, stock: p.stock, image: p.image, emoji: p.emoji, desc: p.desc, badge: p.badge, prep: parseOpts(p.prepText), packs: parseOpts(p.packText), flash: on ? { price: p.flashPrice, until: flashEnd(p.flashUntil), quota: p.flashQuota } : null, active: p.active, order: p.order, sold: sm[p.id] || 0 };
    if (admin) { o.hpp = p.hpp; o.kemas = p.kemas; o.prepText = p.prepText; o.packText = p.packText; o.flashPrice = p.flashPrice; o.flashUntil = p.flashUntil; o.flashQuota = p.flashQuota; }
    return o;
  }
  function pubSettings(S) {
    var o = clone(S); delete o.finance;
    o.vouchers = (o.vouchers || []).filter(function (v) { return v.active !== false; });
    if (o.tebus) o.tebus.items = o.tebus.items.map(function (i) { return { id: i.id, name: i.name, price: i.price, normalPrice: i.normalPrice, emoji: i.emoji }; });
    return o;
  }
  function custOrder(o) {
    var c = clone(o); delete c.margin; delete c.key; delete c.ts;
    c.items = c.items.map(function (i) { delete i.cost; return i; });
    return c;
  }
  function lineText(l) { var opt = [l.prep, l.pack].filter(Boolean).join(' | '); if (l.note) opt += (opt ? ' | ' : '') + 'Catatan: ' + l.note; return l.qty + 'x ' + l.name + (opt ? ' [' + opt + ']' : ''); }
  function sigOf(arr) { return arr.filter(function (l) { return !l.tebus; }).map(function (l) { return l.id + '|' + l.prep + '|' + l.pack + 'x' + l.qty; }).sort().join(','); }

  function order(d) {
    var D = load(), S = D.settings, now = Date.now();
    if (!S.storeOpen) return err(S.closedMessage);
    var ex = D.orders.filter(function (o) { return o.key && o.key === d.key; })[0];
    if (ex) return { ok: true, duplicate: true, order: custOrder(ex) };
    var wa = normWa(d.wa), name = String(d.name || '').trim();
    if (!name || wa.length < 9) return err('Isi nama dan nomor WhatsApp dengan benar.');
    var lines = [], sub = 0, need = {}, i;
    for (i = 0; i < d.items.length; i++) {
      var rq = d.items[i], q = Math.floor(nz(rq.qty)), p = D.products.filter(function (x) { return x.id === rq.id && x.active; })[0];
      if (!p) return err('Ada produk yang sudah tidak dijual. Muat ulang halaman.');
      if (q < 1 || q > 99) return err('Jumlah barang tidak valid.');
      var pl = parseOpts(p.prepText), kl = parseOpts(p.packText), prep = '', pack = '', fee = 0, o1, o2;
      if (pl.length) { o1 = pl.filter(function (x) { return x.name === (rq.prep || pl[0].name); })[0]; if (!o1) return err('Pilihan potongan "' + p.name + '" sudah berubah. Muat ulang halaman.'); prep = o1.name; fee += o1.fee; }
      if (kl.length) { o2 = kl.filter(function (x) { return x.name === (rq.pack || kl[0].name); })[0]; if (!o2) return err('Pilihan kemasan "' + p.name + '" sudah berubah. Muat ulang halaman.'); pack = o2.name; fee += o2.fee; }
      var unit = (flashOnP(p, now) ? p.flashPrice : p.price) + fee;
      lines.push({ id: p.id, name: p.name, price: unit, qty: q, prep: prep, pack: pack, note: String(rq.note || '').slice(0, 200), cost: nz(p.hpp) + nz(p.kemas) });
      sub += unit * q; need[p.id] = (need[p.id] || 0) + q;
    }
    for (var pid in need) { var pr = D.products.filter(function (x) { return x.id === pid; })[0]; if (pr.stock !== null && need[pid] > pr.stock) return err('Stok "' + pr.name + '" tersisa ' + pr.stock + '.'); }
    var mine = sigOf(lines);
    var dup = D.orders.filter(function (o) { return o.status !== 'Dibatalkan' && normWa(o.wa) === wa && sigOf(o.items) === mine && now - o.ts < 180000; })[0];
    if (dup) return { ok: true, duplicate: true, order: custOrder(dup) };
    var T = S.tebus || {}, productSub = sub;
    if (d.tebus && d.tebus.length) {
      if (!T.enabled || productSub < nz(T.min)) return err('Syarat Tebus Murah belum terpenuhi.');
      d.tebus.forEach(function (tid) { var it = T.items.filter(function (x) { return x.id === tid; })[0]; if (it && !lines.some(function (l) { return l.id === tid; })) { lines.push({ id: it.id, name: it.name, price: nz(it.price), qty: 1, prep: '', pack: '', note: '', cost: nz(it.hpp), tebus: true }); sub += nz(it.price); } });
    }
    var vcode = String(d.voucher || '').trim().toUpperCase(), voucher = null;
    if (vcode) {
      voucher = (S.vouchers || []).filter(function (v) { return String(v.code).toUpperCase() === vcode && v.active !== false; })[0];
      if (!voucher) return err('Kode voucher ' + vcode + ' tidak berlaku.');
      if (sub < nz(voucher.min)) return err('Voucher ' + vcode + ' butuh belanja minimal ' + rp(voucher.min) + '.');
      if (voucher.newOnly && D.orders.some(function (o) { return o.status !== 'Dibatalkan' && normWa(o.wa) === wa; })) return err('Voucher ' + vcode + ' hanya untuk pelanggan baru.');
      if (nz(voucher.maxUses) > 0 && D.orders.filter(function (o) { return o.voucher === voucher.code && o.status !== 'Dibatalkan'; }).length >= nz(voucher.maxUses)) return err('Kuota voucher ' + vcode + ' sudah habis.');
    }
    var Dl = S.delivery, ship = 0, method = '', zone = '', slot = '', date = '', m = d.method;
    if (m === 'pickup') { if (!Dl.pickup.enabled) return err('Ambil sendiri tidak tersedia.'); method = Dl.pickup.label; zone = Dl.pickup.address; }
    else if (m === 'courier') {
      var opt = Dl.courier.options.filter(function (o) { return o.name === d.courier; })[0];
      if (!Dl.courier.enabled || !opt) return err('Pilih kurir online.'); if (!d.address) return err('Isi alamat pengiriman.');
      method = Dl.courier.label; zone = opt.name; ship = nz(opt.fee);
    } else if (m === 'scheduled') {
      var sc = Dl.scheduled, z = sc.zones.filter(function (x) { return x.name === d.zone; })[0], sl = sc.slots.filter(function (x) { return x.name === d.slot; })[0];
      if (!sc.enabled || !z || !sl) return err('Pilih rute dan sesi antar.'); if (!d.address) return err('Isi alamat pengiriman.');
      if (now >= cutoffAt(d.date, sl)) return err('Batas pesan untuk ' + sl.name + ' sudah lewat. Pilih sesi atau tanggal lain.');
      if (nz(sl.capacity) > 0 && (usage()[d.date + '|' + sl.name] || 0) >= nz(sl.capacity)) return err(sl.name + ' sudah penuh. Pilih sesi lain.');
      method = sc.label; zone = z.name; slot = sl.name; date = d.date; ship = (nz(sc.freeFrom) > 0 && sub >= nz(sc.freeFrom)) ? 0 : nz(z.fee);
    } else return err('Pilih cara menerima pesanan.');
    var discount = 0;
    if (voucher) { if (voucher.type === 'ongkir') { if (m !== 'scheduled') return err('Voucher gratis ongkir hanya berlaku untuk Kurir toko.'); ship = 0; } else discount = Math.min(nz(voucher.value), sub); }
    var pay = S.payment.methods.filter(function (x) { return x.name === d.payment; })[0];
    if (!pay) return err('Pilih metode pembayaran.');
    lines.forEach(function (l) { if (!l.tebus) { var pr2 = D.products.filter(function (x) { return x.id === l.id; })[0]; if (pr2.stock !== null) pr2.stock -= l.qty; } });
    var lineMargin = lines.reduce(function (s, l) { return s + (l.price - l.cost) * l.qty; }, 0);
    var margin = lineMargin - discount + (m === 'scheduled' ? ship - nz((S.finance || {}).courierCost) : 0);
    var day = todayWIB().slice(2).replace(/-/g, ''), pre = 'SK-' + day + '-';
    var seq = D.orders.reduce(function (mx, o) { return o.id.indexOf(pre) === 0 ? Math.max(mx, parseInt(o.id.slice(pre.length), 10) || 0) : mx; }, 0) + 1;
    var o = { id: pre + ('00' + seq).slice(-3), time: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }), name: name, wa: wa, method: method, zone: zone, address: d.address || '', maps: d.maps || '', date: date, slot: slot, summary: lines.map(lineText).join('; '), subtotal: sub, discount: discount, voucher: voucher ? voucher.code : '', shipping: ship, total: sub + ship - discount, payment: pay.name, note: d.note || '', status: 'Baru', items: lines, margin: Math.round(margin), key: d.key, ts: now };
    D.orders.unshift(o); save(); return { ok: true, order: custOrder(o) };
  }

  function handle(r) {
    var D = load(), a = r.action || 'public', sm;
    if (a === 'public') { sm = sold(); return { ok: true, now: Date.now(), settings: pubSettings(D.settings), products: D.products.filter(function (p) { return p.active; }).sort(function (x, y) { return x.order - y.order; }).map(function (p) { return pub(p, sm, false); }), usage: usage() }; }
    if (a === 'track') {
      var t = D.orders.filter(function (o) { return o.id.toUpperCase() === String(r.id).trim().toUpperCase() && normWa(o.wa) === normWa(r.wa); })[0];
      return t ? { ok: true, order: { id: t.id, status: t.status, total: t.total, method: t.method, zone: t.zone, date: t.date, slot: t.slot, summary: t.summary, time: t.time } } : err('Pesanan tidak ditemukan. Periksa nomor pesanan dan nomor WhatsApp.');
    }
    if (a === 'order') return order(r);
    if (a === 'complaint') {
      if (!D.settings.complaintEnabled) return err('Fitur aduan sedang dinonaktifkan.');
      if (!r.name || normWa(r.wa).length < 9 || String(r.message || '').length < 5) return err('Isi nama, nomor WhatsApp, dan isi aduan.');
      D.complaints.unshift({ id: 'AD-' + Date.now().toString(36).toUpperCase(), time: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }), name: r.name, wa: normWa(r.wa), orderId: r.orderId || '', type: r.type || '', message: r.message, status: 'Baru', reply: '' });
      save(); return { ok: true };
    }
    if (a === 'adminLogin') { if (String(r.pin) !== '1234') return err('PIN salah. Di mode demo PIN-nya 1234.'); var tk = 'demo' + Date.now(); tokens[tk] = 1; return { ok: true, token: tk, sheetUrl: '' }; }
    if (!tokens[r.token]) return { ok: false, auth: false, error: 'Sesi admin berakhir. Silakan login lagi.' };
    if (a === 'adminData') { sm = sold(); return { ok: true, now: Date.now(), orders: clone(D.orders), complaints: clone(D.complaints), products: D.products.slice().sort(function (x, y) { return x.order - y.order; }).map(function (p) { return pub(p, sm, true); }), settings: clone(D.settings) }; }
    if (a === 'adminOrderStatus') {
      var o = D.orders.filter(function (x) { return x.id === r.id; })[0]; if (!o) return err('Pesanan tidak ditemukan.');
      if (o.status === 'Dibatalkan' && r.status !== 'Dibatalkan') return err('Pesanan yang dibatalkan tidak bisa diaktifkan lagi.');
      if (r.status === 'Dibatalkan' && o.status !== 'Dibatalkan') o.items.forEach(function (it) { if (it.tebus) return; var p = D.products.filter(function (x) { return x.id === it.id; })[0]; if (p && p.stock !== null) p.stock += it.qty; });
      o.status = r.status; save(); return { ok: true };
    }
    if (a === 'adminProductSave') {
      var pr = r.product; if (!String(pr.name || '').trim()) return err('Nama produk wajib diisi.');
      if (nz(pr.flashPrice) > 0 && !flashEnd(pr.flashUntil)) return err('Isi tanggal dan jam berakhir flash sale.');
      var cur = D.products.filter(function (x) { return x.id === pr.id; })[0];
      var rec = { id: pr.id, name: String(pr.name).trim(), cat: String(pr.cat || 'Lainnya').trim(), price: Math.floor(nz(pr.price)), oldPrice: Math.floor(nz(pr.oldPrice)), hpp: Math.round(nz(pr.hpp)), kemas: Math.round(nz(pr.kemas)), stock: (pr.stock === '' || pr.stock == null) ? null : Math.floor(nz(pr.stock)), image: pr.image || '', emoji: pr.emoji || '', desc: pr.desc || '', badge: pr.badge || '', prepText: pr.prepText || '', packText: pr.packText || '', flashPrice: nz(pr.flashPrice) > 0 ? Math.floor(nz(pr.flashPrice)) : 0, flashUntil: nz(pr.flashPrice) > 0 ? pr.flashUntil : '', flashQuota: nz(pr.flashQuota), active: pr.active !== false, order: pr.order ? Math.floor(nz(pr.order)) : (cur ? cur.order : D.products.length + 1) };
      if (cur) Object.assign(cur, rec); else { rec.id = 'P' + ('0' + (D.products.reduce(function (m, x) { return Math.max(m, parseInt(x.id.replace(/\D/g, ''), 10) || 0); }, 0) + 1)).slice(-2); D.products.push(rec); }
      save(); return { ok: true, id: rec.id };
    }
    if (a === 'adminPricingSave') { var n = 0; (r.rows || []).forEach(function (x) { var p = D.products.filter(function (q) { return q.id === x.id; })[0]; if (p) { p.price = Math.max(0, Math.floor(nz(x.price))); p.hpp = Math.max(0, Math.round(nz(x.hpp))); p.kemas = Math.max(0, Math.round(nz(x.kemas))); n++; } }); save(); return { ok: true, saved: n }; }
    if (a === 'adminProductDelete') { D.products = D.products.filter(function (x) { return x.id !== r.id; }); save(); return { ok: true }; }
    if (a === 'adminUpload') return { ok: true, url: 'data:' + r.mime + ';base64,' + r.data };
    if (a === 'adminSettingsSave') { D.settings = r.settings; save(); return { ok: true }; }
    if (a === 'adminComplaintUpdate') { var c = D.complaints.filter(function (x) { return x.id === r.id; })[0]; if (c) { c.status = r.status; c.reply = r.reply; save(); } return { ok: true }; }
    if (a === 'adminBackupNow') return err('Backup tersedia setelah toko terhubung ke Google Sheet.');
    return err('Aksi tidak dikenal.');
  }
  return { handle: handle };
})();
