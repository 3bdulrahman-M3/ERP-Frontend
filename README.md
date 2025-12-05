# ERP Frontend System

نظام ERP مبني باستخدام Angular و Tailwind CSS

## المتطلبات

- Node.js (v18 أو أحدث)
- npm

## التثبيت

```bash
npm install
```

## التشغيل

```bash
npm start
```

سيتم فتح التطبيق على `http://localhost:4200`

## المميزات

- ✅ Register الدخول مع API Backend
- ✅ Dashboard مع Navbar و Sidebar
- ✅ تصميم حديث باستخدام Tailwind CSS
- ✅ دعم اللغة العربية (RTL)
- ✅ حماية الصفحات (Auth Guards)
- ✅ Token Refresh تلقائي

## بيانات Register الدخول الافتراضية

- Email: `admin@erp.com`
- Password: `admin123`

## البنية

```
src/
├── app/
│   ├── components/
│   │   ├── login/          # صفحة Register الدخول
│   │   ├── dashboard/      # لوحة التحكم
│   │   └── unauthorized/   # صفحة غير مصرح
│   ├── guards/             # Auth Guards
│   ├── interceptors/       # HTTP Interceptors
│   └── services/           # Services (AuthService)
├── environments/           # إعدادات البيئة
└── styles.css             # Tailwind CSS
```

## API Backend

التطبيق يتصل بـ Backend API على `http://localhost:3001`

