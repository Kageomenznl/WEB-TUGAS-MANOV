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

Konfigurasi saat ini memakai Netlify untuk dashboard, Render untuk API, dan
PostgreSQL untuk database produksi. Ikuti [panduan deployment](README-DEPLOY.md)
untuk menyiapkan layanan, variabel lingkungan, dan ESP32.

Jangan commit file `.env`, kunci API, password Wi-Fi, atau database lokal.
