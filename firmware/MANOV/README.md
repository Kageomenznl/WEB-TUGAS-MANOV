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

Untuk ESP32 DevKit dengan SPI VSPI standar, sambungkan RC522: SDA/SS ke GPIO 5,
SCK ke 18, MOSI ke 23, MISO ke 19, RST ke 22, VCC ke **3.3V** (bukan 5V), dan
GND ke GND. Saat boot, Serial Monitor menampilkan `MFRC522 VersionReg`;
`0x00` atau `0xFF` menandakan ESP32 tidak berkomunikasi dengan reader. Kartu
harus mendukung 13.56 MHz (contohnya MIFARE), bukan kartu 125 kHz.

Sketch mengirim pembacaan ke `/api/sensor/reading` setiap lima detik dan
heartbeat ke `/api/sensor/heartbeat` setiap lima detik. Keduanya memakai
`POST`, `Content-Type: application/json`, dan header `X-Sensor-Key`.
