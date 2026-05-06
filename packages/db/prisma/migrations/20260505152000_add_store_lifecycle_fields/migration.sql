ALTER TABLE `Store`
  ADD COLUMN `status` ENUM('ACTIVE', 'PAUSED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `disabledAt` DATETIME(3) NULL,
  ADD COLUMN `disabledByUserId` CHAR(36) NULL,
  ADD COLUMN `disabledReason` TEXT NULL;

CREATE INDEX `Store_status_idx` ON `Store`(`status`);
CREATE INDEX `Store_disabledByUserId_idx` ON `Store`(`disabledByUserId`);
