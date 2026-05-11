-- AlterTable
ALTER TABLE `Item` ADD COLUMN `flagged` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `flaggedAt` DATETIME(3) NULL,
    ADD COLUMN `flaggedByAdminId` CHAR(36) NULL,
    ADD COLUMN `flaggedReason` TEXT NULL;
