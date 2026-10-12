# Firmware ESP32 MANOV

Untuk memakai sketch, buka `MANOV.ino` dan isi `WIFI_SSID`, `WIFI_PASSWORD`,
serta `SENSOR_API_KEY` di bagian atas file dengan nilai milikmu. Atur
`SENSOR_API_KEY` yang sama di environment Production Vercel. Jangan commit
sketch yang berisi kredensial asli; gunakan placeholder pada salinan publik.

Pasang library Arduino `MFRC522` dan `LiquidCrystal_I2C`, pilih board ESP32 yang
sesuai, lalu sesuaikan pin, nomor kamar, UID kartu, serta sensitivitas ACS712.
Sensitivitas umumnya 185 mV/A (5 A), 100 mV/A (20 A), atau 66 mV/A (30 A).
`ACS712_OUTPUT_SCALE` mengoreksi pembagi tegangan pada input ADC jika digunakan.
Pastikan tegangan pada pin ADC ESP32 tidak melebihi batas 3,3 V.

Sketch mengirim pembacaan ke `/api/sensor/reading` setiap lima detik dan
heartbeat ke `/api/sensor/heartbeat` setiap lima detik. Keduanya memakai
`POST`, `Content-Type: application/json`, dan header `X-Sensor-Key`.
