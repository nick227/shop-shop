ALTER TABLE `BusinessListing` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX `BusinessListing_addressZip_idx` ON `BusinessListing`(`addressZip`);
CREATE INDEX `BusinessListing_published_category_idx` ON `BusinessListing`(`published`, `category`);

CREATE TABLE `ListingNeighborhood` (
  `listingId` CHAR(36) NOT NULL,
  `placeId` CHAR(36) NOT NULL,
  `featured` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`listingId`, `placeId`),
  INDEX `ListingNeighborhood_placeId_featured_idx` (`placeId`, `featured`),
  CONSTRAINT `ListingNeighborhood_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `BusinessListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ListingNeighborhood_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MediaAsset` ADD COLUMN `listingId` CHAR(36) NULL;
CREATE INDEX `MediaAsset_listingId_idx` ON `MediaAsset`(`listingId`);
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `BusinessListing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
