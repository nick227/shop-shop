-- AlterEnum
ALTER TABLE `User` MODIFY `role` ENUM('USER', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `Store` ADD COLUMN `referredByAffiliateId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `Store` ADD INDEX `Store_referredByAffiliateId_idx`(`referredByAffiliateId`);

-- CreateTable
CREATE TABLE `Affiliate` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'PENDING',
    `referralCode` VARCHAR(191) NOT NULL,
    `commissionRate` DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
    `paypalEmail` VARCHAR(191) NULL,
    `bankAccountJson` JSON NULL,
    `taxId` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Affiliate_userId_key`(`userId`),
    UNIQUE INDEX `Affiliate_referralCode_key`(`referralCode`),
    INDEX `Affiliate_referralCode_idx`(`referralCode`),
    INDEX `Affiliate_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `rate` DECIMAL(5, 4) NOT NULL,
    `serviceFeeBase` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PAID', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `payoutId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Commission_affiliateId_status_idx`(`affiliateId`, `status`),
    INDEX `Commission_orderId_idx`(`orderId`),
    INDEX `Commission_payoutId_idx`(`payoutId`),
    INDEX `Commission_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliatePayout` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AffiliatePayout_affiliateId_status_idx`(`affiliateId`, `status`),
    INDEX `AffiliatePayout_status_periodEnd_idx`(`status`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryZone` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `polygonJson` JSON NOT NULL,
    `baseFee` DECIMAL(10, 2) NOT NULL,
    `minOrder` DECIMAL(10, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DeliveryZone_storeId_isActive_idx`(`storeId`, `isActive`),
    INDEX `DeliveryZone_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorVerification` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NOT NULL,
    `documentsJson` JSON NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `reviewNotes` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `stripeAccountId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VendorVerification_userId_key`(`userId`),
    INDEX `VendorVerification_status_idx`(`status`),
    INDEX `VendorVerification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_referredByAffiliateId_fkey` FOREIGN KEY (`referredByAffiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affiliate` ADD CONSTRAINT `Affiliate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_payoutId_fkey` FOREIGN KEY (`payoutId`) REFERENCES `AffiliatePayout`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliatePayout` ADD CONSTRAINT `AffiliatePayout_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryZone` ADD CONSTRAINT `DeliveryZone_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorVerification` ADD CONSTRAINT `VendorVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

