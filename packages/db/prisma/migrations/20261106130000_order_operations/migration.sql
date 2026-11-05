ALTER TABLE `Store` ADD COLUMN `autoAcceptOrders` BOOLEAN NOT NULL DEFAULT false, ADD COLUMN `acceptanceTimeoutMin` INTEGER NOT NULL DEFAULT 10;
ALTER TABLE `Order`
 ADD COLUMN `version` INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN `promisedReadyAt` DATETIME(3) NULL,
 ADD COLUMN `acceptedAt` DATETIME(3) NULL,
 ADD COLUMN `readyAt` DATETIME(3) NULL,
 ADD COLUMN `collectedAt` DATETIME(3) NULL,
 ADD COLUMN `collectionCode` VARCHAR(12) NULL,
 ADD COLUMN `acceptanceDeadline` DATETIME(3) NULL,
 ADD COLUMN `refundState` VARCHAR(24) NOT NULL DEFAULT 'NONE',
 ADD COLUMN `refundError` TEXT NULL;
ALTER TABLE `OrderEvent` ADD COLUMN `actorId` CHAR(36) NULL, ADD COLUMN `operationId` VARCHAR(100) NULL, ADD COLUMN `requestFingerprint` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `OrderEvent_operationId_key` ON `OrderEvent` (`operationId`);
CREATE TABLE `OrderWork` (
 `id` CHAR(36) NOT NULL, `orderId` CHAR(36) NOT NULL, `kind` VARCHAR(24) NOT NULL,
 `payload` JSON NOT NULL, `attempts` INTEGER NOT NULL DEFAULT 0,
 `availableAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `completedAt` DATETIME(3) NULL,
 `lastError` TEXT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id`), INDEX `OrderWork_completedAt_availableAt_idx` (`completedAt`, `availableAt`), INDEX `OrderWork_orderId_idx` (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing orders require manual review; only new orders enter acceptance automation.
ALTER TABLE `Order` ADD COLUMN `automationEligible` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Order` ALTER COLUMN `automationEligible` SET DEFAULT true;

ALTER TABLE `OrderWork` ADD CONSTRAINT `OrderWork_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
