-- Store branding columns referenced by seed and API (schema parity).

ALTER TABLE `Store`
  ADD COLUMN `brandColor` VARCHAR(7) NULL,
  ADD COLUMN `accentColor` VARCHAR(7) NULL;
