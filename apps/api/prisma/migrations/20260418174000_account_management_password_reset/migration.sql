-- AlterTable
ALTER TABLE `User`
ADD COLUMN `passwordResetEnabled` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `passwordResetEnabledAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `PasswordResetAccessRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `note` VARCHAR(500) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PasswordResetAccessRequest_userId_status_requestedAt_idx`(`userId`, `status`, `requestedAt`),
    INDEX `PasswordResetAccessRequest_status_requestedAt_idx`(`status`, `requestedAt`),
    INDEX `PasswordResetAccessRequest_reviewedById_reviewedAt_idx`(`reviewedById`, `reviewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_passwordResetEnabled_role_idx` ON `User`(`passwordResetEnabled`, `role`);

-- AddForeignKey
ALTER TABLE `PasswordResetAccessRequest`
ADD CONSTRAINT `PasswordResetAccessRequest_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetAccessRequest`
ADD CONSTRAINT `PasswordResetAccessRequest_reviewedById_fkey`
FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
