-- Stripe Connect snapshot columns + unique connected account id per store
ALTER TABLE `Store`
  ADD COLUMN `stripeChargesEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `stripePayoutsEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `stripeRequirementsJson` JSON NULL,
  ADD COLUMN `stripeLastSyncedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Store_stripeAccountId_key` ON `Store`(`stripeAccountId`);
