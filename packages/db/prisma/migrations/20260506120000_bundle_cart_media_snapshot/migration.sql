-- Migration: bundle_cart_media_snapshot
-- CartItem.itemId    → nullable (one-of: itemId | bundleId)
-- CartItem.bundleId  → new FK → Bundle
-- MediaAsset.bundleId→ new FK → Bundle (replaces imageUrl on Bundle)
-- Bundle.imageUrl    → dropped
-- OrderItem.bundleSnapshot → new JSON column for immutable purchase snapshot

-- CartItem: make itemId nullable so bundle-only lines are valid
ALTER TABLE `CartItem` MODIFY `itemId` CHAR(36) NULL;

-- CartItem: add bundleId FK
ALTER TABLE `CartItem` ADD COLUMN `bundleId` CHAR(36) NULL;
ALTER TABLE `CartItem` ADD INDEX `CartItem_bundleId_idx` (`bundleId`);
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_bundleId_fkey`
  FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- MediaAsset: add bundleId FK
ALTER TABLE `MediaAsset` ADD COLUMN `bundleId` CHAR(36) NULL;
ALTER TABLE `MediaAsset` ADD INDEX `MediaAsset_bundleId_idx` (`bundleId`);
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_bundleId_fkey`
  FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Bundle: drop imageUrl (replaced by MediaAsset relation)
ALTER TABLE `Bundle` DROP COLUMN `imageUrl`;

-- Bundle: compound index for storeId+isActive public listing queries
ALTER TABLE `Bundle` ADD INDEX `Bundle_storeId_isActive_idx` (`storeId`, `isActive`);

-- OrderItem: bundleSnapshot JSON for permanent purchase history
ALTER TABLE `OrderItem` ADD COLUMN `bundleSnapshot` JSON NULL;
