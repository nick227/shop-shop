-- Directory listings are not merchant accounts. Ordering stays on Store.

CREATE TABLE `BusinessListing` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `categoryLabel` VARCHAR(80) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `website` TEXT NULL,
    `description` TEXT NULL,
    `addressStreet` VARCHAR(160) NULL,
    `addressCity` VARCHAR(80) NULL,
    `addressState` CHAR(2) NULL,
    `addressZip` CHAR(5) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `placeId` CHAR(36) NULL,
    `storeId` CHAR(36) NULL,
    `source` VARCHAR(20) NOT NULL,
    `sourceId` VARCHAR(80) NOT NULL,
    `sourceFetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BusinessListing_slug_key`(`slug`),
    UNIQUE INDEX `BusinessListing_storeId_key`(`storeId`),
    UNIQUE INDEX `BusinessListing_sourceId_key`(`sourceId`),
    INDEX `BusinessListing_published_latitude_idx`(`published`, `latitude`),
    INDEX `BusinessListing_placeId_idx`(`placeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BusinessImportBatch` (
    `id` CHAR(36) NOT NULL,
    `adminId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BusinessImportBatch_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BusinessImportEntry` (
    `id` CHAR(36) NOT NULL,
    `batchId` CHAR(36) NOT NULL,
    `submittedName` VARCHAR(160) NOT NULL,
    `status` ENUM('PENDING', 'SEARCHING', 'MATCHED', 'READY', 'REVIEW', 'EXISTING', 'NOT_FOUND', 'IMPORTED') NOT NULL,
    `candidates` JSON NOT NULL,
    `selectedSourceId` VARCHAR(80) NULL,
    `listingId` CHAR(36) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BusinessImportEntry_batchId_idx`(`batchId`),
    INDEX `BusinessImportEntry_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BusinessListing` ADD CONSTRAINT `BusinessListing_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `BusinessListing` ADD CONSTRAINT `BusinessListing_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `BusinessImportEntry` ADD CONSTRAINT `BusinessImportEntry_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `BusinessImportBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `BusinessImportEntry` ADD CONSTRAINT `BusinessImportEntry_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `BusinessListing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
