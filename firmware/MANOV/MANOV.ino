#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>
#include <time.h>
// ======================== PENGATURAN KONEKSI ========================
// Ganti nilai ini pada salinan lokal. Jangan unggah kredensial asli ke GitHub.
const char WIFI_SSID[] = "GANTI_DENGAN_NAMA_WIFI";
const char WIFI_PASSWORD[] = "GANTI_DENGAN_PASSWORD_WIFI";
const char SENSOR_API_KEY[] = "GANTI_DENGAN_SENSOR_API_KEY";
const char SERVER_URL[] =
    "https://web-tugas-manov.vercel.app/api/sensor/reading";
const char HEARTBEAT_URL[] =
    "https://web-tugas-manov.vercel.app/api/sensor/heartbeat";
const char ROOM_NUMBER[] = "01";

// ======================== KARTU YANG DIIZINKAN ========================
// Isi UID sesuai format yang tercetak di Serial Monitor, contoh: AA:BB:CC:DD.
const char USER_CARD_UID[] = "E9:97:BB:02";
const char ADMIN_CARD_UID[] = "AC:C5:30:03";

// ======================== SERTIFIKAT HTTPS ========================
// Root CA ini dipakai untuk memeriksa sertifikat server Vercel.
static const char SERVER_ROOT_CA[] PROGMEM = R"PEM(
-----BEGIN CERTIFICATE-----
MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw
MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp
Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo
27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w
Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw
TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl
qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH
szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8
Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk
MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92
wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p
aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN
VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID
AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E
FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb
C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe
QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy
h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4
7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J
ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef
MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/
Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT
6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ
0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm
2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb
bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c
-----END CERTIFICATE-----
)PEM";

// ======================== PIN PERANGKAT ========================
// Sesuaikan nomor pin jika rangkaian ESP32 berbeda.
const int RFID_RST_PIN = 22;
const int RFID_SS_PIN = 5;
const int RELAY_MAIN_PIN = 25;
const int RELAY_LIGHT_PIN = 26;
const int PIR_PIN = 21;
const int ACS_PIN = 34;
const int LCD_SDA_PIN = 32;
const int LCD_SCL_PIN = 33;

// Kebanyakan modul relay aktif-LOW. Ubah kedua nilai ini jika modul berbeda.
const int RELAY_ON = LOW;
const int RELAY_OFF = HIGH;

// ======================== JEDA WAKTU ========================
const unsigned long SEND_INTERVAL_MS = 5000;
const unsigned long HEARTBEAT_INTERVAL_MS = 5000;
const unsigned long LIGHT_TIMEOUT_MS = 15000;
const unsigned long RFID_DEBOUNCE_MS = 1000;
const unsigned long RFID_RECOVERY_INTERVAL_MS = 60000;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000;
const unsigned long CURRENT_SAMPLE_WINDOW_MS = 200;
const unsigned long HTTP_TIMEOUT_MS = 3000;
const int CARD_UID_BUFFER_SIZE = 31;
const int LCD_I2C_ADDRESS = 0x27;
const int LCD_COLUMNS = 16;
const int LCD_ROWS = 2;

// ======================== KALIBRASI SENSOR ========================
// Nilai perkiraan ini perlu disesuaikan dengan modul dan hasil kalibrasi.
const float MAINS_VOLTAGE_V = 220.0;
const float POWER_FACTOR = 0.85;
const float ACS712_SENSITIVITY_MV_PER_AMP = 185.0;  // ACS712 5 A
const float ACS712_OUTPUT_SCALE = 1.0;  // Set >1 when using an ADC voltage divider.
const float MIN_CURRENT_A = 0.05;

// ======================== STATUS PROGRAM ========================
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, LCD_COLUMNS, LCD_ROWS);
bool isRoomActive = false;
bool isLightOn = false;
unsigned long lastSendTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastMovementTime = 0;
unsigned long lastRfidTapTime = 0;
unsigned long lastRfidInitTime = 0;
unsigned long lastWifiRetryTime = 0;
bool ntpConfigured = false;
bool hasHandledRfidTap = false;
char lastHandledUid[CARD_UID_BUFFER_SIZE] = {};

// Daftar fungsi: memudahkan mencari bagian program yang ingin dianalisis.
void connectToWiFi();
void maintainWiFi();
void showLcdMessage(const char* line1, const char* line2);
void showIdleLcdStatus();
void handleRfid();
void formatCardUid(char* output, size_t outputSize);
void initializeRfidReader();
void toggleRoomPower(unsigned long now);
void handleMotionSensor();
void sendHeartbeatIfDue();
void sendHeartbeat();
void sendReadingIfDue();
float readACCurrent();
void sendDataToServer(float currentRmsA);

// ======================== MULAI PERANGKAT ========================
void setup() {
  Serial.begin(9600);

  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.begin();
  lcd.backlight();
  showIdleLcdStatus();

  // Matikan semua relay ketika board mulai atau restart.
  pinMode(RELAY_MAIN_PIN, OUTPUT);
  pinMode(RELAY_LIGHT_PIN, OUTPUT);
  digitalWrite(RELAY_MAIN_PIN, RELAY_OFF);
  digitalWrite(RELAY_LIGHT_PIN, RELAY_OFF);
  pinMode(PIR_PIN, INPUT);
  Serial.printf("Sensor PIR HC-SR501 siap pada pin %d.\n", PIR_PIN);
  analogReadResolution(12);
  analogSetPinAttenuation(ACS_PIN, ADC_11db);

  SPI.begin();
  initializeRfidReader();

  WiFi.mode(WIFI_STA);
  connectToWiFi();
  lastSendTime = millis();
  Serial.println("Sistem siap. Tempelkan kartu untuk membaca UID.");
  Serial.println("UID yang tidak dikenal ditampilkan di sini untuk didaftarkan.");
  if (strcmp(USER_CARD_UID, "ISI_UID_KARTU_KAMAR") == 0 ||
      strcmp(ADMIN_CARD_UID, "ISI_UID_MASTERCARD") == 0) {
    Serial.println("Atur USER_CARD_UID dan ADMIN_CARD_UID setelah membaca UID kedua kartu.");
  } else if (strcmp(USER_CARD_UID, ADMIN_CARD_UID) == 0) {
    Serial.println("PERINGATAN: UID user dan admin sama; ubah agar menjadi dua kartu berbeda.");
  }
}

// ======================== PERULANGAN UTAMA ========================
void loop() {
  handleRfid();
  maintainWiFi();
  sendHeartbeatIfDue();

  // Wi-Fi dan RFID tetap diproses; sensor hanya aktif saat listrik kamar menyala.
  if (!isRoomActive) return;

  handleMotionSensor();
  sendReadingIfDue();
}

void initializeRfidReader() {
  mfrc522.PCD_Init();
  mfrc522.PCD_AntennaOn();
  lastRfidInitTime = millis();
  delay(4);
}

void showLcdMessage(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

void showIdleLcdStatus() {
  showLcdMessage(
      "Tempelkan RFID",
      isRoomActive ? "Listrik: MENYALA" : "Listrik: MATI"
  );
}

// ======================== WI-FI DAN WAKTU HTTPS ========================
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  lastWifiRetryTime = millis();
  if (strcmp(WIFI_SSID, "NAMA_WIFI_KAMU") == 0 ||
      strcmp(WIFI_PASSWORD, "PASSWORD_WIFI_KAMU") == 0) {
    Serial.println("Atur WIFI_SSID dan WIFI_PASSWORD sebelum menjalankan sketch.");
    return;
  }

  // Mulai koneksi tanpa menahan loop; statusnya diperiksa di maintainWiFi().
  Serial.printf("Menghubungkan ke Wi-Fi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!ntpConfigured) {
      configTime(0, 0, "pool.ntp.org", "time.nist.gov");
      ntpConfigured = true;
      Serial.println("Menyinkronkan waktu untuk validasi sertifikat HTTPS.");
    }
    return;
  }
  if (millis() - lastWifiRetryTime < WIFI_RETRY_INTERVAL_MS) return;

  Serial.println("Wi-Fi terputus; mencoba menyambungkan kembali.");
  connectToWiFi();
}

// Kirim tanda aktif walaupun relay kamar mati dan belum ada data daya.
void sendHeartbeatIfDue() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastHeartbeatTime < HEARTBEAT_INTERVAL_MS) return;
  lastHeartbeatTime = millis();
  sendHeartbeat();
}

void sendHeartbeat() {
  if (strcmp(SENSOR_API_KEY, "PASTE_SENSOR_API_KEY_HERE") == 0) {
    Serial.println("Atur SENSOR_API_KEY sebelum mengirim status koneksi.");
    return;
  }
  if (time(nullptr) < 1735689600) {
    Serial.println("Menunggu sinkronisasi waktu NTP sebelum koneksi HTTPS.");
    return;
  }

  WiFiClientSecure secureClient;
  secureClient.setCACert(SERVER_ROOT_CA);
  secureClient.setHandshakeTimeout(3);
  secureClient.setTimeout(HTTP_TIMEOUT_MS);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(secureClient, HEARTBEAT_URL)) {
    Serial.println("Gagal memulai HTTPS untuk status koneksi ESP32.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Sensor-Key", SENSOR_API_KEY);

  String payload = "{\"nomor\":\"";
  payload += ROOM_NUMBER;
  payload += "\"}";

  const int responseCode = http.POST(payload);
  if (responseCode >= 200 && responseCode < 300) {
    Serial.printf("Heartbeat berhasil (HTTP %d).\n", responseCode);
  } else if (responseCode > 0) {
    const String responseBody = http.getString();
    Serial.printf(
        "Heartbeat ditolak server (HTTP %d): %s\n",
        responseCode,
        responseBody.c_str());
  } else {
    Serial.printf("Heartbeat gagal: %s\n", http.errorToString(responseCode).c_str());
  }

  http.end();
}

// ======================== PEMBACA KARTU RFID ========================
void handleRfid() {
  const unsigned long now = millis();

  if (!mfrc522.PICC_IsNewCardPresent()) {
    if (now - lastRfidInitTime >= RFID_RECOVERY_INTERVAL_MS) {
      Serial.println("Memulihkan reader RFID setelah lama tidak aktif.");
      initializeRfidReader();
    }
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    Serial.println("Kartu terdeteksi tetapi UID gagal dibaca; memulihkan reader.");
    mfrc522.PCD_StopCrypto1();
    initializeRfidReader();
    return;
  }

  char cardUid[CARD_UID_BUFFER_SIZE] = {};
  formatCardUid(cardUid, sizeof(cardUid));
  Serial.printf("UID RFID terbaca: %s\n", cardUid);

  const bool isUserCard = strcmp(cardUid, USER_CARD_UID) == 0;
  const bool isAdminCard = strcmp(cardUid, ADMIN_CARD_UID) == 0;
  const bool duplicateTap = hasHandledRfidTap &&
      strcmp(cardUid, lastHandledUid) == 0 &&
      now - lastRfidTapTime < RFID_DEBOUNCE_MS;

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  if (duplicateTap) return;

  if (isUserCard && isAdminCard) {
    Serial.println("Konfigurasi ditolak: UID user dan admin harus berbeda.");
    showLcdMessage("UID kartu sama", "Periksa pengaturan");
  } else if (isUserCard || isAdminCard) {
    strncpy(lastHandledUid, cardUid, sizeof(lastHandledUid) - 1);
    lastHandledUid[sizeof(lastHandledUid) - 1] = '\0';
    lastRfidTapTime = now;
    hasHandledRfidTap = true;
    Serial.printf("Kartu %s diterima.\n", isAdminCard ? "admin" : "user");
    toggleRoomPower(now);
  } else {
    Serial.println("Kartu tidak terdaftar. Salin UID ini ke USER_CARD_UID atau ADMIN_CARD_UID.");
    showLcdMessage(
        "KARTU: SALAH",
        isRoomActive ? "Listrik tetap ON" : "Listrik: MATI"
    );
  }
}

// Ubah byte UID menjadi teks heksadesimal, misalnya AA:BB:CC:DD.
void formatCardUid(char* output, size_t outputSize) {
  size_t used = 0;
  for (byte i = 0; i < mfrc522.uid.size && i < sizeof(mfrc522.uid.uidByte); i++) {
    const int written = snprintf(
        output + used,
        outputSize - used,
        i == 0 ? "%02X" : ":%02X",
        mfrc522.uid.uidByte[i]
    );
    if (written < 0 || static_cast<size_t>(written) >= outputSize - used) {
      output[outputSize - 1] = '\0';
      return;
    }
    used += static_cast<size_t>(written);
  }
}

// Kedua kartu terdaftar memakai fungsi sakelar listrik yang sama.
void toggleRoomPower(unsigned long now) {
  isRoomActive = !isRoomActive;
  if (isRoomActive) {
    Serial.println("Listrik kamar diaktifkan.");
    digitalWrite(RELAY_MAIN_PIN, RELAY_ON);
    digitalWrite(RELAY_LIGHT_PIN, RELAY_OFF);
    isLightOn = false;
    lastMovementTime = now;
    showLcdMessage("KARTU: BENAR", "Listrik MENYALA");
    return;
  }

  Serial.println("Listrik kamar dimatikan.");
  digitalWrite(RELAY_MAIN_PIN, RELAY_OFF);
  digitalWrite(RELAY_LIGHT_PIN, RELAY_OFF);
  if (isLightOn) {
    Serial.println("Lampu dimatikan karena listrik kamar dimatikan.");
  }
  isLightOn = false;
  showLcdMessage("KARTU: BENAR", "Listrik: MATI");
}

// ======================== SENSOR GERAK DAN LAMPU ========================
void handleMotionSensor() {
  if (digitalRead(PIR_PIN) == HIGH) {
    lastMovementTime = millis();
    digitalWrite(RELAY_LIGHT_PIN, RELAY_ON);
    if (!isLightOn) {
      Serial.println("Pergerakan terdeteksi: lampu menyala.");
      isLightOn = true;
    }
    return;
  }

  if (isLightOn && millis() - lastMovementTime >= LIGHT_TIMEOUT_MS) {
    digitalWrite(RELAY_LIGHT_PIN, RELAY_OFF);
    isLightOn = false;
    Serial.printf(
        "Tidak ada pergerakan selama %lu detik: lampu mati.\n",
        LIGHT_TIMEOUT_MS / 1000
    );
  }
}

// ======================== PEMBACA ARUS DAN PENGIRIMAN ========================
void sendReadingIfDue() {
  if (millis() - lastSendTime < SEND_INTERVAL_MS) return;
  lastSendTime = millis();

  const float currentRmsA = readACCurrent();
  const float activePowerW = MAINS_VOLTAGE_V * currentRmsA * POWER_FACTOR;

  Serial.printf("Arus: %.3f A, daya perkiraan: %.1f W\n", currentRmsA, activePowerW);
  sendDataToServer(currentRmsA);
}

// Hitung arus RMS; pengurangan rata-rata membantu mengabaikan offset ADC.
float readACCurrent() {
  double sumMillivolts = 0;
  double sumSquaresMillivolts = 0;
  uint32_t sampleCount = 0;
  const uint32_t startMicros = micros();
  const uint32_t sampleWindowMicros = CURRENT_SAMPLE_WINDOW_MS * 1000UL;

  while (static_cast<uint32_t>(micros() - startMicros) < sampleWindowMicros) {
    const float sampleMillivolts = analogReadMilliVolts(ACS_PIN);
    sumMillivolts += sampleMillivolts;
    sumSquaresMillivolts +=
        static_cast<double>(sampleMillivolts) * sampleMillivolts;
    sampleCount++;
    delayMicroseconds(250);
  }

  if (sampleCount < 20) {
    Serial.println("ACS712: sampel ADC terlalu sedikit untuk menghitung RMS.");
    return 0;
  }

  const double meanMillivolts = sumMillivolts / sampleCount;
  const double variance = (sumSquaresMillivolts / sampleCount) -
      (meanMillivolts * meanMillivolts);
  const float rmsMillivolts =
      sqrtf(static_cast<float>(variance > 0 ? variance : 0));
  const float currentRmsA =
      (rmsMillivolts * ACS712_OUTPUT_SCALE) /
      ACS712_SENSITIVITY_MV_PER_AMP;

  Serial.printf(
      "ACS712: offset %.0f mV, sinyal RMS %.1f mV, %lu sampel\n",
      meanMillivolts,
      rmsMillivolts,
      static_cast<unsigned long>(sampleCount));

  return currentRmsA < MIN_CURRENT_A ? 0 : currentRmsA;
}

// Kirim satu pembacaan ke API melalui HTTPS dan tampilkan hasilnya di Serial.
void sendDataToServer(float currentRmsA) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Data belum terkirim: Wi-Fi tidak tersambung.");
    return;
  }

  if (strcmp(SENSOR_API_KEY, "PASTE_SENSOR_API_KEY_HERE") == 0) {
    Serial.println("Atur SENSOR_API_KEY sebelum mengirim data.");
    return;
  }

  if (time(nullptr) < 1735689600) {
    Serial.println("Menunggu sinkronisasi waktu NTP sebelum koneksi HTTPS.");
    return;
  }

  WiFiClientSecure secureClient;
  secureClient.setCACert(SERVER_ROOT_CA);

  secureClient.setHandshakeTimeout(3);
  secureClient.setTimeout(HTTP_TIMEOUT_MS);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(secureClient, SERVER_URL)) {
    Serial.println("Gagal memulai koneksi HTTPS ke server.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Sensor-Key", SENSOR_API_KEY);

  String payload;
  payload.reserve(96);
  payload = "{\"nomor\":\"";
  payload += ROOM_NUMBER;
  payload += "\",\"voltage_v\":";
  payload += String(MAINS_VOLTAGE_V, 1);
  payload += ",\"current_a\":";
  payload += String(currentRmsA, 4);
  payload += ",\"power_factor\":";
  payload += String(POWER_FACTOR, 2);
  payload += "}";

  const int responseCode = http.POST(payload);
  if (responseCode > 0) {
    const String responseBody = http.getString();
    Serial.printf("Respons server HTTP %d: %s\n", responseCode, responseBody.c_str());
  } else {
    Serial.printf("Pengiriman gagal: %s\n", http.errorToString(responseCode).c_str());
  }

  http.end();
}
