# 🚀 Comunic8 — Kurulum ve Çalıştırma Rehberi

Merhaba! Bu döküman, Comunic8 projesini bilgisayarına indirip ayağa kaldırmak isteyen takım arkadaşları için hazırlanmış en kolay ve anlaşılır kurulum rehberidir.

---

## 🛠️ Adım 1: Gerekli Programların Kurulumu

Projeyi kendi bilgisayarında çalıştırabilmek için aşağıdaki üç aracı indirip kurman şart:

1.  **Node.js (LTS sürümü):** Projenin kodlarını çalıştırmak için. [Buradan İndir](https://nodejs.org/)
2.  **pnpm:** Projenin paket yöneticisi. Node.js'i kurduktan sonra terminal (cmd) açıp `npm install -g pnpm` yazarak kurabilirsin.
3.  **Docker Desktop:** İçinde veritabanı (PostgreSQL) ve mesajlaşma kuyruğu (Redis) hazır olarak gelir, senin elle veritabanı kurmana gerek bırakmaz! Sadece kurup arka planda açık tutman yeterlidir. [Docker Desktop İndir](https://www.docker.com/products/docker-desktop/)

---

## 🐳 Adım 2: Veritabanlarını Başlatma (Docker)

Docker Desktop uygulamasını aç ve bilgisayarın sağ alt köşesinde Docker ikonunu gördüğünden (çalıştığından) emin ol.

1. VS Code üzerinden projeyi aç.
2. Yeni bir terminal aç (`Ctrl` + `"` tuşuyla açabilirsin).
3. Şu komutu çalıştır:

```bash
docker compose up -d
```
*Bu işlem sadece ilk seferinde biraz uzun sürer. İnternetten gerekli veritabanı sistemlerini indirip arka planda hazır hale getirir.*

---

## ⚙️ Adım 3: Çevresel Değişkenler (.env Dosyaları)

Github'dan projeyi çektiğinde güvenlik sebebiyle şifrelerin bulunduğu `.env` dosyaları gelmez. Bunları senin oluşturman lazım:

**1. `apps/server` klasörünün içine `.env` adında bir dosya oluştur ve içine şunları yapıştır:**
```env
PORT=3001
DATABASE_URL="postgresql://comunic8:comunic8_pass@localhost:5432/comunic8"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="cok_gizli_bir_sir_buraya_yazilabilir_123"
```

**2. `apps/web` klasörünün içine `.env` adında bir dosya oluştur ve içine şunları yapıştır:**
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

---

## 🗄️ Adım 4: Paketleri Kurma ve Veritabanını Güncelleme

Terminale geri dön ve ana dizinde sırasıyla şu iki komutu çalıştır:

1. Önce gerekli kod paketlerini indirelim:
```bash
pnpm install
```

2. Şimdi az önce kurduğumuz veritabanının içine tabloları (Kullanıcılar, Mesajlar, Roller vb.) otomatik olarak yollayalım:
```bash
pnpm db:push
```

---

## 🚀 Adım 5: Uygulamayı Çalıştırma!

Her şey hazır! Uygulamayı çalıştırmak için terminale şunu yazman yeterli:

```bash
pnpm dev
```

*Bu komut hem arka planı (backend) hem de ön yüzü (frontend) aynı anda çalıştırır.*
Artık tarayıcını açıp **http://localhost:5173** adresine gidebilir ve uygulamayı kullanmaya başlayabilirsin!

---

## 🎯 Projenin Mevcut Durumu

Proje şu an tam teşekküllü bir iletişim platformudur:
*   **Tamamlandı:** Kullanıcı kaydı, Sunucu ve Metin Kanalı oluşturma, Gerçek zamanlı mesajlaşma (Socket.io).
*   **Tamamlandı:** Sunucu üye yönetimi, Rol oluşturma ve Atama sistemi (Faz 2).
*   **Tamamlandı:** WebRTC Peer-to-Peer altyapısı ile Sesli Odalarda konuşma (Faz 3).
*   **Tamamlandı:** Kendi mesajlarını sağ tıklayarak veya fareyi üstüne getirerek düzenleme (Edit) ve Silme.

*(Eğer bilgisayarında Rust kuruluysa `pnpm dev:desktop` diyerek uygulamayı direkt masaüstü uygulaması olarak da açabilirsin!)*
