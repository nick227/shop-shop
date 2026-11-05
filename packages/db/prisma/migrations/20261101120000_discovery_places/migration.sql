-- Canonical places and ZIP codes for discovery. Store address columns stay.

CREATE TABLE `Place` (
    `id` CHAR(36) NOT NULL,
    `kind` ENUM('CITY', 'NEIGHBORHOOD') NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `parentId` CHAR(36) NULL,
    `state` CHAR(2) NULL,
    `country` CHAR(2) NOT NULL DEFAULT 'US',
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `boundaryJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Place_slug_key`(`slug`),
    INDEX `Place_parentId_idx`(`parentId`),
    INDEX `Place_kind_state_idx`(`kind`, `state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PostalCode` (
    `code` CHAR(5) NOT NULL,
    `cityPlaceId` CHAR(36) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `boundaryJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PostalCode_cityPlaceId_idx`(`cityPlaceId`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlacePostalCode` (
    `placeId` CHAR(36) NOT NULL,
    `postalCode` CHAR(5) NOT NULL,

    INDEX `PlacePostalCode_postalCode_idx`(`postalCode`),
    PRIMARY KEY (`placeId`, `postalCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UnresolvedStorePlace` (
    `storeId` CHAR(36) NOT NULL,
    `reason` ENUM('NO_LOCATION', 'UNKNOWN_ZIP', 'UNKNOWN_CITY') NOT NULL,
    `addressCity` VARCHAR(191) NULL,
    `addressState` VARCHAR(2) NULL,
    `addressZip` VARCHAR(10) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Store` ADD COLUMN `placeId` CHAR(36) NULL;
CREATE INDEX `Store_placeId_idx` ON `Store`(`placeId`);

ALTER TABLE `Place` ADD CONSTRAINT `Place_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Place`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PostalCode` ADD CONSTRAINT `PostalCode_cityPlaceId_fkey` FOREIGN KEY (`cityPlaceId`) REFERENCES `Place`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PlacePostalCode` ADD CONSTRAINT `PlacePostalCode_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PlacePostalCode` ADD CONSTRAINT `PlacePostalCode_postalCode_fkey` FOREIGN KEY (`postalCode`) REFERENCES `PostalCode`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Store` ADD CONSTRAINT `Store_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `UnresolvedStorePlace` ADD CONSTRAINT `UnresolvedStorePlace_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
