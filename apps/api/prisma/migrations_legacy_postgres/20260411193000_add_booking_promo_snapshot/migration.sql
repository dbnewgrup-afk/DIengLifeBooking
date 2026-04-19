ALTER TABLE `Booking`
  ADD COLUMN `buyerEmail` VARCHAR(191) NULL,
  ADD COLUMN `buyerPhone` VARCHAR(191) NULL,
  ADD COLUMN `promoPackageId` VARCHAR(191) NULL,
  ADD COLUMN `promoCode` VARCHAR(191) NULL,
  ADD COLUMN `promoTitle` VARCHAR(191) NULL;

CREATE INDEX `Booking_promoPackageId_idx` ON `Booking`(`promoPackageId`);

ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_promoPackageId_fkey`
  FOREIGN KEY (`promoPackageId`) REFERENCES `PromoPackage`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
