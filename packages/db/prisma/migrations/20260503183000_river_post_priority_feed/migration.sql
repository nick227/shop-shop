-- River MVP: priority ordering, layout/source, automation idempotency, optional item link

ALTER TABLE `Post`
  ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `layout` VARCHAR(64) NOT NULL DEFAULT 'instagram_basic',
  ADD COLUMN `source` ENUM('MANUAL', 'AUTO_STORE', 'AUTO_PRODUCT') NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN `automationKey` VARCHAR(128) NULL,
  ADD COLUMN `linkedItemId` CHAR(36) NULL;

CREATE UNIQUE INDEX `Post_automationKey_key` ON `Post`(`automationKey`);
CREATE INDEX `Post_priority_createdAt_id_idx` ON `Post`(`priority`, `createdAt`, `id`);

ALTER TABLE `Post`
  ADD CONSTRAINT `Post_linkedItemId_fkey` FOREIGN KEY (`linkedItemId`) REFERENCES `Item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
