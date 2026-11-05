-- CreateTable
CREATE TABLE `StorefrontConfig` (
    `storeId` CHAR(36) NOT NULL,
    `draftJson` JSON NOT NULL,
    `publishedJson` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `publishedById` CHAR(36) NULL,
    `draftUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorefrontConfig` ADD CONSTRAINT `StorefrontConfig_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

