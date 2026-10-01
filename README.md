# WEB-TUGAS-MANOV

Dashboard pemantauan konsumsi listrik kamar dengan API Flask dan pembacaan
sensor ESP32. Dashboard mengambil data dari API dan memperbaruinya setiap tiga
detik. Konsumsi dan estimasi tagihan direset otomatis setiap tanggal 1
berdasarkan waktu Jakarta; pembacaan daya dan status sensor tidak dihapus.
Grafik daya menampilkan tren realtime selama dashboard terbuka (hingga satu
menit riwayat pada tab tersebut); data grafik tidak disimpan lintas sesi.

## Menjalankan secara lokal

1. Gunakan Python 3.10 atau yang lebih baru.
2. Pasang dependensi:

   ```powershell
   pip install -r requirements.txt
   ```

3. Salin `.env.example` menjadi `.env`, lalu atur kata sandi login, rahasia
   Flask, dan sandi admin lokal. Untuk menerima pembacaan sensor, atur juga
   `SENSOR_API_KEY`.
4. Jalankan backend:

   ```powershell
   python manov1.py
   ```

5. Buka <http://localhost:5000>.

Secara lokal aplikasi menggunakan SQLite. Kirim pembacaan sensor dalam JSON ke
`http://localhost:5000/api/sensor/reading` dengan header `X-Sensor-Key`.

## Deploy

Proyek dapat dijalankan sebagai satu aplikasi Flask di Vercel dengan database
PostgreSQL eksternal, atau memakai susunan Netlify + Render. Untuk Vercel,
hubungkan root repositori ini dan atur variabel lingkungan produksi:

- `ENVIRONMENT=production`
- `DATABASE_URL` — connection string PostgreSQL persisten, misalnya dari Neon.
- `FLASK_SECRET_KEY` — rahasia acak untuk menandatangani sesi login.
- `SITE_LOGIN_PASSWORD` — kata sandi untuk masuk ke dashboard.
- `SENSOR_API_KEY` — kunci acak untuk ESP32.
- `ADMIN_API_KEY` — kunci acak untuk pengaturan admin.

Kata sandi login dan sandi admin harus diatur langsung sebagai environment
variables di Vercel, bukan disimpan di source code atau GitHub. Login berlaku
selama delapan jam; perubahan nama dan tarif meminta sandi admin setiap kali.

Jangan gunakan SQLite untuk deployment serverless: filesystem Function tidak
menyimpan perubahan secara permanen. Backend menginisialisasi database saat
permintaan API pertama, jadi halaman utama tetap dapat dibuka jika variabel
database belum disetel; endpoint API akan membalas `503` dengan pesan
konfigurasi yang perlu diperbaiki. Buka `/api/health` pada domain setelah
deployment untuk memverifikasi koneksi database.

Ikuti [panduan deployment](README-DEPLOY.md) untuk langkah lebih lengkap.

Jangan commit file `.env`, kunci API, password Wi-Fi, atau database lokal.
