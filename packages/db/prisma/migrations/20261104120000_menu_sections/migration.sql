-- Menu sections become their own records. Until now a section was only the label typed on an item
-- (Item.optionsJson.category); each store's distinct labels become its sections and its items point at them.
-- optionsJson.category is left in place, unused, so nothing is lost.

CREATE TABLE `MenuSection` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `sortIndex` INTEGER NOT NULL DEFAULT 0,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MenuSection_storeId_sortIndex_idx`(`storeId`, `sortIndex`),
    UNIQUE INDEX `MenuSection_storeId_name_key`(`storeId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Item` ADD COLUMN `sectionId` CHAR(36) NULL;
CREATE INDEX `Item_sectionId_idx` ON `Item`(`sectionId`);
ALTER TABLE `Item` ADD CONSTRAINT `Item_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `MenuSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MenuSection` ADD CONSTRAINT `MenuSection_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill. A label is trimmed with inner whitespace collapsed, and compared in the section name's collation
-- (case-insensitive), matching the unique key. The first item (by sortIndex) gives the spelling and the position.
INSERT INTO `MenuSection` (`id`, `storeId`, `name`, `sortIndex`, `isVisible`, `createdAt`, `updatedAt`)
SELECT UUID(), firsts.storeId, firsts.label,
       ROW_NUMBER() OVER (PARTITION BY firsts.storeId ORDER BY firsts.firstSort, firsts.firstCreated, firsts.label) - 1,
       true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM (
    SELECT ranked.storeId, ranked.label, ranked.sortIndex AS firstSort, ranked.createdAt AS firstCreated
    FROM (
        SELECT labelled.storeId, labelled.label, labelled.sortIndex, labelled.createdAt,
               ROW_NUMBER() OVER (
                   PARTITION BY labelled.storeId, labelled.label
                   ORDER BY labelled.sortIndex, labelled.createdAt, labelled.id
               ) AS rn
        FROM (
            SELECT i.id, i.storeId, i.sortIndex, i.createdAt,
                   CAST(LEFT(REGEXP_REPLACE(TRIM(JSON_UNQUOTE(JSON_EXTRACT(i.optionsJson, '$.category'))), '[[:space:]]+', ' '), 120)
                        AS CHAR(120) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS label
            FROM `Item` i
            WHERE JSON_TYPE(JSON_EXTRACT(i.optionsJson, '$.category')) = 'STRING'
        ) labelled
        WHERE labelled.label <> ''
    ) ranked
    WHERE ranked.rn = 1
) firsts;

UPDATE `Item` i
JOIN `MenuSection` s
  ON s.storeId = i.storeId
 AND s.name = CAST(LEFT(REGEXP_REPLACE(TRIM(JSON_UNQUOTE(JSON_EXTRACT(i.optionsJson, '$.category'))), '[[:space:]]+', ' '), 120)
              AS CHAR(120) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
SET i.sectionId = s.id
WHERE JSON_TYPE(JSON_EXTRACT(i.optionsJson, '$.category')) = 'STRING';
