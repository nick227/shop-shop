-- Add independent merchant authorities. Existing Role values remain for compatibility.
ALTER TABLE `User`
  ADD COLUMN `vendorAccessRevokedAt` DATETIME(3) NULL,
  ADD COLUMN `adminVendorWorkspace` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `adminCreateStores` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `VendorEnrollment` (
  `userId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  `source` VARCHAR(191) NOT NULL DEFAULT 'SELF_SERVICE',
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewedAt` DATETIME(3) NULL,
  `reviewedByUserId` VARCHAR(191) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `VendorEnrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve established merchants, including legacy USER owners. No enrollment for team-only accounts.
INSERT INTO `VendorEnrollment` (`userId`, `status`, `source`, `reviewedAt`, `updatedAt`)
SELECT u.id, 'APPROVED', 'LEGACY_BACKFILL', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `User` u
WHERE u.role = 'VENDOR' OR EXISTS (SELECT 1 FROM `Store` s WHERE s.ownerUserId = u.id);

INSERT INTO `VendorEnrollment` (`userId`, `status`, `source`, `updatedAt`)
SELECT u.id, 'PENDING', 'LEGACY_BACKFILL', CURRENT_TIMESTAMP(3)
FROM `User` u WHERE u.role = 'VENDOR_PENDING'
AND NOT EXISTS (SELECT 1 FROM `VendorEnrollment` e WHERE e.userId = u.id);

-- Explicit one-time grants preserve existing admin operations. Future admins get neither by default.
UPDATE `User` SET `adminVendorWorkspace` = true, `adminCreateStores` = true WHERE role = 'ADMIN';
-- TeamMember rows, permission arrays, invitations, stores, orders, and KYC records are unchanged.
