# NgeTarget Saham — Dashboard Kalkulasi & Forecasting Portofolio

Dashboard berbasis **React + TypeScript** untuk memonitor perkembangan investasi pribadi, melakukan kalkulasi/simulasi "angan-angan", memproyeksikan nilai aset di masa depan, dan mendapatkan saran dari **Gemini AI**.

Kolom kalkulasi mengikuti spreadsheet referensi:

| BELI | JUAL | %RUGI | TANGGAL | ASET SAAT INI | MODAL AWAL | L/R | %L/R | TARGET >10% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.455.000 | 2.375.000 | 3,26% | 9 November | 2.072.900 | 2.100.000 | -27.100,00 | -1,29% | Belum Tercapai |

Dokumen: [BRD](docs/BRD.md) · [PRD](docs/PRD.md)

---

## Fitur

- **Kalkulator portofolio** — %Rugi (spread), L/R, %L/R, status target, harga JUAL impas & harga JUAL target, dihitung real-time.
- **Harga pasar otomatis** — saham BEI/IDX (`HRTA.JK`, `BBCA.JK`, `ANTM.JK`, …) dan emas spot per gram (`XAU-IDR`) via [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) — gratis, tanpa API key. Harga tetap bisa diedit manual (mis. harga beli/buyback emas fisik).
- **Simulasi angan-angan** — slider perubahan harga JUAL & tambahan modal, bisa disimpan sebagai catatan simulasi.
- **Tabel monitoring bergaya spreadsheet** — filter Aktual/Simulasi, edit, hapus, export CSV.
- **Forecasting** — proyeksi 3–36 bulan (optimis/moderat/pesimis) dari tren historis atau asumsi return, plus setoran rutin (DCA) & estimasi bulan target tercapai.
- **Insight Gemini AI** — diagnosis posisi, analisis spread, strategi target, saran tindakan. Bila API key kosong/gagal → otomatis memakai analisis rule-based.
- **SQLite lokal** (Prisma) — data tersimpan permanen; baris contoh HRTA di-seed otomatis.

## Arsitektur

```
kalkulasi-saham/
├── shared/     # Engine kalkulasi & forecasting (TypeScript murni, dipakai backend + frontend) + unit test
├── backend/    # Express 5 + Prisma (SQLite) + yahoo-finance2 + @google/genai  → http://localhost:4000
├── frontend/   # React 19 + Vite + Tailwind CSS v4 + Recharts                → http://localhost:5173
└── docs/       # BRD & PRD
```

Frontend memanggil `/api/*` yang di-proxy Vite ke backend, sehingga **`GEMINI_API_KEY` hanya ada di server**.

## Cara Menjalankan

Prasyarat: Node.js ≥ 20 (diuji di Node 24 / npm 12).

```bash
# 1. Install dependency + buat database SQLite
npm run setup

# 2. (Opsional) Isi API key Gemini di backend/.env
#    GEMINI_API_KEY="..."   ← dapatkan gratis di https://aistudio.google.com/apikey

# 3. Jalankan backend + frontend sekaligus
npm run dev
```

Buka **http://localhost:5173**.

> [!NOTE]
> npm 12 memblokir install script secara default. Script yang dibutuhkan (Prisma engines, esbuild, protobufjs) sudah disetujui lewat field `allowScripts` di `package.json` root.

### Konfigurasi `backend/.env`

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `PORT` | `4000` | Port API |
| `DATABASE_URL` | `file:./dev.db` | File SQLite (relatif ke `backend/prisma/`) |
| `GEMINI_API_KEY` | _(kosong)_ | Kosong = insight rule-based |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Ganti bila ingin model lain |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend |

### Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm test` | Unit test engine kalkulasi & forecasting (Vitest) |
| `npm run typecheck` | Cek tipe seluruh workspace |
| `npm run build` | Build produksi frontend |
| `npm run db:studio -w backend` | Buka Prisma Studio untuk melihat isi database |
| `npm run db:seed -w backend` | Tambah ulang baris contoh HRTA |

## REST API

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Status server, database, Gemini |
| GET | `/api/stocks/list` | Daftar kurasi saham IDX + emas spot |
| GET | `/api/stocks/search?q=` | Cari ticker IDX |
| GET | `/api/stocks/quote/:symbol` | Harga BELI (ask) / JUAL (bid) terbaru |
| GET | `/api/stocks/history/:symbol?range=3m` | Harga penutupan harian (`1m`/`3m`/`6m`/`1y`) |
| POST | `/api/portfolio/calculate` | Kalkulasi instan (+ `whatIf` opsional) |
| GET | `/api/portfolio?type=all\|actual\|simulation` | Daftar catatan |
| POST / PUT / DELETE | `/api/portfolio[/:id]` | Simpan / ubah / hapus catatan |
| GET | `/api/portfolio/export.csv` | Export CSV |
| POST | `/api/portfolio/forecast` | Proyeksi nilai aset |
| POST | `/api/ai/insight` | Insight Gemini AI (cache per catatan) |

## Catatan Sumber Data

- **Yahoo Finance (`yahoo-finance2`)** — sumber utama, gratis. Saham IDX memakai suffix `.JK`. Bid/ask hanya tersedia saat jam bursa; di luar jam bursa BELI = JUAL = harga terakhir. Harga terakhir disimpan di SQLite sebagai cadangan bila API gagal.
- **Emas fisik HRTA/Antam** tidak punya API publik resmi, jadi isi harga beli & buyback secara manual (seperti di spreadsheet). Untuk forecasting, tren emas memakai `XAU-IDR` (emas spot dunia × kurs USD/IDR ÷ 31,1035 g).
- Alternatif bila butuh data IDX yang lebih lengkap: GoAPI.io (IDX lokal, free tier), Twelve Data, Finnhub.

## Rencana Pengembangan Berikutnya

1. Riwayat nilai aset per tanggal (grafik L/R historis dari catatan yang tersimpan).
2. Watchlist dengan auto-refresh harga & notifikasi ketika target tercapai.
3. Scraper harga buyback emas lokal (opsional) agar kolom BELI/JUAL emas fisik terisi otomatis.
4. Multi-posisi per aset (average price) & perhitungan fee broker/pajak.
5. Model forecasting lanjutan (Monte Carlo / ARIMA) dan backtest akurasi.

> Semua analisis bersifat edukatif dan **bukan rekomendasi investasi**.

