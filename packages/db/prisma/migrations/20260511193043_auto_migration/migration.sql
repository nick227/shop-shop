/*
  Warnings:

  - A unique constraint covering the columns `[duplicateKey]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `post` ADD COLUMN `contentType` VARCHAR(50) NULL,
    ADD COLUMN `duplicateKey` VARCHAR(255) NULL,
    ADD COLUMN `freshnessKind` VARCHAR(50) NULL,
    ADD COLUMN `freshnessScore` INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN `packageId` VARCHAR(128) NULL,
    ADD COLUMN `storeCategory` JSON NULL;

-- CreateTable
CREATE TABLE `RiverPostSeen` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `postId` CHAR(36) NOT NULL,
    `seenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RiverPostSeen_userId_seenAt_idx`(`userId`, `seenAt`),
    INDEX `RiverPostSeen_postId_idx`(`postId`),
    UNIQUE INDEX `RiverPostSeen_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Post_duplicateKey_key` ON `Post`(`duplicateKey`);

-- CreateIndex
CREATE INDEX `Post_freshnessKind_freshnessScore_idx` ON `Post`(`freshnessKind`, `freshnessScore`);

-- CreateIndex
CREATE INDEX `Post_contentType_idx` ON `Post`(`contentType`);

-- CreateIndex
CREATE INDEX `Post_duplicateKey_idx` ON `Post`(`duplicateKey`);

-- AddForeignKey
ALTER TABLE `RiverPostSeen` ADD CONSTRAINT `RiverPostSeen_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiverPostSeen` ADD CONSTRAINT `RiverPostSeen_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
