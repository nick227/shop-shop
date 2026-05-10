-- CreateTable
CREATE TABLE `PayoutAuditLog` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `affiliatePayoutId` CHAR(36) NOT NULL,
    `action` ENUM('CREATED', 'APPROVED', 'PAID', 'REVERSED', 'MODIFIED') NOT NULL DEFAULT 'CREATED',
    `performedBy` CHAR(36) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PayoutAuditLog_affiliateId_performedAt_idx`(`affiliateId`, `performedAt`),
    INDEX `PayoutAuditLog_affiliatePayoutId_action_idx`(`affiliatePayoutId`, `action`),
    INDEX `PayoutAuditLog_performedAt_idx`(`performedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PayoutAuditLog` ADD CONSTRAINT `PayoutAuditLog_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutAuditLog` ADD CONSTRAINT `PayoutAuditLog_affiliatePayoutId_fkey` FOREIGN KEY (`affiliatePayoutId`) REFERENCES `AffiliatePayout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
