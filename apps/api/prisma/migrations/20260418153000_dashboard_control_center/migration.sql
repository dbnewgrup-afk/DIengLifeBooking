-- CreateTable
CREATE TABLE `DashboardNotice` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `audience` ENUM('SELLER', 'AFFILIATE', 'ALL_USERS') NOT NULL,
    `ctaLabel` VARCHAR(80) NULL,
    `ctaHref` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DashboardNotice_audience_isActive_sortOrder_idx`(`audience`, `isActive`, `sortOrder`),
    INDEX `DashboardNotice_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    INDEX `DashboardNotice_createdById_createdAt_idx`(`createdById`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DashboardNotice`
ADD CONSTRAINT `DashboardNotice_createdById_fkey`
FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
