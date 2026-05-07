-- AlterTable
ALTER TABLE `user` ADD COLUMN `referredByAffiliateId` CHAR(36) NULL,
    ADD COLUMN `referredByReferralCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_referredByAffiliateId_idx` ON `User`(`referredByAffiliateId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_referredByAffiliateId_fkey` FOREIGN KEY (`referredByAffiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
