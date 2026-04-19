# Phase 9 - Staging, QA, UAT, dan Siap Deploy

Dokumen ini adalah artefak fase 9 untuk memastikan repo benar-benar siap masuk fase deploy.

## Objective

Menutup gap antara fitur yang sudah selesai secara kode dengan kesiapan operasional sebelum deploy:

- build production lolos
- env staging lengkap
- smoke lintas role siap
- UAT lintas flow siap
- checklist deploy final jelas

## Build Validation

Command yang dipakai sebagai gate:

1. `apps/api`: `npm.cmd run build`
2. `apps/web-public`: `npm.cmd run build`
3. `apps/web-admin`: `npm.cmd run build`

Expected result:

- ketiga app lolos build production
- tidak ada `spawn EPERM` blocker tersisa
- route query-driven Next.js tidak gagal prerender

## Staging Env Matrix

### API

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `CORS_ORIGINS`
- `APP_BASE_URL`
- `PUBLIC_APP_URL`
- `XENDIT_SECRET_KEY`
- `XENDIT_WEBHOOK_VERIFICATION_TOKEN`

### Web Public

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_MODE=live`
- `NEXT_PUBLIC_ADMIN_APP_URL`
- `NEXT_PUBLIC_SHOW_PROMOS=true`
- `NEXT_PUBLIC_LEGACY_PARTNER_FORM=0`

### Web Admin

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_PUBLIC_APP_URL`
- `SESSION_COOKIE_NAME`
- `NEXT_PUBLIC_DEV_NO_AUTH=0`

## Automated Smoke Script

Script:

- `scripts/smoke-launch.mjs`

Entry command:

- `npm.cmd run smoke:launch`

Coverage minimum:

- auth guard admin/kasir/seller/partner
- login `USER`, `SELLER`, `AFFILIATE`, `ADMIN`, `KASIR`, `SUPER_ADMIN`
- alias seller `/partner`
- endpoint buyer, seller, affiliate, admin, kasir
- sesi buyer di public app
- sesi seller/affiliate/admin/kasir/super-admin di admin app

## Manual UAT Matrix

### Buyer / public

- homepage dan kategori
- product detail canonical
- booking stepper
- checkout single
- checkout cart
- invoice canonical
- payment success page
- buyer dashboard

### Seller

- login seller
- `/seller`
- `/partner`
- products
- bookings
- wallet/balance
- withdraw request
- payout history

### Affiliate

- login affiliate
- overview
- links
- activity
- balance
- withdraw request
- tracking referral dari public app

### Admin / kasir / super admin

- admin overview
- products/promos
- transactions
- reports
- account management
- kasir overview
- super admin approvals
- payout batch
- audit trail
- CMS

### Payment sandbox

- create order
- create invoice
- redirect ke Xendit sandbox
- webhook / canonical sync
- retry payment

## Exit Criteria Phase 9

Fase 9 baru dianggap selesai bila:

- build API lolos
- build web-public lolos
- build web-admin lolos
- env examples sudah sinkron dengan kode aktual
- smoke script sudah menutup role final
- checklist deploy final sudah mencakup public, seller, affiliate, admin, kasir, super admin, dan payment sandbox

Jika semua poin di atas lolos, status repo bisa ditandai:

- `siap deploy`
