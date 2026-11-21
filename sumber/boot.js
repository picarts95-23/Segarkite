/* ===== Mulai aplikasi ===== */
function route() {
  var admin = location.hash === '#admin';
  document.body.classList.toggle('in-admin', admin);
  $('view-store').hidden = admin; $('view-admin').hidden = !admin;
  closeModal(); document.body.classList.remove('cart-open');
  if (admin) { if (AD.token && !AD.data) loadAdmin(); else renderAdmin(); window.scrollTo(0, 0); }
  else if (!St.loaded) { St.loaded = true; loadStore(); }
}
(function () {
  var bar = $('demo-bar');
  if (API.demo) { bar.hidden = false; bar.textContent = 'Mode demo: pesanan dan pengaturan hanya tersimpan di browser ini. Panel admin: tambahkan #admin di alamat, PIN 1234.'; }
  bindStore(); bindAdmin();
  window.addEventListener('hashchange', route);
  route();
})();
