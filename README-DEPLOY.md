# Deploy WEB-TUGAS-MANOV

## Gambaran sistem

- Vercel dapat menjalankan dashboard dan API Flask dalam satu deployment.
- PostgreSQL eksternal menyimpan nama penghuni, pembacaan sensor, konsumsi, dan tarif.
- ESP32 mengirim data pembacaan ke API melalui HTTPS.
- Sensor dan admin memakai kunci akses yang berbeda. Jangan commit kunci ke Git.

## Deploy aplikasi penuh ke Vercel

1. Buat database PostgreSQL persisten, misalnya project di Neon, lalu salin
   connection string PostgreSQL ber-SSL.
2. Di Vercel, impor repositori `Kageomenznl/WEB-TUGAS-MANOV`. Gunakan root
   repositori sebagai **Root Directory**; jangan pilih folder `frontend`,
   karena backend Flask dan dependensinya ada di root.
3. Biarkan Vercel mendeteksi framework Flask secara otomatis. `vercel.json`
   menyertakan file frontend yang dibaca Flask saat melayani dashboard.
4. Di **Project Settings → Environment Variables**, tambahkan:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = connection string PostgreSQL dari langkah pertama.
   - `FLASK_SECRET_KEY` = rahasia acak panjang untuk sesi login. Buat dengan
     `python -c "import secrets; print(secrets.token_hex(32))"` di komputer
     sendiri dan simpan langsung di Vercel; jangan masukkan ke Git.
   - `SITE_LOGIN_PASSWORD` = kata sandi untuk membuka dashboard.
   - `SENSOR_API_KEY` = kunci acak yang kuat untuk ESP32.
   - `ADMIN_API_KEY` = sandi admin, berbeda dari kata sandi login.
5. Jangan isi `DATABASE_URL` dengan alamat file SQLite. Vercel menjalankan
   Function serverless; file database lokal tidak persisten. Tanpa
   `DATABASE_URL`, halaman utama tetap bisa dibuka, tetapi API akan membalas
   `503` sampai koneksi PostgreSQL dikonfigurasi.
6. Pilih environment **Production** (tambahkan **Preview** bila diperlukan),
   simpan variabel, lalu lakukan **Redeploy**. Push berikutnya ke `main` akan
   otomatis membuat deployment Production.
7. Verifikasi `https://<domain-vercel>/api/health` membalas
   `{"status":"ok"}`. Jika belum, buka deployment **Functions → Logs** untuk
   melihat error koneksi PostgreSQL atau environment yang belum diatur.
8. Dashboard dan API menggunakan domain yang sama, jadi CORS tidak diperlukan.
   Set `ALLOWED_ORIGINS` hanya jika dashboard nantinya di-host pada domain
   terpisah.
9. Dashboard meminta login terlebih dahulu. Sesi login berlaku delapan jam.
   Setiap kali menyimpan nama penghuni atau tarif, masukkan sandi admin lagi.
10. Konsumsi dan estimasi tagihan direset otomatis saat periode bulan kalender
    berganti, mengikuti waktu Jakarta. Reset diproses oleh permintaan dashboard
    atau pembacaan sensor pertama di bulan baru; tidak perlu menambahkan cron job.

Setelah deploy, ESP32 mengirim data ke
`https://<domain-vercel>/api/sensor/reading`. Tetap gunakan header
`X-Sensor-Key` dan `ADMIN_API_KEY` yang telah disetel di Vercel; jangan
menaruh keduanya di source code.

## Opsi: dashboard Netlify dan API Render

Opsi ini memerlukan cookie login same-site dan penyesuaian domain/CORS. Untuk
setup yang mudah dan sudah didukung tanpa konfigurasi tambahan, deploy aplikasi
penuh di Vercel seperti langkah di atas; domain frontend dan API akan sama.
Jika memakai Netlify + Render, gunakan domain kustom HTTPS di bawah domain
induk yang sama untuk dashboard dan API, lalu isi `ALLOWED_ORIGINS` dengan
origin dashboard yang tepat. Domain bawaan `netlify.app` dan `onrender.com`
berbeda site, sehingga cookie login dapat diblokir oleh browser.

Jika memilih hosting terpisah, siapkan database PostgreSQL terlebih dahulu.

1. Buat project PostgreSQL di Neon.
2. Salin connection string PostgreSQL dengan SSL, biasanya diawali
   `postgresql://` atau `postgres://`.
3. Simpan URL ini untuk konfigurasi Render. URL tersebut berisi password;
   jangan masukkan ke source code atau repositori.

### Deploy API ke Render

1. Jadikan isi folder proyek ini sebagai root repositori GitHub. Di Netlify,
   pilih subdomain site yang ingin dipakai, misalnya
   `https://monitor-energi-kost.netlify.app`.
2. Di Render, pilih **New + → Blueprint** dan hubungkan repositori.
3. Masukkan connection string Neon saat Render meminta `DATABASE_URL`, origin
   Netlify pilihanmu saat meminta `ALLOWED_ORIGINS`, dan kata sandi login saat
   meminta `SITE_LOGIN_PASSWORD`.
4. `render.yaml` membuat `FLASK_SECRET_KEY` dan `SENSOR_API_KEY` secara acak.
   Atur `ADMIN_API_KEY` di Render ke sandi admin yang dipilih, lalu simpan
   seluruh nilai sebagai environment variables rahasia.
5. Pastikan `https://<nama-service>.onrender.com/api/health` membalas
   `{"status":"ok"}`.

### Deploy dashboard ke Netlify

1. Buat site Netlify dari repositori yang sama dan tetapkan nama site seperti
   origin yang diizinkan di Render. `netlify.toml` mengatur build dan publish.
2. Di **Site configuration → Environment variables**, tambahkan
   `API_BASE_URL=https://<nama-service>.onrender.com` (origin API saja, tanpa
   path `/api`).
3. Deploy site. Build akan menulis URL backend ke `frontend/assets/config.js`.
4. Jika URL site berbeda dari `ALLOWED_ORIGINS`, ubah nilai itu di Render dan
   deploy ulang service backend.
5. Dashboard memperbarui data setiap tiga detik. Untuk pemantauan kontinu tanpa
   jeda, gunakan tier hosting backend yang selalu aktif; service gratis bisa
   tidur saat lama tidak aktif.
6. Dashboard memerlukan login. Untuk mengubah penghuni atau tarif, masukkan
   kembali sandi admin setiap kali menyimpan perubahan.

## Sambungkan ESP32

- URL tujuan:
  - Vercel: `https://<domain-vercel>/api/sensor/reading`
  - Render: `https://<nama-service>.onrender.com/api/sensor/reading`
- Kirim HTTP POST JSON setiap 3–5 detik:

  ```json
  {
    "nomor": "01",
    "voltage_v": 220.0,
    "current_a": 0.5,
    "power_factor": 0.95
  }
  ```

- Header request:
  - `Content-Type: application/json`
  - `X-Sensor-Key: <SENSOR_API_KEY>` dari layanan backend.
- `nomor` harus berupa string `"01"` sampai `"05"`. `power_factor` opsional,
  default `1.0`.
- Atur SSID, password Wi-Fi, alamat API, nomor kamar, pemetaan pin, faktor
  kalibrasi sensor, dan variabel tegangan/arus pada sketch ESP32.
- Library Arduino ESP32: `WiFi.h`, `HTTPClient.h`, dan `WiFiClientSecure.h`.
  Gunakan sertifikat CA untuk TLS; jangan matikan verifikasi sertifikat untuk
  koneksi internet.

Pola pengiriman setelah variabel `voltage`, `current`, dan `powerFactor`
didapatkan dari sensor:

```cpp
WiFiClientSecure client;
client.setCACert(rootCaCertificate);
HTTPClient http;
http.begin(client, "https://<domain-api>/api/sensor/reading");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Sensor-Key", "<SENSOR_API_KEY>");
String body = "{\"nomor\":\"01\",\"voltage_v\":" + String(voltage, 2)
    + ",\"current_a\":" + String(current, 3)
    + ",\"power_factor\":" + String(powerFactor, 2) + "}";
int responseCode = http.POST(body);
http.end();
```

Ganti URL domain API, token, sertifikat CA, nomor kamar, nama variabel bacaan,
Wi-Fi, pin, dan faktor kalibrasi sesuai perangkatmu. Jangan unggah password Wi-Fi atau
`SENSOR_API_KEY` ke repositori publik. Token ESP32 berbeda dari `ADMIN_API_KEY`.

Sebelum perangkat tersedia, endpoint dapat diuji dari PowerShell:

```powershell
$headers = @{ 'X-Sensor-Key' = '<SENSOR_API_KEY>' }
$body = @{
  nomor = '01'
  voltage_v = 220.0
  current_a = 0.5
  power_factor = 0.95
} | ConvertTo-Json
Invoke-RestMethod -Uri 'https://<domain-api>/api/sensor/reading' `
  -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

SQLite lokal dipakai saat menjalankan prototipe di laptop. Untuk Vercel atau
backend online, gunakan database PostgreSQL dengan persistence aktif. Blueprint
Render memakai paket Free untuk prototipe; layanan gratis dapat tidur, sehingga
gunakan hosting backend selalu aktif bila sensor perlu dipantau tanpa jeda.
