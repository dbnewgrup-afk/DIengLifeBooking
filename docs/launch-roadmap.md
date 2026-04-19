# Launch Roadmap

Dokumen ini memecah audit dan target schema menjadi urutan eksekusi sampai production-ready launch.

Keputusan final phase decision lock sudah ditetapkan di:

- `docs/phase-1-decision-lock.md`

## Goal

Membawa repo ini dari:
- fondasi monorepo + UI awal + API dasar

menjadi:
- marketplace booking multi-vendor yang siap launch terbatas

## Strategi Umum

Jangan kerjakan semuanya paralel tanpa fondasi. Urutan aman:

1. lock domain model
2. bangun booking core
3. bangun finance core
4. sambungkan admin dan seller UI ke data nyata
5. hardening + testing + launch

## Phase 0: Decision Lock

Target output:
- keputusan final stack dan payment provider
- tidak ada lagi ambiguity besar

Checklist:
- backend final dikunci di `Express + Prisma`
- payment final dikunci di `Xendit`
- naming domain final dikunci di `Listing/Booking`
- role final dikunci dengan `PARTNER` sebagai alias kompatibilitas ke `SELLER`
- dua fase terakhir dikunci sebagai `siap deploy` lalu `switch ke Xendit production`

Done jika:
- keputusan tertulis dan tidak berubah-ubah

## Phase 1: Schema & Domain Foundation

Target output:
- schema production target tersedia
- migrasi dasar domain baru siap

Checklist:
- buat model `SellerProfile`
- buat model `Listing`
- buat model `ListingImage`
- buat model `ListingAvailability`
- buat model `Booking`
- refactor `Payment` agar relasinya ke `Booking`
- perluas `User` fields production
- pastikan `AuditLog` tetap ada

Deliverables:
- migrasi Prisma baru
- docs schema final
- seed data dev baru

Risk:
- breaking change ke UI lama

Mitigasi:
- additive migration dulu, jangan hapus model lama di awal

## Phase 2: Public Listing & Seller Listing Management

Target output:
- seller bisa punya listing
- public bisa lihat listing nyata

Checklist:
- endpoint seller create/update listing
- endpoint seller upload/remove listing image
- endpoint public list listing
- endpoint public detail listing
- filter berdasarkan kategori, lokasi, harga, status
- admin approve/reject listing

Deliverables:
- seller listing CRUD
- moderation listing
- public catalog pakai data nyata

Definition of done:
- listing tidak lagi berasal dari mock/fallback

## Phase 3: Booking Engine

Target output:
- booking date-based benar-benar hidup

Checklist:
- endpoint cek availability per listing
- endpoint create booking
- perhitungan total berdasarkan durasi dan qty
- lock availability / anti double booking
- booking expires jika tidak dibayar
- status booking konsisten

Deliverables:
- booking lifecycle final
- anti-double-booking logic
- expiry job draft

Definition of done:
- dua user tidak bisa booking slot yang sama secara race condition

## Phase 4: Payment Integration

Target output:
- booking bisa dibayar dengan provider final

Checklist:
- create payment/invoice endpoint
- webhook endpoint final
- signature verification
- idempotency check
- update booking/payment status
- error and retry handling
- manual verify endpoint admin bila dibutuhkan

Deliverables:
- end-to-end payment sandbox lulus
- booking state berubah otomatis dari callback

Definition of done:
- create booking -> bayar -> webhook -> status berubah stabil

## Phase 5: Wallet, Escrow, Withdraw

Target output:
- arsitektur uang seller benar-benar aman

Checklist:
- wallet seller dibuat otomatis
- pending balance bertambah setelah payment sukses
- available balance bertambah setelah booking complete
- ledger transaksi tercatat
- seller request withdraw
- admin approve/reject withdraw
- disbursement provider final
- withdraw failure handling

Deliverables:
- wallet domain
- escrow release flow
- withdraw flow final

Definition of done:
- semua perpindahan uang seller bisa ditrace dari payment sampai withdraw

## Phase 6: Review & Trust Layer

Target output:
- review system aktif

Checklist:
- create review endpoint
- list review endpoint
- guard hanya booking selesai yang bisa review
- aggregate rating
- tampilkan review di public detail page

Deliverables:
- review visible di public page

## Phase 7: Admin & Seller Dashboard Real Data

Target output:
- dashboard tidak lagi pakai mock/local storage untuk flow inti

Checklist:
- admin summary dari API nyata
- reports dari data nyata
- partner/seller bookings dari data nyata
- payout dashboard dari data nyata
- approvals dari data nyata
- audit log dari data nyata
- buang `MOCK_*` dari flow kritikal
- buang `localStorage` untuk source data bisnis

Deliverables:
- admin, partner, affiliate panel terkoneksi backend final

Definition of done:
- refresh browser tidak menghilangkan state bisnis inti

## Phase 8: Notifications & Jobs

Target output:
- background jobs dan notifikasi dasar aktif

Checklist:
- email booking success
- email payment success
- email withdraw update
- queue/job untuk booking expiry
- queue/job untuk retry notifikasi
- optional WhatsApp notifier

Deliverables:
- job worker minimal

## Phase 9: Hardening

Target output:
- aplikasi aman dan layak go-live

Checklist:
- review auth/role access
- rate limit endpoint sensitif
- validate semua input penting
- observability/logging final
- alerting dasar
- env separation dev/staging/prod
- backup restore DB plan
- incident rollback plan

Deliverables:
- runbook dasar
- config production checklist

## Phase 10: Testing & Launch Readiness

Target output:
- confidence sebelum launch

Checklist:
- unit test booking calculator
- integration test booking create
- integration test payment webhook
- integration test wallet release
- integration test withdraw
- e2e public booking flow
- e2e admin approve/reject flow
- e2e seller withdraw flow
- staging UAT
- dry run launch

Definition of done:
- seluruh happy path dan failure path utama lulus

## Recommended Sprint Breakdown

### Sprint 1

Fokus:
- phase 0
- phase 1
- sebagian phase 2

Outcome:
- domain model final
- migrasi baru
- listing CRUD dasar

### Sprint 2

Fokus:
- sisa phase 2
- phase 3
- phase 4

Outcome:
- listing live
- booking engine hidup
- payment end-to-end hidup

### Sprint 3

Fokus:
- phase 5
- phase 6
- phase 7

Outcome:
- wallet/escrow/withdraw hidup
- review hidup
- dashboard pakai data nyata

### Sprint 4

Fokus:
- phase 8
- phase 9
- phase 10

Outcome:
- jobs/notifikasi
- hardening
- UAT + staging + launch prep

## Launch Scope Recommendation

Kalau mau realistis, launch pertama jangan bawa semua advanced feature.

### Minimum Launch Scope

Wajib ada:
- auth dasar
- seller listing management
- listing moderation admin
- public catalog + detail
- booking date-based
- payment success flow
- wallet pending/available
- withdraw request + approval
- admin reports dasar
- audit log dasar

Belum wajib untuk launch v1:
- coupon/voucher
- weighted rating system
- multi currency
- WhatsApp automation
- dynamic seasonal pricing kompleks

## Critical Path

Kalau waktu sempit, jalur kritisnya adalah:

1. schema final
2. listing CRUD
3. availability
4. booking create
5. payment callback
6. escrow release
7. withdraw
8. admin approval
9. tests

Kalau salah satu titik ini belum selesai, launch sebaiknya ditunda.

## Immediate Next Actions

Urutan kerja paling masuk akal setelah dokumen ini:

1. buat migrasi schema target tahap 1
2. refactor API dari `Product/Order` menuju `Listing/Booking`
3. hapus mock dependency dari admin flow paling kritikal
4. implement booking availability + anti double booking
5. implement wallet ledger dan withdraw flow
