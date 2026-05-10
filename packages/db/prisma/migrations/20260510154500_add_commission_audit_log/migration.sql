-- CreateTable
CREATE TABLE `CommissionAuditLog` (
    `id` CHAR(36) NOT NULL,
    `commissionId` CHAR(36) NOT NULL,
    `action` ENUM('AUTO_APPROVED', 'AUTO_REVERSED', 'MANUAL_APPROVED', 'MANUAL_REVERSED') NOT NULL DEFAULT 'AUTO_APPROVED',
    `performedBy` CHAR(36) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommissionAuditLog_commissionId_performedAt_idx`(`commissionId`, `performedAt`),
    INDEX `CommissionAuditLog_action_performedAt_idx`(`action`, `performedAt`),
    INDEX `CommissionAuditLog_performedAt_idx`(`performedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommissionAuditLog` ADD CONSTRAINT `CommissionAuditLog_commissionId_fkey` FOREIGN KEY (`commissionId`) REFERENCES `Commission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
