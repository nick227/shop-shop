-- Merchant-controlled order pause, kept apart from the administrative `status` column.
ALTER TABLE `Store` ADD COLUMN `acceptingOrders` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ordersPausedAt` DATETIME(3) NULL,
    ADD COLUMN `ordersPausedByUserId` CHAR(36) NULL,
    ADD COLUMN `ordersPausedReason` VARCHAR(200) NULL;
