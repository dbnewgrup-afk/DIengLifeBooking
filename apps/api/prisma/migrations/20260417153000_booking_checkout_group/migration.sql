ALTER TABLE `Booking`
    ADD COLUMN `checkoutCode` VARCHAR(191) NULL;

CREATE INDEX `Booking_checkoutCode_idx` ON `Booking`(`checkoutCode`);
