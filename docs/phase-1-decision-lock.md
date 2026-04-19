# Phase 1 Decision Lock

Dokumen ini adalah keputusan final untuk **Phase 1 - Finalisasi Scope dan Source of Truth**.

Status:
- `DONE`

Tanggal lock:
- `2026-04-18`

Tujuan dokumen:
- menghilangkan ambiguity besar sebelum masuk fase implementasi berikutnya
- memberi satu referensi resmi untuk stack, domain, role, route, dan payment provider

## Keputusan Final

### 1. Backend final

Backend final untuk project ini adalah:

- `Express + TypeScript + Prisma`

Catatan:
- tidak ada migrasi ke Laravel di fase ini
- semua fase berikutnya harus melanjutkan stack aktif yang sudah ada

### 2. Payment provider final

Payment gateway final untuk project ini adalah:

- `Xendit`

Catatan:
- `Midtrans` diperlakukan sebagai `legacy / compat only`
- seluruh flow baru harus mengarah ke Xendit
- sandbox dipakai sampai fase siap deploy selesai
- switch ke production key hanya boleh dilakukan di fase paling akhir

### 3. Canonical domain naming

Penamaan domain final yang dipakai:

- `Listing`
- `Booking`
- `Payment`
- `Wallet`
- `Withdraw`

Aturan:
- `Product` hanya dianggap compatibility surface / UI naming lama bila masih tersisa
- `Order` tidak boleh lagi dipakai sebagai source of truth transaksi baru

### 4. Transaction source of truth

Source of truth transaksi aktif adalah:

- `Booking` sebagai transaksi utama
- `Payment` sebagai status dan histori pembayaran

Aturan operasional:

1. semua transaksi baru harus ditulis ke `Booking`
2. semua status pembayaran baru harus ditulis ke `Payment`
3. dashboard buyer, seller, admin, kasir, dan laporan harus membaca dari `Booking + Payment`
4. flow baru tidak boleh membangun source data paralel berbasis `Order`

### 5. Route canon

Route canonical yang dipakai ke depan:

- seller route canonical: `/seller`
- seller compatibility alias: `/partner`
- transaction route canonical: `/orders` yang dimount dari `orders-cart.routes.ts`
- payment webhook canonical: `/webhooks/xendit`

Aturan:
- alias lama boleh hidup sementara untuk kompatibilitas
- semua pengembangan baru harus memakai route canonical

### 6. Role canon

Role utama yang dipakai:

- `USER`
- `SELLER`
- `ADMIN`
- `SUPER_ADMIN`
- `KASIR`

Catatan:
- `PARTNER` dianggap alias legacy yang harus dinormalisasi ke `SELLER`
- `AFFILIATE` sudah muncul di sebagian codebase, tetapi pengaktifan penuh ada di fase affiliate, bukan di phase 1

### 7. Dua fase terakhir project

Dua fase terakhir project tetap dikunci sebagai:

1. `Siap Deploy`
2. `Switch ke Xendit Production`

Aturan:
- dua fase ini tidak boleh dimulai sebelum semua fase sebelumnya stabil

## Dampak ke Fase Berikutnya

Mulai setelah dokumen ini:

- jangan buka lagi diskusi `Midtrans vs Xendit`
- jangan buka lagi diskusi `Product/Order vs Listing/Booking`
- jangan buka lagi diskusi `Laravel vs Express`
- kalau ada route lama, perlakukan sebagai `compat only`, bukan arah utama

## Definition of Done Phase 1

Phase 1 dianggap selesai jika:

- keputusan final stack tertulis
- keputusan final payment provider tertulis
- keputusan final domain naming tertulis
- keputusan final source of truth transaksi tertulis
- keputusan final route canonical tertulis
- keputusan final role canonical tertulis
- dokumen lama yang masih ambigu sudah disinkronkan
