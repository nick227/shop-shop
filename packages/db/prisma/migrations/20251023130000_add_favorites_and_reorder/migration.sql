-- CreateTable FavoriteStore
CREATE TABLE `FavoriteStore` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FavoriteStore_userId_storeId_key`(`userId`, `storeId`),
    INDEX `FavoriteStore_userId_idx`(`userId`),
    INDEX `FavoriteStore_storeId_idx`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable FavoriteItem
CREATE TABLE `FavoriteItem` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FavoriteItem_userId_itemId_key`(`userId`, `itemId`),
    INDEX `FavoriteItem_userId_idx`(`userId`),
    INDEX `FavoriteItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FavoriteStore` ADD CONSTRAINT `FavoriteStore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteStore` ADD CONSTRAINT `FavoriteStore_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteItem` ADD CONSTRAINT `FavoriteItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteItem` ADD CONSTRAINT `FavoriteItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

