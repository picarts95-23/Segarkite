/* ===== Panel admin ===== */
var AD = { token: '', sheetUrl: '', data: null, S: null, tab: 'pesanan', dirty: false, ofilter: 'Semua', oq: '', period: '30', onlyDone: false, loading: false };
try { AD.token = sessionStorage.getItem('sk_tok') || ''; AD.sheetUrl = sessionStorage.getItem('sk_sheet') || ''; } catch (e) {}

var TABS = [['pesanan', 'Pesanan'], ['produk', 'Produk'], ['keuangan', 'Keuangan'], ['promo', 'Promo & Tampilan'], ['pengaturan', 'Pengaturan'], ['aduan', 'Aduan'], ['data', 'Data & Backup'], ['academy', 'Academy SOP']];
var ROW_TPL = {
  heroSlides: { badge: '', title: '', desc: '', cta: 'Belanja sekarang', emoji: '🛒' }, categories: { name: '', emoji: '🛒' }, values: { icon: '⭐', title: '', text: '' },
  vouchers: { code: '', label: '', type: 'potongan', value: 0, min: 0, newOnly: false, maxUses: 0, active: true, desc: '' },
  items: { id: '', name: '', price: 0, normalPrice: 0, emoji: '🛒', hpp: 0 }, options: { name: '', fee: 0 }, zones: { name: '', fee: 8000 },
  slots: { name: '', time: '', daysBefore: 0, cutoffHour: 12, capacity: 30 }, methods: { name: '', detail: '' }, opex: { name: '', amount: 0 }
};

function aCall(action, extra) {
  return API.post(Object.assign({ action: action, token: AD.token }, extra || {})).then(function (r) {
    if (r && r.auth === false) { adminLogout(true); }
    return r;
  });
}
function adminLogout(expired) {
  AD.token = ''; AD.data = null; try { sessionStorage.removeItem('sk_tok'); } catch (e) {}
  renderAdmin(); if (expired) toast('Sesi admin berakhir. Silakan login lagi.', true);
}
function orderDay(o) { var m = String(o.id).match(/^SK-(\d{2})(\d{2})(\d{2})-/); return m ? '20' + m[1] + '-' + m[2] + '-' + m[3] : ''; }
function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(), t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v; }

function loadAdmin() {
  AD.loading = true; renderAdmin();
  return aCall('adminData').then(function (r) {
    AD.loading = false;
    if (!r || !r.ok) { if (AD.token) toast((r && r.error) || 'Gagal memuat data admin.', true); renderAdmin(); return; }
    AD.data = r; AD.S = Object.assign(clone(DEFAULT_S), clone(r.settings)); AD.S.finance = Object.assign(clone(DEFAULT_S.finance), AD.S.finance || {}); AD.dirty = false;
    if (r.now) NOW_OFF = r.now - Date.now();
    renderAdmin();
  });
}

function renderAdmin() {
  var v = $('view-admin'), S = (AD.S || DEFAULT_S);
  if (!AD.token) {
    v.innerHTML = '<div class="wrap"><div class="login"><img src="' + esc(logoLg(S)) + '" alt="Logo"><h1>Admin SegarKite</h1><p class="muted" style="text-align:center;margin-top:4px">Masukkan PIN admin' + (API.demo ? ' (mode demo: 1234)' : '') + '</p><div class="field"><label for="pin">PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password"></div><div id="login-err" class="err"></div><button class="btn btn-primary" style="width:100%;margin-top:14px" data-a="login">Masuk</button><p style="text-align:center;margin-top:12px"><a href="#">← Kembali ke toko</a></p></div></div>';
    return;
  }
  var d = AD.data, newCount = d ? d.orders.filter(function (o) { return o.status === 'Baru'; }).length : 0;
  var h = '<div class="wrap adm"><div class="adm-head"><h1><img src="' + esc(logoSm(S)) + '" alt="">Admin ' + esc(S.storeName) + '</h1><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-a="aRefresh">⟳ Muat ulang</button><a class="btn btn-ghost btn-sm" href="#">Lihat toko</a><button class="btn btn-ghost btn-sm" data-a="logout">Keluar</button></div></div>';
  h += '<div class="tabs" role="tablist">' + TABS.map(function (t) { return '<button class="tab" role="tab" data-a="tab" data-t="' + t[0] + '" aria-selected="' + (AD.tab === t[0]) + '">' + t[1] + (t[0] === 'pesanan' && newCount ? ' (' + newCount + ')' : '') + '</button>'; }).join('') + '</div>';
  if (!d) h += '<p class="muted">' + (AD.loading ? 'Memuat data...' : 'Data belum termuat.') + '</p>';
  else h += '<div id="adm-body">' + ({ pesanan: tabPesanan, produk: tabProduk, keuangan: tabKeuangan, promo: tabPromo, pengaturan: tabPengaturan, aduan: tabAduan, data: tabData, academy: tabAcademy }[AD.tab])() + '</div>';
  v.innerHTML = h + '</div>'; if (AD.S) updPriceRows(); acCalc();
}
function saveBar() {
  return '<div class="save-bar"><span class="muted" id="dirty">' + (AD.dirty ? 'Ada perubahan yang belum disimpan' : 'Semua tersimpan') + '</span><button class="btn btn-primary" data-a="saveSettings">Simpan perubahan</button></div>';
}

/* ---------- Pesanan ---------- */
function tabPesanan() {
  var d = AD.data, os = d.orders, q = AD.oq.trim().toLowerCase();
  var list = os.filter(function (o) { return (AD.ofilter === 'Semua' || o.status === AD.ofilter) && (!q || (o.id + ' ' + o.name + ' ' + o.wa).toLowerCase().indexOf(q) >= 0); });
  var today = todayWIB(), tOrders = os.filter(function (o) { return orderDay(o) === today && o.status !== 'Dibatalkan'; });
  var h = '<div class="stats"><div class="stat"><b>' + os.filter(function (o) { return o.status === 'Baru'; }).length + '</b><span>Pesanan baru</span></div><div class="stat"><b>' + tOrders.length + '</b><span>Pesanan hari ini</span></div><div class="stat good"><b>' + rp(tOrders.reduce(function (s, o) { return s + o.total; }, 0)) + '</b><span>Omzet hari ini</span></div></div>';
  h += '<details class="box" style="margin:0 0 14px"><summary style="font-weight:800;cursor:pointer">📋 Rekap belanja subuh (siap dibelanjakan dan dikemas)</summary>' + rekapHtml(os) + '</details>';
  h += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div class="chips">' + ['Semua'].concat(STATUSES).map(function (s) { return '<button class="chip" data-a="ofilter" data-s="' + s + '" aria-pressed="' + (AD.ofilter === s) + '">' + s + '</button>'; }).join('') + '</div><input class="inp" id="oq" style="max-width:240px" placeholder="Cari nama, nomor, WA" value="' + esc(AD.oq) + '"></div>';
  if (!list.length) return h + '<p class="muted">Tidak ada pesanan.</p>';
  h += list.map(function (o) {
    var wa = normWa(o.wa);
    return '<details class="ord"><summary><b class="oid">' + esc(o.id) + '</b><span class="pill s-' + esc(o.status) + '">' + esc(o.status) + '</span><span>' + esc(o.name) + '</span><span class="muted">' + esc(o.time) + '</span><b class="num" style="margin-left:auto">' + rp(o.total) + '</b></summary><div class="ord-body">' +
      '<div><b>WhatsApp:</b> <a target="_blank" rel="noopener" href="https://wa.me/' + wa + '">' + esc(o.wa) + '</a></div><div><b>Terima:</b> ' + esc(o.method) + (o.zone ? ' - ' + esc(o.zone) : '') + (o.date ? ' · ' + dateLabel(o.date) + ' ' + esc(o.slot) : '') + '</div>' +
      (o.address ? '<div><b>Alamat:</b> ' + esc(o.address) + (safeUrl(o.maps) ? ' <a target="_blank" rel="noopener" href="' + esc(o.maps) + '">Buka peta</a>' : '') + '</div>' : '') +
      '<div><b>Pesanan:</b><ul style="margin:4px 0 0;padding-left:18px">' + o.items.map(function (i) { return '<li>' + i.qty + 'x ' + esc(i.name) + (i.tebus ? ' (tebus)' : '') + (i.prep || i.pack ? ' <span class="muted">[' + esc([i.prep, i.pack].filter(Boolean).join(' | ')) + ']</span>' : '') + (i.note ? ' <i>"' + esc(i.note) + '"</i>' : '') + ' <span class="muted num">' + rp(i.price * i.qty) + '</span></li>'; }).join('') + '</ul></div>' +
      '<div><b>Subtotal</b> ' + rp(o.subtotal) + ' · <b>Ongkir</b> ' + rp(o.shipping) + (o.discount ? ' · <b>Diskon</b> -' + rp(o.discount) + ' (' + esc(o.voucher) + ')' : '') + ' · <b>Total</b> ' + rp(o.total) + '</div><div><b>Bayar:</b> ' + esc(o.payment) + (o.note ? ' · <b>Catatan:</b> ' + esc(o.note) : '') + '</div>' +
      '<div><b>Estimasi margin:</b> <span class="mg ' + (o.margin < 0 ? 'neg' : '') + '">' + rp(o.margin) + '</span></div>' +
      '<div class="row"><label class="lbl" style="margin:0" for="st-' + esc(o.id) + '">Status</label><select class="inp" style="width:auto" id="st-' + esc(o.id) + '" data-a="oStatus" data-id="' + esc(o.id) + '">' + STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
      '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Halo ' + o.name + ', pesanan ' + o.id + ' di ' + AD.S.storeName + ' berstatus: ' + o.status + '.') + '">Kabari via WA</a></div></div></details>';
  }).join('');
  return h;
}
function rekapHtml(os) {
  var act = os.filter(function (o) { return o.status !== 'Dibatalkan' && o.status !== 'Selesai'; }), groups = {};
  act.forEach(function (o) {
    var g = o.date ? dateLabel(o.date) + ' · ' + o.slot : 'Ambil sendiri / kurir online';
    groups[g] = groups[g] || { n: 0, items: {}, order: o.date || 'z' }; groups[g].n++;
    o.items.forEach(function (i) { var k = i.name + (i.prep || i.pack ? ' [' + [i.prep, i.pack].filter(Boolean).join(' | ') + ']' : ''); groups[g].items[k] = (groups[g].items[k] || 0) + i.qty; });
  });
  var keys = Object.keys(groups).sort(function (a, b) { return groups[a].order < groups[b].order ? -1 : 1; });
  if (!keys.length) return '<p class="muted" style="margin-top:8px">Tidak ada pesanan aktif.</p>';
  return keys.map(function (g) { var G = groups[g]; return '<h4 style="margin:12px 0 4px">' + esc(g) + ' <span class="muted">(' + G.n + ' pesanan)</span></h4><ul style="margin:0;padding-left:18px">' + Object.keys(G.items).sort().map(function (k) { return '<li><b>' + G.items[k] + 'x</b> ' + esc(k) + '</li>'; }).join('') + '</ul>'; }).join('');
}

/* ---------- Produk ---------- */
function tabProduk() {
  var ps = AD.data.products, miss = ps.filter(function (p) { return p.active && !nz(p.hpp); }).length;
  var h = '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div class="muted">' + ps.length + ' produk' + (miss ? ' · <b style="color:var(--sunset)">' + miss + ' belum diisi HPP</b>' : '') + '</div><button class="btn btn-primary" data-a="pNew">+ Tambah produk</button></div><div class="pgrid">';
  h += ps.map(function (p) {
    var m = marginOf(p.price, p.hpp, p.kemas), has = nz(p.hpp) > 0;
    return '<div class="prow"><div class="th">' + (imgSrc(p.image) ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji || '🛒')) + '</div><div class="meta"><b>' + esc(p.name) + (p.active ? '' : ' <span class="pill">Disembunyikan</span>') + '</b><span class="muted">' + esc(p.cat) + ' · ' + (p.stock === null ? 'stok bebas' : 'stok ' + p.stock) + '</span><div class="num">' + rp(p.price) + (p.flash ? ' · ⚡' + rp(p.flash.price) : '') + '</div><span class="mg ' + mgClass(m, has) + '">' + (has ? 'Margin ' + rp(m.rp) + ' (' + m.pct + '%)' : 'HPP belum diisi') + '</span><div class="acts"><button class="btn btn-sm btn-ghost" data-a="pEdit" data-id="' + esc(p.id) + '">Edit</button><button class="btn btn-sm btn-ghost" data-a="pToggle" data-id="' + esc(p.id) + '">' + (p.active ? 'Sembunyikan' : 'Tampilkan') + '</button></div></div></div>';
  }).join('') + '</div>';
  return h;
}
function openProductEditor(id) {
  var p = id ? AD.data.products.filter(function (x) { return x.id === id; })[0] : null;
  p = p ? clone(p) : { id: '', name: '', cat: '', price: 0, oldPrice: 0, hpp: 0, kemas: 0, stock: null, image: '', emoji: '🛒', desc: '', badge: '', prepText: '', packText: '', flashPrice: 0, flashUntil: '', flashQuota: 0, active: true, order: '' };
  AD.edit = p;
  var cats = (AD.S.categories || []).map(function (c) { return '<option value="' + esc(c.name) + '">'; }).join('');
  function f(label, k, type, extra) { return '<div class="field"><label for="pe-' + k + '">' + label + '</label><input id="pe-' + k + '" data-pe="' + k + '" type="' + (type || 'text') + '" value="' + esc(p[k] == null ? '' : p[k]) + '" ' + (extra || '') + '></div>'; }
  var h = mHead(p.id ? 'Edit produk ' + esc(p.id) : 'Tambah produk') + f('Nama produk', 'name') + '<div class="two-f">' + f('Kategori', 'cat', 'text', 'list="pe-cats"') + '<datalist id="pe-cats">' + cats + '</datalist>' + f('Emoji (cadangan foto)', 'emoji') + f('Label/badge (mis. Terlaris)', 'badge') + '</div>' +
    '<div class="field"><label for="pe-desc">Deskripsi</label><textarea id="pe-desc" data-pe="desc">' + esc(p.desc) + '</textarea></div>' +
    '<div class="field"><label>Foto produk</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="prow" style="padding:0;border:0;background:none"><div class="th" id="pe-th">' + (imgSrc(p.image) ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.emoji)) + '</div></div><input type="file" id="pe-file" accept="image/*"><span id="pe-up" class="hint"></span></div>' + f('atau tempel link foto', 'image', 'text', 'placeholder="https://..."') + '</div>' +
    '<h4 style="margin-top:16px">Harga dan modal</h4><div class="two-f">' + f('Harga jual (Rp)', 'price', 'number', 'min="0" step="500"') + f('Harga coret (Rp, opsional)', 'oldPrice', 'number', 'min="0"') + f('HPP / modal per unit (Rp)', 'hpp', 'number', 'min="0"') + f('Biaya kemas per unit (Rp)', 'kemas', 'number', 'min="0"') + f('Stok (kosong = tak terbatas)', 'stock', 'number', 'min="0"') + f('Urutan tampil', 'order', 'number', 'min="1"') + '</div><div class="calc" id="pe-calc"></div>' +
    '<h4 style="margin-top:16px">Pilihan pelanggan</h4><div class="field"><label for="pe-prepText">Pilihan potongan (satu per baris, tambahan harga di akhir, mis. Fillet +3000)</label><textarea id="pe-prepText" data-pe="prepText" placeholder="Utuh&#10;Potong 4&#10;Fillet +3000">' + esc(p.prepText) + '</textarea></div><div class="field"><label for="pe-packText">Pilihan kemasan (satu per baris)</label><textarea id="pe-packText" data-pe="packText" placeholder="Plastik biasa&#10;Daun pisang +1000">' + esc(p.packText) + '</textarea></div>' +
    '<h4 style="margin-top:16px">Flash sale (opsional)</h4><div class="two-f">' + f('Harga flash (Rp, 0 = nonaktif)', 'flashPrice', 'number', 'min="0"') + '<div class="field"><label for="pe-flashUntil">Berakhir (WIB)</label><input id="pe-flashUntil" data-pe="flashUntil" type="datetime-local" value="' + esc(p.flashUntil) + '"></div>' + f('Kuota flash', 'flashQuota', 'number', 'min="0"') + '</div>' +
    '<label class="ck" style="display:flex;gap:8px;margin-top:14px;font-weight:700"><input type="checkbox" id="pe-active" ' + (p.active ? 'checked' : '') + '> Tampilkan di toko</label><div id="pe-err" class="err"></div>' +
    '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-primary" data-a="pSave">Simpan produk</button>' + (p.id ? '<button class="btn btn-danger" data-a="pDel">Hapus</button>' : '') + '<button class="btn btn-ghost" data-a="closem">Batal</button></div>';
  openModal(h); peCalc();
}
function peRead() {
  var p = AD.edit;
  document.querySelectorAll('[data-pe]').forEach(function (e) { p[e.getAttribute('data-pe')] = e.value; });
  p.active = $('pe-active').checked; return p;
}
function peCalc() {
  var p = peRead(), m = marginOf(nz(p.price), nz(p.hpp), nz(p.kemas)), tg = nz(AD.S.finance.targetMargin, 25), cost = nz(p.hpp) + nz(p.kemas);
  var sug = cost > 0 && tg < 100 ? Math.ceil(cost / (1 - tg / 100) / 500) * 500 : 0;
  var has = nz(p.hpp) > 0;
  $('pe-calc').innerHTML = has ? 'Modal total <b>' + rp(cost) + '</b> · Margin <span class="mg ' + mgClass(m, true) + '">' + rp(m.rp) + ' (' + m.pct + '%)</span><div class="row" style="margin-top:6px">Harga saran untuk target margin ' + tg + '%: <b>' + rp(sug) + '</b> <button class="btn btn-sm btn-ghost" data-a="peSuggest" data-v="' + sug + '">Pakai</button></div>' : 'Isi HPP untuk melihat margin dan harga saran.';
  var th = $('pe-th'); if (th && !imgSrc(p.image)) th.textContent = p.emoji || '🛒';
}
function resizeImage(file, maxW) {
  return new Promise(function (res, rej) {
    var fr = new FileReader(); fr.onerror = rej;
    fr.onload = function () { var im = new Image(); im.onerror = rej; im.onload = function () { var s = Math.min(1, maxW / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82)); }; im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
function uploadImage(file, cb, status) {
  if (status) status.textContent = 'Mengunggah...';
  resizeImage(file, 900).then(function (url) {
    return aCall('adminUpload', { mime: 'image/jpeg', filename: (file.name || 'foto').replace(/\.\w+$/, '') + '.jpg', data: url.split(',')[1] });
  }).then(function (r) { if (r && r.ok) { cb(r.url); if (status) status.textContent = 'Foto terunggah.'; } else if (status) status.textContent = (r && r.error) || 'Gagal mengunggah.'; }).catch(function () { if (status) status.textContent = 'Foto tidak bisa dibaca.'; });
}
function saveProduct() {
  var p = peRead();
  if (!String(p.name).trim()) { $('pe-err').textContent = 'Nama produk wajib diisi.'; return; }
  var btn = document.querySelector('[data-a=pSave]'); btn.disabled = true;
  aCall('adminProductSave', { product: p }).then(function (r) {
    btn.disabled = false;
    if (!r.ok) { $('pe-err').textContent = r.error; return; }
    closeModal(); toast('Produk tersimpan'); loadAdmin();
  });
}

/* ---------- Keuangan ---------- */
function periodOrders() {
  var os = AD.data.orders.filter(function (o) { return o.status !== 'Dibatalkan' && (!AD.onlyDone || o.status === 'Selesai'); }), today = todayWIB(), from = '', days = 1;
  if (AD.period === '7') from = addDays(today, -6), days = 7;
  else if (AD.period === '30') from = addDays(today, -29), days = 30;
  else if (AD.period === 'month') { from = today.slice(0, 8) + '01'; days = +today.slice(8); }
  else { var ds = os.map(orderDay).filter(Boolean).sort(); from = ds[0] || today; days = Math.max(1, Math.round((Date.parse(today) - Date.parse(from)) / 864e5) + 1); }
  return { orders: os.filter(function (o) { var d = orderDay(o); return d >= from && d <= today; }), days: days };
}
function tabKeuangan() {
  var F = AD.S.finance, pr = periodOrders(), os = pr.orders, ps = AD.data.products;
  var omzet = 0, hppT = 0, margin = 0, ship = 0, disc = 0;
  os.forEach(function (o) { omzet += o.total; margin += o.margin; ship += o.shipping; disc += o.discount; o.items.forEach(function (i) { hppT += nz(i.cost) * i.qty; }); });
  var opexMonth = (F.opex || []).reduce(function (s, x) { return s + nz(x.amount); }, 0), opex = Math.round(opexMonth / 30 * pr.days), net = margin - opex;
  var avgM = os.length ? margin / os.length : 0, bep = avgM > 0 ? Math.ceil((opexMonth / 30) / avgM) : 0, perDay = os.length / pr.days;
  var h = '<div class="chips" style="margin-bottom:12px">' + [['7', '7 hari'], ['30', '30 hari'], ['month', 'Bulan ini'], ['all', 'Semua']].map(function (c) { return '<button class="chip" data-a="period" data-p="' + c[0] + '" aria-pressed="' + (AD.period === c[0]) + '">' + c[1] + '</button>'; }).join('') + '<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-a="onlyDone"' + (AD.onlyDone ? ' checked' : '') + '> Hanya pesanan Selesai</label></div>';
  h += '<div class="stats"><div class="stat"><b>' + os.length + '</b><span>Pesanan (' + pr.days + ' hari)</span></div><div class="stat"><b>' + rp(omzet) + '</b><span>Omzet</span></div><div class="stat"><b>' + rp(hppT) + '</b><span>Total HPP + kemas</span></div><div class="stat good"><b>' + rp(margin) + '</b><span>Margin kontribusi</span></div><div class="stat"><b>' + rp(opex) + '</b><span>OPEX prorata (÷30 hari)</span></div><div class="stat ' + (net >= 0 ? 'good' : 'bad') + '"><b>' + rp(net) + '</b><span>Laba bersih estimasi</span></div></div>';
  h += '<p class="muted" style="margin-bottom:14px">Titik impas: <b>' + (bep || '-') + ' pesanan/hari</b> (OPEX bulanan ' + rp(opexMonth) + ', margin rata-rata ' + rp(avgM) + '/pesanan). Rata-rata sekarang ' + (Math.round(perDay * 10) / 10) + ' pesanan/hari. Ongkir terkumpul ' + rp(ship) + ', diskon voucher ' + rp(disc) + '.</p>';
  var miss = ps.filter(function (p) { return p.active && !nz(p.hpp); });
  if (miss.length) h += '<div class="notice" style="margin-bottom:14px">⚠️ ' + miss.length + ' produk aktif belum punya HPP, jadi marginnya dianggap 100%: ' + miss.map(function (p) { return esc(p.name); }).join(', ') + '.</div>';
  /* tabel harga & margin */
  h += '<div class="set-sec"><h3>Harga dan margin per produk</h3><p class="muted">Ubah harga jual, HPP, dan biaya kemas langsung di tabel lalu simpan. Harga saran memakai target margin ' + nz(F.targetMargin, 25) + '%.</p><div class="tbl-wrap"><table class="t"><thead><tr><th>Produk</th><th class="r">Harga jual</th><th class="r">HPP</th><th class="r">Kemas</th><th class="r">Margin Rp</th><th class="r">Margin %</th><th class="r">Harga saran</th></tr></thead><tbody>' + ps.map(function (p) {
    return '<tr data-row="' + esc(p.id) + '"><td>' + esc(p.name) + '</td><td class="r"><input type="number" min="0" step="500" data-pr="price" value="' + p.price + '"></td><td class="r"><input type="number" min="0" data-pr="hpp" value="' + p.hpp + '"></td><td class="r"><input type="number" min="0" data-pr="kemas" value="' + p.kemas + '"></td><td class="r num" data-o="rp"></td><td class="r" data-o="pct"></td><td class="r num" data-o="sug"></td></tr>';
  }).join('') + '</tbody></table></div><button class="btn btn-primary" style="margin-top:10px" data-a="priceSave">Simpan harga dan HPP</button></div>';
  /* performa produk */
  var perf = {}; os.forEach(function (o) { o.items.forEach(function (i) { var k = i.name; perf[k] = perf[k] || { q: 0, rev: 0, mg: 0 }; perf[k].q += i.qty; perf[k].rev += i.price * i.qty; perf[k].mg += (i.price - nz(i.cost)) * i.qty; }); });
  var pk = Object.keys(perf).sort(function (a, b) { return perf[b].mg - perf[a].mg; });
  h += '<div class="set-sec"><h3>Performa produk</h3>' + (pk.length ? '<div class="tbl-wrap"><table class="t"><thead><tr><th>Produk</th><th class="r">Terjual</th><th class="r">Omzet</th><th class="r">Margin</th></tr></thead><tbody>' + pk.map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="r">' + perf[k].q + '</td><td class="r num">' + rp(perf[k].rev) + '</td><td class="r num">' + rp(perf[k].mg) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Belum ada pesanan pada periode ini.</p>') + '</div>';
  /* pengaturan keuangan */
  h += '<div class="set-sec"><h3>Asumsi keuangan</h3><div class="two-f">' + numF('Biaya kurir toko per antaran (Rp)', 'finance.courierCost') + numF('Hari kerja per bulan', 'finance.workDays') + numF('Target margin (%)', 'finance.targetMargin') + '</div><h4 style="margin-top:14px">Biaya operasional bulanan (OPEX)</h4>' +
    rowsEditor('finance.opex', [{ k: 'name', l: 'Nama biaya' }, { k: 'amount', l: 'Per bulan (Rp)', t: 'n' }]) + '</div>' + saveBar();
  return h;
}
function updPriceRows() {
  var tg = nz(AD.S.finance.targetMargin, 25);
  document.querySelectorAll('tr[data-row]').forEach(function (tr) {
    var g = function (k) { return nz(tr.querySelector('[data-pr=' + k + ']').value); }, m = marginOf(g('price'), g('hpp'), g('kemas')), has = g('hpp') > 0, cost = g('hpp') + g('kemas');
    tr.querySelector('[data-o=rp]').innerHTML = has ? '<span class="mg ' + mgClass(m, true) + '">' + rp(m.rp) + '</span>' : '<span class="mg none">-</span>';
    tr.querySelector('[data-o=pct]').textContent = has ? m.pct + '%' : '-';
    tr.querySelector('[data-o=sug]').textContent = cost > 0 && tg < 100 ? rp(Math.ceil(cost / (1 - tg / 100) / 500) * 500) : '-';
  });
}
function savePrices() {
  var rows = []; document.querySelectorAll('tr[data-row]').forEach(function (tr) { var g = function (k) { return nz(tr.querySelector('[data-pr=' + k + ']').value); }; rows.push({ id: tr.getAttribute('data-row'), price: g('price'), hpp: g('hpp'), kemas: g('kemas') }); });
  aCall('adminPricingSave', { rows: rows }).then(function (r) { if (r.ok) { toast('Harga dan HPP tersimpan (' + r.saved + ' produk)'); loadAdmin(); } else toast(r.error, true); });
}

/* ---------- Editor umum ---------- */
function fld(label, path, opts) {
  opts = opts || {}; var v = getPath(AD.S, path); if (v == null) v = '';
  var id = 'f_' + path.replace(/\./g, '_');
  if (opts.area) return '<div class="field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" data-p="' + path + '">' + esc(v) + '</textarea>' + (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '') + '</div>';
  return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" data-p="' + path + '"' + (opts.num ? ' data-t="n" type="number" min="0"' : '') + ' value="' + esc(v) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + '>' + (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '') + '</div>';
}
function numF(label, path) { return fld(label, path, { num: true }); }
function chk(label, path) { return '<label class="ck" style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:700"><input type="checkbox" data-p="' + path + '" data-t="b"' + (getPath(AD.S, path) ? ' checked' : '') + '> ' + label + '</label>'; }
function rowsEditor(path, cols) {
  var arr = getPath(AD.S, path) || [];
  return '<div class="re">' + arr.map(function (row, i) {
    return '<div class="re-row">' + cols.map(function (c) {
      var p = path + '.' + i + '.' + c.k, v = row[c.k];
      if (c.t === 'b') return '<label class="ck"><input type="checkbox" data-p="' + p + '" data-t="b"' + (v ? ' checked' : '') + '> ' + c.l + '</label>';
      if (c.t === 's') return '<label>' + c.l + '<select class="inp" data-p="' + p + '">' + c.o.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
      return '<label>' + c.l + '<input class="inp" data-p="' + p + '"' + (c.t === 'n' ? ' data-t="n" type="number" min="0"' : '') + ' value="' + esc(v == null ? '' : v) + '"></label>';
    }).join('') + '<button class="btn btn-danger btn-sm" data-a="reDel" data-p="' + path + '" data-i="' + i + '">Hapus</button></div>';
  }).join('') + '<button class="btn btn-ghost btn-sm" data-a="reAdd" data-p="' + path + '">+ Tambah</button></div>';
}

/* ---------- Promo & tampilan ---------- */
function tabPromo() {
  var h = '<div class="set-sec"><h3>Bar pengumuman</h3><div class="two-f">' + fld('Label kecil', 'announceBadge') + '</div>' + fld('Teks pengumuman', 'announceText', { area: true }) + '</div>';
  h += '<div class="set-sec"><h3>Banner utama (slide)</h3>' + rowsEditor('heroSlides', [{ k: 'badge', l: 'Label' }, { k: 'title', l: 'Judul' }, { k: 'desc', l: 'Deskripsi' }, { k: 'cta', l: 'Tombol' }, { k: 'emoji', l: 'Emoji' }]) + '</div>';
  h += '<div class="set-sec"><h3>Pencarian populer dan kategori</h3>' + fld('Kata kunci populer (pisahkan koma)', 'keywords') + '<h4 style="margin-top:12px">Kategori</h4><p class="hint">Nama kategori harus sama dengan isian Kategori di produk.</p>' + rowsEditor('categories', [{ k: 'name', l: 'Nama kategori' }, { k: 'emoji', l: 'Emoji' }]) + '</div>';
  h += '<div class="set-sec"><h3>Flash sale</h3><div class="two-f">' + fld('Judul', 'flashTitle') + fld('Catatan', 'flashNote') + '</div><p class="hint">Harga, jam berakhir, dan kuota flash diatur per produk di tab Produk.</p></div>';
  h += '<div class="set-sec"><h3>Voucher</h3>' + rowsEditor('vouchers', [{ k: 'code', l: 'Kode' }, { k: 'label', l: 'Nama promo' }, { k: 'type', l: 'Jenis', t: 's', o: [['potongan', 'Potongan Rp'], ['ongkir', 'Gratis ongkir']] }, { k: 'value', l: 'Nilai potongan (Rp)', t: 'n' }, { k: 'min', l: 'Min. belanja (Rp)', t: 'n' }, { k: 'maxUses', l: 'Kuota pakai (0 = bebas)', t: 'n' }, { k: 'desc', l: 'Keterangan' }, { k: 'newOnly', l: 'Hanya pelanggan baru', t: 'b' }, { k: 'active', l: 'Aktif', t: 'b' }]) + '</div>';
  h += '<div class="set-sec"><h3>Tebus murah</h3>' + chk('Aktifkan Tebus Murah', 'tebus.enabled') + '<div class="two-f">' + numF('Minimal belanja produk (Rp)', 'tebus.min') + '</div>' + rowsEditor('tebus.items', [{ k: 'id', l: 'Kode unik (mis. TM-03)' }, { k: 'name', l: 'Nama' }, { k: 'price', l: 'Harga tebus (Rp)', t: 'n' }, { k: 'normalPrice', l: 'Harga normal (Rp)', t: 'n' }, { k: 'hpp', l: 'HPP (Rp)', t: 'n' }, { k: 'emoji', l: 'Emoji' }]) + '</div>';
  h += '<div class="set-sec"><h3>Keunggulan toko</h3>' + fld('Tentang toko', 'about', { area: true }) + rowsEditor('values', [{ k: 'icon', l: 'Ikon' }, { k: 'title', l: 'Judul' }, { k: 'text', l: 'Penjelasan' }]) + '</div>';
  return h + saveBar();
}

/* ---------- Pengaturan ---------- */
function tabPengaturan() {
  var D = AD.S.delivery;
  var h = '<div class="set-sec"><h3>Profil toko</h3><div class="two-f">' + fld('Nama toko', 'storeName') + fld('Slogan', 'tagline') + '</div>' +
    '<div class="field"><label>Logo toko</label><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><img src="' + esc(logoSm(AD.S)) + '" alt="" style="width:56px;height:56px;border-radius:14px"><input type="file" id="logo-file" accept="image/*"><span class="hint" id="logo-st">Kosongkan untuk memakai logo SegarKite bawaan.</span></div>' + fld('atau link logo', 'logoUrl', { ph: 'https://...' }) + '</div>' +
    chk('Toko buka (terima pesanan)', 'storeOpen') + fld('Pesan saat toko tutup', 'closedMessage') + chk('Tampilkan fitur aduan', 'complaintEnabled') + '</div>';
  h += '<div class="set-sec"><h3>Kontak dan media sosial</h3><div class="two-f">' + fld('WhatsApp admin', 'whatsapp', { ph: '08xxxxxxxxxx' }) + fld('Email', 'email') + fld('Instagram (link atau @nama)', 'instagram') + fld('TikTok', 'tiktok') + fld('Facebook', 'facebook') + fld('YouTube (link)', 'youtube') + fld('Marketplace (link)', 'marketplace') + '</div></div>';
  h += '<div class="set-sec"><h3>Lokasi</h3>' + fld('Alamat toko', 'address') + fld('Jam buka', 'hours') + fld('Kode embed Google Maps', 'mapsEmbed', { area: true, hint: 'Google Maps → cari lokasi → Bagikan → Sematkan peta → Salin HTML, tempel di sini.' }) + fld('Link Google Maps (untuk tombol)', 'mapsLink') + '</div>';
  h += '<div class="set-sec"><h3>Cara menerima pesanan</h3><h4>1. Ambil sendiri</h4>' + chk('Aktif', 'delivery.pickup.enabled') + '<div class="two-f">' + fld('Nama pilihan', 'delivery.pickup.label') + fld('Alamat ambil', 'delivery.pickup.address') + fld('Jam ambil', 'delivery.pickup.hours') + fld('Link peta lokasi ambil', 'delivery.pickup.mapsLink') + '</div>' + fld('Catatan', 'delivery.pickup.note') +
    '<h4 style="margin-top:18px">2. Kurir online</h4>' + chk('Aktif', 'delivery.courier.enabled') + '<div class="two-f">' + fld('Nama pilihan', 'delivery.courier.label') + '</div>' + fld('Catatan', 'delivery.courier.note') + rowsEditor('delivery.courier.options', [{ k: 'name', l: 'Nama kurir' }, { k: 'fee', l: 'Ongkir tetap (Rp, 0 = bayar ke kurir)', t: 'n' }]) +
    '<h4 style="margin-top:18px">3. Kurir toko (jadwal tetap)</h4>' + chk('Aktif', 'delivery.scheduled.enabled') + '<div class="two-f">' + fld('Nama pilihan', 'delivery.scheduled.label') + numF('Gratis ongkir mulai belanja (Rp, 0 = nonaktif)', 'delivery.scheduled.freeFrom') + numF('Bisa pesan berapa hari ke depan', 'delivery.scheduled.daysAhead') + '</div>' + fld('Catatan', 'delivery.scheduled.note') +
    '<h4 style="margin-top:12px">Rute dan ongkir</h4>' + rowsEditor('delivery.scheduled.zones', [{ k: 'name', l: 'Wilayah / rute' }, { k: 'fee', l: 'Ongkir (Rp)', t: 'n' }]) +
    '<h4 style="margin-top:12px">Sesi antar</h4><p class="hint">Batas pesan: "berapa hari sebelumnya" dan "jam" (WIB). Contoh pagi: 1 hari sebelumnya jam 20. Sore: 0 hari jam 12. Kapasitas = maksimal pesanan per sesi per hari.</p>' + rowsEditor('delivery.scheduled.slots', [{ k: 'name', l: 'Nama sesi' }, { k: 'time', l: 'Jam antar' }, { k: 'daysBefore', l: 'Hari sebelumnya', t: 'n' }, { k: 'cutoffHour', l: 'Jam batas (0-23)', t: 'n' }, { k: 'capacity', l: 'Kapasitas (0 = bebas)', t: 'n' }]) + '</div>';
  h += '<div class="set-sec"><h3>Metode pembayaran</h3>' + rowsEditor('payment.methods', [{ k: 'name', l: 'Nama' }, { k: 'detail', l: 'Petunjuk untuk pelanggan' }]) + '</div>';
  return h + saveBar();
}

/* ---------- Aduan ---------- */
function tabAduan() {
  var cs = AD.data.complaints;
  if (!cs.length) return '<p class="muted">Belum ada aduan.</p>';
  return cs.map(function (c) {
    return '<div class="ord-card"><div class="row"><b>' + esc(c.name) + '</b><span class="pill s-' + (c.status === 'Selesai' ? 'Selesai' : 'Baru') + '">' + esc(c.status) + '</span></div><div class="muted">' + esc(c.time) + ' · ' + esc(c.type) + (c.orderId ? ' · ' + esc(c.orderId) : '') + ' · <a target="_blank" rel="noopener" href="https://wa.me/' + normWa(c.wa) + '">' + esc(c.wa) + '</a></div><p style="margin:8px 0;white-space:pre-line">' + esc(c.message) + '</p>' +
      '<div class="two-f"><div class="field" style="margin:0"><label for="cs-' + esc(c.id) + '">Status</label><select id="cs-' + esc(c.id) + '" class="inp">' + ['Baru', 'Diproses', 'Selesai'].map(function (s) { return '<option' + (s === c.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div><div class="field" style="margin:0"><label for="cr-' + esc(c.id) + '">Catatan balasan</label><input id="cr-' + esc(c.id) + '" class="inp" value="' + esc(c.reply || '') + '"></div></div><button class="btn btn-primary btn-sm" style="margin-top:8px" data-a="cSave" data-id="' + esc(c.id) + '">Simpan</button></div>';
  }).join('');
}

/* ---------- Data & backup ---------- */
function tabData() {
  var h = '<div class="set-sec"><h3>Penyimpanan data</h3>' + (API.demo ? '<div class="notice">Mode demo: data hanya tersimpan di browser ini. Sambungkan backend (lihat PANDUAN) agar data tersimpan permanen.</div>' : '<p>Semua pesanan, produk (termasuk HPP dan margin), aduan, dan pengaturan tersimpan permanen di database Supabase Anda. Foto produk ada di Supabase Storage.</p>' + (AD.sheetUrl ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(AD.sheetUrl) + '">Buka Google Sheet</a><button class="btn btn-ghost" data-a="backupNow">Buat salinan backup sekarang</button></div>' : '<p class="hint" style="margin-top:8px">Sambungan otomatis ke Google Sheet belum aktif. Sementara, unduh salinan data lewat CSV di bawah, lalu buka di Google Sheets.</p>')) + '</div>';
  h += '<div class="set-sec"><h3>Unduh data (CSV)</h3><p class="muted">Dapat dibuka di Excel atau Google Sheets. Lakukan rutin sebagai cadangan.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-ghost" data-a="csv">Unduh pesanan</button><button class="btn btn-ghost" data-a="csvProd">Unduh produk, HPP, dan margin</button></div></div>';
  return h;
}
function csvDownload(rows, name) {
  var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function csvProducts() {
  var rows = [['ID', 'Nama', 'Kategori', 'Harga', 'HPP', 'BiayaKemas', 'MarginRp', 'MarginPersen', 'Stok', 'Aktif']];
  AD.data.products.forEach(function (p) { var m = marginOf(p.price, p.hpp, p.kemas); rows.push([p.id, p.name, p.cat, p.price, p.hpp, p.kemas, m.rp, m.pct, p.stock === null ? '' : p.stock, p.active ? 'ya' : 'tidak']); });
  csvDownload(rows, 'produk-segarkite.csv');
}
function csvExport() {
  var rows = [['OrderID', 'Waktu', 'Nama', 'WhatsApp', 'Metode', 'Rute', 'Tanggal', 'Sesi', 'Pesanan', 'Subtotal', 'Diskon', 'Voucher', 'Ongkir', 'Total', 'EstimasiMargin', 'Pembayaran', 'Status']];
  AD.data.orders.forEach(function (o) { rows.push([o.id, o.time, o.name, o.wa, o.method, o.zone, o.date, o.slot, o.summary, o.subtotal, o.discount, o.voucher, o.shipping, o.total, o.margin, o.payment, o.status]); });
  var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'pesanan-segarkite.csv'; document.body.appendChild(a); a.click(); a.remove();
}
function saveSettings() {
  var S = AD.S;
  var b = document.querySelector('[data-a=saveSettings]'); if (b) b.disabled = true;
  aCall('adminSettingsSave', { settings: S }).then(function (r) {
    if (b) b.disabled = false;
    if (r.ok) { AD.dirty = false; var d = $('dirty'); if (d) d.textContent = 'Semua tersimpan'; toast('Pengaturan tersimpan'); } else toast(r.error || 'Gagal menyimpan.', true);
  });
}
function markDirty() { AD.dirty = true; var d = $('dirty'); if (d) d.textContent = 'Ada perubahan yang belum disimpan'; }

/* ---------- Event ---------- */
function onAdminClick(e) {
  var el = e.target.closest('[data-a]'); if (!el || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'checkbox')) return;
  var a = el.getAttribute('data-a'), id = el.getAttribute('data-id');
  if (acAction(a, el)) return;
  switch (a) {
    case 'login': { var pin = $('pin').value; el.disabled = true; API.post({ action: 'adminLogin', pin: pin }).then(function (r) { el.disabled = false; if (!r.ok) { $('login-err').textContent = r.error; return; } AD.token = r.token; AD.sheetUrl = r.sheetUrl || ''; try { sessionStorage.setItem('sk_tok', AD.token); sessionStorage.setItem('sk_sheet', AD.sheetUrl); } catch (x) {} loadAdmin(); }); break; }
    case 'logout': adminLogout(); break;
    case 'aRefresh': loadAdmin(); break;
    case 'tab': AD.tab = el.getAttribute('data-t'); renderAdmin(); break;
    case 'ofilter': AD.ofilter = el.getAttribute('data-s'); renderAdmin(); break;
    case 'period': AD.period = el.getAttribute('data-p'); renderAdmin(); break;
    case 'pNew': openProductEditor(''); break;
    case 'pEdit': openProductEditor(id); break;
    case 'pToggle': { var p = AD.data.products.filter(function (x) { return x.id === id; })[0], c = clone(p); c.active = !p.active; aCall('adminProductSave', { product: c }).then(function (r) { if (r.ok) loadAdmin(); else toast(r.error, true); }); break; }
    case 'pSave': saveProduct(); break;
    case 'pDel': if (confirm('Hapus produk ini permanen? Pesanan lama tetap tersimpan.')) aCall('adminProductDelete', { id: AD.edit.id }).then(function (r) { if (r.ok) { closeModal(); toast('Produk dihapus'); loadAdmin(); } else toast(r.error, true); }); break;
    case 'peSuggest': $('pe-price').value = el.getAttribute('data-v'); peCalc(); break;
    case 'priceSave': savePrices(); break;
    case 'saveSettings': saveSettings(); break;
    case 'reAdd': { var path = el.getAttribute('data-p'), arr = getPath(AD.S, path), key = path.split('.').pop(), t = clone(ROW_TPL[key] || {}); if (key === 'items') t.id = 'TM-' + ('0' + (arr.length + 1)).slice(-2); arr.push(t); markDirty(); renderAdmin(); break; }
    case 'reDel': { getPath(AD.S, el.getAttribute('data-p')).splice(+el.getAttribute('data-i'), 1); markDirty(); renderAdmin(); break; }
    case 'cSave': aCall('adminComplaintUpdate', { id: id, status: $('cs-' + id).value, reply: $('cr-' + id).value }).then(function (r) { if (r.ok) { toast('Aduan diperbarui'); loadAdmin(); } else toast(r.error, true); }); break;
    case 'backupNow': el.disabled = true; aCall('adminBackupNow').then(function (r) { el.disabled = false; toast(r.ok ? 'Backup dibuat di Google Drive Anda.' : r.error, !r.ok); }); break;
    case 'csv': csvExport(); break;
    case 'csvProd': csvProducts(); break;
  }
}
function onAdminChange(e) {
  var t = e.target, a = t.getAttribute && t.getAttribute('data-a');
  if (a === 'oStatus') { aCall('adminOrderStatus', { id: t.getAttribute('data-id'), status: t.value }).then(function (r) { if (r.ok) { toast('Status diperbarui'); loadAdmin(); } else { toast(r.error, true); loadAdmin(); } }); return; }
  if (a === 'acPreset') { acPreset(+t.value); return; }
  if (a === 'acCheck') { var cs = acChecks(); cs[+t.getAttribute('data-i')] = t.checked; acSaveChecks(cs); renderAdmin(); return; }
  if (a === 'onlyDone') { AD.onlyDone = t.checked; renderAdmin(); return; }
  if (t.id === 'pe-file' && t.files[0]) { uploadImage(t.files[0], function (u) { $('pe-image').value = u; AD.edit.image = u; $('pe-th').innerHTML = '<img src="' + esc(u) + '" alt="">'; }, $('pe-up')); return; }
  if (t.id === 'logo-file' && t.files[0]) { uploadImage(t.files[0], function (u) { AD.S.logoUrl = u; markDirty(); renderAdmin(); }, $('logo-st')); return; }
}
function onAdminInput(e) {
  var t = e.target;
  if (t.hasAttribute('data-p')) { var v = t.getAttribute('data-t') === 'b' ? t.checked : t.getAttribute('data-t') === 'n' ? nz(t.value) : t.value; setPath(AD.S, t.getAttribute('data-p'), v); markDirty(); if (t.getAttribute('data-p') === 'finance.targetMargin') updPriceRows(); return; }
  if (t.hasAttribute('data-ac')) { acCalc(); return; }
  if (t.hasAttribute('data-pe')) { peCalc(); return; }
  if (t.hasAttribute('data-pr')) { updPriceRows(); return; }
  if (t.id === 'oq') { AD.oq = t.value; var pos = t.selectionStart; renderAdmin(); var n = $('oq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
}
function bindAdmin() {
  var v = $('view-admin');
  v.addEventListener('click', onAdminClick); v.addEventListener('change', onAdminChange); v.addEventListener('input', onAdminInput);
  document.body.addEventListener('click', function (e) { if (e.target.closest('#modal') && AD.token) { var el = e.target.closest('[data-a]'); if (el && el.getAttribute('data-a') === 'modalbg') { if (e.target === el) closeModal(); return; } if (el && el.getAttribute('data-a') === 'closem') closeModal(); else onAdminClick(e); } });
  document.body.addEventListener('change', function (e) { if (e.target.closest('#modal') && AD.token) onAdminChange(e); });
  document.body.addEventListener('input', function (e) { if (e.target.closest('#modal') && AD.token) onAdminInput(e); });
  v.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'pin') { var b = v.querySelector('[data-a=login]'); if (b) b.click(); } });
}
function afterAdminRender() { updPriceRows(); }
