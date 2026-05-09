-- Thumbnail URLs on Store and Item (schema parity; fixes P2022 on store list/read).

ALTER TABLE `Store`
  ADD COLUMN `imageUrl` VARCHAR(191) NULL;

ALTER TABLE `Item`
  ADD COLUMN `imageUrl` VARCHAR(191) NULL;
