-- Neighborhood tags: a shared vocabulary with explicit discovery query mappings, pinned to places through PlaceTag.

CREATE TABLE `NeighborhoodTag` (
  `id` CHAR(36) NOT NULL,
  `slug` VARCHAR(160) NOT NULL,
  `label` VARCHAR(60) NOT NULL,
  `kind` ENUM('EDITORIAL', 'DISCOVERY') NOT NULL,
  `categoryId` VARCHAR(32) NULL,
  `searchQuery` VARCHAR(80) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `NeighborhoodTag_slug_key` (`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlaceTag` (
  `placeId` CHAR(36) NOT NULL,
  `tagId` CHAR(36) NOT NULL,
  `label` VARCHAR(60) NULL,
  `sortIndex` INTEGER NOT NULL DEFAULT 0,
  `visible` BOOLEAN NOT NULL DEFAULT true,
  INDEX `PlaceTag_tagId_idx` (`tagId`),
  PRIMARY KEY (`placeId`, `tagId`),
  CONSTRAINT `PlaceTag_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PlaceTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `NeighborhoodTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
