# FrontendERP

نظام إدارة موارد المؤسسات مبني بتقنية Angular.

## المتطلبات

- Node.js (الإصدار 18 أو أحدث)
- npm أو yarn

## التثبيت

1. قم بتثبيت التبعيات:
```bash
npm install
```

## التشغيل

لتشغيل المشروع في وضع التطوير:

```bash
npm start
```

ثم افتح المتصفح على `http://localhost:4200`

## البناء

لبناء المشروع للإنتاج:

```bash
npm run build
```

الملفات المبنية ستكون في مجلد `dist/`

## البنية

```
FrontendERP/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── home/
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
└── tsconfig.json
```

## التطوير

المشروع يستخدم Angular 17 مع Standalone Components.

## الرخصة

هذا المشروع مفتوح المصدر.

