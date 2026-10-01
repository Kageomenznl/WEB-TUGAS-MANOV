# WEB-TUGAS-MANOV

Dashboard pemantauan konsumsi listrik kamar dengan API Flask dan pembacaan
sensor ESP32. Dashboard mengambil data dari API dan memperbaruinya setiap tiga
detik.

## Menjalankan secara lokal

1. Gunakan Python 3.10 atau yang lebih baru.
2. Pasang dependensi:

   ```powershell
   pip install -r requirements.txt
   ```

3. Jalankan backend:

   ```powershell
   python manov1.py
   ```

4. Buka <http://localhost:5000>.

Secara lokal aplikasi menggunakan SQLite. Untuk menerima pembacaan sensor,
atur `SENSOR_API_KEY` di file `.env` dan kirim JSON ke
`http://localhost:5000/api/sensor/reading` dengan header `X-Sensor-Key`.

## Deploy

Proyek dapat dijalankan sebagai satu aplikasi Flask di Vercel dengan database
PostgreSQL eksternal, atau memakai susunan Netlify + Render. Untuk Vercel,
hubungkan root repositori ini dan atur variabel lingkungan produksi:

- `ENVIRONMENT=production`
- `DATABASE_URL` — connection string PostgreSQL persisten, misalnya dari Neon.
- `SENSOR_API_KEY` — kunci acak untuk ESP32.
- `ADMIN_API_KEY` — kunci acak untuk pengaturan admin.

Jangan gunakan SQLite untuk deployment serverless: filesystem Function tidak
menyimpan perubahan secara permanen. Backend menginisialisasi database saat
permintaan API pertama, jadi halaman utama tetap dapat dibuka jika variabel
database belum disetel; endpoint API akan membalas `503` dengan pesan
konfigurasi yang perlu diperbaiki. Buka `/api/health` pada domain setelah
deployment untuk memverifikasi koneksi database.

Ikuti [panduan deployment](README-DEPLOY.md) untuk langkah lebih lengkap.

Jangan commit file `.env`, kunci API, password Wi-Fi, atau database lokal.
