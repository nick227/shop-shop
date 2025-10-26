-- AlterTable
ALTER TABLE `Promotion` ADD COLUMN `usageLimitPerUser` INTEGER NULL;
ALTER TABLE `Promotion` ADD COLUMN `allowStacking` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Promotion` ADD COLUMN `eligibleUserIds` JSON NULL;
ALTER TABLE `Promotion` ADD COLUMN `excludedUserIds` JSON NULL;

-- CreateTable
CREATE TABLE `PromotionRedemption` (
    `id` CHAR(36) NOT NULL,
    `promotionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL,
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromotionRedemption_promotionId_userId_idx`(`promotionId`, `userId`),
    INDEX `PromotionRedemption_userId_idx`(`userId`),
    INDEX `PromotionRedemption_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

