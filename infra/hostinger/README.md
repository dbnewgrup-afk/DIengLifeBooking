# Hostinger Deploy Assets

File di folder ini disiapkan untuk deployment `dienglifevillas.com` di Hostinger VPS.

## Isi folder

- `ecosystem.config.cjs`
  PM2 config untuk menjalankan `apps/api`, `apps/web-public`, dan `apps/web-admin`.
- `nginx.dienglifevillas.conf`
  Reverse proxy untuk:
  - `dienglifevillas.com` -> `127.0.0.1:3000`
  - `admin.dienglifevillas.com` -> `127.0.0.1:3010`
  - `api.dienglifevillas.com` -> `127.0.0.1:4000`

## Env files

Gunakan file berikut saat upload ke server:

- `apps/api/.env.production`
- `apps/web-public/.env.production`
- `apps/web-admin/.env.production`

## Sebelum start PM2

1. Isi `DB_HOST`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` di `apps/api/.env.production`.
2. Isi secret JWT yang benar-benar baru.
3. Isi key production Xendit hanya saat go-live.
4. Build app:

```bash
cd /var/www/Booking-Villa
npm install

cd apps/api
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build

cd ../web-public
npm run build

cd ../web-admin
npm run build
```

5. Jalankan PM2:

```bash
pm2 start /var/www/Booking-Villa/infra/hostinger/ecosystem.config.cjs
pm2 save
```
