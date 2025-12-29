# MaRBS - Bayi ve İşletme Yönetim Sistemi

Modern, güvenli ve kullanıcı dostu bir bayi-işletme yönetim platformu.

## 🚀 Özellikler

### Genel Özellikler
- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ İki farklı kullanıcı türü: **Bayi** (Satıcı) ve **İşletme** (Alıcı)
- ✅ Rol bazlı erişim kontrolü
- ✅ Session yönetimi
- ✅ Güvenli şifre hashleme (bcrypt)
- ✅ Modern ve responsive arayüz
- ✅ Fare hareketine duyarlı animasyonlu arka plan

### Bayi (Satıcı) Paneli
- 📊 Satış istatistikleri
- 📦 Ürün yönetimi
- 🛒 Sipariş takibi
- 📈 Raporlama
- ⚙️ Ayarlar
- 💬 Destek sistemi

### İşletme (Alıcı) Paneli
- 🛍️ Ürün sipariş sistemi
- 📊 Harcama raporları
- 🏪 Bayi listesi
- ⭐ Bayi değerlendirme
- 📋 Sipariş geçmişi

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

## 🛠️ Kurulum

1. **Projeyi klonlayın veya indirin**

2. **Bağımlılıkları yükleyin:**
```powershell
npm install
```

3. **Sunucuyu başlatın:**
```powershell
npm start
```

4. **Tarayıcınızda açın:**
```
http://localhost:3000
```

## 📁 Proje Yapısı

```
MaRBS/
│
├── index.html              # Ana giriş sayfası
├── server.js              # Backend sunucu (Node.js + Express)
├── package.json           # Proje bağımlılıkları
├── .env                   # Ortam değişkenleri
│
├── scripts/               # JavaScript dosyaları
│   ├── auth.js           # Giriş/Kayıt işlemleri
│   ├── auth-manager.js   # Session yönetimi
│   ├── particles.js      # Animasyonlu arka plan
│   └── common.js         # Ortak fonksiyonlar
│
├── styles/               # CSS dosyaları
│   └── index.css        # Ana sayfa stilleri
│
├── bayi/                # Bayi (Satıcı) sayfaları
│   ├── yenibyiweb.html
│   ├── siparis_sayfası.html
│   ├── Müsteri_paneli_Rapor.html
│   ├── Marsb_Hakkımızda.html
│   ├── Marsb_destek.html
│   └── marsb_ayarlar.html
│
└── işletme/             # İşletme (Alıcı) sayfaları
    ├── isletme_ana.html
    ├── işletme_siparis.html
    ├── işletme_rapor.html
    ├── ürün_ekleme.html
    └── ürünler_deneme.html
```

## 🔐 API Endpoints

### Kayıt Ol
```
POST /api/register
Body: {
  username: string,
  email: string,
  password: string,
  user_type: 'bayi' | 'isletme'
}
```

### Giriş Yap
```
POST /api/login
Body: {
  username: string,
  password: string
}
Response: {
  success: boolean,
  redirectUrl: string
}
```

### Çıkış Yap
```
POST /api/logout
```

### Mevcut Kullanıcı Bilgisi
```
GET /api/user
Response: {
  success: boolean,
  user: {
    id: number,
    username: string,
    email: string,
    user_type: 'bayi' | 'isletme'
  }
}
```

## 🎨 Kullanıcı Türleri

### 1. Bayi (Satıcı)
- Ürün satışı yapan kullanıcı
- Giriş sonrası: `/bayi/yenibyiweb.html`
- Stok yönetimi, sipariş alma, raporlama

### 2. İşletme (Alıcı)
- Ürün satın alan kullanıcı
- Giriş sonrası: `/işletme/isletme_ana.html`
- Sipariş oluşturma, takip, değerlendirme

## 🔒 Güvenlik

- ✅ Şifreler bcrypt ile hash'lenir
- ✅ Session tabanlı kimlik doğrulama
- ✅ Rol bazlı erişim kontrolü
- ✅ CSRF koruması
- ✅ SQL injection koruması (parametrik sorgular)

## 🎯 Kullanım

### İlk Kullanım

1. **Ana sayfaya gidin**: `http://localhost:3000`
2. **"Kayıt Ol"** butonuna tıklayın
3. Kullanıcı bilgilerinizi girin:
   - Kullanıcı adı
   - E-posta
   - Şifre (min 6 karakter)
   - Kullanıcı türü (Bayi veya İşletme)
4. Kayıt olduktan sonra giriş yapın
5. Kullanıcı türünüze göre panele yönlendirileceksiniz

### Mevcut Sayfalar

**Bayi Sayfaları:**
- Ana Sayfa: `yenibyiweb.html`
- Sipariş Sayfası: `siparis_sayfası.html`
- Raporlar: `Müsteri_paneli_Rapor.html`
- Hakkımızda: `Marsb_Hakkımızda.html`
- Destek: `Marsb_destek.html`
- Ayarlar: `marsb_ayarlar.html`

**İşletme Sayfaları:**
- Ana Sayfa: `isletme_ana.html`
- Sipariş: `işletme_siparis.html`
- Raporlar: `işletme_rapor.html`
- Ürün Ekleme: `ürün_ekleme.html`
- Ürünler: `ürünler_deneme.html`

## 🔧 Yapılandırma

`.env` dosyasını düzenleyerek yapılandırma yapabilirsiniz:

```env
PORT=3000
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

## 📝 Geliştirme

**Development modunda çalıştırma:**
```powershell
npm run dev
```

Bu komut nodemon kullanarak dosya değişikliklerinde otomatik yeniden başlatma sağlar.

## 🐛 Sorun Giderme

### Port zaten kullanılıyor
Eğer 3000 portu kullanılıyorsa, `.env` dosyasında farklı bir port belirleyin:
```env
PORT=3001
```

### Veritabanı hatası
Eğer veritabanı hatası alıyorsanız:
1. `marbs.db` dosyasını silin
2. Sunucuyu yeniden başlatın (otomatik olarak yeniden oluşturulacak)

### Session sorunları
Tarayıcı çerezlerini temizleyin ve yeniden giriş yapın.

## 🚀 Production'a Alma

1. `.env` dosyasında `NODE_ENV=production` yapın
2. `SESSION_SECRET` değerini güçlü bir anahtar ile değiştirin
3. HTTPS kullanın
4. `server.js` içinde `cookie.secure = true` yapın

## 📄 Lisans

Bu proje özel kullanım içindir.

## 👤 İletişim

Sorularınız için:
- E-posta: [email buraya]
- Destek: Platform içi destek sistemi

---

**Not:** Bu sistem eğitim/demo amaçlıdır. Production ortamında kullanmadan önce ek güvenlik önlemleri alınması önerilir.
