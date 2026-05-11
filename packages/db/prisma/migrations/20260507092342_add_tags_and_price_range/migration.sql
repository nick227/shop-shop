-- AlterTable
ALTER TABLE `Store` ADD COLUMN `priceRange` ENUM('BUDGET', 'MODERATE', 'PREMIUM') NULL;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `category` ENUM('DIETARY', 'FREE_FROM', 'CONTAINS_ALLERGEN', 'CUISINE', 'FEATURE', 'MEAL_TIME', 'ITEM_TYPE', 'OCCASION') NOT NULL,
    `target` ENUM('STORE', 'ITEM', 'BOTH') NOT NULL DEFAULT 'BOTH',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tag_slug_key`(`slug`),
    INDEX `Tag_category_idx`(`category`),
    INDEX `Tag_target_idx`(`target`),
    INDEX `Tag_isPublic_idx`(`isPublic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreTag` (
    `storeId` CHAR(36) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `StoreTag_tagId_idx`(`tagId`),
    INDEX `StoreTag_storeId_idx`(`storeId`),
    PRIMARY KEY (`storeId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemTag` (
    `itemId` CHAR(36) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `ItemTag_tagId_idx`(`tagId`),
    INDEX `ItemTag_itemId_idx`(`itemId`),
    PRIMARY KEY (`itemId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StoreTag` ADD CONSTRAINT `StoreTag_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreTag` ADD CONSTRAINT `StoreTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTag` ADD CONSTRAINT `ItemTag_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTag` ADD CONSTRAINT `ItemTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
