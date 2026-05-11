-- DropIndex
DROP INDEX `Store_disabledByUserId_idx` ON `Store`;

-- DropIndex
DROP INDEX `Store_status_idx` ON `Store`;

-- AlterTable
ALTER TABLE `Store` ADD COLUMN `storeType` ENUM('MEAL_PREP', 'BAKERY', 'COFFEE', 'SPECIALTY', 'GENERAL') NULL;
