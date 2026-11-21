/* ===== Etalase toko (gaya Shopee) ===== */
var St = {
  S: clone(DEFAULT_S), products: [], usage: {}, cart: lsGet('sk_cart', []), cat: 'Semua', q: '', sort: 'rel',
  stage: 'cart', form: lsGet('sk_form', {}), tebusSel: [], voucher: '', busy: false, key: '', slide: 0, last: null,
  myOrders: lsGet('sk_orders', [])
};
var slideTimer = null, cdTimer = null;

function prodById(id) { return St.products.filter(function (p) { return p.id === id; })[0]; }
function flashLive(p) { return p.flash && p.flash.until > nowMs(); }
function basePrice(p) { return flashLive(p) ? p.flash.price : p.price; }
function lineKey(id, prep, pack) { return id + '|' + (prep || '') + '|' + (pack || ''); }
function optFee(list, name) { var o = list.filter(function (x) { return x.name === name; })[0]; return o ? o.fee : 0; }
function lineUnit(l, p) { return basePrice(p) + optFee(p.prep, l.prep) + optFee(p.packs, l.pack); }
function cartLines() {
  var out = [];
  St.cart.forEach(function (l) { var p = prodById(l.id); if (p) out.push({ l: l, p: p, unit: lineUnit(l, p) }); });
  return out;
}
function cartCount() { return St.cart.reduce(function (s, l) { return s + l.qty; }, 0); }
function saveCart() { lsSet('sk_cart', St.cart); }
function stockOf(p) { return p.stock === null || p.stock === undefined ? Infinity : p.stock; }
function inCart(id) { return St.cart.reduce(function (s, l) { return l.id === id ? s + l.qty : s; }, 0); }
function discPct(p) { var b = basePrice(p), o = flashLive(p) ? p.price : p.oldPrice; return o > b ? Math.round((o - b) / o * 100) : 0; }

function artHtml(p, extra) {
  var img = imgSrc(p.image), h = img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy">' : esc(p.emoji || '🛒');
  var pc = discPct(p);
  if (p.badge) h += '<span class="b3">' + esc(p.badge) + '</span>';
  if (pc > 0) h += '<span class="b2">-' + pc + '%</span>';
  if (stockOf(p) === 0) h += '<span class="b4">Stok habis</span>';
  return '<div class="art">' + h + (extra || '') + '</div>';
}
function priceHtml(p) {
  var b = basePrice(p), o = flashLive(p) ? p.price : p.oldPrice;
  return '<span class="num"><b>' + rp(b) + '</b>' + (o > b ? ' <s>' + rp(o) + '</s>' : '') + '</span>';
}

/* ----- data ----- */
function loadStore() {
  return API.get({ action: 'public' }).then(function (r) {
    if (!r || !r.ok) { $('view-store').innerHTML = '<div class="wrap" style="padding:60px 0;text-align:center"><h2>Toko belum bisa dimuat</h2><p class="muted" style="margin:8px 0 16px">' + esc((r && r.error) || 'Coba lagi sebentar.') + '</p><button class="btn btn-primary" data-a="reload">Muat ulang</button></div>'; return; }
    if (r.now) NOW_OFF = r.now - Date.now();
    St.S = Object.assign(clone(DEFAULT_S), r.settings);
    St.products = r.products; St.usage = r.usage || {};
    St.cart = St.cart.filter(function (l) { return prodById(l.id); }); saveCart();
    renderStore();
  });
}

/* ----- kerangka halaman ----- */
function renderStore() {
  var S = St.S, v = $('view-store'), wa = normWa(S.whatsapp);
  var cats = [{ name: 'Semua', emoji: '🛍️' }].concat(S.categories || []);
  var kws = String(S.keywords || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var h = '';
  if (!S.storeOpen) h += '<div class="closed-bar">' + esc(S.closedMessage) + '</div>';
  h += '<div class="announce"><div class="wrap">' + (S.announceBadge ? '<span class="tag">' + esc(S.announceBadge) + '</span>' : '') + '<p>' + esc(S.announceText) + '</p><span class="loc">📍 ' + esc(S.address) + '</span></div></div>';
  h += '<header class="site-header"><div class="wrap hd"><a class="brand" href="#" data-a="top"><img src="' + esc(logoSm(S)) + '" alt="Logo ' + esc(S.storeName) + '"><span><b>' + esc(S.storeName) + '</b><small>' + esc(S.tagline) + '</small></span></a>' +
    '<div class="searchbox"><div class="sb-row"><input id="q" type="search" placeholder="Cari ikan, sayur, paket masak..." value="' + esc(St.q) + '" aria-label="Cari produk"><button data-a="search">Cari</button></div>' +
    (kws.length ? '<div class="kw"><b>Populer:</b>' + kws.map(function (k) { return '<button data-a="kw" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="hd-acts"><button class="hd-btn hide-m" data-a="vouchers"><span class="ic">🎟️</span>Voucher</button><button class="hd-btn hide-m" data-a="track"><span class="ic">📦</span>Pesanan</button>' +
    '<a class="hd-btn admin-btn" href="#admin" aria-label="Masuk admin" title="Masuk admin"><span class="ic">🔐</span>Admin</a>' +
    '<button class="hd-btn cart-btn" data-a="cart" aria-label="Buka keranjang"><span class="ic">🛒</span><span class="label">Keranjang</span><span class="badge-n" id="cart-n"></span></button></div></div></header>';
  h += '<main>';
  h += '<section class="wrap sec" id="top" style="padding-top:18px"><div class="hero"><div id="hero"></div><div class="promos">' +
    '<button class="promo p1" data-a="goflash"><div><span class="t">Flash sale</span><h3>' + esc(S.flashTitle) + '</h3><p>Harga spesial, kuota terbatas</p></div><div class="ic">⚡</div></button>' +
    '<button class="promo p2" data-a="vouchers"><div><span class="t">Voucher</span><h3>Klaim voucher belanja</h3><p>Potongan dan gratis ongkir</p></div><div class="ic">🎟️</div></button></div></div></section>';
  h += '<section class="wrap sec"><div class="sec-h"><h2>Kategori</h2></div><div class="cats" id="cats">' + cats.map(function (c) { return '<button class="cat" data-a="cat" data-c="' + esc(c.name) + '" aria-pressed="' + (St.cat === c.name) + '"><span class="ci">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>'; }).join('') + '</div></section>';
  h += '<section class="wrap sec" id="flash"></section>';
  h += '<section class="wrap sec" id="katalog"><div class="sortbar"><div class="sec-h" style="margin:0"><h2>Semua produk</h2></div><div class="sorts"><span>Urutkan:</span>' +
    [['rel', 'Terkait'], ['best', 'Terlaris'], ['low', 'Termurah'], ['high', 'Termahal']].map(function (s) { return '<button class="sort" data-a="sort" data-s="' + s[0] + '" aria-pressed="' + (St.sort === s[0]) + '">' + s[1] + '</button>'; }).join('') + '</div></div><div class="count muted" id="count"></div><div class="grid" id="grid"></div></section>';
  h += '<section class="wrap sec"><div class="sec-h"><h2>Kenapa belanja di ' + esc(S.storeName) + '</h2></div><p class="muted" style="margin-bottom:14px;max-width:70ch">' + esc(S.about) + '</p><div class="vals">' + (S.values || []).map(function (x) { return '<div class="val"><div class="vi">' + esc(x.icon) + '</div><div><b>' + esc(x.title) + '</b><span>' + esc(x.text) + '</span></div></div>'; }).join('') + '</div></section>';
  h += deliverySection();
  h += locationSection();
  h += '</main>';
  var soc = [['Instagram', socialUrl('instagram', S.instagram)], ['TikTok', socialUrl('tiktok', S.tiktok)], ['Facebook', socialUrl('facebook', S.facebook)], ['YouTube', safeUrl(S.youtube)], ['Marketplace', safeUrl(S.marketplace)]].filter(function (x) { return x[1]; });
  h += '<footer style="background:var(--forest-3);color:#d1fae5;padding:30px 0 90px;margin-top:20px"><div class="wrap foot"><div><div class="fb"><img src="' + esc(logoSm(S)) + '" alt="">' + esc(S.storeName) + '</div><p style="font-size:13px">' + esc(S.about) + '</p></div>' +
    '<div><h4>Hubungi kami</h4><ul>' + (wa ? '<li><a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp ' + esc(S.whatsapp) + '</a></li>' : '') + (S.email ? '<li><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a></li>' : '') + '<li>' + esc(S.address) + '</li><li>' + esc(S.hours) + '</li></ul></div>' +
    '<div><h4>Ikuti kami</h4><div class="social">' + (soc.length ? soc.map(function (x) { return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + x[0] + '</a>'; }).join('') : '<span class="muted">Segera hadir</span>') + '</div><p style="margin-top:16px"><a class="admin-link" href="#admin">🔐 Login Admin</a></p></div></div></footer>';
  h += '<div class="scrim" data-a="closeall"></div><aside class="drawer" id="drawer" role="dialog" aria-label="Keranjang belanja" aria-modal="true"></aside>';
  h += '<nav class="bnav" aria-label="Menu bawah"><a href="#top" data-a="top"><span class="ic">🏠</span>Beranda</a><button data-a="catalogGo"><span class="ic">🗂️</span>Katalog</button><button data-a="vouchers"><span class="ic">🎟️</span>Voucher</button><button data-a="track"><span class="ic">📦</span>Pesanan</button><button data-a="cart"><span class="ic">🛒</span>Keranjang<span class="badge-n" id="cart-n2"></span></button></nav>';
  v.innerHTML = h;
  renderHero(); renderFlash(); renderGrid(); renderBadge(); renderDrawer();
  startTimers();
}

function renderHero() {
  var S = St.S, sl = S.heroSlides || [], el = $('hero'); if (!el) return;
  if (!sl.length) { el.innerHTML = ''; return; }
  St.slide = St.slide % sl.length; var s = sl[St.slide];
  el.innerHTML = '<div class="slide"><div class="slide-in"><div><span class="tag">' + esc(s.badge) + '</span><h2>' + esc(s.title) + '</h2><p>' + esc(s.desc) + '</p><div class="acts"><button class="btn btn-hot" data-a="catalogGo">' + esc(s.cta || 'Belanja') + '</button><button class="btn btn-ghost" data-a="track">Lacak pesanan</button></div></div>' +
    '<div class="logo-card"><img src="' + esc(logoLg(S)) + '" alt="' + esc(S.storeName) + '"><span class="em">' + esc(s.emoji || '🛒') + '</span></div></div>' +
    (sl.length > 1 ? '<div class="dots">' + sl.map(function (_, i) { return '<button data-a="slide" data-i="' + i + '" aria-label="Slide ' + (i + 1) + '" aria-current="' + (i === St.slide) + '"></button>'; }).join('') + '</div>' : '') + '</div>';
}

function renderFlash() {
  var el = $('flash'); if (!el) return;
  var fl = St.products.filter(flashLive);
  if (!fl.length) { el.hidden = true; return; }
  el.hidden = false;
  var end = Math.min.apply(null, fl.map(function (p) { return p.flash.until; }));
  el.innerHTML = '<div class="flash"><div class="flash-h"><div class="flash-t"><b class="ttl">⚡ ' + esc(St.S.flashTitle) + '</b><span class="cd" id="cd" data-end="' + end + '"></span></div><span class="muted" style="font-size:12.5px">' + esc(St.S.flashNote) + '</span></div><div class="fgrid">' + fl.map(function (p) {
    var q = nz(p.flash.quota), left = q > 0 ? Math.max(0, q - p.sold) : 0;
    var bar = q > 0 ? '<div class="stockbar"><i style="width:' + Math.min(100, Math.round(p.sold / q * 100)) + '%"></i><span>' + (left > 0 ? 'Terjual ' + p.sold + ' dari ' + q : 'Kuota habis') + '</span></div>' : '';
    return '<button class="fcard" data-a="open" data-id="' + esc(p.id) + '">' + artHtml(p) + '<h3>' + esc(p.name) + '</h3><div class="pr">' + priceHtml(p) + '</div>' + bar + '</button>';
  }).join('') + '</div></div>';
  tickCd();
}
function tickCd() {
  var c = $('cd'); if (!c) return;
  var left = Math.max(0, +c.getAttribute('data-end') - nowMs());
  if (left <= 0) { renderFlash(); renderGrid(); return; }
  var s = Math.floor(left / 1000), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
  function z(n) { return ('0' + n).slice(-2); }
  c.innerHTML = 'Berakhir dalam <i>' + z(hh) + '</i>:<i>' + z(mm) + '</i>:<i>' + z(ss) + '</i>';
}
function startTimers() {
  clearInterval(slideTimer); clearInterval(cdTimer);
  slideTimer = setInterval(function () { if (document.hidden || !$('hero')) return; var n = (St.S.heroSlides || []).length; if (n > 1) { St.slide = (St.slide + 1) % n; renderHero(); } }, 6500);
  cdTimer = setInterval(tickCd, 1000);
}

function filtered() {
  var q = St.q.trim().toLowerCase();
  var l = St.products.filter(function (p) {
    return (St.cat === 'Semua' || p.cat === St.cat) && (!q || (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().indexOf(q) >= 0);
  });
  if (St.sort === 'low') l.sort(function (a, b) { return basePrice(a) - basePrice(b); });
  else if (St.sort === 'high') l.sort(function (a, b) { return basePrice(b) - basePrice(a); });
  else if (St.sort === 'best') l.sort(function (a, b) { return b.sold - a.sold; });
  return l;
}
function renderGrid() {
  var g = $('grid'); if (!g) return;
  var l = filtered();
  $('count').textContent = l.length + ' produk' + (St.cat !== 'Semua' ? ' di ' + St.cat : '') + (St.q ? ' untuk "' + St.q + '"' : '');
  if (!l.length) { g.innerHTML = '<div class="empty muted" style="grid-column:1/-1;text-align:center;padding:40px 0">Produk tidak ditemukan. Coba kata kunci atau kategori lain.</div>'; return; }
  g.innerHTML = l.map(function (p) {
    var out = stockOf(p) === 0, opts = p.prep.length || p.packs.length;
    var meta = '<span>' + (p.sold > 0 ? 'Terjual ' + p.sold : 'Baru') + '</span><span' + (stockOf(p) <= 5 && !out ? ' class="low"' : '') + '>' + (out ? 'Habis' : stockOf(p) === Infinity ? 'Stok tersedia' : 'Sisa ' + p.stock) + '</span>';
    return '<article class="card' + (out ? ' out' : '') + '"><button class="open" data-a="open" data-id="' + esc(p.id) + '">' + artHtml(p) + '<span class="cat-l">' + esc(p.cat) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p></button>' +
      '<div class="card-foot"><div class="card-row"><div class="pr">' + priceHtml(p) + '</div><button class="btn btn-primary btn-sm" data-a="' + (opts ? 'open' : 'add') + '" data-id="' + esc(p.id) + '"' + (out || !St.S.storeOpen ? ' disabled' : '') + '>' + (opts ? 'Pilih' : '+ Keranjang') + '</button></div><div class="card-meta">' + meta + '</div></div></article>';
  }).join('');
}
function renderBadge() {
  var n = cartCount();
  ['cart-n', 'cart-n2'].forEach(function (i) { var e = $(i); if (e) { e.textContent = n; e.style.display = n ? '' : 'none'; } });
}

function deliverySection() {
  var D = St.S.delivery, h = '<section class="wrap sec" id="antar"><div class="sec-h"><h2>Tiga cara menerima pesanan</h2></div><div class="how3">';
  if (D.pickup.enabled) h += '<div class="how"><b>🏪 ' + esc(D.pickup.label) + '</b><span>' + esc(D.pickup.address) + '. Buka ' + esc(D.pickup.hours) + '. ' + esc(D.pickup.note) + '</span></div>';
  if (D.courier.enabled) h += '<div class="how"><b>🛵 ' + esc(D.courier.label) + '</b><span>' + D.courier.options.map(function (o) { return esc(o.name); }).join(', ') + '. ' + esc(D.courier.note) + '</span></div>';
  if (D.scheduled.enabled) h += '<div class="how"><b>🚚 ' + esc(D.scheduled.label) + '</b><span>' + esc(D.scheduled.note) + ' ' + D.scheduled.slots.map(function (s) { return esc(s.name) + ' ' + esc(s.time) + ' (pesan ' + cutoffText(s) + ')'; }).join('; ') + '.' + (nz(D.scheduled.freeFrom) > 0 ? ' Gratis ongkir min. belanja ' + rp(D.scheduled.freeFrom) + '.' : '') + '</span></div>';
  return h + '</div></section>';
}
function locationSection() {
  var S = St.S, emb = embedSrc(S.mapsEmbed), link = safeUrl(S.mapsLink) || safeUrl(S.delivery.pickup.mapsLink), wa = normWa(S.whatsapp);
  var h = '<section class="wrap sec" id="lokasi"><div class="two"><div><div class="sec-h"><h2>Lokasi kami</h2></div><p style="font-weight:700">' + esc(S.address) + '</p><p class="muted" style="margin:4px 0 10px">' + esc(S.hours) + '</p>' +
    (link ? '<a class="btn btn-ghost btn-sm" href="' + esc(link) + '" target="_blank" rel="noopener">📍 Buka di Google Maps</a>' : '') + '</div>' +
    '<div>' + (emb ? '<iframe class="map" src="' + esc(emb) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Peta lokasi ' + esc(S.storeName) + '"></iframe>' : '<div class="map map-ph">Peta belum dipasang. Admin dapat menempelkan embed Google Maps di menu Pengaturan.</div>') + '</div></div></section>';
  if (S.complaintEnabled) h += '<section class="wrap sec" id="aduan"><div class="sec-h"><h2>Aduan dan saran</h2></div><div class="box" style="margin-top:0"><p class="muted" style="margin-bottom:6px">Barang kurang segar atau ada masalah pesanan? Tulis di sini, admin membalas lewat WhatsApp.</p><div class="two-f"><div class="field"><label for="c-name">Nama</label><input id="c-name"></div><div class="field"><label for="c-wa">WhatsApp</label><input id="c-wa" inputmode="tel"></div><div class="field"><label for="c-oid">No. pesanan (opsional)</label><input id="c-oid" placeholder="SK-261118-001"></div><div class="field"><label for="c-type">Jenis</label><select id="c-type"><option>Kualitas barang</option><option>Pengiriman</option><option>Pembayaran</option><option>Saran</option><option>Lainnya</option></select></div></div><div class="field"><label for="c-msg">Isi aduan</label><textarea id="c-msg"></textarea></div><button class="btn btn-primary" style="margin-top:12px" data-a="complain">Kirim aduan</button><div id="c-res" class="result" style="margin-top:8px"></div></div></section>';
  return h;
}

/* ----- keranjang ----- */
function addToCart(id, prep, pack, qty, note) {
  var p = prodById(id); if (!p) return;
  var k = lineKey(id, prep, pack), ln = St.cart.filter(function (l) { return l.key === k; })[0];
  var cap = stockOf(p), have = inCart(id);
  if (have + qty > cap) { toast('Stok ' + p.name + ' tersisa ' + cap + '.', true); qty = Math.max(0, cap - have); if (!qty) return; }
  if (ln) { ln.qty += qty; if (note) ln.note = note; } else St.cart.push({ key: k, id: id, prep: prep || '', pack: pack || '', qty: qty, note: note || '' });
  saveCart(); renderBadge(); renderDrawer(); toast('Masuk keranjang: ' + p.name);
}
function setQty(k, d) {
  var l = St.cart.filter(function (x) { return x.key === k; })[0]; if (!l) return;
  var p = prodById(l.id), n = l.qty + d;
  if (d > 0 && inCart(l.id) + d > stockOf(p)) { toast('Stok ' + p.name + ' tersisa ' + p.stock + '.', true); return; }
  if (n < 1) St.cart = St.cart.filter(function (x) { return x !== l; }); else l.qty = Math.min(99, n);
  saveCart(); renderBadge(); renderDrawer();
}

function totals() {
  var S = St.S, D = S.delivery, f = St.form, lines = cartLines(), sub = 0, i;
  lines.forEach(function (x) { sub += x.unit * x.l.qty; });
  var productSub = sub, T = S.tebus || {}, tebusOk = T.enabled && productSub >= nz(T.min) && lines.length > 0, tb = [];
  if (tebusOk) St.tebusSel.forEach(function (id) { var it = (T.items || []).filter(function (x) { return x.id === id; })[0]; if (it) { tb.push(it); sub += nz(it.price); } });
  else St.tebusSel = [];
  var ship = 0, free = false;
  if (f.method === 'courier') { var o = D.courier.options.filter(function (x) { return x.name === f.courier; })[0]; ship = o ? nz(o.fee) : 0; }
  else if (f.method === 'scheduled') {
    var z = D.scheduled.zones.filter(function (x) { return x.name === f.zone; })[0]; ship = z ? nz(z.fee) : 0;
    if (nz(D.scheduled.freeFrom) > 0 && sub >= nz(D.scheduled.freeFrom)) { ship = 0; free = true; }
  }
  var v = St.voucher ? (S.vouchers || []).filter(function (x) { return String(x.code).toUpperCase() === St.voucher.toUpperCase(); })[0] : null, disc = 0, vErr = '';
  if (St.voucher && !v) vErr = 'Kode voucher tidak berlaku.';
  else if (v) {
    if (sub < nz(v.min)) vErr = 'Voucher ini butuh belanja minimal ' + rp(v.min) + '.';
    else if (v.type === 'ongkir') { if (f.method === 'scheduled') ship = 0; else vErr = 'Gratis ongkir hanya untuk Kurir toko.'; }
    else disc = Math.min(nz(v.value), sub);
  }
  if (vErr) { disc = 0; }
  return { lines: lines, sub: sub, productSub: productSub, tebus: tb, tebusOk: tebusOk, ship: ship, free: free, disc: disc, vErr: vErr, voucher: v && !vErr ? v : null, total: sub + ship - disc };
}

function renderDrawer() {
  var d = $('drawer'); if (!d) return;
  var S = St.S, t = totals(), h = '';
  var head = function (title, sub) { return '<div class="d-head"><div style="display:flex;gap:10px;align-items:center"><img src="' + esc(logoSm(S)) + '" alt=""><div><h2>' + title + '</h2><small>' + sub + '</small></div></div><button class="icon-btn" data-a="closeall" aria-label="Tutup">✕</button></div>'; };
  if (St.stage === 'done' && St.last) { d.innerHTML = head('Pesanan diterima', 'Terima kasih sudah belanja') + '<div class="d-scroll done">' + doneHtml() + '</div>'; return; }
  if (!St.cart.length) {
    d.innerHTML = head('Keranjang', '0 barang') + '<div class="d-scroll"><div class="empty muted" style="text-align:center;padding:50px 10px">Keranjang masih kosong.<br><button class="btn btn-primary" style="margin-top:14px" data-a="catalogGo">Mulai belanja</button></div></div>'; return;
  }
  var ff = nz(S.delivery.scheduled.freeFrom), pct = ff > 0 ? Math.min(100, Math.round(t.sub / ff * 100)) : 0;
  var fb = S.delivery.scheduled.enabled && ff > 0 ? '<div class="freebar">' + (t.sub >= ff ? '🎉 Gratis ongkir Kurir toko terpenuhi' : 'Belanja ' + rp(ff - t.sub) + ' lagi untuk gratis ongkir Kurir toko') + '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div></div>' : '';
  h += head(St.stage === 'checkout' ? 'Checkout' : 'Keranjang', cartCount() + ' barang') + fb + '<div class="d-scroll">';
  if (St.stage === 'cart') {
    h += t.lines.map(function (x) {
      var o = [x.l.prep, x.l.pack].filter(Boolean).join(' | ');
      return '<div class="line-item"><div class="li-main"><div class="em">' + (imgSrc(x.p.image) ? '<img src="' + esc(x.p.image) + '" alt="">' : esc(x.p.emoji || '🛒')) + '</div><div><b>' + esc(x.p.name) + '</b>' + (o ? '<small>' + esc(o) + '</small>' : '') + (x.l.note ? '<small>Catatan: ' + esc(x.l.note) + '</small>' : '') + '<div class="pr num"><b>' + rp(x.unit) + '</b></div></div></div><div style="text-align:right"><div class="stepper"><button data-a="dec" data-k="' + esc(x.l.key) + '" aria-label="Kurangi">−</button><span>' + x.l.qty + '</span><button data-a="inc" data-k="' + esc(x.l.key) + '" aria-label="Tambah">+</button></div><div class="num" style="font-size:12px;margin-top:4px;font-weight:800">' + rp(x.unit * x.l.qty) + '</div></div></div>';
    }).join('');
    var T = S.tebus || {};
    if (T.enabled && (T.items || []).length) {
      h += '<div class="box-hot"><div class="hh"><span>Tebus murah, belanja min. ' + rp(T.min) + '</span><i>Hemat</i></div>' + T.items.map(function (it) {
        var on = t.tebusOk, sel = St.tebusSel.indexOf(it.id) >= 0;
        return '<label class="tebus' + (on ? '' : ' off') + '"><span><b>' + esc(it.emoji || '') + ' ' + esc(it.name) + '</b><s>' + (nz(it.normalPrice) ? rp(it.normalPrice) : '') + '</s></span><span class="num"><b>' + rp(it.price) + '</b> <input type="checkbox" data-a="tebus" data-id="' + esc(it.id) + '"' + (sel ? ' checked' : '') + (on ? '' : ' disabled') + '></span></label>';
      }).join('') + (t.tebusOk ? '' : '<p class="hint">Tambah ' + rp(nz(T.min) - t.productSub) + ' lagi untuk membuka Tebus Murah.</p>') + '</div>';
    }
  } else h += checkoutForm(t);
  h += '</div><div class="d-foot">';
  h += '<div class="sum-row"><span>Subtotal</span><span class="num">' + rp(t.sub) + '</span></div>';
  if (St.stage === 'checkout') h += '<div class="sum-row"><span>Ongkir' + (t.free ? ' (gratis)' : '') + '</span><span class="num">' + (St.form.method === 'courier' ? 'Sesuai tarif aplikasi' : rp(t.ship)) + '</span></div>';
  if (t.disc) h += '<div class="sum-row disc"><span>Voucher ' + esc(t.voucher.code) + '</span><span class="num">-' + rp(t.disc) + '</span></div>';
  h += '<div class="sum-row total"><span>Total</span><span class="num">' + rp(t.total) + '</span></div>';
  if (St.stage === 'cart') h += '<button class="btn btn-hot" data-a="toCheckout"' + (S.storeOpen ? '' : ' disabled') + '>Lanjut checkout</button>';
  else h += '<button class="btn btn-hot" data-a="submit"' + (St.busy ? ' disabled' : '') + '>' + (St.busy ? 'Mengirim...' : 'Buat pesanan') + '</button><button class="btn btn-ghost" data-a="toCart">Kembali ke keranjang</button>';
  d.innerHTML = h + '</div>';
}

function checkoutForm(t) {
  var S = St.S, D = S.delivery, f = St.form, h = '';
  h += '<div class="box" style="margin-top:0"><h3 class="sub">Data pemesan</h3><div class="field"><label for="f-name">Nama</label><input id="f-name" data-f="name" value="' + esc(f.name || '') + '" autocomplete="name"></div><div class="field"><label for="f-wa">Nomor WhatsApp</label><input id="f-wa" data-f="wa" inputmode="tel" value="' + esc(f.wa || '') + '" autocomplete="tel" placeholder="08xxxxxxxxxx"></div></div>';
  h += '<div class="box"><h3 class="sub">Cara menerima pesanan</h3>';
  function opt(v, title, desc) { return '<label class="opt"><input type="radio" name="method" data-f="method" value="' + v + '"' + (f.method === v ? ' checked' : '') + '><span><b>' + title + '</b><small>' + desc + '</small></span></label>'; }
  if (D.pickup.enabled) h += opt('pickup', esc(D.pickup.label), esc(D.pickup.address) + '. ' + esc(D.pickup.hours));
  if (D.courier.enabled) h += opt('courier', esc(D.courier.label), esc(D.courier.note));
  if (D.scheduled.enabled) h += opt('scheduled', esc(D.scheduled.label), esc(D.scheduled.note));
  if (f.method === 'courier') h += '<div class="sub-panel"><div class="field" style="margin-top:0"><label for="f-courier">Pilih kurir</label><select id="f-courier" data-f="courier">' + D.courier.options.map(function (o) { return '<option' + (f.courier === o.name ? ' selected' : '') + '>' + esc(o.name) + '</option>'; }).join('') + '</select></div>' + addrFields(f) + '</div>';
  if (f.method === 'scheduled') {
    var sc = D.scheduled, today = todayWIB(), dates = []; for (var i = 0; i <= nz(sc.daysAhead, 3); i++) dates.push(addDays(today, i));
    h += '<div class="sub-panel"><div class="field" style="margin-top:0"><label for="f-zone">Rute / wilayah antar</label><select id="f-zone" data-f="zone"><option value="">Pilih wilayah</option>' + sc.zones.map(function (z) { return '<option value="' + esc(z.name) + '"' + (f.zone === z.name ? ' selected' : '') + '>' + esc(z.name) + ' (' + rp(z.fee) + ')</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-date">Tanggal antar</label><select id="f-date" data-f="date"><option value="">Pilih tanggal</option>' + dates.map(function (d) { return '<option value="' + d + '"' + (f.date === d ? ' selected' : '') + '>' + dateLabel(d) + '</option>'; }).join('') + '</select></div>';
    if (f.date) {
      h += '<div class="lbl" style="margin-top:12px">Sesi antar</div>' + sc.slots.map(function (sl) {
        var closed = nowMs() >= cutoffAt(f.date, sl), used = St.usage[f.date + '|' + sl.name] || 0, full = nz(sl.capacity) > 0 && used >= nz(sl.capacity), off = closed || full;
        return '<label class="opt' + (off ? ' off' : '') + '"><input type="radio" name="slot" data-f="slot" value="' + esc(sl.name) + '"' + (f.slot === sl.name ? ' checked' : '') + (off ? ' disabled' : '') + '><span><b>' + esc(sl.name) + ' (' + esc(sl.time) + ')</b><small>' + (closed ? 'Batas pesan sudah lewat' : full ? 'Penuh' : 'Pesan ' + cutoffText(sl)) + '</small></span></label>';
      }).join('');
    }
    h += addrFields(f) + '</div>';
  }
  if (f.method === 'pickup') h += '<div class="sub-panel">' + esc(D.pickup.note) + (safeUrl(D.pickup.mapsLink) ? ' <a href="' + esc(D.pickup.mapsLink) + '" target="_blank" rel="noopener">Lihat peta</a>' : '') + '</div>';
  h += '</div>';
  h += '<div class="box"><h3 class="sub">Voucher</h3><div style="display:flex;gap:8px;margin-top:6px"><input class="inp" id="f-voucher" value="' + esc(St.voucher) + '" placeholder="Masukkan kode" style="text-transform:uppercase"><button class="btn btn-ghost" data-a="applyV">Pakai</button></div>' + (t.vErr ? '<div class="err">' + esc(t.vErr) + '</div>' : t.voucher ? '<div class="hint" style="color:var(--leaf);font-weight:700">Voucher terpasang: ' + esc(t.voucher.label) + '</div>' : '') + '</div>';
  h += '<div class="box"><h3 class="sub">Pembayaran</h3>' + S.payment.methods.map(function (m) { return '<label class="opt"><input type="radio" name="pay" data-f="payment" value="' + esc(m.name) + '"' + (f.payment === m.name ? ' checked' : '') + '><span><b>' + esc(m.name) + '</b><small>' + esc(m.detail) + '</small></span></label>'; }).join('') + '</div>';
  h += '<div class="box"><div class="field" style="margin-top:0"><label for="f-note">Catatan untuk toko (opsional)</label><textarea id="f-note" data-f="note">' + esc(f.note || '') + '</textarea></div></div>';
  h += '<div id="f-err" class="err" style="margin-top:10px"></div>';
  return h;
}
function addrFields(f) {
  return '<div class="field"><label for="f-addr">Alamat lengkap</label><textarea id="f-addr" data-f="address" placeholder="Jalan, nomor, patokan">' + esc(f.address || '') + '</textarea></div><div class="field"><label for="f-maps">Link titik Google Maps (opsional)</label><input id="f-maps" data-f="maps" value="' + esc(f.maps || '') + '" placeholder="https://maps.app.goo.gl/..."><div class="hint">Buka Google Maps, tekan Bagikan, salin link lalu tempel di sini.</div></div>';
}

function doneHtml() {
  var o = St.last, S = St.S, wa = normWa(S.whatsapp);
  var txt = 'Halo ' + S.storeName + ', saya sudah memesan.\nNo. pesanan: ' + o.id + '\nNama: ' + o.name + '\nPesanan: ' + o.summary + '\nTotal: ' + rp(o.total) + '\nPenerimaan: ' + o.method + (o.zone ? ' - ' + o.zone : '') + (o.date ? '\nJadwal: ' + dateLabel(o.date) + ' ' + o.slot : '') + '\nPembayaran: ' + o.payment;
  return '<div style="text-align:center;font-size:44px">✅</div><h3 style="text-align:center">Pesanan berhasil dibuat</h3><p class="muted" style="text-align:center;margin:6px 0 12px">Nomor pesanan Anda <span class="oid">' + esc(o.id) + '</span></p>' +
    (o.duplicate ? '<div class="notice" style="margin-bottom:10px">Pesanan yang sama sudah tercatat, jadi tidak dibuat dua kali.</div>' : '') +
    '<div class="ord-card"><div class="row"><b>Total</b><b class="num">' + rp(o.total) + '</b></div><div class="muted" style="margin-top:6px">' + esc(o.summary) + '</div></div>' +
    '<pre>' + esc(txt) + '</pre>' +
    (wa ? '<a class="btn btn-hot" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(txt) + '">Kirim konfirmasi ke WhatsApp</a>' : '') +
    '<button class="btn btn-ghost" data-a="closeall">Selesai</button>';
}

/* ----- modal ----- */
function openModal(html, small) {
  closeModal();
  var m = document.createElement('div'); m.className = 'mwrap'; m.id = 'modal'; m.setAttribute('data-a', 'modalbg');
  m.innerHTML = '<div class="mbox' + (small ? ' sm' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(m); document.body.classList.add('modal-open');
}
function closeModal() { var m = $('modal'); if (m) m.remove(); document.body.classList.remove('modal-open'); }
function mHead(t) { return '<div class="m-head"><h3>' + t + '</h3><button class="icon-btn" data-a="closem" aria-label="Tutup">✕</button></div>'; }

function openProduct(id) {
  var p = prodById(id); if (!p) return;
  var h = mHead(esc(p.name)) + '<div class="pm-top">' + artHtml(p) + '<div><span class="tag-g">' + esc(p.cat) + '</span><div class="pr" style="margin-top:6px;font-size:18px" id="pm-price">' + priceHtml(p) + '</div><div class="muted" style="font-size:12px">' + (p.sold > 0 ? 'Terjual ' + p.sold + ' · ' : '') + (stockOf(p) === Infinity ? 'Stok tersedia' : 'Sisa ' + p.stock) + '</div></div></div>';
  if (flashLive(p)) h += '<div class="notice" style="margin-top:12px">⚡ Harga flash sale berlaku sampai ' + new Date(p.flash.until).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Pontianak' }) + ' WIB</div>';
  h += '<p style="margin-top:12px;white-space:pre-line">' + esc(p.desc) + '</p>';
  if (p.prep.length) h += '<div class="box"><h3 class="sub">Pilih potongan</h3>' + p.prep.map(function (o, i) { return '<label class="opt"><input type="radio" name="pm-prep" value="' + esc(o.name) + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(o.name) + '</b><small>' + (o.fee ? '+' + rp(o.fee) : 'Gratis') + '</small></span></label>'; }).join('') + '</div>';
  if (p.packs.length) h += '<div class="box"><h3 class="sub">Pilih kemasan</h3>' + p.packs.map(function (o, i) { return '<label class="opt"><input type="radio" name="pm-pack" value="' + esc(o.name) + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(o.name) + '</b><small>' + (o.fee ? '+' + rp(o.fee) : 'Gratis') + '</small></span></label>'; }).join('') + '</div>';
  h += '<div class="field"><label for="pm-note">Catatan (opsional)</label><input id="pm-note" maxlength="200" placeholder="Mis. ikan dipotong 4 bagian"></div>';
  var out = stockOf(p) === 0 || !St.S.storeOpen;
  h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px"><div class="stepper"><button data-a="pmq" data-d="-1" aria-label="Kurangi">−</button><span id="pm-q">1</span><button data-a="pmq" data-d="1" aria-label="Tambah">+</button></div><button class="btn btn-hot" style="flex:1" data-a="pmadd" data-id="' + esc(p.id) + '"' + (out ? ' disabled' : '') + '>' + (out ? 'Tidak tersedia' : 'Tambah ke keranjang') + '</button></div>';
  openModal(h);
  pmPrice(p);
}
function pmSel() { var a = document.querySelector('input[name="pm-prep"]:checked'), b = document.querySelector('input[name="pm-pack"]:checked'); return { prep: a ? a.value : '', pack: b ? b.value : '' }; }
function pmPrice(p) { var s = pmSel(), q = +$('pm-q').textContent || 1, u = basePrice(p) + optFee(p.prep, s.prep) + optFee(p.packs, s.pack), e = $('pm-price'); if (e) e.innerHTML = '<span class="num"><b>' + rp(u) + '</b></span>' + (q > 1 ? ' <span class="muted" style="font-size:12px">x ' + q + ' = ' + rp(u * q) + '</span>' : ''); }

function openVouchers() {
  var vs = St.S.vouchers || [], h = mHead('Voucher untuk Anda');
  h += vs.length ? vs.map(function (v, i) {
    var kind = v.type === 'ongkir' ? 'Gratis ongkir' : 'Potongan ' + rp(v.value);
    return '<div class="vcard' + (v.type === 'ongkir' ? ' h' : '') + '"><div><span class="vt">' + kind + '</span><h4>' + esc(v.label) + '</h4><p>' + esc(v.desc || '') + (nz(v.min) ? ' Min. belanja ' + rp(v.min) + '.' : '') + (v.newOnly ? ' Khusus pelanggan baru.' : '') + '</p><p class="num" style="font-weight:800;color:var(--fg)">' + esc(v.code) + '</p></div><button class="btn btn-primary btn-sm" data-a="useV" data-code="' + esc(v.code) + '">Pakai</button></div>';
  }).join('') : '<p class="muted">Belum ada voucher aktif.</p>';
  openModal(h, true);
}
function openTrack() {
  var h = mHead('Lacak pesanan') + '<div class="two-f"><div class="field" style="margin-top:0"><label for="t-id">Nomor pesanan</label><input id="t-id" placeholder="SK-261118-001"></div><div class="field" style="margin-top:0"><label for="t-wa">Nomor WhatsApp</label><input id="t-wa" inputmode="tel"></div></div><button class="btn btn-primary" style="margin-top:12px;width:100%" data-a="doTrack">Cek status</button><div id="t-res" style="margin-top:12px"></div>';
  if (St.myOrders.length) h += '<div class="hint" style="margin-top:10px">Pesanan di perangkat ini:</div><div class="chips" style="margin-top:6px">' + St.myOrders.slice(0, 5).map(function (o) { return '<button class="chip" data-a="trackMine" data-id="' + esc(o.id) + '" data-wa="' + esc(o.wa) + '">' + esc(o.id) + '</button>'; }).join('') + '</div>';
  openModal(h, true);
}
function trackNow(id, wa) {
  var r = $('t-res'); r.innerHTML = '<span class="muted">Mencari...</span>';
  API.get({ action: 'track', id: id, wa: wa }).then(function (x) {
    if (!x.ok) { r.innerHTML = '<div class="err">' + esc(x.error) + '</div>'; return; }
    var o = x.order, flow = ['Baru', 'Dikonfirmasi', 'Dikemas', 'Diantar', 'Selesai'], idx = flow.indexOf(o.status);
    r.innerHTML = '<div class="ord-card"><div class="row"><b class="oid">' + esc(o.id) + '</b><span class="pill s-' + esc(o.status) + '">' + esc(o.status) + '</span></div>' +
      (o.status === 'Dibatalkan' ? '<p class="err">Pesanan ini dibatalkan.</p>' : '<div class="steps">' + flow.map(function (s, i) { return '<div class="' + (i < idx ? 'on' : i === idx ? 'now' : '') + '">' + s + '</div>'; }).join('') + '</div>') +
      '<div class="muted">' + esc(o.summary) + '</div><div class="row" style="margin-top:8px"><span>' + esc(o.method) + (o.date ? ' · ' + dateLabel(o.date) + ' ' + esc(o.slot) : '') + '</span><b class="num">' + rp(o.total) + '</b></div></div>';
  });
}

/* ----- checkout ----- */
function readForm() {
  document.querySelectorAll('#drawer [data-f]').forEach(function (e) {
    var k = e.getAttribute('data-f');
    if (e.type === 'radio') { if (e.checked) St.form[k] = e.value; } else St.form[k] = e.value;
  });
  var v = $('f-voucher'); if (v) St.voucher = v.value.trim().toUpperCase();
  lsSet('sk_form', { name: St.form.name, wa: St.form.wa, address: St.form.address, maps: St.form.maps });
}
function validateCheckout(t) {
  var f = St.form, D = St.S.delivery;
  if (!String(f.name || '').trim()) return 'Isi nama Anda.';
  if (normWa(f.wa).length < 9) return 'Isi nomor WhatsApp dengan benar.';
  if (!f.method) return 'Pilih cara menerima pesanan.';
  if (f.method === 'courier' && !f.courier) return 'Pilih kurir online.';
  if (f.method !== 'pickup' && !String(f.address || '').trim()) return 'Isi alamat pengiriman.';
  if (f.method === 'scheduled') {
    if (!f.zone) return 'Pilih wilayah antar.'; if (!f.date) return 'Pilih tanggal antar.'; if (!f.slot) return 'Pilih sesi antar.';
  }
  if (!f.payment) return 'Pilih metode pembayaran.';
  if (t.vErr) return t.vErr;
  return '';
}
function submitOrder() {
  if (St.busy) return;
  readForm();
  var t = totals(), e = validateCheckout(t), f = St.form;
  if (e) { $('f-err').textContent = e; return; }
  if (!St.key) St.key = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  St.busy = true; renderDrawer();
  var body = { action: 'order', key: St.key, name: f.name.trim(), wa: normWa(f.wa), method: f.method, courier: f.courier || '', zone: f.zone || '', date: f.date || '', slot: f.slot || '', address: (f.address || '').trim(), maps: (f.maps || '').trim(), payment: f.payment, note: (f.note || '').trim(), voucher: t.voucher ? t.voucher.code : '', tebus: St.tebusSel.slice(), items: St.cart.map(function (l) { return { id: l.id, prep: l.prep, pack: l.pack, qty: l.qty, note: l.note }; }) };
  API.post(body).then(function (r) {
    St.busy = false;
    if (!r.ok) {
      renderDrawer(); var el = $('f-err'); if (el) el.textContent = r.error || 'Gagal membuat pesanan.';
      if (!r.network) { St.key = ''; loadStoreQuiet(); }
      return;
    }
    St.last = Object.assign({}, r.order, { duplicate: !!r.duplicate });
    St.myOrders = [{ id: r.order.id, wa: r.order.wa }].concat(St.myOrders.filter(function (o) { return o.id !== r.order.id; })).slice(0, 10); lsSet('sk_orders', St.myOrders);
    St.cart = []; saveCart(); St.tebusSel = []; St.voucher = ''; St.key = ''; St.stage = 'done';
    renderBadge(); renderDrawer(); loadStoreQuiet();
  });
}
function loadStoreQuiet() {
  API.get({ action: 'public' }).then(function (r) { if (r && r.ok) { if (r.now) NOW_OFF = r.now - Date.now(); St.S = Object.assign(clone(DEFAULT_S), r.settings); St.products = r.products; St.usage = r.usage || {}; renderGrid(); renderFlash(); } });
}

function openCart(stage) {
  if (stage) St.stage = stage; else if (St.stage === 'done') St.stage = 'cart';
  renderDrawer(); document.body.classList.add('cart-open');
}
function closeAll() { document.body.classList.remove('cart-open'); closeModal(); if (St.stage === 'done') St.stage = 'cart'; }
function scrollTo_(id) { closeAll(); var e = $(id); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function sendComplaint() {
  var r = $('c-res'), body = { action: 'complaint', name: $('c-name').value.trim(), wa: $('c-wa').value, orderId: $('c-oid').value.trim(), type: $('c-type').value, message: $('c-msg').value.trim() };
  r.className = 'result'; r.textContent = 'Mengirim...';
  API.post(body).then(function (x) {
    if (x.ok) { r.innerHTML = '<span style="color:var(--leaf);font-weight:700">Aduan terkirim. Admin akan menghubungi lewat WhatsApp.</span>'; ['c-name', 'c-wa', 'c-oid', 'c-msg'].forEach(function (i) { $(i).value = ''; }); }
    else r.innerHTML = '<span class="err">' + esc(x.error) + '</span>';
  });
}

/* ----- event ----- */
function onStoreClick(e) {
  var el = e.target.closest('[data-a]'); if (!el) return;
  var a = el.getAttribute('data-a'), id = el.getAttribute('data-id');
  if (a === 'modalbg') { if (e.target === el) closeModal(); return; }
  switch (a) {
    case 'reload': loadStore(); break;
    case 'top': e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'search': St.q = $('q').value; renderGrid(); scrollTo_('katalog'); break;
    case 'kw': St.q = el.getAttribute('data-k'); $('q').value = St.q; renderGrid(); scrollTo_('katalog'); break;
    case 'cat': St.cat = el.getAttribute('data-c'); document.querySelectorAll('.cat').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-c') === St.cat); }); renderGrid(); scrollTo_('katalog'); break;
    case 'sort': St.sort = el.getAttribute('data-s'); document.querySelectorAll('.sort').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-s') === St.sort); }); renderGrid(); break;
    case 'slide': St.slide = +el.getAttribute('data-i'); renderHero(); break;
    case 'goflash': scrollTo_($('flash') && !$('flash').hidden ? 'flash' : 'katalog'); break;
    case 'catalogGo': scrollTo_('katalog'); break;
    case 'open': openProduct(id); break;
    case 'add': addToCart(id, '', '', 1, ''); break;
    case 'cart': openCart(); break;
    case 'closeall': closeAll(); break;
    case 'closem': closeModal(); break;
    case 'inc': setQty(el.getAttribute('data-k'), 1); break;
    case 'dec': setQty(el.getAttribute('data-k'), -1); break;
    case 'toCheckout': St.stage = 'checkout'; if (!St.form.method) { var D = St.S.delivery; St.form.method = D.scheduled.enabled ? 'scheduled' : D.courier.enabled ? 'courier' : 'pickup'; } renderDrawer(); break;
    case 'toCart': readForm(); St.stage = 'cart'; renderDrawer(); break;
    case 'submit': submitOrder(); break;
    case 'applyV': readForm(); renderDrawer(); break;
    case 'vouchers': openVouchers(); break;
    case 'useV': St.voucher = el.getAttribute('data-code'); closeModal(); openCart(St.cart.length ? 'checkout' : 'cart'); toast('Voucher ' + St.voucher + ' dipasang'); break;
    case 'track': openTrack(); break;
    case 'doTrack': trackNow($('t-id').value, $('t-wa').value); break;
    case 'trackMine': $('t-id').value = id; $('t-wa').value = el.getAttribute('data-wa'); trackNow(id, el.getAttribute('data-wa')); break;
    case 'complain': sendComplaint(); break;
    case 'pmq': var q = $('pm-q'); q.textContent = Math.max(1, Math.min(99, (+q.textContent || 1) + +el.getAttribute('data-d'))); pmPrice(prodById(document.querySelector('[data-a=pmadd]').getAttribute('data-id'))); break;
    case 'pmadd': var s = pmSel(); addToCart(id, s.prep, s.pack, +$('pm-q').textContent || 1, $('pm-note').value.trim()); closeModal(); break;
  }
}
function onStoreChange(e) {
  var t = e.target;
  if (t.getAttribute && t.getAttribute('data-a') === 'tebus') { var id = t.getAttribute('data-id'), i = St.tebusSel.indexOf(id); if (t.checked && i < 0) St.tebusSel.push(id); else if (!t.checked && i >= 0) St.tebusSel.splice(i, 1); readForm(); renderDrawer(); return; }
  if (t.name === 'pm-prep' || t.name === 'pm-pack') { var pb = document.querySelector('[data-a=pmadd]'); if (pb) pmPrice(prodById(pb.getAttribute('data-id'))); return; }
  if (t.closest && t.closest('#drawer') && t.hasAttribute('data-f')) {
    var k = t.getAttribute('data-f'); readForm();
    if (k === 'method' || k === 'zone' || k === 'date' || k === 'courier') { if (k === 'date') St.form.slot = ''; var y = $('drawer').querySelector('.d-scroll').scrollTop; renderDrawer(); $('drawer').querySelector('.d-scroll').scrollTop = y; }
    else if (k === 'slot' || k === 'payment') { /* tidak perlu render ulang */ }
  }
}
function bindStore() {
  var v = $('view-store');
  v.addEventListener('click', onStoreClick); v.addEventListener('change', onStoreChange);
  document.body.addEventListener('click', function (e) { if (e.target.closest('#modal')) onStoreClick(e); });
  document.body.addEventListener('change', function (e) { if (e.target.closest('#modal')) onStoreChange(e); });
  v.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'q') { St.q = e.target.value; renderGrid(); scrollTo_('katalog'); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  v.addEventListener('input', function (e) { if (e.target.closest('#drawer') && e.target.hasAttribute('data-f') && e.target.type !== 'radio' && e.target.tagName !== 'SELECT') readForm(); });
}
