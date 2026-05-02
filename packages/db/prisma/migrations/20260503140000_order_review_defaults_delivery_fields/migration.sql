-- Align Order default with Stripe checkout; optional delivery distance/ETA; index delivery coords

ALTER TABLE `Order` MODIFY COLUMN `status`
  ENUM('PENDING_PAYMENT','PLACED','ACCEPTED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','CANCELED')
  NOT NULL DEFAULT 'PENDING_PAYMENT';

ALTER TABLE `Order` ADD COLUMN `deliveryDistanceMiles` DECIMAL(6, 2) NULL;
ALTER TABLE `Order` ADD COLUMN `estimatedDeliveryAt` DATETIME(3) NULL;

CREATE INDEX `Order_deliveryLatitude_deliveryLongitude_idx` ON `Order` (`deliveryLatitude`, `deliveryLongitude`);
