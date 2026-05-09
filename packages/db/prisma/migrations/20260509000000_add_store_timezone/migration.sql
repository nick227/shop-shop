-- Add timezone field to Store model
ALTER TABLE `Store` ADD COLUMN `timezone` VARCHAR(50) NULL COMMENT 'IANA timezone identifier (e.g., America/New_York)';

-- Add index for timezone queries
CREATE INDEX `Store_timezone_index` ON `Store` (`timezone`);
