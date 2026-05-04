-- Public feed visibility: optional scheduled release time (UTC)
ALTER TABLE `Post` ADD COLUMN `publishAt` DATETIME(3) NULL;
CREATE INDEX `Post_publishAt_idx` ON `Post`(`publishAt`);
