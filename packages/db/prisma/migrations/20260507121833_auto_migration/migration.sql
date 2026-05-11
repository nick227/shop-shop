-- AlterTable
ALTER TABLE `Order` ADD COLUMN `referredByAffiliateId` CHAR(36) NULL,
    ADD COLUMN `referredByReferralCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_referredByAffiliateId_idx` ON `Order`(`referredByAffiliateId`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_referredByAffiliateId_fkey` FOREIGN KEY (`referredByAffiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
