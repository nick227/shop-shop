-- Phase 1: Affiliate system schema additions
-- Enums are implemented as column-level ENUM types in MySQL (no separate ALTER needed)
-- New models, new columns, and new indexes only — no existing columns dropped.

-- CreateTable: AffiliatePayoutGroup
CREATE TABLE `AffiliatePayoutGroup` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `customerRateBps` INTEGER NOT NULL DEFAULT 500,
    `storeRateBps` INTEGER NOT NULL DEFAULT 500,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AffiliatePayoutGroup_isDefault_idx`(`isDefault`),
    INDEX `AffiliatePayoutGroup_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ReferralEvent
CREATE TABLE `ReferralEvent` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `eventType` ENUM('STORE_SIGNUP', 'USER_SIGNUP') NOT NULL,
    `referredUserId` CHAR(36) NULL,
    `referredStoreId` CHAR(36) NULL,
    `referralCode` VARCHAR(191) NULL,
    `referralSlug` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReferralEvent_affiliateId_idx`(`affiliateId`),
    INDEX `ReferralEvent_eventType_idx`(`eventType`),
    INDEX `ReferralEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: User — add referralAttributedAt
ALTER TABLE `User`
    ADD COLUMN `referralAttributedAt` DATETIME(3) NULL;

-- AlterTable: Affiliate — add Phase 1 fields
ALTER TABLE `Affiliate`
    ADD COLUMN `referralSlug` VARCHAR(100) NULL,
    ADD COLUMN `payoutGroupId` CHAR(36) NULL,
    ADD COLUMN `customerRateBpsOverride` INTEGER NULL,
    ADD COLUMN `storeRateBpsOverride` INTEGER NULL,
    ADD COLUMN `payoutProvider` ENUM('MANUAL', 'STRIPE_CONNECT', 'PAYPAL', 'ACH_PROVIDER') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `payoutProviderAccountId` VARCHAR(191) NULL,
    ADD COLUMN `payoutProviderStatus` ENUM('NOT_SET', 'PENDING', 'ACTIVE', 'SUSPENDED', 'FAILED') NOT NULL DEFAULT 'NOT_SET';

-- Unique index on referralSlug
CREATE UNIQUE INDEX `Affiliate_referralSlug_key` ON `Affiliate`(`referralSlug`);

-- Indexes on new Affiliate columns
CREATE INDEX `Affiliate_referralSlug_idx` ON `Affiliate`(`referralSlug`);
CREATE INDEX `Affiliate_payoutGroupId_idx` ON `Affiliate`(`payoutGroupId`);

-- AlterTable: Commission — add Phase 1 fields (all nullable for backward compat)
ALTER TABLE `Commission`
    ADD COLUMN `sourceType` ENUM('CUSTOMER_PURCHASE', 'STORE_REVENUE', 'MANUAL') NULL,
    ADD COLUMN `commissionBaseCents` INTEGER NULL,
    ADD COLUMN `rateBps` INTEGER NULL,
    ADD COLUMN `amountCents` INTEGER NULL,
    ADD COLUMN `rateSource` ENUM('PAYOUT_GROUP', 'USER_OVERRIDE', 'PLATFORM_DEFAULT') NULL,
    ADD COLUMN `payoutGroupIdSnapshot` VARCHAR(36) NULL;

-- Idempotency unique guard (MySQL allows multiple NULLs, so existing rows are unaffected)
CREATE UNIQUE INDEX `Commission_affiliateId_orderId_sourceType_key`
    ON `Commission`(`affiliateId`, `orderId`, `sourceType`);

-- AddForeignKey: Affiliate → AffiliatePayoutGroup
ALTER TABLE `Affiliate`
    ADD CONSTRAINT `Affiliate_payoutGroupId_fkey`
    FOREIGN KEY (`payoutGroupId`) REFERENCES `AffiliatePayoutGroup`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ReferralEvent → Affiliate
ALTER TABLE `ReferralEvent`
    ADD CONSTRAINT `ReferralEvent_affiliateId_fkey`
    FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: SystemSettings (affiliate defaults)
INSERT INTO `SystemSetting` (`key`, `value`, `updatedAt`) VALUES
    ('platform.affiliate_customer_rate_bps', '500', NOW()),
    ('platform.affiliate_store_rate_bps', '500', NOW()),
    ('platform.affiliate_attribution_window_days', '60', NOW()),
    ('platform.affiliate_payout_minimum_cents', '2500', NOW()),
    ('platform.affiliate_max_burden_bps', '5000', NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedAt` = NOW();

-- Seed: AffiliatePayoutGroup rows
INSERT INTO `AffiliatePayoutGroup` (`id`, `name`, `customerRateBps`, `storeRateBps`, `isDefault`, `isActive`, `createdAt`, `updatedAt`) VALUES
    (UUID(), 'Standard Affiliate', 500,  500,  true,  true, NOW(), NOW()),
    (UUID(), 'Store Recruiter',    500,  1500, false, true, NOW(), NOW()),
    (UUID(), 'Sales Partner',      1000, 2000, false, true, NOW(), NOW()),
    (UUID(), 'Founding Partner',   1000, 2500, false, true, NOW(), NOW());
