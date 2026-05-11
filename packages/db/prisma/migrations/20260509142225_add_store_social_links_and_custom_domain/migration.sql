/*
  Warnings:

  - You are about to drop the column `isDairyFree` on the `item` table. All the data in the column will be lost.
  - You are about to drop the column `isGlutenFree` on the `item` table. All the data in the column will be lost.
  - You are about to drop the column `isVegan` on the `item` table. All the data in the column will be lost.
  - You are about to drop the column `isVegetarian` on the `item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Item_isVegan_isVegetarian_isGlutenFree_idx` ON `Item`;

-- DropIndex
DROP INDEX `Store_timezone_index` ON `Store`;

-- AlterTable
ALTER TABLE `Item` DROP COLUMN `isDairyFree`,
    DROP COLUMN `isGlutenFree`,
    DROP COLUMN `isVegan`,
    DROP COLUMN `isVegetarian`;

-- AlterTable
ALTER TABLE `Store` ADD COLUMN `customDomain` VARCHAR(191) NULL,
    ADD COLUMN `socialLinksJson` JSON NULL,
    MODIFY `storeType` ENUM('RESTAURANT', 'CONVENIENCE', 'GROCERY', 'HOME_KITCHEN', 'BAKERY', 'RETAIL', 'OTHER', 'MEAL_PREP', 'COFFEE', 'SPECIALTY', 'GENERAL') NULL;
