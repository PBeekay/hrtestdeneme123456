# 🏢 EskiDC HR Dashboard

Modern, kullanıcı dostu B2B İnsan Kaynakları Yönetim Sistemi. Bento Grid tasarım felsefesi ile oluşturulmuş, tam özellikli bir İK dashboard uygulaması. EskiDC.com için geliştirilmiştir.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)
![MariaDB](https://img.shields.io/badge/MariaDB-10.11-orange.svg)
![License](https://img.shields.io/badge/License-MIT-purple.svg)

## ✨ Özellikler

### 🎨 Modern Arayüz
- **Bento Grid Tasarım** - Şık ve organize görünüm
- **Karanlık Mod** - Göz dostu tema desteği
- **Responsive Tasarım** - Mobil ve masaüstü uyumlu
- **Animasyonlar** - Smooth geçişler ve micro-interactions
- **Glassmorphism** - Modern cam efektleri

### 🔐 Güvenlik
- **JWT Authentication** - Güvenli oturum yönetimi
- **Bcrypt Şifreleme** - Güçlü şifre hashleme
- **Session Yönetimi** - Token tabanlı doğrulama
- **SQL Injection Koruması** - Prepared statements

### 📊 İK Modülleri
- **Profil Yönetimi** - Kullanıcı bilgileri ve avatar
- **İzin Takibi** - Yıllık, hastalık ve kişisel izin bakiyesi
- **Görev Yönetimi** - Öncelikli görev takibi ve tamamlama
- **Performans Metrikleri** - Gerçek zamanlı performans göstergeleri
- **Duyurular** - Şirket içi duyuru sistemi
- **Duyuru Yönetimi** - (Admin) Duyuru oluşturma, düzenleme ve silme desteği

### 🎯 Gelişmiş Özellikler
- **Canlı Saat** - Türkçe tarih ve saat formatı
- **Arama ve Filtreleme** - Görevler ve duyurularda anlık arama
- **Toast Bildirimleri** - Başarı, hata ve bilgi mesajları
- **Konfeti Animasyonu** - Görev tamamlama kutlaması
- **İstatistik Kartları** - Özet bilgiler ve trendler

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Python** 3.10 veya üzeri
- **Node.js** 16 veya üzeri
- **MariaDB** 10.5 veya üzeri
- **npm** veya yarn

### 1. Projeyi İndirin

```bash
git clone https://github.com/berkaypekersoy/eskidc-hr-dashboard.git
cd eskidc-hr-dashboard
```

### 2. MariaDB Kurulumu

1. MariaDB'yi kurun ve başlatın
2. Veritabanını oluşturun:

```bash
cd backend
mysql -u root -p --port=3307 < create_database.sql
```

### 3. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluşturun (önerilen)
python -m venv venv

# Aktifleştirin
# Windows:
venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# .env dosyasını ayarlayın
# .env.example dosyasını kopyalayıp .env olarak kaydedin
# Database bilgilerinizi girin

# Backend'i başlatın
uvicorn main:app --reload
```

Backend çalışacak: http://localhost:8000

### 4. Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Frontend'i başlatın
npm start
```

Frontend çalışacak: http://localhost:3000

## 🔑 Demo Hesap

```
Kullanıcı Adı: ikadmin
Şifre: admin123
```

## 📁 Proje Yapısı

```
hrtest/
├── backend/
│   ├── database.py          # Veritabanı işlemleri
│   ├── main.py             # FastAPI uygulaması
│   ├── requirements.txt    # Python bağımlılıkları
│   ├── create_database.sql # Veritabanı kurulum scripti
│   └── .env               # Konfigürasyon (oluşturulmalı)
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── vr_logo.png    # Şirket logosu
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.tsx       # Ana uygulama
│   │   ├── types.ts      # TypeScript tipleri
│   │   └── index.css     # Global stiller
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🗄️ Veritabanı Yapısı

### Tablolar

- **users** - Kullanıcı bilgileri
- **leave_balance** - İzin bakiyeleri
- **tasks** - Görevler
- **performance_metrics** - Performans metrikleri
- **announcements** - Duyurular
- **sessions** - Oturum yönetimi

## 🛠️ Teknoloji Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PyMySQL** - MariaDB bağlantısı
- **Bcrypt** - Şifre hashleme
- **Pydantic** - Veri doğrulama
- **Python-dotenv** - Ortam değişkenleri

### Frontend
- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Utility-first CSS
- **Create React App** - Build tool

### Database
- **MariaDB** - İlişkisel veritabanı
- **UTF-8 Türkçe** karakter desteği

## 🎨 Tasarım Özellikleri

### Renk Paleti
- **Primary (Mavi)**: Güven, profesyonellik
- **Yeşil**: Başarı, tamamlanma
- **Turuncu/Amber**: Dikkat, bekleyen işler
- **Kırmızı**: Aciliyet, yüksek öncelik

### Komponentler
- **BentoCard** - Yeniden kullanılabilir kart bileşeni
- **StatCard** - İstatistik kartları
- **SearchBar** - Arama ve filtreleme
- **Toast** - Bildirim sistemi
- **Confetti** - Kutlama animasyonu
- **LoginPage** - Giriş sayfası

## 🔧 Geliştirme

### Backend Test

```bash
cd backend
python database.py  # Veritabanı bağlantı testi
```

### Frontend Geliştirme

```bash
cd frontend
npm start  # Development server (hot reload)
npm run build  # Production build
```

### API Dokümantasyonu

Backend çalışırken: http://localhost:8000/docs

## 📊 API Endpoints

### Authentication
- `POST /api/login` - Kullanıcı girişi
- `POST /api/logout` - Çıkış

### Dashboard
- `GET /api/dashboard` - Dashboard verileri
- `PUT /api/tasks/{id}/status` - Görev durumu güncelleme

### Duyurular (Admin)
- `POST /api/announcements` - Yeni duyuru oluştur
- `PUT /api/announcements/{id}` - Duyuru güncelle
- `DELETE /api/announcements/{id}` - Duyuru sil

## 🔐 Güvenlik Notları

### Üretim İçin

1. `.env` dosyasını **asla** Git'e eklemeyin
2. Güçlü `SECRET_KEY` kullanın
3. Database şifrelerini düzenli değiştirin
4. HTTPS kullanın
5. CORS ayarlarını sıkılaştırın
6. Rate limiting ekleyin

### Geliştirme Ortamı

`.env` dosyası örneği:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=hrapp
DB_PASSWORD=güçlü-şifre
DB_NAME=hrtest_db
SECRET_KEY=rastgele-güvenli-anahtar
DEBUG=False
```

## 🐛 Sorun Giderme

### Backend Çalışmıyor

```bash
# Bağımlılıkları kontrol edin
pip install -r requirements.txt

# .env dosyasını kontrol edin
# Port numarasını doğrulayın (3307 veya 3306)
```

### Database Bağlantı Hatası

```bash
# MariaDB servisinin çalıştığından emin olun
# Port numarasını kontrol edin
# Kullanıcı adı ve şifreyi doğrulayın
```

### Frontend Hataları

```bash
# Node modüllerini temizleyin
rm -rf node_modules package-lock.json
npm install
```

## 📝 Özelleştirme

### Logo Değiştirme

`frontend/public/vr_logo.png` dosyasını değiştirin

### Renk Teması

`frontend/tailwind.config.js` dosyasında primary renkleri düzenleyin

### Dashboard Kartları

`frontend/src/App.tsx` içinde Bento Grid layout'u özelleştirin

## 🚀 Deployment

### Backend (Production)

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend (Production)

```bash
npm run build
# build/ klasörünü web sunucunuza deploy edin
```

## 📄 Lisans

Bu proje demo amaçlı oluşturulmuştur.

## 👨‍💻 Geliştirici

- **Framework**: FastAPI + React
- **Database**: MariaDB
- **Tasarım**: Bento Grid + Tailwind CSS

## 🎯 Roadmap

- [ ] Çoklu dil desteği
- [ ] Excel/PDF export
- [ ] E-posta bildirimleri
- [ ] Takvim entegrasyonu
- [ ] Detaylı raporlama
- [ ] Rol tabanlı yetkilendirme
- [ ] Mobil uygulama

## 📞 Destek

Sorun yaşıyorsanız:
1. API dokümantasyonunu kontrol edin: http://localhost:8000/docs
2. Browser console'u kontrol edin
3. Backend terminal çıktısını kontrol edin

---

**⚡ Modern, Hızlı, Güvenli - İK Yönetimi Artık Daha Kolay!**
