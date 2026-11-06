-- National ZIP reference data, kept apart from served places (PostalCode / Place).

CREATE TABLE `ReferenceDataset` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(60) NOT NULL,
  `source` VARCHAR(20) NOT NULL,
  `sourceUrl` VARCHAR(255) NOT NULL,
  `sourceDate` DATETIME(3) NOT NULL,
  `checksum` CHAR(64) NOT NULL,
  `license` VARCHAR(60) NOT NULL,
  `attribution` VARCHAR(255) NOT NULL,
  `recordCount` INTEGER NOT NULL,
  `skippedCount` INTEGER NOT NULL,
  `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ReferenceDataset_name_checksum_key` (`name`, `checksum`),
  INDEX `ReferenceDataset_name_importedAt_idx` (`name`, `importedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ZipReference` (
  `zip` CHAR(5) NOT NULL,
  `city` VARCHAR(120) NOT NULL,
  `state` CHAR(2) NOT NULL,
  `county` VARCHAR(120) NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `accuracy` TINYINT NULL,
  `source` VARCHAR(20) NOT NULL,
  `sourceDate` DATETIME(3) NOT NULL,
  `datasetId` CHAR(36) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ZipReference_state_idx` (`state`),
  INDEX `ZipReference_datasetId_idx` (`datasetId`),
  PRIMARY KEY (`zip`),
  CONSTRAINT `ZipReference_datasetId_fkey` FOREIGN KEY (`datasetId`) REFERENCES `ReferenceDataset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
