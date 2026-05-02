-- AlterTable
ALTER TABLE `Order` ADD COLUMN `assignedToUserId` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `Order_assignedToUserId_idx` ON `Order`(`assignedToUserId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
