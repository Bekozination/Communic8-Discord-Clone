# 🚀 Communic8 - Uygulamaya Bağlantı Rehberi (Arkadaş İçin)

Merhaba! Projeyi test etmek ve sunucuya bağlanıp konuşabilmemiz için senin kod veya program indirmene, kurulum yapmana gerek yok. Sadece aşağıdaki 3 basit adımı uygulaman yeterli.

---

### Adım 1: Ağa Bağlanmak İçin Tailscale İndir
Güvenlik sebebiyle uygulamamız dış dünyaya açık değil, özel bir sanal ağ (VPN) içinde çalışıyor. Bu ağa katılman için Tailscale adlı ufak bir uygulama kurman lazım:

1. [Tailscale İndirme Sayfası](https://tailscale.com/download)'na git.
2. İşletim sistemine uygun olanı indir ve kur.

### Adım 2: Ortak Hesaba Giriş Yap
Kurulum bittikten sonra uygulama senden giriş yapmanı isteyecek. İkimizin de aynı ağda olması için benim sana vereceğim şu **ortak test hesabı** ile giriş yapmalısın:

*   **Giriş Yöntemi:** Google ile Giriş Yap (Sign in with Google)
*   **Email:** `resulcanvol1@gmail.com`
*   **Şifre:** *(Bu şifreyi sana özelden atacağım)*

Giriş yaptıktan sonra bilgisayarının sağ alt kısmındaki araç çubuğunda Tailscale simgesinin aktif olduğunu görebilirsin.

### Adım 3: Uygulamaya Giriş Yap!
Ağa başarıyla bağlandın. Artık tek yapman gereken herhangi bir web tarayıcısını (Chrome, Opera, Edge vb.) açmak ve adres çubuğuna direkt olarak benim ana sunucu adresimi girmek:

👉 **http://100.89.247.26:5173**

*(Not: Başında `https` değil, sadece `http` olmasına dikkat et)*

### Adım 4: Mikrofon İznini Açmak (Çok Önemli 🎤)
Uygulamamıza özel bir IP adresi üzerinden bağlandığımız için (HTTPS olmadığı için) Chrome gibi tarayıcılar güvenlik gereği mikrofonu otomatik kilitler. Odaya katılıp **karşı tarafı dinleyebilirsin ama senin sesinin de gitmesini istiyorsan** şu ayarı yapmalısın:

1. Bilgisayarında veya telefonunda **Google Chrome** tarayıcısını aç.
2. Adres çubuğuna şunu yazıp enter'a bas: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Açılan ekranda sarı ile vurgulanmış kutucuğa bizim adresimizi tam olarak yaz: `http://100.89.247.26:5173`
4. Kutucuğun yanındaki (veya altındaki) menüden **"Enabled"** seçeneğini seç.
5. Ekranın altındaki **"Relaunch"** butonuna basarak Chrome'un yeniden başlamasını sağla.

Bu işlemi yaptıktan sonra ses kanalına girdiğinde tarayıcı mikrofon izni isteyecek ve sorunsuz konuşabileceksin!

---

### 🎮 İçeride Ne Yapacaksın?
Linke girdiğinde karşına Discord benzeri kendi uygulamamızın Kayıt/Giriş ekranı çıkacak.

1.  Oradan kendine yepyeni bir hesap oluştur.
2.  Ben seni arkadaş olarak ekleyeceğim veya sana bir sunucu davet linki atacağım.
3.  Kanala katılıp doğrudan sesli sohbete bağlanabilir ve test edebilirsin!

Seste görüşürüz! 🎤

---

### 📱 Alternatif: Telefondan Bağlanarak Test Etmek İstersen

Eğer bilgisayar başında değilsen veya mikrofon/hoparlör testini cep telefonundan yapmak istersen, süreci tamamen telefonundan da yürütebilirsin. (Bu yöntem sesin gerçekten gidip gelmediğini anlamak için en pratik test yöntemidir.)

1. **Telefona Tailscale Kur:** Telefonunun uygulama mağazasına (App Store veya Google Play Store) gir ve `Tailscale` uygulamasını aratıp indir.
2. **Hesaba Giriş Yap:** Uygulamayı açtığında tıpkı bilgisayardaki gibi "Sign in with Google" (Google ile Giriş) seçeneğini seç ve sana özelden attığım ortak test hesabı (`resulcanvol1@gmail.com`) ile giriş yap.
3. **Telefondan Siteye Gir:** VPN ağına katıldıktan sonra telefonun kendi web tarayıcısını (iPhone ise Safari, Android ise Chrome vb.) aç ve adres çubuğuna şu linki yaz: 
   👉 `http://100.89.247.26:5173`
4. **Hesap Oluştur:** Karşına çıkan ekrandan rastgele bir e-posta ile kendine yepyeni bir "Telefon Hesabı" oluşturup giriş yap.
5. **Sesli Sohbeti Başlat:** İçeri girdiğinde benim sana atacağım davet linkiyle sunucuya katıl veya beni arkadaş olarak ekle. Ses kanalına katıldığında telefonunun mikrofonuna izin vererek benimle veya sunucudaki diğer kişilerle doğrudan telefonundan konuşabilirsin! 

*(Not: Eğer bu testi kendi kendine aynı odada, hem bilgisayardan hem telefondan yapıyorsan; çok fena bir yankı (feedback) döngüsü olmaması için cihazlardan birinin sesini kısmayı veya mikrofonunu kapatmayı unutma!)*
