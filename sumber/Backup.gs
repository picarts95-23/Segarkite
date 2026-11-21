/* SegarKite: penerima cadangan otomatis ke Google Sheet.
   Tempel di Apps Script yang dibuka dari spreadsheet (Ekstensi > Apps Script),
   ganti TOKEN, lalu Terapkan > Deployment baru > Aplikasi web (akses: Siapa saja). */
var TOKEN = 'GANTI_DENGAN_KATA_RAHASIA';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return out({ ok: false, error: 'token salah' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (d.action === 'status') {
      var sh = ss.getSheetByName('Pesanan');
      var f = sh.getRange('A:A').createTextFinder(String(d.id)).matchEntireCell(true).findNext();
      if (f) sh.getRange(f.getRow(), 19).setValue(d.status);
      return out({ ok: true });
    }
    if (d.action === 'replaceAll') {
      var ps = ss.getSheetByName('Produk'), po = ss.getSheetByName('Pesanan'), pa = ss.getSheetByName('Aduan');
      if (d.produk && d.produk.length) {
        var n = d.produk.length;
        ps.getRange(2, 1, Math.max(ps.getMaxRows() - 1, n), 12).clearContent();
        ps.getRange(2, 1, n, 7).setValues(d.produk.map(function (r) { return r.slice(0, 7); }));
        ps.getRange(2, 10, n, 3).setValues(d.produk.map(function (r) { return [r[7], r[8], r[9]]; }));
        var f = [];
        for (var i = 0; i < n; i++) { var x = i + 2; f.push(['=IF(F' + x + '=0;"";D' + x + '-F' + x + '-G' + x + ')', '=IF(H' + x + '="";"";H' + x + '/D' + x + ')']); }
        ps.getRange(2, 8, n, 2).setFormulas(f);
      }
      writeAll(po, d.pesanan || [], 19, [11, 12, 14, 15, 16]);
      writeAll(pa, d.aduan || [], 9, []);
      return out({ ok: true });
    }
    var tab = ss.getSheetByName(d.tab);
    if (!tab) return out({ ok: false, error: 'tab tidak ada' });
    var row = tab.getLastRow() + 1;
    var r = tab.getRange(row, 1, 1, d.row.length);
    r.setNumberFormat('@');
    r.setValues([d.row.map(function (v) { return v === null ? '' : String(v); })]);
    var nums = d.tab === 'Pesanan' ? [11, 12, 14, 15, 16] : [];
    nums.forEach(function (c) { tab.getRange(row, c).setNumberFormat('#,##0').setValue(Number(d.row[c - 1]) || 0); });
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function writeAll(sh, rows, cols, numCols) {
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cols).clearContent();
  if (!rows.length) return;
  var r = sh.getRange(2, 1, rows.length, cols);
  r.setNumberFormat('@');
  r.setValues(rows.map(function (x) { return x.map(function (v) { return v === null ? '' : String(v); }); }));
  numCols.forEach(function (c) {
    var col = sh.getRange(2, c, rows.length, 1);
    col.setNumberFormat('#,##0');
    col.setValues(rows.map(function (x) { return [Number(x[c - 1]) || 0]; }));
  });
}
