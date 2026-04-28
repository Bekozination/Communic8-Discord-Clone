# 🌍 Communic8 - Uzaktan Test ve Canlı Kullanım Rehberi

Projeyi iki farklı evden (farklı internet ağlarından) test etmek ve sesli sohbeti kullanabilmek için yerel bilgisayarındaki bu projeyi dış dünyaya açman gerekiyor. Sesli iletişim altyapısı olarak kullanılan **WebRTC** teknolojisi iki bilgisayarı (seni ve arkadaşını) doğrudan birbirine bağlamaya çalıştığı için, aynı modemde/ağda değilken bazı bağlantı engellerine takılabilir.

İşte bunu çözmek ve arkadaşınla hemen denemek için en kolaydan en profesyonele doğru **3 farklı yöntem**:

---

## Seçenek 1: Sanal Yerel Ağ Kurmak (Tailscale) - 🏆 EN KOLAY VE ÜCRETSİZ

Bu yöntem, ikinizin bilgisayarını sanki aynı evde aynı modeme bağlıymış gibi gösterir. WebRTC'nin en pürüzsüz çalıştığı yöntemdir, modemden port açmanıza veya sunucu kiralamanıza gerek kalmaz.

### Adım Adım Kurulum:
1. **Tailscale İndirin**: Hem sen hem de arkadaşın [Tailscale.com](https://tailscale.com/)'a gidip ücretsiz hesap oluşturun ve uygulamayı bilgisayarlarınıza indirin.
2. **Ağa Katılın**: Uygulamayı kurup giriş yapın. Tailscale sana özel bir IP adresi verecek (örneğin: `100.x.x.x`). Arkadaşın da kendi cihazında bağlandığında aynı ağda olacaksınız.
3. **Uygulamayı Çalıştır**: Sen kendi bilgisayarında her zamanki gibi terminalde `pnpm dev` ile projeyi başlat.
4. **.env Dosyasını Güncelle**: Kendi bilgisayarındaki `apps/web/.env` dosyasını aç ve `localhost` yerine Tailscale'in sana verdiği `100` ile başlayan IP adresini yaz:
   ```env
   VITE_API_URL=http://100.x.x.x:3001
   VITE_WS_URL=http://100.x.x.x:3001
   ```
   *(Değişiklikten sonra terminalde çalışan `pnpm dev`'i `Ctrl+C` ile kapatıp tekrar `pnpm dev` yazarak açmayı unutma ki yeni IP adresini algılasın)*
5. **Arkadaşın Bağlansın**: Arkadaşın tarayıcısını açıp **senin Tailscale IP adresine ve 5173 portuna** gidecek: 
   `http://100.x.x.x:5173`
6. **Sesli Sohbeti Test Edin**: Artık sanki internette yayındaymış gibi kayıt olup, kanallara girip sesli konuşabilirsiniz!

---

## Seçenek 2: Ngrok ile Tünelleme (Hızlı Geçici Test)

Bilgisayarını dış dünyaya geçici bir link (URL) ile açmanı sağlar. Arkadaşının bilgisayarına hiçbir şey kurmasına gerek kalmaz, sadece senin ona atacağın linke tıklar.

### Adım Adım Kurulum:
1. [Ngrok.com](https://ngrok.com/)'dan hesap açıp bilgisayarına ngrok uygulamasını kur ve kurulum talimatlarındaki *auth token* (kimlik doğrulama) kodunu terminale gir.
2. Projeni `pnpm dev` ile çalıştır (3001 backend ve 5173 frontend portları açılacak).
3. **Backend'i dışarı aç**: VS Code'da *yeni* bir terminal sekmesi aç ve şu komutu gir:
   ```bash
   ngrok http 3001
   ```
   Ngrok sana bir HTTPS linki verecek (örn: `https://abc-123.ngrok-free.app`). Bu linki kopyala.
4. **Frontend .env'sini Güncelle**: `apps/web/.env` dosyana gir ve `localhost` olan backend linklerini ngrok linkinle değiştir:
   ```env
   VITE_API_URL=https://abc-123.ngrok-free.app
   VITE_WS_URL=https://abc-123.ngrok-free.app
   ```
   *(Kaydettiğinde frontend otomatik olarak yenilenecektir)*
5. **Frontend'i dışarı aç**: VS Code'da *üçüncü* bir terminal sekmesi daha aç ve bu sefer 5173 portunu (arayüzü) dışarı aç:
   ```bash
   ngrok http 5173
   ```
   Ngrok sana **yeni** bir HTTPS linki daha verecek (örn: `https://xyz-987.ngrok-free.app`).
6. **Arkadaşına Gönder**: Elde ettiğin bu ikinci linki (`https://xyz...`) arkadaşına at. O direkt tarayıcıdan girip projeyi senin bilgisayarın üzerinden kullanabilir.

---

## Seçenek 3: VPS (Sanal Sunucu) Kiralamak - 🚀 KALICI VE PROFESYONEL ÇÖZÜM

Eğer uygulamayı artık bilgisayarını kapatsan bile 7/24 açık tutmak ve "gerçek" bir site gibi (örn: `bizimdiscord.com`) kullanmak istiyorsanız, bir sunucu kiralamanız gerekir.

### Adım Adım Kurulum:
1. **Sunucu Kirala**: Hetzner, DigitalOcean, Vultr veya AWS gibi bir firmadan aylık 5-10$ civarına **Ubuntu** kurulu bir Sanal Sunucu (VPS) kirala (En az 2GB RAM önerilir).
2. **Sunucuya Bağlan**: Terminalinden `ssh root@sunucu_ip_adresi` komutu ile sunucuya bağlan.
3. **Gereksinimleri Kur**: Sunucuya `git`, `docker`, `docker-compose`, `nodejs` ve `pnpm` kur. (Docker Desktop yerine sadece Docker Engine kurman yeterli).
4. **Projeyi İndir ve Ayarla**:
   - Github'dan projeni sunucuya çek (`git clone proj_url`).
   - `docker-compose up -d` ile veritabanlarını başlat.
   - `apps/server/.env` ve `apps/web/.env` dosyalarını oluştur, linkleri sunucunun IP adresiyle değiştir.
5. **Uygulamayı Canlıya Al**:
   - `pnpm install` ve `pnpm db:push` komutlarını çalıştır.
   - `pnpm build` komutu ile projenin canlı (production) versiyonunu derle.
6. **Uygulamayı 7/24 Çalıştır**: Uygulamanın sen SSH bağlantısını kapatsan da arka planda çalışması için `pm2` isimli aracı kur:
   - `npm install -g pm2`
   - Sunucuyu `pm2 start` ile ayağa kaldır (Veya tüm projeyi Docker içerisine alıp tek bir container olarak çalıştırabilirsiniz).

---

### 💡 Sesli Sohbet (WebRTC) İçin Önemli Not
WebRTC teknolojisi ev internetlerinde genelde sorunsuz çalışır. Ancak arkadaşın veya sen; üniversite, yurt, şirket gibi **katı güvenlik duvarı (Symmetric NAT)** olan bir internetten bağlanıyorsanız uygulamaya girseniz bile sesiniz karşıya gitmeyebilir.

* WebRTC p2p (kişiden kişiye) bağlanamazsa yedeğe düşecek bir **TURN Sunucusuna** (Örn: açık kaynaklı `Coturn` veya ücretli `Twilio`, `Metered`) ihtiyaç duyar.
* Eğer başlangıç aşamasında hiç ses sorunlarıyla (NAT geçişleriyle) uğraşmak istemiyorsan **Seçenek 1 (Tailscale)** sizin için kesin çözümdür, ağ kısıtlamalarını tamamen atlar. İlk testleriniz için kesinlikle Tailscale'i kullanmanızı öneririm!
