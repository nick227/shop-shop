-- AlterTable
ALTER TABLE `Cart` ADD COLUMN `expiresAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Cart_expiresAt_idx` ON `Cart`(`expiresAt`);
