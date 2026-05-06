-- Add DeliveryJob to support delivery execution providers.
-- MVP: sandbox/mock providers only; no production third-party access required.

CREATE TABLE `DeliveryJob` (
  `id` CHAR(36) NOT NULL,
  `orderId` CHAR(36) NOT NULL,
  `storeId` CHAR(36) NOT NULL,
  `provider` ENUM('IN_HOUSE','DOORDASH_DRIVE','UBER_DIRECT') NOT NULL,
  `status` ENUM('REQUESTED','DISPATCHED','CANCELED','FAILED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  `providerExternalId` VARCHAR(191) NULL,
  `trackingUrl` VARCHAR(191) NULL,
  `providerStatus` VARCHAR(191) NULL,
  `providerPayload` JSON NULL,
  `requestedByUserId` CHAR(36) NULL,
  `canceledAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `DeliveryJob_orderId_idx` (`orderId`),
  INDEX `DeliveryJob_storeId_idx` (`storeId`),
  INDEX `DeliveryJob_providerExternalId_idx` (`providerExternalId`),
  CONSTRAINT `DeliveryJob_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DeliveryJob_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DeliveryJob_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

