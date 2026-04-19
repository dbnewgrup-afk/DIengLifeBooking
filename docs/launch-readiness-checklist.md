# Launch Readiness Checklist

## Scope

Checklist ini dipakai untuk fase 9 `siap deploy`, mencakup:

- `apps/api`
- `apps/web-public`
- `apps/web-admin`

Dokumen pendukung:

- `docs/phase-1-decision-lock.md`
- `docs/phase-9-staging-uat-readiness.md`
- `scripts/smoke-launch.mjs`

## 1. Environment

### `apps/api/.env`

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
- `ALLOW_DOCKER_DB_HOST=false` kecuali runtime benar-benar memakai network docker internal

### `apps/web-public/.env`

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_MODE=live`
- `NEXT_PUBLIC_ADMIN_APP_URL`
- `NEXT_PUBLIC_SHOW_PROMOS`
- `NEXT_PUBLIC_LEGACY_PARTNER_FORM=0`

### `apps/web-admin/.env`

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_PUBLIC_APP_URL`
- `SESSION_COOKIE_NAME`
- `NEXT_PUBLIC_DEV_NO_AUTH=0` atau unset

### Sanity env

- Tidak ada credential sandbox hardcoded di repo
- Tidak ada base URL `localhost/127.0.0.1` di env staging/production
- Tidak ada fallback role/user env yang dipakai di flow utama

## 2. Build Gates

Jalankan ulang di machine target atau CI staging:

1. `apps/api`: `npm.cmd run build`
2. `apps/web-public`: `npm.cmd run build`
3. `apps/web-admin`: `npm.cmd run build`

Semua build harus lolos tanpa hang.

## 3. Database / Prisma

- `npx prisma generate`
- `apps/api`: `npm.cmd run build`
- Seed test accounts tersedia untuk QA bila dibutuhkan:
  - `npm.cmd --workspace apps/api run seed`
  - `npm.cmd --workspace apps/api run seed:test-accounts`
- Koneksi database valid dari env aktif
- Host database bukan `db` kecuali deploy memang di docker network

## 4. Automated Smoke

Siapkan service berjalan:

1. `apps/api`
2. `apps/web-public`
3. `apps/web-admin`

Lalu jalankan:

`npm.cmd run smoke:launch`

Smoke automation minimal harus menutup:

- route guard admin, kasir, seller, partner alias
- login `USER`, `SELLER`, `AFFILIATE`, `ADMIN`, `KASIR`, `SUPER_ADMIN`
- wrong-role rejection di endpoint login
- endpoint canonical buyer, seller, affiliate, admin, dan kasir
- sesi buyer di `web-public`
- sesi seller/affiliate/admin/kasir/super-admin di `web-admin`

## 5. Manual UAT

### Public / buyer

- homepage, catalog, product detail, booking stepper, cart, checkout, invoice, dashboard buyer
- register/login buyer dengan `returnTo`
- checkout single item dan cart
- redirect payment success ke invoice canonical

### Seller

- login seller
- dashboard `/seller`
- alias `/partner`
- seller summary, bookings, products, balance, withdraws, payout history

### Affiliate

- login affiliate via seller portal
- overview, links, activity, balance, withdraw request
- tracking link `aff` / `affiliate` / `ref` tetap tertangkap dari public app

### Admin / kasir / super admin

- admin overview, products, promos, transactions, reports
- account management
- kasir overview
- super admin approvals, payout batch, audit, CMS

### Payment sandbox

- create order
- create invoice Xendit sandbox
- redirect ke hosted payment page
- verify webhook/canonical invoice status
- payment retry tidak membuat flow ganda

## 6. Final Go/No-Go Checklist

- tidak ada flow kritikal yang masih mock
- tidak ada TODO besar di flow utama
- tidak ada route utama yang legacy-confusing
- semua role dashboard bisa dipakai
- approval dan payout final utuh
- affiliate aktif dan komisi 5% tercatat
- build semua app lolos
- smoke automation siap atau sudah dijalankan
- UAT staging ditandai lulus

## 7. Rollback Notes

- Jika issue hanya di `web-public`: rollback FE public tanpa revert migration
- Jika issue hanya di `web-admin`: rollback FE admin tanpa revert migration
- Jika issue di route seller/partner, affiliate, booking, payment, payout, atau approval: rollback API terakhir
- Jangan rollback migration Prisma secara tergesa bila data operasional baru sudah masuk
- Backup env deploy sebelum mengganti secret, callback, atau URL staging/production

## 8. Recommended Safe Deploy Order

1. Validasi env staging/production
2. Validasi build API + frontend
3. Deploy `apps/api`
4. Jalankan smoke API/auth lintas role
5. Deploy `apps/web-public`
6. Deploy `apps/web-admin`
7. Jalankan smoke lintas role lagi
8. Lakukan manual UAT singkat
9. Tandai status repo: `siap deploy`
