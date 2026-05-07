-- Add affiliate attribution source to Order snapshots

ALTER TABLE `Order`
  ADD COLUMN `affiliateAttributionSource` ENUM(
    'CUSTOMER_REFERRAL',
    'STORE_REFERRAL',
    'CHECKOUT_CODE',
    'REFERRAL_LINK'
  ) NULL AFTER `referredByReferralCode`;

