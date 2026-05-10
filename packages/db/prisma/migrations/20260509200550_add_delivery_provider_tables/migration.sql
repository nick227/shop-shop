-- CreateTable
CREATE TABLE `StoreDeliveryProviderConfig` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `settingsJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StoreDeliveryProviderConfig_storeId_idx`(`storeId`),
    INDEX `StoreDeliveryProviderConfig_provider_idx`(`provider`),
    INDEX `StoreDeliveryProviderConfig_enabled_idx`(`enabled`),
    UNIQUE INDEX `StoreDeliveryProviderConfig_storeId_provider_key`(`storeId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreDeliveryOption` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `deliveryMode` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `feeDisclosure` TEXT NULL,
    `externalInfoUrl` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StoreDeliveryOption_storeId_idx`(`storeId`),
    INDEX `StoreDeliveryOption_enabled_idx`(`enabled`),
    UNIQUE INDEX `StoreDeliveryOption_storeId_deliveryMode_key`(`storeId`, `deliveryMode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryProviderEvent` (
    `id` CHAR(36) NOT NULL,
    `deliveryJobId` CHAR(36) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryProviderEvent_deliveryJobId_idx`(`deliveryJobId`),
    INDEX `DeliveryProviderEvent_provider_idx`(`provider`),
    INDEX `DeliveryProviderEvent_processed_idx`(`processed`),
    INDEX `DeliveryProviderEvent_timestamp_idx`(`timestamp`),
    INDEX `DeliveryProviderEvent_eventType_idx`(`eventType`),
    UNIQUE INDEX `DeliveryProviderEvent_provider_eventId_deliveryJobId_key`(`provider`, `eventId`, `deliveryJobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryTrackingPoint` (
    `id` CHAR(36) NOT NULL,
    `deliveryJobId` CHAR(36) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `accuracyMeters` INTEGER NULL,
    `speedMph` DECIMAL(5, 2) NULL,
    `headingDegrees` INTEGER NULL,
    `providerPayload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeliveryTrackingPoint_deliveryJobId_idx`(`deliveryJobId`),
    INDEX `DeliveryTrackingPoint_provider_idx`(`provider`),
    INDEX `DeliveryTrackingPoint_timestamp_idx`(`timestamp`),
    INDEX `DeliveryTrackingPoint_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StoreDeliveryProviderConfig` ADD CONSTRAINT `StoreDeliveryProviderConfig_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreDeliveryOption` ADD CONSTRAINT `StoreDeliveryOption_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryProviderEvent` ADD CONSTRAINT `DeliveryProviderEvent_deliveryJobId_fkey` FOREIGN KEY (`deliveryJobId`) REFERENCES `DeliveryJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryTrackingPoint` ADD CONSTRAINT `DeliveryTrackingPoint_deliveryJobId_fkey` FOREIGN KEY (`deliveryJobId`) REFERENCES `DeliveryJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
