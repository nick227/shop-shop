-- AlterTable Item - Add dietary and allergen fields
ALTER TABLE `Item` ADD COLUMN `allergensJson` JSON NULL;
ALTER TABLE `Item` ADD COLUMN `isVegan` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Item` ADD COLUMN `isVegetarian` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Item` ADD COLUMN `isGlutenFree` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Item` ADD COLUMN `isDairyFree` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Item` ADD COLUMN `spicyLevel` INTEGER NULL;

-- Add index for dietary filters
CREATE INDEX `Item_isVegan_isVegetarian_isGlutenFree_idx` ON `Item`(`isVegan`, `isVegetarian`, `isGlutenFree`);

-- AlterTable Order - Add cancellation and refund tracking
ALTER TABLE `Order` ADD COLUMN `cancelReason` TEXT NULL;
ALTER TABLE `Order` ADD COLUMN `canceledBy` CHAR(36) NULL;
ALTER TABLE `Order` ADD COLUMN `canceledAt` DATETIME(3) NULL;
ALTER TABLE `Order` ADD COLUMN `refundReason` TEXT NULL;
ALTER TABLE `Order` ADD COLUMN `refundedAt` DATETIME(3) NULL;

-- Add index for cancellation queries
CREATE INDEX `Order_status_canceledAt_idx` ON `Order`(`status`, `canceledAt`);

