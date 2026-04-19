# Transaction Source of Truth

Referensi keputusan final:

- `docs/phase-1-decision-lock.md`

## Canonical model

Flow transaksi aktif di project ini memakai:

- `Booking` sebagai transaksi utama
- `Payment` sebagai status dan histori pembayaran

Model aktif ada di:

- `apps/api/prisma/schema.prisma`
  - `Booking`
  - `Payment`
  - relasi ke `User`, `Listing`, `SellerProfile`, `PromoPackage`

## Jalur aktif

Jalur runtime yang aktif dan ter-mount dari `apps/api/src/routes/index.ts`:

- `routes/orders-cart.routes.ts`
  - create booking
  - read booking detail
  - mark cash
  - verify payment status
  - complete booking
- `routes/webhooks.routes.ts`
  - webhook payment aktif yang meng-update `Booking + Payment`
- `routes/buyer.routes.ts`
  - buyer dashboard membaca `Booking + Payment`
- `routes/seller.routes.ts`
  - seller bookings/balance/products membaca `Booking + Payment`
  - `/partner` hidup sebagai alias kompatibilitas dari route seller
- `routes/reports-v2.routes.ts`
  - summary seller/admin membaca `Booking + Payment`
- `routes/admin-marketplace.routes.ts`
  - admin transactions membaca `Booking`
- `routes/cashier.routes.ts`
  - verifikasi/manual payment membaca dan menulis `Booking + Payment`

Repo pembaca aktif:

- `repositories/buyer-dashboard.repo.ts`
- `repositories/partner-dashboard.repo.ts`
- `repositories/marketplace-admin.repo.ts`
- `repositories/cashier.repo.ts`

## Legacy flow

File berikut masih memakai konsep lama `Order` dan bukan jalur aktif:

- `apps/api/src/controllers/orders.controller.ts`
- `apps/api/src/services/orders.service.ts`
- `apps/api/src/repositories/orders.repo.ts`
- `apps/api/src/controllers/webhooks.controller.ts`
- `apps/api/src/routes/webhooks.midtrans.ts`
- `apps/api/src/routes/orders.verify.ts`

Status file-file di atas:

- `legacy`
- tidak di-mount di `apps/api/src/routes/index.ts`
- tidak boleh dipakai untuk flow checkout buyer, dashboard buyer, dashboard seller, atau admin transactions

## Operational rule

Kalau ada fitur transaksi baru:

1. tulis transaksi ke `Booking`
2. tulis status pembayaran ke `Payment`
3. baca dashboard buyer/seller/admin dari `Booking + Payment`
4. jangan buat source data paralel berbasis `Order`
5. semua route atau file legacy dianggap `compat only`, bukan jalur utama
