# Kode sumber SegarKite

Folder ini berisi potongan kode asli yang dirakit menjadi `index.html`.

Cara merakit ulang (butuh Python 3):

    cd sumber
    SK_API_URL="https://akjramwlgwlaubzdrqxz.supabase.co/functions/v1/api" python3 build.py

Hasilnya ada di folder `../dist/` (salin `dist/index.html` ke root repo).

- `core.js`, `store.js`, `admin.js`, `academy.js`, `boot.js`, `style.css`: aplikasi
- `gen_data.py`: pengaturan awal dan produk contoh
- `edge.template.ts`: fungsi server Supabase (Edge Function `api`)
- `schema.sql`: tabel database Supabase
