/* ===== SegarKite Academy: SOP operasional di panel admin ===== */
var AC = { mod: 'm1', last: 0 };
var AC_MODS = [['m1', '🧭 1. Persiapan & Supplier'], ['m2', '🧼 2. SOP Bersih & Frozen'], ['m3', '📦 3. Packaging & Coolbox'], ['m4', '⚖️ 4. Kalkulator HPP & Checklist'], ['m5', '📣 5. Promosi WA, IG & Sheet'], ['m6', '🎨 6. Stiker & Logo'], ['m7', '🛒 7. Kelola Produk'], ['m8', '⚙️ 8. Pengaturan & Ongkir']];
var AC_PRESET = [
  ['🐟 Ikan utuh siang sisik & insang', 18, 2000, 1500], ['🥩 Ikan fillet / giling tanpa tulang', 42, 2000, 2500], ['🦐 Udang kupas bersih belah punggung', 38, 2000, 2000],
  ['🍗 Ayam potong bersih / ungkep frozen', 12, 2500, 1500], ['🥬 Sayur daun sortir pucuk muda', 22, 600, 1000], ['🌶️ Bumbu kupas kulit bersih', 15, 1500, 1500]
];
var AC_CHECK = [
  'Stiker kemasan berlogo SEGAR KITE sudah dicetak, lengkap dengan WA 0898-0386-681 dan IG @segarkite.',
  'Sudah mengunci 2 supplier ikan basah dan 2 grosir sayur di Pasar Flamboyan Pontianak.',
  'Sudah memisahkan 3 warna talenan dan pisau (biru: ikan, merah: ayam, hijau: sayur).',
  'Sudah menguasai teknik membersihkan ikan 4 titik (sisik, insang, isi perut, darah tulang tengah).',
  'Sudah paham aturan dry-sorting: sayur daun tidak dicuci air sebelum dibungkus daun pisang.',
  'Sudah memproduksi stok awal frozen food (ayam ungkep bumbu kuning, udang kupas beku, tenggiri giling).',
  'Sudah membekukan minimal 6 ice gel pack di chest freezer (-18°C).',
  'Box motor kurir (coolbox) sudah disiapkan dengan susunan 4 lapis suhu.',
  'Bio Instagram @segarkite dan link WhatsApp +628980386681 sudah aktif.',
  'Sudah menetapkan sesi kurir serentak (pagi 08.00 dan sore 15.30 WIB) di tab Pengaturan.',
  'Sudah menyiapkan 10 paket tester untuk ibu-ibu komplek di Pontianak dan Serdam.',
  'Sudah mengunduh salinan data pesanan (CSV) minimal sekali sebagai cadangan.'
];
function acChecks() { try { var a = JSON.parse(localStorage.getItem('sk_acad_checks') || '[]'); return AC_CHECK.map(function (_, i) { return !!a[i]; }); } catch (e) { return AC_CHECK.map(function () { return false; }); } }
function acSaveChecks(a) { try { localStorage.setItem('sk_acad_checks', JSON.stringify(a)); } catch (e) {} }
function acBox(title, body, cls) { return '<div class="ac-box ' + (cls || '') + '"><h4>' + title + '</h4>' + body + '</div>'; }
function acList(items) { return '<ul class="ac-ul">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
function acHead(kicker, title, lead) { return '<span class="ac-kick">' + kicker + '</span><h3 class="ac-h">' + title + '</h3>' + (lead ? '<p class="muted">' + lead + '</p>' : ''); }

function tabAcademy() {
  var done = acChecks().filter(Boolean).length, pct = Math.round(done / AC_CHECK.length * 100);
  var h = '<div class="ac-hero"><div><b>SegarKite Academy</b><span>Buku pintar & SOP harian tim (hanya terlihat oleh admin)</span></div><div class="ac-pct"><b>' + pct + '%</b><span>Siap buka (' + done + '/' + AC_CHECK.length + ')</span></div><button class="btn btn-ghost btn-sm" data-a="acPrint">🖨️ Cetak SOP</button></div>';
  h += '<div class="chips ac-nav">' + AC_MODS.map(function (m) { return '<button class="chip" data-a="acMod" data-m="' + m[0] + '" aria-pressed="' + (AC.mod === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div>';
  return h + '<div class="ac-body">' + ({ m1: acM1, m2: acM2, m3: acM3, m4: acM4, m5: acM5, m6: acM6, m7: acM7, m8: acM8 }[AC.mod])() + '</div>';
}

function acM1() {
  return '<div class="set-sec">' + acHead('Modul 01', 'Persiapan hulu & kunci supplier Pontianak', 'Jangan langsung menyewa ruko. Kunci pemasok tangan pertama dan pakai alur pre-order H-1 supaya tidak ada bahan terbuang.') +
    acBox('Fase H-7 • Persiapan', acList(['<b>Ikan & udang:</b> datangi los basah Pasar Flamboyan / TPI Seng Hie sekitar pukul 04.30 WIB. Minta nomor WA 2 pedagang langganan untuk pesan stok malam hari.', '<b>Sayur & hidroponik:</b> bekerja sama dengan grosir sayur subuh Pasar Flamboyan dan petani hidroponik di Rasau Jaya / Sungai Raya.', '<b>Dapur 5 zona:</b> siapkan chest freezer, vacuum sealer, timbangan digital gram, dan 3 warna talenan terpisah.'])) +
    acBox('Fase H-1 • 15.00 sampai 20.30 WIB', acList(['Buka katalog harian di web SegarKite, Instagram Story @segarkite, dan broadcast WA pukul 15.00 WIB.', 'Tutup pesanan kloter pagi pukul 20.00 WIB. Rekap total berat kotor yang harus dibeli, tambahkan toleransi susut sisik/insang sekitar 18%.', 'Pastikan 6 ice gel pack sudah masuk chest freezer semalaman.'])) +
    acBox('Hari H subuh • 04.30 sampai 08.00 WIB', acList(['<b>04.30 – 05.30:</b> ambil barang pesanan di Pasar Flamboyan sebelum bahan terbaik habis.', '<b>05.45 – 07.45:</b> siangi ikan, vakum protein, sortir kering sayur, bungkus daun pisang, tempel stiker pesanan.', '<b>08.00 tepat:</b> kurir berangkat serentak membawa coolbox sesuai rute kecamatan.'])) +
    acBox('Standar seleksi grade A', acList(['<b>Ikan laut & sungai:</b> mata bening cembung (bukan merah/cekung), insang merah segar tidak berlendir, daging kenyal saat ditekan jari.', '<b>Ayam potong subuh:</b> kulit putih kekuningan alami, tidak memar kebiruan, bau segar khas daging baru dipotong.', '<b>Sayur daun & buah:</b> batang renyah patah berbunyi "krek", daun hijau cerah tanpa bercak kuning atau lubang ulat berlebih.'])) +
    acBox('4 pantangan keras untuk pemula', acList(['Jangan belanja spekulatif tanpa data PO H-1 (risiko rugi karena busuk).', 'Jangan mencuci sayur daun dengan air sebelum dibungkus daun pisang (memicu busuk berlendir).', 'Jangan memeras jeruk nipis langsung ke ikan mentah sebelum dikirim (dagingnya berubah putih seperti matang). Sertakan jeruk utuh terpisah.', 'Jangan memakai talenan yang sama untuk ikan/ayam dan sayur/buah.']), 'warn') + '</div>';
}

function acM2() {
  return '<div class="set-sec">' + acHead('Modul 02', 'SOP bersih bahan & frozen food', 'Urutan kerja yang sama setiap hari membuat hasil konsisten dan aman.') +
    acBox('Kebersihan dasar sebelum mulai', acList(['Cuci tangan dengan sabun, pakai sarung tangan food-grade dan celemek bersih.', 'Gunakan 3 warna talenan dan pisau: <b>biru</b> untuk ikan, <b>merah</b> untuk ayam, <b>hijau</b> untuk sayur dan buah.', 'Permukaan meja dan peralatan dilap dengan air sabun lalu dibilas sebelum dan sesudah bekerja.', 'Bahan mentah segar disimpan dingin (sekitar 5°C atau lebih rendah) sampai saatnya diproses.'])) +
    acBox('Ikan bersih 4 titik bebas amis', '<ol class="ac-ol"><li><b>Sisik:</b> kerok dari ekor ke kepala sampai tidak ada sisik tersisa di sirip dan pangkal ekor.</li><li><b>Insang:</b> buang seluruh insang, sumber bau amis utama.</li><li><b>Isi perut:</b> keluarkan jeroan dan selaput hitam di rongga perut, bilas air dingin mengalir.</li><li><b>Darah tulang tengah:</b> sikat darah di sepanjang tulang tengah sampai putih bersih.</li></ol><p class="hint">Tiriskan dingin, lalu segera vakum atau masukkan thinwall. Jangan diperas jeruk nipis: sertakan jeruk utuh terpisah.</p>') +
    acBox('Ayam & udang', acList(['<b>Ayam:</b> buang brutu, paru, dan bulu halus. Cuci air dingin, tiriskan sampai kering, lalu potong sesuai pilihan pelanggan.', '<b>Udang:</b> kupas kulit, belah punggung, buang benang hitam. Rendam sebentar di air es agar tetap kenyal, tiriskan.'])) +
    acBox('Sayur: dry-sorting', acList(['Sortir kering: buang daun menguning, batang lembek, dan ulat. <b>Jangan dicuci</b> sebelum dibungkus.', 'Bungkus dengan daun pisang, ikat tali bambu, simpan di bagian atas coolbox (tidak menempel langsung ke es).'])) +
    acBox('Frozen food (ayam ungkep, tenggiri giling, dimsum)', '<ol class="ac-ol"><li>Masak/ungkep sesuai resep standar, lalu dinginkan cepat sampai suhu ruang.</li><li>Porsikan per kemasan dan vakum.</li><li>Beri label tanggal produksi dan nama produk.</li><li>Bekukan di chest freezer sekitar -18°C. Susun datar agar cepat beku, tidak ditumpuk.</li><li>Gunakan pola FIFO: yang diproduksi lebih dulu dikirim lebih dulu.</li></ol><p class="hint">Daya tahan yang Anda cantumkan ke pelanggan (misalnya 60 hari) sebaiknya sudah Anda uji sendiri di freezer Anda.</p>') + '</div>';
}

function acM3() {
  return '<div class="set-sec">' + acHead('Modul 03', 'Packaging & 4 lapis coolbox', 'Tujuannya satu: barang tiba di pintu pelanggan masih dingin dan utuh.') +
    acBox('Susunan 4 lapis di coolbox motor kurir', '<ol class="ac-ol"><li><b>Lapis 1 (dasar):</b> ice gel pack beku, dialasi kardus tipis agar tidak menempel langsung ke barang.</li><li><b>Lapis 2:</b> frozen food vakum (ayam ungkep, udang kupas, tenggiri giling, dimsum).</li><li><b>Lapis 3:</b> pembatas kardus, lalu ikan dan ayam segar dalam vakum atau thinwall bersama absorbent pad.</li><li><b>Lapis 4 (atas):</b> sayur daun pisang, telur, bumbu kupas, jeruk utuh. Tambahkan 1 ice gel pack di tutup, tidak menyentuh sayur.</li></ol>') +
    acBox('Kemasan per jenis produk', acList(['<b>Ikan & ayam segar:</b> vakum atau thinwall, jeruk nipis utuh dalam kantong terpisah.', '<b>Sayur:</b> lipatan daun pisang atau perahu daun pisang dengan tali bambu. Hindari kantong plastik.', '<b>Telur:</b> mika anti-pecah, diletakkan paling atas dan rata.', '<b>MPASI:</b> vakum mini food-grade per porsi 50 gr, label tanggal dan isi.'])) +
    acBox('Cek sebelum kurir berangkat', acList(['Ice gel pack minimal 6 buah sudah beku keras.', 'Stiker pesanan sesuai nama dan nomor pesanan di panel admin.', 'Rute dan sesi sudah dibagi per kecamatan.', 'Coolbox ditutup rapat, dibuka hanya saat serah terima.']), 'warn') + '</div>';
}

function acM4() {
  var ch = acChecks(), S = AD.S || {}, tm = nz(S.finance && S.finance.targetMargin, 26);
  var prods = (AD.data && AD.data.products) || [];
  var h = '<div class="set-sec">' + acHead('Modul 04', 'Kalkulator HPP & harga jual', 'Hitung modal per kemasan termasuk susut, lalu terapkan langsung ke produk. HPP dan margin hanya tersimpan di server dan tidak tampil di toko.') +
    '<div class="two-f"><div class="field"><label for="ac-type">Jenis bahan</label><select id="ac-type" data-a="acPreset">' + AC_PRESET.map(function (p, i) { return '<option value="' + i + '">' + esc(p[0]) + ' (susut ' + p[1] + '%)</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="ac-buy">Harga beli pasar per kg (Rp)</label><input id="ac-buy" type="number" min="0" step="1000" value="44000" data-ac></div></div>' +
    '<div class="two-f"><div class="field"><label for="ac-raw">Berat kotor (gram)</label><input id="ac-raw" type="number" min="1" step="50" value="500" data-ac></div><div class="field"><label for="ac-shr">Susut (%)</label><input id="ac-shr" type="number" min="0" max="90" value="18" data-ac></div><div class="field"><label for="ac-pack">Biaya kemas (Rp)</label><input id="ac-pack" type="number" min="0" step="100" value="2000" data-ac></div><div class="field"><label for="ac-labor">Jasa siang/es (Rp)</label><input id="ac-labor" type="number" min="0" step="100" value="1500" data-ac></div></div>' +
    '<div class="field"><label for="ac-mg">Target margin: <b id="ac-mgl">' + tm + '%</b></label><input id="ac-mg" type="range" min="10" max="60" value="' + tm + '" data-ac></div>' +
    '<div class="stats" style="margin-top:12px"><div class="stat"><b id="ac-net">-</b><span>Berat bersih jadi</span></div><div class="stat"><b id="ac-rawc">-</b><span>Modal bahan baku</span></div><div class="stat"><b id="ac-hpp">-</b><span>Total HPP + kemas</span></div><div class="stat good"><b id="ac-profit">-</b><span>Laba per pack</span></div><div class="stat"><b id="ac-sell">-</b><span>Harga jual saran (bulat Rp 500)</span></div></div>' +
    '<div class="two-f" style="align-items:end"><div class="field"><label for="ac-target">Terapkan ke produk</label><select id="ac-target">' + (prods.length ? prods.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc((p.emoji || '') + ' ' + p.name) + '</option>'; }).join('') : '<option value="">Data produk belum termuat</option>') + '</select></div><div class="field"><button class="btn btn-primary" data-a="acApply">Terapkan harga, HPP & kemas</button></div></div>' +
    '<p class="hint">Rumus: HPP = (harga beli/kg ÷ 1000 × berat kotor) + jasa. Harga jual = (HPP + kemas) ÷ (1 − margin), dibulatkan ke atas per Rp 500. Susut mengurangi berat bersih yang bisa dijual, jadi cantumkan berat bersih pada nama produk.</p></div>';
  h += '<div class="set-sec"><h3>Checklist kesiapan operasional</h3><p class="muted">12 langkah sebelum membuka kloter. Centang tersimpan di browser ini.</p>' + AC_CHECK.map(function (t, i) { return '<label class="ac-ck' + (ch[i] ? ' on' : '') + '"><input type="checkbox" data-a="acCheck" data-i="' + i + '"' + (ch[i] ? ' checked' : '') + '><span>' + (i + 1) + '. ' + esc(t) + '</span></label>'; }).join('') + '</div>';
  return h;
}

function acCalc() {
  var g = function (id) { var e = $(id); return e ? nz(e.value) : 0; };
  if (!$('ac-hpp')) return;
  var raw = g('ac-raw') || 500, shr = Math.min(90, Math.max(0, g('ac-shr'))), pack = g('ac-pack'), labor = g('ac-labor'), buy = g('ac-buy'), mg = Math.min(85, g('ac-mg') || 26);
  var rawCost = buy / 1000 * raw, hpp = rawCost + labor, total = hpp + pack, sell = Math.ceil(total / (1 - mg / 100) / 500) * 500;
  $('ac-mgl').textContent = mg + '%'; $('ac-net').textContent = '± ' + Math.round(raw * (1 - shr / 100)) + ' gram'; $('ac-rawc').textContent = rp(rawCost);
  $('ac-hpp').textContent = rp(total); $('ac-profit').textContent = rp(sell - total); $('ac-sell').textContent = rp(sell);
  AC.last = { price: sell, hpp: Math.round(hpp), kemas: Math.round(pack) };
}
function acPreset(i) {
  var p = AC_PRESET[i]; if (!p) return;
  $('ac-shr').value = p[1]; $('ac-pack').value = p[2]; $('ac-labor').value = p[3]; acCalc();
}
function acApply() {
  var id = $('ac-target') && $('ac-target').value; acCalc();
  if (!id || !AC.last || !AC.last.price) { toast('Pilih produk dan isi harga beli dulu.', true); return; }
  var p = AD.data.products.filter(function (x) { return x.id === id; })[0]; if (!p) return;
  if (!confirm('Ubah "' + p.name + '" menjadi harga jual ' + rp(AC.last.price) + ', HPP ' + rp(AC.last.hpp) + ', kemas ' + rp(AC.last.kemas) + '?')) return;
  aCall('adminPricingSave', { rows: [{ id: id, price: AC.last.price, hpp: AC.last.hpp, kemas: AC.last.kemas }] }).then(function (r) { if (r && r.ok) { toast('Harga dan HPP "' + p.name + '" diperbarui'); loadAdmin(); } else toast((r && r.error) || 'Gagal menyimpan', true); });
}

function acStoreUrl() { return location.origin + location.pathname; }
function acM5() {
  var u = acStoreUrl();
  var wa = 'Halo Bunda/Ayah 👋\nSegarKite buka pre-order besok!\n🐟 Ikan bersih tanpa amis\n🍗 Ayam ungkep & frozen siap masak\n🌿 Sayur segar kemas daun pisang\n\nOrder sebelum pukul 20.00 WIB untuk kloter pagi.\nPesan di sini: ' + u + '\nTanya-tanya: wa.me/628980386681';
  var ig = 'Menu hari ini siap diantar dingin ke rumah ❄️🌿\nIkan sudah disiangi, ayam sudah diungkep, sayur dibungkus daun pisang.\nPre-order sampai 20.00 WIB, link di bio.\n#segarkite #pontianak #sayursegar #frozenfood #masakpraktis #kuburaya';
  return '<div class="set-sec">' + acHead('Modul 05', 'Promosi WA, Instagram & rekap data', 'Pakai pesan siap salin di bawah, lalu ganti isi menu sesuai stok hari itu.') +
    '<h4>Template broadcast WhatsApp</h4><textarea class="ac-copy" id="ac-wa" readonly rows="8">' + esc(wa) + '</textarea><button class="btn btn-ghost btn-sm" data-a="acCopy" data-id="ac-wa">Salin teks</button>' +
    '<h4>Template caption Instagram</h4><textarea class="ac-copy" id="ac-ig" readonly rows="6">' + esc(ig) + '</textarea><button class="btn btn-ghost btn-sm" data-a="acCopy" data-id="ac-ig">Salin teks</button>' +
    acBox('Jadwal posting harian yang disarankan', acList(['<b>15.00 WIB:</b> Instagram Story + broadcast WA (buka PO).', '<b>19.00 WIB:</b> pengingat "tutup 20.00" dengan sisa kuota.', '<b>08.00 WIB:</b> foto proses subuh dan kurir berangkat (membangun kepercayaan).', '<b>Siang:</b> repost testimoni pelanggan, dengan izin mereka.'])) +
    acBox('Rekap pesanan & Google Sheet', acList(['Semua pesanan tersimpan permanen di database. Unduh CSV kapan saja di tab <b>Data & Backup</b>, lalu buka di Google Sheets (File → Import).', 'Sambungan otomatis ke Google Sheet bisa ditambahkan nanti tanpa mengubah data yang sudah ada.'])) + '</div>';
}

function acM6(S) {
  S = AD.S || DEFAULT_S; var lg = logoLg(S);
  return '<div class="set-sec">' + acHead('Modul 06', 'Stiker kemasan & identitas logo', 'Stiker yang konsisten membuat pelanggan mengenali SegarKite sejak paket diterima.') +
    '<div class="ac-logo"><img src="' + esc(lg) + '" alt="Logo SegarKite"><div><a class="btn btn-ghost btn-sm" href="' + esc(lg) + '" download="logo-segarkite.webp">⬇ Unduh logo</a><p class="hint">Ganti logo di tab Promo & Tampilan, lalu unduh versi terbaru dari sini.</p></div></div>' +
    acBox('Isi stiker produk', acList(['Logo SegarKite dan tulisan "Fresh & Frozen Food".', 'Nama produk dan berat bersih.', 'Tanggal kemas dan "habis sebaiknya dikonsumsi".', 'Cara simpan: <b>Chilled</b> (kulkas bawah, sekitar 0–5°C) atau <b>Frozen</b> (freezer -18°C).', 'Kontak: WA 0898-0386-681, IG @segarkite.'])) +
    acBox('Pedoman desain', acList(['Warna utama: hijau <b style="color:#1BA33C">#1BA33C</b> dan kuning <b style="color:#b8860b">#F7D138</b> (sesuai logo).', 'Ukuran umum: 5×3 cm (stiker produk) atau 6×4 cm (stiker segel coolbox).', 'Gunakan bahan sticker waterproof untuk produk frozen agar tidak luntur saat embun.', 'Cetak 1 lembar contoh dulu dan tes di dalam freezer sebelum cetak banyak.'])) + '</div>';
}
function acM7() { return '<div class="set-sec">' + acHead('Modul 07', 'Kelola produk & ganti foto', 'Tambah, ubah, atau nonaktifkan produk, unggah foto, dan atur flash sale per produk.') + '<button class="btn btn-primary" data-a="acGo" data-t="produk">Buka tab Produk</button> <button class="btn btn-ghost" data-a="acGo" data-t="keuangan">Buka tab Keuangan (harga & HPP)</button></div>'; }
function acM8() { return '<div class="set-sec">' + acHead('Modul 08', 'Pengaturan toko & ongkir', 'Atur ongkir per zona, gratis ongkir, sesi kurir, voucher, dan buka/tutup toko.') + '<button class="btn btn-primary" data-a="acGo" data-t="pengaturan">Buka tab Pengaturan</button> <button class="btn btn-ghost" data-a="acGo" data-t="promo">Buka tab Promo & Tampilan</button></div>'; }

function acAction(a, el) {
  switch (a) {
    case 'acMod': AC.mod = el.getAttribute('data-m'); renderAdmin(); return true;
    case 'acGo': AD.tab = el.getAttribute('data-t'); renderAdmin(); return true;
    case 'acPrint': window.print(); return true;
    case 'acApply': acApply(); return true;
    case 'acCopy': { var t = $(el.getAttribute('data-id')); if (!t) return true; t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(function () { toast('Teks disalin'); }, function () { toast(ok ? 'Teks disalin' : 'Salin manual dari kotak teks', !ok); }); else toast(ok ? 'Teks disalin' : 'Salin manual dari kotak teks', !ok); return true; }
  }
  return false;
}
