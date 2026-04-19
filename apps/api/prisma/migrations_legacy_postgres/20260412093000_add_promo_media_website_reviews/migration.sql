-- AlterTable
ALTER TABLE `PromoPackage`
  ADD COLUMN `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN `terms` TEXT NULL;

-- CreateTable
CREATE TABLE `WebsiteReview` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NULL,
  `rating` INTEGER NOT NULL,
  `comment` TEXT NOT NULL,
  `imageUrl` LONGTEXT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `WebsiteReview_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `WebsiteReview_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WebsiteReview`
  ADD CONSTRAINT `WebsiteReview_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
