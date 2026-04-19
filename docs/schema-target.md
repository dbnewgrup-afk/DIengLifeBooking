# Schema Target Production

Dokumen ini mengubah hasil audit menjadi target schema yang jelas untuk marketplace booking sesuai `dieng scope.docx`, sambil tetap realistis terhadap kondisi repo saat ini.

## Tujuan

Schema target harus mendukung:
- multi-vendor seller marketplace
- katalog multi-kategori: villa, jeep, mobil, fotografer
- booking berbasis tanggal
- payment provider final
- escrow, wallet, withdraw
- review dan rating
- admin moderation dan audit

## Prinsip Desain

1. Jangan pakai `Product` generik sebagai pusat domain production.
2. Bedakan `listing` dengan `booking`.
3. Simpan ledger keuangan secara eksplisit, jangan cuma update saldo total.
4. Semua flow uang harus bisa diaudit.
5. Availability harus bisa dicek dan dikunci.

## Mapping Kondisi Sekarang -> Target

| Schema Sekarang | Arah Target |
| --- | --- |
| `User` | dipertahankan, diperluas |
| `Product` | diganti atau di-migrate ke `Listing` |
| `Order` | dipecah jadi `Booking` atau dijadikan compatibility layer sementara |
| `OrderItem` | tidak jadi pusat domain; opsional untuk add-on, bukan booking inti |
| `Payment` | dipertahankan, tapi relasinya ke `Booking` |
| `Audit` | dipertahankan dan diperluas |

## Enum Target

### UserRole

- `USER`
- `SELLER`
- `ADMIN`
- `SUPER_ADMIN`
- opsional: `KASIR`

Catatan:
- kalau `KASIR` tetap dipakai, posisinya role operasional tambahan, bukan pengganti `SELLER`

### ListingType

- `VILLA`
- `JEEP`
- `TRANSPORT`
- `PHOTOGRAPHER`

### ListingStatus

- `DRAFT`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `ARCHIVED`

### BookingStatus

- `PENDING`
- `AWAITING_PAYMENT`
- `PAID`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `EXPIRED`
- `REFUNDED`

### PaymentStatus

- `PENDING`
- `PAID`
- `EXPIRED`
- `FAILED`
- `REFUNDED`

### WalletTransactionType

- `BOOKING_IN`
- `COMMISSION_OUT`
- `ESCROW_RELEASE`
- `WITHDRAW_REQUEST`
- `WITHDRAW_PAID`
- `REFUND_OUT`
- `ADJUSTMENT`

### WithdrawStatus

- `PENDING`
- `APPROVED`
- `REJECTED`
- `PROCESSING`
- `PAID`
- `FAILED`
- `CANCELLED`

## Core Model Target

### 1. User

Tambahkan field minimum:
- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `phone`
- `avatarUrl`
- `status`
- `emailVerifiedAt`
- `createdAt`
- `updatedAt`

Status user:
- `ACTIVE`
- `BANNED`
- `PENDING_VERIFICATION`

## 2. SellerProfile

Pisahkan info seller dari user supaya fleksibel.

Field minimum:
- `id`
- `userId`
- `displayName`
- `legalName`
- `bio`
- `bankName`
- `bankCode`
- `accountNumber`
- `accountName`
- `status`
- `createdAt`
- `updatedAt`

## 3. Listing

Ini pengganti `Product`.

Field minimum:
- `id`
- `sellerId`
- `type`
- `title`
- `slug`
- `description`
- `locationText`
- `latitude`
- `longitude`
- `basePrice`
- `maxGuest`
- `unitType`
- `status`
- `publishedAt`
- `createdAt`
- `updatedAt`

Catatan:
- `unitType` berguna karena tidak semua kategori murni per malam
- untuk scope Word, tetap prioritaskan mode date-based booking

## 4. ListingImage

Field minimum:
- `id`
- `listingId`
- `url`
- `sortOrder`
- `isPrimary`
- `createdAt`

## 5. ListingAvailability

Pusat booking engine.

Field minimum:
- `id`
- `listingId`
- `date`
- `basePrice`
- `priceOverride`
- `stock`
- `reservedCount`
- `isAvailable`
- `lockVersion`
- `createdAt`
- `updatedAt`

Catatan:
- `lockVersion` atau mekanisme row lock dipakai untuk anti double booking
- untuk villa tunggal, `stock` bisa `1`

## 6. Booking

Ini entitas utama transaksi user.

Field minimum:
- `id`
- `code`
- `userId`
- `listingId`
- `sellerId`
- `startDate`
- `endDate`
- `totalDays`
- `qty`
- `guestCount`
- `pricePerUnit`
- `subtotal`
- `platformFee`
- `discountAmount`
- `totalAmount`
- `status`
- `paymentStatus`
- `expiresAt`
- `paidAt`
- `completedAt`
- `cancelledAt`
- `createdAt`
- `updatedAt`

## 7. Payment

Field minimum:
- `id`
- `bookingId`
- `provider`
- `externalId`
- `invoiceUrl`
- `amount`
- `currency`
- `paymentMethod`
- `status`
- `paidAt`
- `expiredAt`
- `rawPayload`
- `createdAt`
- `updatedAt`

## 8. Wallet

Satu wallet per seller.

Field minimum:
- `id`
- `sellerId`
- `balanceAvailable`
- `balancePending`
- `updatedAt`

## 9. WalletTransaction

Ledger wajib.

Field minimum:
- `id`
- `walletId`
- `sellerId`
- `bookingId`
- `withdrawId`
- `type`
- `amount`
- `status`
- `referenceCode`
- `description`
- `createdAt`

## 10. Withdraw

Field minimum:
- `id`
- `sellerId`
- `walletId`
- `amount`
- `bankCode`
- `accountNumber`
- `accountName`
- `provider`
- `externalDisbursementId`
- `status`
- `requestedAt`
- `approvedAt`
- `paidAt`
- `rejectedAt`
- `failureReason`
- `createdAt`
- `updatedAt`

## 11. Review

Field minimum:
- `id`
- `bookingId`
- `userId`
- `listingId`
- `rating`
- `comment`
- `status`
- `createdAt`
- `updatedAt`

Status:
- `VISIBLE`
- `HIDDEN`
- `FLAGGED`

## 12. AuditLog

Perluasan dari model `Audit` sekarang.

Field minimum:
- `id`
- `actorUserId`
- `actorRole`
- `action`
- `targetType`
- `targetId`
- `meta`
- `ipAddress`
- `userAgent`
- `createdAt`

## Relationship Target

- `User 1:N Booking`
- `User 1:1 SellerProfile` untuk user seller
- `SellerProfile 1:N Listing`
- `Listing 1:N ListingImage`
- `Listing 1:N ListingAvailability`
- `Listing 1:N Booking`
- `Booking 1:N Payment` atau `1:1` tergantung desain final
- `SellerProfile 1:1 Wallet`
- `Wallet 1:N WalletTransaction`
- `SellerProfile 1:N Withdraw`
- `Listing 1:N Review`
- `Booking 1:0..1 Review`

## Migration Strategy

### Phase 1: additive migration

Tambahkan model baru tanpa langsung menghapus model lama:
- `SellerProfile`
- `Listing`
- `ListingImage`
- `ListingAvailability`
- `Booking`
- `Wallet`
- `WalletTransaction`
- `Withdraw`
- `Review`

### Phase 2: compatibility layer

Sementara waktu:
- `Product` tetap hidup untuk UI lama
- `Order` tetap hidup untuk flow lama
- endpoint lama diarahkan bertahap ke model baru

### Phase 3: switch-over

- public web pakai `Listing` + `Booking`
- admin pakai source data baru
- payment dan payout pakai relasi model baru

### Phase 4: cleanup

- hapus dependensi ke `Product` lama
- hapus dependensi ke `Order` lama jika sudah tidak dipakai
- rapikan route lama yang redundant

## Table Prioritas Implementasi

### Wajib dulu

1. `SellerProfile`
2. `Listing`
3. `ListingImage`
4. `ListingAvailability`
5. `Booking`
6. `Payment` refactor

### Wajib sebelum launch

1. `Wallet`
2. `WalletTransaction`
3. `Withdraw`
4. `Review`
5. `AuditLog` final

## Keputusan yang Sudah Dikunci

Referensi:
- `docs/phase-1-decision-lock.md`

- `Product` diperlakukan sebagai compatibility surface / facade lama, bukan domain utama production
- `Order` tidak dipakai lagi sebagai source of truth transaksi baru
- payment provider final dikunci ke `Xendit`
- role `KASIR` tetap dipertahankan sebagai role operasional production

## Rekomendasi Praktis

Kalau ingin cepat sampai production:
- tetap pakai `Express + Prisma` dulu
- jangan migrasi ke Laravel di tengah jalan kecuali memang keputusan bisnis final
- fokus pada migrasi domain dari `Product/Order` ke `Listing/Booking`
- treat finance (`Wallet`, `Withdraw`, `Ledger`) sebagai domain inti, bukan tambahan belakangan
