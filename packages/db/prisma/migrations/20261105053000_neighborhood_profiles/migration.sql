-- Neighborhood profile copy and images live on the existing Place row.

ALTER TABLE `Place`
  ADD COLUMN `headline` VARCHAR(160) NULL,
  ADD COLUMN `about` TEXT NULL,
  ADD COLUMN `published` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `MediaAsset` ADD COLUMN `placeId` CHAR(36) NULL;
CREATE INDEX `MediaAsset_placeId_idx` ON `MediaAsset`(`placeId`);
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
