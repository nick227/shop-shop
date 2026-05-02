-- Canonical delivery coordinates on Order (self-contained for maps / navigation)

ALTER TABLE `Order` ADD COLUMN `deliveryLatitude` DECIMAL(10, 8) NULL;
ALTER TABLE `Order` ADD COLUMN `deliveryLongitude` DECIMAL(11, 8) NULL;
