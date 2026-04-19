-- Alter enum-backed columns to register AFFILIATE as an official role.
ALTER TABLE `User`
    MODIFY COLUMN `role` ENUM('SUPER_ADMIN', 'ADMIN', 'KASIR', 'SELLER', 'AFFILIATE', 'USER') NOT NULL DEFAULT 'USER';

ALTER TABLE `Audit`
    MODIFY COLUMN `actorRole` ENUM('SUPER_ADMIN', 'ADMIN', 'KASIR', 'SELLER', 'AFFILIATE', 'USER') NULL;

-- Affiliate master profile, tracking, and withdraw requests.
CREATE TABLE `AffiliateProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `bankCode` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `commissionRateBps` INTEGER NOT NULL DEFAULT 500,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateProfile_userId_key`(`userId`),
    UNIQUE INDEX `AffiliateProfile_code_key`(`code`),
    INDEX `AffiliateProfile_code_idx`(`code`),
    INDEX `AffiliateProfile_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AffiliateClick` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `landingPath` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `visitorKey` VARCHAR(191) NULL,
    `sessionKey` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AffiliateClick_affiliateId_createdAt_idx`(`affiliateId`, `createdAt`),
    INDEX `AffiliateClick_code_createdAt_idx`(`code`, `createdAt`),
    INDEX `AffiliateClick_visitorKey_createdAt_idx`(`visitorKey`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AffiliateWithdraw` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `provider` ENUM('XENDIT', 'MANUAL') NOT NULL DEFAULT 'XENDIT',
    `externalDisbursementId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateWithdraw_externalDisbursementId_key`(`externalDisbursementId`),
    INDEX `AffiliateWithdraw_affiliateId_status_requestedAt_idx`(`affiliateId`, `status`, `requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AffiliateProfile`
    ADD CONSTRAINT `AffiliateProfile_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AffiliateClick`
    ADD CONSTRAINT `AffiliateClick_affiliateId_fkey`
    FOREIGN KEY (`affiliateId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AffiliateWithdraw`
    ADD CONSTRAINT `AffiliateWithdraw_affiliateId_fkey`
    FOREIGN KEY (`affiliateId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
