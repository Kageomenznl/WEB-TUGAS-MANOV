# Deploy dashboard Netlify + API Render + PostgreSQL Neon

## Gambaran sistem

- Netlify menayangkan dashboard statis dari folder `frontend`.
- Render menjalankan API Flask dari folder ini.
- Neon PostgreSQL menyimpan nama penghuni, pembacaan sensor, konsumsi, dan tarif.
- ESP32 mengirim data pembacaan langsung ke API Render melalui HTTPS.
- Sensor dan admin memakai kunci akses yang berbeda. Jangan commit kunci ke Git.

## 1. Siapkan database PostgreSQL

1. Buat project PostgreSQL di Neon.
2. Salin connection string PostgreSQL dengan SSL, biasanya diawali
   `postgresql://` atau `postgres://`.
3. Simpan URL ini untuk konfigurasi Render. URL tersebut berisi password;
   jangan masukkan ke source code atau repositori.

## 2. Deploy API ke Render

1. Jadikan isi folder proyek ini sebagai root repositori GitHub. Di Netlify,
   pilih subdomain site yang ingin dipakai, misalnya
   `https://monitor-energi-kost.netlify.app`.
2. Di Render, pilih **New + → Blueprint** dan hubungkan repositori.
3. Masukkan connection string Neon saat Render meminta `DATABASE_URL`, dan
   origin Netlify pilihanmu saat meminta `ALLOWED_ORIGINS`.
4. `render.yaml` membuat `SENSOR_API_KEY` dan `ADMIN_API_KEY` secara acak.
   Simpan keduanya dari Render sebagai secret.
5. Pastikan `https://<nama-service>.onrender.com/api/health` membalas
   `{"status":"ok"}`.

## 3. Deploy dashboard ke Netlify

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
6. Tekan **Akses admin** pada dashboard, lalu masukkan `ADMIN_API_KEY` dari
   Render untuk mengganti penghuni atau tarif. Kunci hanya disimpan di sesi
   browser saat ini.

## 4. Sambungkan ESP32

- URL tujuan: `https://<nama-service>.onrender.com/api/sensor/reading`
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
  - `X-Sensor-Key: <SENSOR_API_KEY>` dari Render.
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
http.begin(client, "https://<nama-service>.onrender.com/api/sensor/reading");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Sensor-Key", "<SENSOR_API_KEY>");
String body = "{\"nomor\":\"01\",\"voltage_v\":" + String(voltage, 2)
    + ",\"current_a\":" + String(current, 3)
    + ",\"power_factor\":" + String(powerFactor, 2) + "}";
int responseCode = http.POST(body);
http.end();
```

Ganti URL, token, sertifikat CA, nomor kamar, nama variabel bacaan, Wi-Fi, pin,
dan faktor kalibrasi sesuai perangkatmu. Jangan unggah password Wi-Fi atau
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
Invoke-RestMethod -Uri 'https://<nama-service>.onrender.com/api/sensor/reading' `
  -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

SQLite lokal dipakai saat menjalankan prototipe di laptop. Untuk Netlify dan
backend online, database harus PostgreSQL dengan persistence aktif. Blueprint
memakai Render Free untuk prototipe; layanan gratis dapat tidur, sehingga
gunakan hosting backend selalu aktif bila sensor perlu dipantau tanpa jeda.
