ALTER TABLE `User`
  ADD COLUMN `adminCanManageAccounts` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `adminCanReviewPasswordResets` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `archivedAt` DATETIME(3) NULL;

CREATE INDEX `User_archivedAt_idx` ON `User`(`archivedAt`);
