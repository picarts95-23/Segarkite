"""Sumber data tunggal untuk pengaturan awal dan produk contoh.
Dijalankan oleh build.py; hasilnya dipakai oleh Code.gs dan index.html."""
import json

OPEX = [
    ["Asisten dapur pagi (05.30-09.00)", 1040000],
    ["Gaji pokok kurir standby (2 sesi)", 1300000],
    ["BBM belanja subuh pasar", 390000],
    ["Listrik freezer, air PDAM, es batu", 350000],
    ["Iklan IG/FB lokal dan kuota", 400000],
    ["Cadangan garansi kesegaran (waste)", 320000],
]

DEFAULTS = {
    "storeName": "SegarKite",
    "tagline": "Fresh & Frozen Food",
    "logoUrl": "",
    "announceBadge": "PO H-1 & Sore",
    "announceText": "Pesan sebelum 20.00 WIB untuk kurir serentak pagi. Gratis ongkir min. belanja Rp 100.000 se-Pontianak dan Serdam.",
    "heroSlides": [
        {"badge": "Pasar subuh digital Pontianak", "title": "Ikan sudah disiangi dan sayur kemas daun pisang.",
         "desc": "Tak perlu bangun subuh ke pasar atau bau amis di wastafel. Semua produk tiba bersih, siap bumbui, dan diantar dingin dengan coolbox.",
         "cta": "Belanja sekarang", "emoji": "🐟"},
        {"badge": "Kurir serentak 2 sesi (pagi dan sore)", "title": "Ongkir flat Rp 8.000, gratis ongkir min. Rp 100rb.",
         "desc": "Pilih kloter pagi (08.00 WIB) untuk masak makan siang, atau kloter sore (15.30 WIB) untuk pekerja kantor yang baru pulang.",
         "cta": "Lihat cara terima", "emoji": "🛵"},
        {"badge": "Lini Frozen Food tahan 60 hari", "title": "Stok kulkas siap goreng: ayam ungkep, tenggiri giling, udang kupas.",
         "desc": "Dimasak tanpa pengawet, dikemas vakum, dan dibekukan -18°C. Tinggal goreng 5 menit, cocok untuk bekal dan hari sibuk.",
         "cta": "Lihat frozen food", "emoji": "❄️"},
        {"badge": "Paket bundling \"Masak apa hari ini?\"", "title": "Paket asam pedas kakap nanas khas Pontianak.",
         "desc": "Ikan kakap bersih, nanas manis, daun kesum, dan bumbu rempah segar. Tinggal masukkan ke kuali.",
         "cta": "Pesan paket masak", "emoji": "🍲"},
    ],
    "keywords": "Kakap, Asam Pedas, Pakis, Udang, Ayam, Hidroponik",
    "categories": [
        {"name": "Frozen Food", "emoji": "❄️"}, {"name": "Paket Masak", "emoji": "🍲"}, {"name": "Ikan & Seafood", "emoji": "🐟"},
        {"name": "Ayam & Telur", "emoji": "🍗"}, {"name": "Sayur Daun Pisang", "emoji": "🌿"},
        {"name": "Hidroponik", "emoji": "🥬"}, {"name": "Bumbu & Rempah", "emoji": "🌶️"},
        {"name": "MPASI Bayi", "emoji": "👶"},
    ],
    "flashTitle": "FLASH SALE SUBUH",
    "flashNote": "Kuota harian terbatas dari Pasar Flamboyan dan Kebun Rasau Jaya.",
    "about": "SegarKite melayani Pontianak dan Kubu Raya. Bahan dipilih setiap subuh dari pemasok lokal, dibersihkan di dapur kami, lalu diantar dalam boks pendingin oleh kurir serentak dua sesi.",
    "values": [
        {"icon": "🐟", "title": "Siap masak tanpa amis", "text": "Ikan dan ayam sudah dibuang sisik, insang, dan isi perut, dicuci air es mengalir dan jeruk sambal."},
        {"icon": "🌿", "title": "Kemas daun pisang lestari", "text": "Sayuran disortir Grade A dan dibungkus daun pisang agar awet segar di kulkas."},
        {"icon": "🛵", "title": "Kurir serentak coolbox", "text": "Antar terjadwal pagi dan sore dengan boks pendingin berinsulasi."},
        {"icon": "🛡️", "title": "Garansi segar 100%", "text": "Sayur layu atau ikan kurang segar? Kirim foto lewat WhatsApp, kami ganti baru di kloter berikutnya."},
    ],
    "whatsapp": "08980386681",
    "email": "Segarkite@gmail.com",
    "instagram": "https://www.instagram.com/segarkite",
    "facebook": "", "tiktok": "", "youtube": "", "marketplace": "",
    "address": "Pontianak, Kalimantan Barat",
    "hours": "Setiap hari 06.00 - 20.00 WIB",
    "mapsEmbed": "", "mapsLink": "",
    "storeOpen": True,
    "closedMessage": "Toko sedang tutup. Pesanan dibuka kembali besok pagi.",
    "complaintEnabled": True,
    "delivery": {
        "pickup": {"enabled": True, "label": "Ambil sendiri", "address": "Dapur SegarKite, Pontianak", "mapsLink": "",
                   "hours": "06.00 - 20.00 WIB", "note": "Tunjukkan nomor pesanan saat mengambil."},
        "courier": {"enabled": True, "label": "Kurir online",
                    "note": "Ongkir sesuai tarif aplikasi dan dibayar langsung ke kurir. Admin memesankan kurir setelah pembayaran.",
                    "options": [{"name": "Gojek", "fee": 0}, {"name": "Grab", "fee": 0}, {"name": "Maxim", "fee": 0}]},
        "scheduled": {
            "enabled": True, "label": "Kurir toko (jadwal tetap)",
            "note": "Diantar serentak oleh kurir kami pada sesi yang dipilih, dalam boks pendingin.",
            "freeFrom": 100000, "daysAhead": 3,
            "zones": [
                {"name": "Rute A - Pontianak Kota (Gajah Mada, Sungai Jawi)", "fee": 8000},
                {"name": "Rute A - Pontianak Barat (Jeruju, Pal Lima)", "fee": 8000},
                {"name": "Rute B - Pontianak Tenggara (Paris 2, Purnama, Untan)", "fee": 8000},
                {"name": "Rute B - Pontianak Selatan (Ahmad Yani, Benua Melayu)", "fee": 8000},
                {"name": "Rute B - Kubu Raya (Sungai Raya Dalam, Serdam)", "fee": 8000},
                {"name": "Rute C - Pontianak Timur dan Utara (Saigon, Siantan)", "fee": 10000},
            ],
            "slots": [
                {"name": "Kloter pagi", "time": "08.00 - 10.00 WIB", "daysBefore": 1, "cutoffHour": 20, "capacity": 30},
                {"name": "Kloter sore", "time": "15.30 - 17.30 WIB", "daysBefore": 0, "cutoffHour": 12, "capacity": 30},
            ],
        },
    },
    "payment": {"methods": [
        {"name": "QRIS SegarKite", "detail": "Kode QRIS dikirim lewat WhatsApp setelah pesanan dibuat. Bebas biaya admin."},
        {"name": "COD (bayar tunai)", "detail": "Bayar tunai saat barang diterima atau diambil."},
        {"name": "Transfer bank", "detail": "Nomor rekening dikirim lewat WhatsApp setelah pesanan dibuat."},
    ]},
    "vouchers": [
        {"code": "GRATISONGKIRPNK", "label": "Gratis ongkir kurir serentak", "type": "ongkir", "value": 0, "min": 0,
         "newOnly": False, "maxUses": 0, "active": True, "desc": "Berlaku untuk kurir toko di semua rute Pontianak dan Serdam."},
        {"code": "SEGARKITEBARU", "label": "Promo pelanggan baru", "type": "potongan", "value": 10000, "min": 85000,
         "newOnly": True, "maxUses": 0, "active": True, "desc": "Diskon Rp 10.000 untuk pesanan pertama."},
        {"code": "HEMAT15", "label": "Belanja mingguan kulkas rapi", "type": "potongan", "value": 15000, "min": 150000,
         "newOnly": False, "maxUses": 0, "active": True, "desc": "Diskon Rp 15.000 untuk belanja besar."},
    ],
    "tebus": {"enabled": True, "min": 75000, "items": [
        {"id": "TM-01", "name": "Telur ayam bersih (6 butir)", "price": 9500, "normalPrice": 15500, "emoji": "🥚", "hpp": 0},
        {"id": "TM-02", "name": "Tempe daun + jeruk sambal 250gr", "price": 4500, "normalPrice": 10000, "emoji": "🍋", "hpp": 0},
    ]},
    "finance": {
        "courierCost": 5500, "workDays": 26, "targetMargin": 25,
        "opex": [{"name": n, "amount": a} for n, a in OPEX],
    },
}

PROD = []
def prod(id, name, cat, price, old, hpp, kemas, emoji, badge, desc, prep, packs, stock=None, flash=None):
    PROD.append(dict(id=id, name=name, cat=cat, price=price, oldPrice=old, hpp=hpp, kemas=kemas, emoji=emoji,
                     badge=badge, desc=desc, prep="\n".join(prep), packs="\n".join(packs), stock=stock, flash=flash))

TW = "Kotak thinwall reusable +2000"
prod("P01", "Ikan Kakap Merah Segar Flamboyan (500gr)", "Ikan & Seafood", 54000, 0, 35500, 2000, "🐟", "Siap masak tanpa amis",
     "Kakap merah segar tangkapan nelayan Kalbar. Sudah dikerok sisik, dibuang insang dan perut, dicuci air es mengalir dan jeruk sambal.",
     ["Potong 3 + buang sisik/insang + jeruk sambal", "Fillet tanpa tulang (cocok MPASI/crispy)", "Belah punggung siap bakar"],
     ["Vacuum pack kedap udara (standar)", TW], 4, dict(price=46000, hours=12, quota=20))
prod("P02", "Paket Masak Asam Pedas Kakap Nanas Khas Pontianak", "Paket Masak", 72000, 0, 45000, 1500, "🍲", "Menu #1 Pontianak",
     "Paket lengkap favorit keluarga: 500gr ikan kakap bersih, nanas manis potong, daun kesum, dan bumbu asam pedas segar siap cemplung.",
     ["Potongan sedang + bumbu asam pedas lengkap", "Potongan kepala dan badan + ekstra daun kesum"],
     ["Daun pisang + vacuum ikan", TW], 3, dict(price=62000, hours=12, quota=15))
prod("P03", "Udang Vaname Kupas Bersih Belah Punggung (250gr)", "Ikan & Seafood", 39000, 0, 24000, 2000, "🦐", "Bebas kotoran punggung",
     "Udang manis segar yang sudah dikupas kulitnya dan dibersihkan urat hitam di punggungnya. Praktis untuk tumis sayur atau goreng tepung.",
     ["Kupas kulit + buang kotoran punggung (sisa ekor)", "Kupas habis tanpa ekor (siap cincang MPASI)"],
     ["Thinwall food-grade rapi", "Vacuum pack kedap udara"], 6, dict(price=33000, hours=12, quota=25))
prod("P04", "Ayam Potong Segar Bersih 1 Ekor Utuh (~1,1 Kg)", "Ayam & Telur", 55000, 0, 38500, 2000, "🍗", "Potong subuh higienis",
     "Ayam potong baru setiap subuh, sudah dibersihkan dari bulu halus, lemak berlebih, dan sisa darah. Langsung siap ungkep.",
     ["Potong 12 (ukuran goreng/gulai)", "Potong 10 (ukuran ayam bakar)", "Potong 16 kecil (ukuran sop/semur)", "Pisahkan dada fillet dan tulang sop"],
     ["Vacuum pack kedap udara", TW], 5, dict(price=48000, hours=12, quota=30))
prod("P05", "Sayur Pakis Segar dan Cangkuk Manis (Paket 2 Ikat)", "Sayur Daun Pisang", 12000, 15000, 7000, 500, "🌿", "Kemas daun pisang",
     "Sayur khas Kalimantan Barat (pakis hutan dan cangkuk manis/katuk) pilihan. Dikemas daun pisang agar tidak berlendir di kulkas.",
     ["Pucuk muda utuh sortir", "Sudah dipetik daun dan potong siap tumis"], ["Lipatan daun pisang lestari (gratis)"])
prod("P06", "Ikan Tenggiri Steak Tebal Segar (500gr)", "Ikan & Seafood", 58000, 64000, 0, 0, "🥩", "Kualitas super grade A",
     "Ikan tenggiri segar kualitas premium dari pelelangan subuh. Cocok untuk goreng bawang putih, kuah kuning, atau MPASI.",
     ["Potong steak tebal 4 potong", "Giling halus murni (siap pempek/bakso ikan)"], ["Vacuum pack kedap udara"])
prod("P07", "Ikan Kembung Banjar Segar Bersih (500gr, 4-5 Ekor)", "Ikan & Seafood", 32000, 36000, 22000, 2000, "🐟", "Sudah kerat badan",
     "Ikan kembung mata bening segar, sudah dibuang isi perut dan insang sampai bersih tanpa bau amis.",
     ["Buang insang dan perut + kerat badan + jeruk nipis", "Potong dua siap masak pindang"], ["Vacuum pack kedap udara", "Thinwall food-grade"])
prod("P08", "Sawi Pakcoy dan Selada Hidroponik Rasau Jaya (250gr)", "Hidroponik", 14000, 17000, 0, 0, "🥬", "Bebas pestisida",
     "Dipanen langsung dari kebun mitra hidroponik lokal Pontianak dan Kubu Raya. Daun renyah, manis alami, dan bebas ulat.",
     ["Akar potong bersih siap simpan", "Cuci bersih siap salad/tumis"], ["Lipatan daun pisang lestari (gratis)"])
prod("P09", "Tomat Merah dan Terong Ungu Mulus (Perahu Daun Pisang 500gr)", "Sayur Daun Pisang", 11000, 14000, 7000, 600, "🍅", "Kemas daun ikonik",
     "Dikemas cantik di atas perahu daun pisang, inspirasi kampanye bebas kantong plastik Pontianak.",
     ["Sortir matang merata grade A", "Campur setengah matang (tahan 2 minggu)"], ["Perahu daun pisang dan tali bambu (gratis)"])
prod("P10", "Telur Ayam Negeri Terseleksi (10 Butir Mika Bersih)", "Ayam & Telur", 24500, 27000, 20000, 500, "🥚", "Cangkang dilap bersih",
     "Telur baru dari peternak lokal, setiap butir sudah dilap bersih dari kotoran sehingga higienis langsung masuk kulkas.",
     ["Ukuran besar seragam + lap sanitasi kering"], ["Mika pengaman anti-pecah + alas daun"])
prod("P11", "Paket Sayur Sop Ayam Kampung Segar (Porsi Keluarga)", "Paket Masak", 54000, 60000, 0, 0, "🥕", "Praktis tinggal rebus",
     "Berisi ayam kampung muda potong bersih, wortel, kentang kupas, buncis, daun bawang seledri, dan bumbu rempah sop.",
     ["Ayam kampung potong kecil + sayur kupas potong", "Sayur utuh kupas + bumbu sop lengkap"], ["Daun pisang + vacuum ayam kampung"])
prod("P12", "Paket Bumbu Dapur Kupas Bersih (Bawang Merah, Putih, Cabai)", "Bumbu & Rempah", 26000, 30000, 0, 0, "🌶️", "Sudah kupas kulit",
     "Bawang merah, bawang putih, cabai rawit, dan cabai keriting yang sudah dikupas kulit dan tangkainya. Hemat waktu 30 menit di dapur.",
     ["Kupas kulit bersih siap blender/iris", "Utuh kering sortir super"], ["Thinwall sekat 4 rapi (tahan 2 minggu)"])
prod("P13", "Paket Protein MPASI Bayi Lengkap (Salmon, Tenggiri, Hati Ayam)", "MPASI Bayi", 68000, 75000, 0, 0, "👶", "Takaran per porsi masak",
     "Dirancang untuk Bunda pejuang MPASI. Sudah ditakar per sekali masak (50gr) sehingga tidak perlu mencairkan seluruh stok.",
     ["Kemas per 50gr (6 pack kecil siap kukus)", "Cincang halus + wortel dan tomat organik"], ["Vacuum pack mini food-grade khusus MPASI"])
prod("P14", "Ikan Bawal Putih Segar Bersih (500gr, 2 Ekor)", "Ikan & Seafood", 49000, 54000, 0, 0, "🐠", "Cocok tim bawang putih",
     "Ikan bawal putih berdaging lembut dan manis. Lezat dimasak tim kecap jahe.",
     ["Utuh bersih insang/perut + kerat badan (siap tim)", "Potong dua siap goreng kering"], ["Vacuum pack kedap udara"])
prod("P15", "Kangkung Cabut dan Bayam Hijau Segar (Paket 3 Ikat)", "Sayur Daun Pisang", 10500, 13500, 0, 0, "🌱", "Bebas tanah dan rumput",
     "Kangkung dan bayam pagi yang sudah dipotong akarnya sehingga tidak mengotori meja dapur dan kulkas.",
     ["Akar potong bersih + sortir daun kuning", "Sudah dipetik siap rebus/tumis +2000"], ["Lipatan daun pisang lestari (gratis)"])
prod("P16", "Tahu Cina Lembut dan Tempe Bungkus Daun (Paket Combi)", "Bumbu & Rempah", 14000, 16000, 0, 0, "🧈", "Produksi subuh lokal",
     "Perpaduan tahu sutra lembut khas Pontianak dan tempe kedelai murni bungkus daun pisang.",
     ["Utuh segar air bersih", "Potong kotak siap goreng"], ["Daun pisang + thinwall tahu air bersih"])

prod("P17", "Ayam Ungkep Bumbu Kuning Lengkuas (Frozen Vacuum 1 Ekor)", "Frozen Food", 58000, 68000, 40000, 2500, "🍗", "❄️ Frozen tahan 60 hari",
     "Andalan lini frozen SegarKite. Ayam segar diungkep bumbu kuning rempah alami tanpa pengawet, tinggal goreng 5 menit.",
     ["Potong 8 ungkep bumbu rempah + sambal korek", "Potong 12 kecil siap goreng / airfryer"], ["Vacuum pack embossed frozen (-18°C)"], 5, dict(price=52000, hours=12, quota=25))
prod("P18", "Ikan Tenggiri Giling Murni 100% (Frozen 500gr)", "Frozen Food", 64000, 72000, 46000, 2000, "🥟", "❄️ Siap pempek / tekwan",
     "Daging tenggiri segar kualitas super yang digiling dingin higienis tanpa campuran. Kenyal untuk pempek, tekwan, siomay, dan otak-otak.",
     ["Giling halus murni daging tenggiri putih", "Bagi 2 pack @250gr praktis"], ["Vacuum pack pipih cepat cair"], 12)
prod("P19", "Dimsum Ayam Udang Tanpa MSG (Frozen Pack Isi 12 Pcs)", "Frozen Food", 38000, 45000, 26000, 2000, "🍱", "❄️ Frozen bekal anak",
     "Dibuat dari dada ayam segar dan udang vaname kupas. Padat daging, cocok untuk sarapan dan bekal sekolah.",
     ["Lengkap saus mentai dan chili oil terpisah"], ["Thinwall food-grade segel"], 18)
prod("P20", "Udang Vaname Kupas Frozen IQF (250gr)", "Frozen Food", 36000, 39000, 24000, 2000, "🦐", "❄️ Stok kulkas",
     "Udang manis kupas bersih, buang benang hitam, dibekukan cepat (IQF) sehingga tahan lama dan tidak lengket.",
     ["Kupas kulit + buang kotoran punggung (sisa ekor)", "Kupas habis tanpa ekor (siap cincang MPASI)"], ["Vacuum pack frozen tahan lama"], 15)

if __name__ == "__main__":
    import sys
    out = sys.argv[1]
    json.dump(DEFAULTS, open(out + "/defaults.json", "w"), ensure_ascii=False, indent=1)
    json.dump(PROD, open(out + "/seed_products.json", "w"), ensure_ascii=False, indent=1)
    print(len(PROD), "produk")
