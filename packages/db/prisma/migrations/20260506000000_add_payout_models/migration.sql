-- Add payout and accounting snapshot tables.
-- All monetary snapshot fields are stored as integer cents.

CREATE TABLE `Payout` (
  `id` CHAR(36) NOT NULL,
  `vendorUserId` CHAR(36) NOT NULL,
  `periodStart` DATETIME(3) NOT NULL,
  `periodEnd` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `grossSalesCents` INT NOT NULL DEFAULT 0,
  `discountsCents` INT NOT NULL DEFAULT 0,
  `refundsCents` INT NOT NULL DEFAULT 0,
  `tipsCents` INT NOT NULL DEFAULT 0,
  `platformFeesCents` INT NOT NULL DEFAULT 0,
  `processorFeesCents` INT NOT NULL DEFAULT 0,
  `netPayoutCents` INT NOT NULL DEFAULT 0,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `providerPayoutId` VARCHAR(191) NULL,
  `providerTransferId` VARCHAR(191) NULL,
  `arrivalAt` DATETIME(3) NULL,
  `createdByUserId` CHAR(36) NULL,
  `completedAt` DATETIME(3) NULL,
  `failedAt` DATETIME(3) NULL,
  `failureReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `Payout_vendorUserId_periodStart_periodEnd_idx` (`vendorUserId`, `periodStart`, `periodEnd`),
  INDEX `Payout_status_idx` (`status`),
  INDEX `Payout_providerPayoutId_idx` (`providerPayoutId`),
  CONSTRAINT `Payout_vendorUserId_fkey` FOREIGN KEY (`vendorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayoutOrder` (
  `id` CHAR(36) NOT NULL,
  `payoutId` CHAR(36) NOT NULL,
  `orderId` CHAR(36) NOT NULL,

  `orderCreatedAt` DATETIME(3) NOT NULL,
  `orderStatus` ENUM(
    'PENDING_PAYMENT',
    'PLACED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELED'
  ) NOT NULL,
  `paymentStatus` ENUM('UNPAID','PAID','REFUNDED') NOT NULL,

  `grossSalesCents` INT NOT NULL DEFAULT 0,
  `discountsCents` INT NOT NULL DEFAULT 0,
  `refundsCents` INT NOT NULL DEFAULT 0,
  `tipsCents` INT NOT NULL DEFAULT 0,
  `platformFeesCents` INT NOT NULL DEFAULT 0,
  `processorFeesCents` INT NOT NULL DEFAULT 0,
  `netContributionCents` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `PayoutOrder_orderId_key` (`orderId`),
  INDEX `PayoutOrder_payoutId_idx` (`payoutId`),
  CONSTRAINT `PayoutOrder_payoutId_fkey` FOREIGN KEY (`payoutId`) REFERENCES `Payout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PayoutOrder_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PayoutAdjustment` (
  `id` CHAR(36) NOT NULL,
  `payoutId` CHAR(36) NOT NULL,
  `type` ENUM('CREDIT','DEBIT') NOT NULL,
  `amountCents` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `createdByUserId` CHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `PayoutAdjustment_payoutId_idx` (`payoutId`),
  CONSTRAINT `PayoutAdjustment_payoutId_fkey` FOREIGN KEY (`payoutId`) REFERENCES `Payout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
