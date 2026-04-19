/*
  WARNING: destructive migration
  - Drops old Product/Order-based domain tables
  - Recreates the schema around Listing/Booking + Xendit
  - Existing data in old domain tables will be lost
*/

DROP TABLE IF EXISTS "WalletTransaction" CASCADE;
DROP TABLE IF EXISTS "Withdraw" CASCADE;
DROP TABLE IF EXISTS "Wallet" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "ListingAvailability" CASCADE;
DROP TABLE IF EXISTS "ListingImage" CASCADE;
DROP TABLE IF EXISTS "Listing" CASCADE;
DROP TABLE IF EXISTS "SellerProfile" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Audit" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

DROP TYPE IF EXISTS "WalletTransactionStatus" CASCADE;
DROP TYPE IF EXISTS "WalletTransactionType" CASCADE;
DROP TYPE IF EXISTS "WithdrawStatus" CASCADE;
DROP TYPE IF EXISTS "ReviewStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentProvider" CASCADE;
DROP TYPE IF EXISTS "BookingStatus" CASCADE;
DROP TYPE IF EXISTS "ListingUnitType" CASCADE;
DROP TYPE IF EXISTS "ListingStatus" CASCADE;
DROP TYPE IF EXISTS "ListingType" CASCADE;
DROP TYPE IF EXISTS "SellerStatus" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'KASIR',
  'SELLER',
  'USER'
);

CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'BANNED',
  'PENDING_VERIFICATION'
);

CREATE TYPE "SellerStatus" AS ENUM (
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED'
);

CREATE TYPE "ListingType" AS ENUM (
  'VILLA',
  'JEEP',
  'TRANSPORT',
  'PHOTOGRAPHER'
);

CREATE TYPE "ListingStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED'
);

CREATE TYPE "ListingUnitType" AS ENUM (
  'PER_NIGHT',
  'PER_DAY',
  'PER_TRIP',
  'PER_SESSION'
);

CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED'
);

CREATE TYPE "PaymentProvider" AS ENUM (
  'XENDIT',
  'MANUAL'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PAID',
  'EXPIRED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "WalletTransactionType" AS ENUM (
  'BOOKING_IN',
  'COMMISSION_OUT',
  'ESCROW_RELEASE',
  'WITHDRAW_REQUEST',
  'WITHDRAW_PAID',
  'REFUND_OUT',
  'ADJUSTMENT'
);

CREATE TYPE "WalletTransactionStatus" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "WithdrawStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "ReviewStatus" AS ENUM (
  'VISIBLE',
  'HIDDEN',
  'FLAGGED'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "phone" TEXT,
  "avatarUrl" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "legalName" TEXT,
  "bio" TEXT,
  "bankName" TEXT,
  "bankCode" TEXT,
  "accountNumber" TEXT,
  "accountName" TEXT,
  "status" "SellerStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Listing" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "type" "ListingType" NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "locationText" TEXT NOT NULL,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "basePrice" INTEGER NOT NULL,
  "maxGuest" INTEGER NOT NULL DEFAULT 1,
  "unitType" "ListingUnitType" NOT NULL DEFAULT 'PER_NIGHT',
  "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  "metadata" JSONB,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingImage" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingAvailability" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "basePrice" INTEGER,
  "priceOverride" INTEGER,
  "stock" INTEGER NOT NULL DEFAULT 1,
  "reservedCount" INTEGER NOT NULL DEFAULT 0,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "lockVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ListingAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "totalDays" INTEGER NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "guestCount" INTEGER NOT NULL DEFAULT 1,
  "pricePerUnit" INTEGER NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "platformFee" INTEGER NOT NULL DEFAULT 0,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'XENDIT',
  "externalId" TEXT NOT NULL,
  "invoiceUrl" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "paymentMethod" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "balanceAvailable" INTEGER NOT NULL DEFAULT 0,
  "balancePending" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Withdraw" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "bankName" TEXT,
  "bankCode" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'XENDIT',
  "externalDisbursementId" TEXT,
  "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Withdraw_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "bookingId" TEXT,
  "withdrawId" TEXT,
  "type" "WalletTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "referenceCode" TEXT,
  "description" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Audit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" "Role",
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "meta" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");
CREATE INDEX "SellerProfile_status_idx" ON "SellerProfile"("status");

CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");
CREATE INDEX "Listing_type_status_idx" ON "Listing"("type", "status");
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

CREATE INDEX "ListingImage_listingId_sortOrder_idx" ON "ListingImage"("listingId", "sortOrder");

CREATE UNIQUE INDEX "ListingAvailability_listingId_date_key" ON "ListingAvailability"("listingId", "date");
CREATE INDEX "ListingAvailability_listingId_date_idx" ON "ListingAvailability"("listingId", "date");

CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");
CREATE INDEX "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");
CREATE INDEX "Booking_sellerId_createdAt_idx" ON "Booking"("sellerId", "createdAt");
CREATE INDEX "Booking_listingId_startDate_endDate_idx" ON "Booking"("listingId", "startDate", "endDate");
CREATE INDEX "Booking_status_paymentStatus_idx" ON "Booking"("status", "paymentStatus");

CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");

CREATE UNIQUE INDEX "Wallet_sellerId_key" ON "Wallet"("sellerId");

CREATE UNIQUE INDEX "Withdraw_externalDisbursementId_key" ON "Withdraw"("externalDisbursementId");
CREATE INDEX "Withdraw_sellerId_status_requestedAt_idx" ON "Withdraw"("sellerId", "status", "requestedAt");
CREATE INDEX "Withdraw_walletId_idx" ON "Withdraw"("walletId");

CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX "WalletTransaction_sellerId_createdAt_idx" ON "WalletTransaction"("sellerId", "createdAt");
CREATE INDEX "WalletTransaction_type_status_idx" ON "WalletTransaction"("type", "status");

CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");
CREATE INDEX "Review_listingId_createdAt_idx" ON "Review"("listingId", "createdAt");
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");
CREATE INDEX "Review_status_idx" ON "Review"("status");

CREATE INDEX "Audit_actorId_createdAt_idx" ON "Audit"("actorId", "createdAt");
CREATE INDEX "Audit_targetType_targetId_idx" ON "Audit"("targetType", "targetId");
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

ALTER TABLE "SellerProfile"
  ADD CONSTRAINT "SellerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Listing"
  ADD CONSTRAINT "Listing_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingImage"
  ADD CONSTRAINT "ListingImage_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingAvailability"
  ADD CONSTRAINT "ListingAvailability_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wallet"
  ADD CONSTRAINT "Wallet_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Withdraw"
  ADD CONSTRAINT "Withdraw_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Withdraw"
  ADD CONSTRAINT "Withdraw_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_withdrawId_fkey"
  FOREIGN KEY ("withdrawId") REFERENCES "Withdraw"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Audit"
  ADD CONSTRAINT "Audit_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_check"
  CHECK ("rating" >= 1 AND "rating" <= 5);
