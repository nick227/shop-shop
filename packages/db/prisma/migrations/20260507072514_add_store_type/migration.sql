-- DropIndex
DROP INDEX `Store_disabledByUserId_idx` ON `store`;

-- DropIndex
DROP INDEX `Store_status_idx` ON `store`;

-- AlterTable
ALTER TABLE `store` ADD COLUMN `storeType` ENUM('MEAL_PREP', 'BAKERY', 'COFFEE', 'SPECIALTY', 'GENERAL') NULL;
