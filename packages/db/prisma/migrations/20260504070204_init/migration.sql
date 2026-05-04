-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF') NOT NULL DEFAULT 'USER',
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `isCompany` BOOLEAN NOT NULL DEFAULT false,
    `companyName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
    `id` CHAR(36) NOT NULL,
    `ownerUserId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `taxId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `deliveryEnabled` BOOLEAN NOT NULL DEFAULT true,
    `pickupEnabled` BOOLEAN NOT NULL DEFAULT true,
    `prepTimeMin` INTEGER NOT NULL DEFAULT 15,
    `feesJson` JSON NULL,
    `hoursJson` JSON NULL,
    `deliveryDistance` DECIMAL(5, 2) NULL,
    `deliveryCharge` DECIMAL(10, 2) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `addressStreet` VARCHAR(191) NULL,
    `addressCity` VARCHAR(191) NULL,
    `addressState` CHAR(2) NULL,
    `addressZip` VARCHAR(191) NULL,
    `addressCountry` CHAR(2) NULL DEFAULT 'US',
    `geocodedAt` DATETIME(3) NULL,
    `geocodeSource` VARCHAR(191) NULL,
    `referredByAffiliateId` CHAR(36) NULL,
    `stripeAccountId` VARCHAR(191) NULL,
    `stripeOnboarded` BOOLEAN NOT NULL DEFAULT false,
    `commissionRate` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Store_slug_key`(`slug`),
    INDEX `Store_ownerUserId_idx`(`ownerUserId`),
    INDEX `Store_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `Store_addressCity_addressState_idx`(`addressCity`, `addressState`),
    INDEX `Store_addressZip_idx`(`addressZip`),
    INDEX `Store_isPublished_latitude_idx`(`isPublished`, `latitude`),
    INDEX `Store_referredByAffiliateId_idx`(`referredByAffiliateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeocodingCache` (
    `id` CHAR(36) NOT NULL,
    `queryType` VARCHAR(20) NOT NULL,
    `queryValue` VARCHAR(100) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `city` VARCHAR(191) NULL,
    `state` CHAR(2) NULL,
    `zip` VARCHAR(191) NULL,
    `country` CHAR(2) NULL DEFAULT 'US',
    `formattedAddress` VARCHAR(191) NULL,
    `confidence` VARCHAR(10) NOT NULL,
    `source` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NULL,

    INDEX `GeocodingCache_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `GeocodingCache_expiresAt_idx`(`expiresAt`),
    INDEX `GeocodingCache_createdAt_idx`(`createdAt`),
    INDEX `GeocodingCache_queryType_idx`(`queryType`),
    UNIQUE INDEX `GeocodingCache_queryType_queryValue_key`(`queryType`, `queryValue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSoldOut` BOOLEAN NOT NULL DEFAULT false,
    `sortIndex` INTEGER NOT NULL DEFAULT 0,
    `optionsJson` JSON NULL,
    `stockQty` INTEGER NULL,
    `allergensJson` JSON NULL,
    `isVegan` BOOLEAN NOT NULL DEFAULT false,
    `isVegetarian` BOOLEAN NOT NULL DEFAULT false,
    `isGlutenFree` BOOLEAN NOT NULL DEFAULT false,
    `isDairyFree` BOOLEAN NOT NULL DEFAULT false,
    `spicyLevel` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Item_storeId_sortIndex_idx`(`storeId`, `sortIndex`),
    INDEX `Item_isVegan_isVegetarian_isGlutenFree_idx`(`isVegan`, `isVegetarian`, `isGlutenFree`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NULL,
    `itemId` CHAR(36) NULL,
    `kind` ENUM('IMAGE', 'VIDEO') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `altText` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `sortIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MediaAsset_storeId_idx`(`storeId`),
    INDEX `MediaAsset_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'SUBMITTED', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Cart_userId_idx`(`userId`),
    INDEX `Cart_storeId_idx`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` CHAR(36) NOT NULL,
    `cartId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `titleSnapshot` VARCHAR(191) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `optionsJson` JSON NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CartItem_cartId_idx`(`cartId`),
    INDEX `CartItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `cartId` CHAR(36) NULL,
    `assignedToUserId` CHAR(36) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `deliveryType` ENUM('DELIVERY', 'PICKUP') NOT NULL,
    `paymentStatus` ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `fees` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL,
    `tip` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `serviceFeePercent` DECIMAL(5, 2) NOT NULL,
    `serviceFeeAmount` DECIMAL(10, 2) NOT NULL,
    `netToVendor` DECIMAL(10, 2) NOT NULL,
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `stripeChargeId` VARCHAR(191) NULL,
    `stripeTransferId` VARCHAR(191) NULL,
    `stripeApplicationFeeId` VARCHAR(191) NULL,
    `stripeRefundId` VARCHAR(191) NULL,
    `addressId` CHAR(36) NULL,
    `addressSnapshot` JSON NULL,
    `deliveryLatitude` DECIMAL(10, 8) NULL,
    `deliveryLongitude` DECIMAL(11, 8) NULL,
    `deliveryDistanceMiles` DECIMAL(6, 2) NULL,
    `estimatedDeliveryAt` DATETIME(3) NULL,
    `cancelReason` TEXT NULL,
    `canceledBy` CHAR(36) NULL,
    `canceledAt` DATETIME(3) NULL,
    `refundReason` TEXT NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_cartId_key`(`cartId`),
    UNIQUE INDEX `Order_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_storeId_idx`(`storeId`),
    INDEX `Order_paymentStatus_idx`(`paymentStatus`),
    INDEX `Order_stripeTransferId_idx`(`stripeTransferId`),
    INDEX `Order_status_canceledAt_idx`(`status`, `canceledAt`),
    INDEX `Order_assignedToUserId_idx`(`assignedToUserId`),
    INDEX `Order_deliveryLatitude_deliveryLongitude_idx`(`deliveryLatitude`, `deliveryLongitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NULL,
    `bundleId` CHAR(36) NULL,
    `titleSnapshot` VARCHAR(191) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `optionsJson` JSON NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderEvent` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELED') NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderEvent_orderId_createdAt_idx`(`orderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tip` (
    `id` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `stripeChargeId` VARCHAR(191) NULL,
    `stripeTransferId` VARCHAR(191) NULL,
    `stripeApplicationFeeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Tip_orderId_idx`(`orderId`),
    INDEX `Tip_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `label` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `line1` VARCHAR(191) NOT NULL,
    `line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,
    `geo` JSON NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `externalRef` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    INDEX `Address_userId_isActive_idx`(`userId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhook` (
    `id` CHAR(36) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'stripe',
    `eventId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentWebhook_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentMethod` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `provider` ENUM('TEST', 'STRIPE', 'SQUARE') NOT NULL DEFAULT 'TEST',
    `brand` VARCHAR(191) NULL,
    `last4` VARCHAR(191) NULL,
    `tokenRef` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentMethod_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Promotion` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'FREE_DELIVERY') NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `value` DECIMAL(10, 2) NOT NULL,
    `minOrderValue` DECIMAL(10, 2) NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `usageLimit` INTEGER NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `usageLimitPerUser` INTEGER NULL,
    `allowStacking` BOOLEAN NOT NULL DEFAULT false,
    `eligibleUserIds` JSON NULL,
    `excludedUserIds` JSON NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `createdById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Promotion_code_key`(`code`),
    INDEX `Promotion_storeId_idx`(`storeId`),
    INDEX `Promotion_code_idx`(`code`),
    INDEX `Promotion_status_validFrom_validUntil_idx`(`status`, `validFrom`, `validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionRedemption` (
    `id` CHAR(36) NOT NULL,
    `promotionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL,
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromotionRedemption_promotionId_userId_idx`(`promotionId`, `userId`),
    INDEX `PromotionRedemption_userId_idx`(`userId`),
    INDEX `PromotionRedemption_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `content` TEXT NULL,
    `mediaUrls` JSON NOT NULL,
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `commentsCount` INTEGER NOT NULL DEFAULT 0,
    `sharesCount` INTEGER NOT NULL DEFAULT 0,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `layout` VARCHAR(64) NOT NULL DEFAULT 'default_layout',
    `source` ENUM('MANUAL', 'AUTO_STORE', 'AUTO_PRODUCT') NOT NULL DEFAULT 'MANUAL',
    `automationKey` VARCHAR(128) NULL,
    `linkedItemId` CHAR(36) NULL,
    `publishAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Post_automationKey_key`(`automationKey`),
    INDEX `Post_storeId_idx`(`storeId`),
    INDEX `Post_createdAt_idx`(`createdAt`),
    INDEX `Post_priority_createdAt_id_idx`(`priority`, `createdAt`, `id`),
    INDEX `Post_publishAt_idx`(`publishAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostLike` (
    `id` CHAR(36) NOT NULL,
    `postId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PostLike_userId_idx`(`userId`),
    UNIQUE INDEX `PostLike_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` CHAR(36) NOT NULL,
    `postId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_postId_idx`(`postId`),
    INDEX `Comment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affiliate` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'PENDING',
    `referralCode` VARCHAR(191) NOT NULL,
    `commissionRate` DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
    `paypalEmail` VARCHAR(191) NULL,
    `bankAccountJson` JSON NULL,
    `taxId` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Affiliate_userId_key`(`userId`),
    UNIQUE INDEX `Affiliate_referralCode_key`(`referralCode`),
    INDEX `Affiliate_referralCode_idx`(`referralCode`),
    INDEX `Affiliate_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `orderId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `rate` DECIMAL(5, 4) NOT NULL,
    `serviceFeeBase` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PAID', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `payoutId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Commission_affiliateId_status_idx`(`affiliateId`, `status`),
    INDEX `Commission_orderId_idx`(`orderId`),
    INDEX `Commission_storeId_idx`(`storeId`),
    INDEX `Commission_payoutId_idx`(`payoutId`),
    INDEX `Commission_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliatePayout` (
    `id` CHAR(36) NOT NULL,
    `affiliateId` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AffiliatePayout_affiliateId_status_idx`(`affiliateId`, `status`),
    INDEX `AffiliatePayout_status_periodEnd_idx`(`status`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryZone` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `polygonJson` JSON NOT NULL,
    `baseFee` DECIMAL(10, 2) NOT NULL,
    `minOrder` DECIMAL(10, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DeliveryZone_storeId_isActive_idx`(`storeId`, `isActive`),
    INDEX `DeliveryZone_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorVerification` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NOT NULL,
    `documentsJson` JSON NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `reviewNotes` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `stripeAccountId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VendorVerification_userId_key`(`userId`),
    INDEX `VendorVerification_status_idx`(`status`),
    INDEX `VendorVerification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `permissionsJson` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamMember_userId_idx`(`userId`),
    INDEX `TeamMember_storeId_isActive_idx`(`storeId`, `isActive`),
    UNIQUE INDEX `TeamMember_storeId_userId_key`(`storeId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invitation` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `senderUserId` CHAR(36) NOT NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `recipientUserId` CHAR(36) NULL,
    `token` VARCHAR(191) NOT NULL,
    `permissionsJson` JSON NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `message` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `declinedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invitation_token_key`(`token`),
    INDEX `Invitation_storeId_idx`(`storeId`),
    INDEX `Invitation_recipientEmail_idx`(`recipientEmail`),
    INDEX `Invitation_token_idx`(`token`),
    INDEX `Invitation_status_expiresAt_idx`(`status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteStore` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteStore_userId_idx`(`userId`),
    INDEX `FavoriteStore_storeId_idx`(`storeId`),
    UNIQUE INDEX `FavoriteStore_userId_storeId_key`(`userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteItem` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteItem_userId_idx`(`userId`),
    INDEX `FavoriteItem_itemId_idx`(`itemId`),
    UNIQUE INDEX `FavoriteItem_userId_itemId_key`(`userId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bundle` (
    `id` CHAR(36) NOT NULL,
    `storeId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Bundle_storeId_idx`(`storeId`),
    INDEX `Bundle_isActive_idx`(`isActive`),
    INDEX `Bundle_sortIndex_idx`(`sortIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleItem` (
    `id` CHAR(36) NOT NULL,
    `bundleId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `sortIndex` INTEGER NOT NULL DEFAULT 0,

    INDEX `BundleItem_bundleId_idx`(`bundleId`),
    INDEX `BundleItem_itemId_idx`(`itemId`),
    UNIQUE INDEX `BundleItem_bundleId_itemId_key`(`bundleId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundlePricing` (
    `id` CHAR(36) NOT NULL,
    `bundleId` CHAR(36) NOT NULL,
    `pricingType` ENUM('FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL') NOT NULL DEFAULT 'FIXED_PRICE',
    `fixedPrice` DECIMAL(10, 2) NULL,
    `discountPercent` DECIMAL(5, 2) NULL,
    `discountAmount` DECIMAL(10, 2) NULL,
    `minSavings` DECIMAL(10, 2) NULL,
    `showSavings` BOOLEAN NOT NULL DEFAULT true,
    `savingsLabel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BundlePricing_bundleId_key`(`bundleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_referredByAffiliateId_fkey` FOREIGN KEY (`referredByAffiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderEvent` ADD CONSTRAINT `OrderEvent_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tip` ADD CONSTRAINT `Tip_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentMethod` ADD CONSTRAINT `PaymentMethod_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionRedemption` ADD CONSTRAINT `PromotionRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_linkedItemId_fkey` FOREIGN KEY (`linkedItemId`) REFERENCES `Item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affiliate` ADD CONSTRAINT `Affiliate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_payoutId_fkey` FOREIGN KEY (`payoutId`) REFERENCES `AffiliatePayout`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliatePayout` ADD CONSTRAINT `AffiliatePayout_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryZone` ADD CONSTRAINT `DeliveryZone_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorVerification` ADD CONSTRAINT `VendorVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_senderUserId_fkey` FOREIGN KEY (`senderUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_recipientUserId_fkey` FOREIGN KEY (`recipientUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteStore` ADD CONSTRAINT `FavoriteStore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteStore` ADD CONSTRAINT `FavoriteStore_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteItem` ADD CONSTRAINT `FavoriteItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteItem` ADD CONSTRAINT `FavoriteItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bundle` ADD CONSTRAINT `Bundle_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleItem` ADD CONSTRAINT `BundleItem_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleItem` ADD CONSTRAINT `BundleItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundlePricing` ADD CONSTRAINT `BundlePricing_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `Bundle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
