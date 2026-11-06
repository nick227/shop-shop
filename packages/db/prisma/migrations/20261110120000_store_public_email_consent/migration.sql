-- A store's business email is published only after the vendor confirms it for display.
-- Existing emails stay stored but unconfirmed (NULL), so none is shown until a vendor confirms it.
ALTER TABLE `Store` ADD COLUMN `publicEmailConfirmedAt` DATETIME(3) NULL;
