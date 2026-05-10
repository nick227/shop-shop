
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  role: 'role',
  email: 'email',
  passwordHash: 'passwordHash',
  name: 'name',
  phone: 'phone',
  isCompany: 'isCompany',
  companyName: 'companyName',
  referredByAffiliateId: 'referredByAffiliateId',
  referredByReferralCode: 'referredByReferralCode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  suspendedAt: 'suspendedAt'
};

exports.Prisma.StoreScalarFieldEnum = {
  id: 'id',
  ownerUserId: 'ownerUserId',
  name: 'name',
  slug: 'slug',
  description: 'description',
  companyName: 'companyName',
  taxId: 'taxId',
  phone: 'phone',
  email: 'email',
  website: 'website',
  customDomain: 'customDomain',
  socialLinksJson: 'socialLinksJson',
  isPublished: 'isPublished',
  status: 'status',
  storeType: 'storeType',
  priceRange: 'priceRange',
  disabledAt: 'disabledAt',
  disabledByUserId: 'disabledByUserId',
  disabledReason: 'disabledReason',
  deliveryEnabled: 'deliveryEnabled',
  pickupEnabled: 'pickupEnabled',
  prepTimeMin: 'prepTimeMin',
  feesJson: 'feesJson',
  hoursJson: 'hoursJson',
  timezone: 'timezone',
  brandColor: 'brandColor',
  accentColor: 'accentColor',
  imageUrl: 'imageUrl',
  deliveryDistance: 'deliveryDistance',
  deliveryCharge: 'deliveryCharge',
  latitude: 'latitude',
  longitude: 'longitude',
  addressStreet: 'addressStreet',
  addressCity: 'addressCity',
  addressState: 'addressState',
  addressZip: 'addressZip',
  addressCountry: 'addressCountry',
  geocodedAt: 'geocodedAt',
  geocodeSource: 'geocodeSource',
  referredByAffiliateId: 'referredByAffiliateId',
  stripeAccountId: 'stripeAccountId',
  stripeOnboarded: 'stripeOnboarded',
  stripeChargesEnabled: 'stripeChargesEnabled',
  stripePayoutsEnabled: 'stripePayoutsEnabled',
  stripeRequirementsJson: 'stripeRequirementsJson',
  stripeLastSyncedAt: 'stripeLastSyncedAt',
  commissionRate: 'commissionRate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GeocodingCacheScalarFieldEnum = {
  id: 'id',
  queryType: 'queryType',
  queryValue: 'queryValue',
  latitude: 'latitude',
  longitude: 'longitude',
  city: 'city',
  state: 'state',
  zip: 'zip',
  country: 'country',
  formattedAddress: 'formattedAddress',
  confidence: 'confidence',
  source: 'source',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.ItemScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  title: 'title',
  description: 'description',
  imageUrl: 'imageUrl',
  price: 'price',
  isActive: 'isActive',
  isSoldOut: 'isSoldOut',
  flagged: 'flagged',
  flaggedAt: 'flaggedAt',
  flaggedByAdminId: 'flaggedByAdminId',
  flaggedReason: 'flaggedReason',
  sortIndex: 'sortIndex',
  optionsJson: 'optionsJson',
  stockQty: 'stockQty',
  allergensJson: 'allergensJson',
  spicyLevel: 'spicyLevel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MediaAssetScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  itemId: 'itemId',
  bundleId: 'bundleId',
  kind: 'kind',
  url: 'url',
  altText: 'altText',
  metadata: 'metadata',
  sortIndex: 'sortIndex',
  createdAt: 'createdAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  storeId: 'storeId',
  status: 'status',
  note: 'note',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  itemId: 'itemId',
  bundleId: 'bundleId',
  titleSnapshot: 'titleSnapshot',
  unitPrice: 'unitPrice',
  quantity: 'quantity',
  optionsJson: 'optionsJson',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  storeId: 'storeId',
  cartId: 'cartId',
  referredByAffiliateId: 'referredByAffiliateId',
  referredByReferralCode: 'referredByReferralCode',
  affiliateAttributionSource: 'affiliateAttributionSource',
  assignedToUserId: 'assignedToUserId',
  status: 'status',
  deliveryType: 'deliveryType',
  deliveryMode: 'deliveryMode',
  paymentStatus: 'paymentStatus',
  subtotal: 'subtotal',
  fees: 'fees',
  tax: 'tax',
  tip: 'tip',
  total: 'total',
  serviceFeePercent: 'serviceFeePercent',
  serviceFeeAmount: 'serviceFeeAmount',
  netToVendor: 'netToVendor',
  stripePaymentIntentId: 'stripePaymentIntentId',
  stripeChargeId: 'stripeChargeId',
  stripeTransferId: 'stripeTransferId',
  stripeApplicationFeeId: 'stripeApplicationFeeId',
  stripeRefundId: 'stripeRefundId',
  addressId: 'addressId',
  addressSnapshot: 'addressSnapshot',
  deliveryLatitude: 'deliveryLatitude',
  deliveryLongitude: 'deliveryLongitude',
  deliveryDistanceMiles: 'deliveryDistanceMiles',
  estimatedDeliveryAt: 'estimatedDeliveryAt',
  cancelReason: 'cancelReason',
  canceledBy: 'canceledBy',
  canceledAt: 'canceledAt',
  refundReason: 'refundReason',
  refundedAt: 'refundedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryJobScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  storeId: 'storeId',
  provider: 'provider',
  status: 'status',
  providerExternalId: 'providerExternalId',
  trackingUrl: 'trackingUrl',
  providerStatus: 'providerStatus',
  providerPayload: 'providerPayload',
  requestedByUserId: 'requestedByUserId',
  canceledAt: 'canceledAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  itemId: 'itemId',
  bundleId: 'bundleId',
  titleSnapshot: 'titleSnapshot',
  unitPrice: 'unitPrice',
  quantity: 'quantity',
  optionsJson: 'optionsJson',
  notes: 'notes',
  bundleSnapshot: 'bundleSnapshot'
};

exports.Prisma.OrderEventScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  status: 'status',
  note: 'note',
  createdAt: 'createdAt'
};

exports.Prisma.TipScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  amount: 'amount',
  status: 'status',
  stripePaymentIntentId: 'stripePaymentIntentId',
  stripeChargeId: 'stripeChargeId',
  stripeTransferId: 'stripeTransferId',
  stripeApplicationFeeId: 'stripeApplicationFeeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  label: 'label',
  contactName: 'contactName',
  phone: 'phone',
  line1: 'line1',
  line2: 'line2',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  instructions: 'instructions',
  geo: 'geo',
  isDefault: 'isDefault',
  isActive: 'isActive',
  externalRef: 'externalRef',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  archivedAt: 'archivedAt'
};

exports.Prisma.PayoutScalarFieldEnum = {
  id: 'id',
  vendorUserId: 'vendorUserId',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  status: 'status',
  grossSalesCents: 'grossSalesCents',
  discountsCents: 'discountsCents',
  refundsCents: 'refundsCents',
  tipsCents: 'tipsCents',
  platformFeesCents: 'platformFeesCents',
  processorFeesCents: 'processorFeesCents',
  netPayoutCents: 'netPayoutCents',
  currency: 'currency',
  providerPayoutId: 'providerPayoutId',
  providerTransferId: 'providerTransferId',
  arrivalAt: 'arrivalAt',
  createdByUserId: 'createdByUserId',
  completedAt: 'completedAt',
  failedAt: 'failedAt',
  failureReason: 'failureReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayoutOrderScalarFieldEnum = {
  id: 'id',
  payoutId: 'payoutId',
  orderId: 'orderId',
  orderCreatedAt: 'orderCreatedAt',
  orderStatus: 'orderStatus',
  paymentStatus: 'paymentStatus',
  grossSalesCents: 'grossSalesCents',
  discountsCents: 'discountsCents',
  refundsCents: 'refundsCents',
  tipsCents: 'tipsCents',
  platformFeesCents: 'platformFeesCents',
  processorFeesCents: 'processorFeesCents',
  netContributionCents: 'netContributionCents',
  createdAt: 'createdAt'
};

exports.Prisma.PayoutAdjustmentScalarFieldEnum = {
  id: 'id',
  payoutId: 'payoutId',
  type: 'type',
  amountCents: 'amountCents',
  reason: 'reason',
  note: 'note',
  createdByUserId: 'createdByUserId',
  createdAt: 'createdAt'
};

exports.Prisma.SystemSettingScalarFieldEnum = {
  key: 'key',
  value: 'value',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentWebhookScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  eventId: 'eventId',
  type: 'type',
  payload: 'payload',
  processed: 'processed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentMethodScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  provider: 'provider',
  brand: 'brand',
  last4: 'last4',
  tokenRef: 'tokenRef',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PromotionScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  code: 'code',
  name: 'name',
  description: 'description',
  type: 'type',
  status: 'status',
  value: 'value',
  minOrderValue: 'minOrderValue',
  maxDiscount: 'maxDiscount',
  usageLimit: 'usageLimit',
  usageCount: 'usageCount',
  usageLimitPerUser: 'usageLimitPerUser',
  allowStacking: 'allowStacking',
  eligibleUserIds: 'eligibleUserIds',
  excludedUserIds: 'excludedUserIds',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  isGlobal: 'isGlobal',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PromotionRedemptionScalarFieldEnum = {
  id: 'id',
  promotionId: 'promotionId',
  userId: 'userId',
  orderId: 'orderId',
  discountAmount: 'discountAmount',
  redeemedAt: 'redeemedAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  content: 'content',
  mediaUrls: 'mediaUrls',
  likesCount: 'likesCount',
  commentsCount: 'commentsCount',
  sharesCount: 'sharesCount',
  priority: 'priority',
  layout: 'layout',
  source: 'source',
  automationKey: 'automationKey',
  linkedItemId: 'linkedItemId',
  publishAt: 'publishAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PostLikeScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliateScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  status: 'status',
  referralCode: 'referralCode',
  commissionRate: 'commissionRate',
  paypalEmail: 'paypalEmail',
  bankAccountJson: 'bankAccountJson',
  taxId: 'taxId',
  bio: 'bio',
  website: 'website',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommissionScalarFieldEnum = {
  id: 'id',
  affiliateId: 'affiliateId',
  orderId: 'orderId',
  storeId: 'storeId',
  amount: 'amount',
  rate: 'rate',
  serviceFeeBase: 'serviceFeeBase',
  status: 'status',
  approvedAt: 'approvedAt',
  paidAt: 'paidAt',
  payoutId: 'payoutId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliatePayoutScalarFieldEnum = {
  id: 'id',
  affiliateId: 'affiliateId',
  amount: 'amount',
  method: 'method',
  status: 'status',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  referenceId: 'referenceId',
  failureReason: 'failureReason',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryZoneScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  name: 'name',
  polygonJson: 'polygonJson',
  baseFee: 'baseFee',
  minOrder: 'minOrder',
  isActive: 'isActive',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorVerificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  businessName: 'businessName',
  businessType: 'businessType',
  taxId: 'taxId',
  documentsJson: 'documentsJson',
  status: 'status',
  submittedAt: 'submittedAt',
  reviewedAt: 'reviewedAt',
  approvedAt: 'approvedAt',
  expiresAt: 'expiresAt',
  reviewNotes: 'reviewNotes',
  rejectionReason: 'rejectionReason',
  stripeAccountId: 'stripeAccountId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  userId: 'userId',
  permissionsJson: 'permissionsJson',
  isActive: 'isActive',
  addedAt: 'addedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  senderUserId: 'senderUserId',
  recipientEmail: 'recipientEmail',
  recipientUserId: 'recipientUserId',
  token: 'token',
  permissionsJson: 'permissionsJson',
  status: 'status',
  message: 'message',
  expiresAt: 'expiresAt',
  acceptedAt: 'acceptedAt',
  declinedAt: 'declinedAt',
  revokedAt: 'revokedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FavoriteStoreScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  storeId: 'storeId',
  createdAt: 'createdAt'
};

exports.Prisma.FavoriteItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  itemId: 'itemId',
  createdAt: 'createdAt'
};

exports.Prisma.BundleScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  sortIndex: 'sortIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BundleItemScalarFieldEnum = {
  id: 'id',
  bundleId: 'bundleId',
  itemId: 'itemId',
  quantity: 'quantity',
  sortIndex: 'sortIndex'
};

exports.Prisma.BundlePricingScalarFieldEnum = {
  id: 'id',
  bundleId: 'bundleId',
  pricingType: 'pricingType',
  fixedPrice: 'fixedPrice',
  discountPercent: 'discountPercent',
  discountAmount: 'discountAmount',
  minSavings: 'minSavings',
  showSavings: 'showSavings',
  savingsLabel: 'savingsLabel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  label: 'label',
  category: 'category',
  target: 'target',
  isPublic: 'isPublic',
  sortOrder: 'sortOrder',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StoreTagScalarFieldEnum = {
  storeId: 'storeId',
  tagId: 'tagId'
};

exports.Prisma.ItemTagScalarFieldEnum = {
  itemId: 'itemId',
  tagId: 'tagId'
};

exports.Prisma.AdminAuditLogScalarFieldEnum = {
  id: 'id',
  adminId: 'adminId',
  action: 'action',
  targetType: 'targetType',
  targetId: 'targetId',
  payload: 'payload',
  createdAt: 'createdAt'
};

exports.Prisma.StoreDeliveryProviderConfigScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  provider: 'provider',
  enabled: 'enabled',
  settingsJson: 'settingsJson',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StoreDeliveryOptionScalarFieldEnum = {
  id: 'id',
  storeId: 'storeId',
  deliveryMode: 'deliveryMode',
  enabled: 'enabled',
  feeDisclosure: 'feeDisclosure',
  externalInfoUrl: 'externalInfoUrl',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryProviderEventScalarFieldEnum = {
  id: 'id',
  deliveryJobId: 'deliveryJobId',
  provider: 'provider',
  eventId: 'eventId',
  eventType: 'eventType',
  timestamp: 'timestamp',
  payload: 'payload',
  processed: 'processed',
  createdAt: 'createdAt'
};

exports.Prisma.DeliveryTrackingPointScalarFieldEnum = {
  id: 'id',
  deliveryJobId: 'deliveryJobId',
  provider: 'provider',
  latitude: 'latitude',
  longitude: 'longitude',
  timestamp: 'timestamp',
  accuracyMeters: 'accuracyMeters',
  speedMph: 'speedMph',
  headingDegrees: 'headingDegrees',
  providerPayload: 'providerPayload',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  USER: 'USER',
  VENDOR_PENDING: 'VENDOR_PENDING',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  AFFILIATE: 'AFFILIATE',
  RIDER: 'RIDER',
  STAFF: 'STAFF'
};

exports.StoreStatus = exports.$Enums.StoreStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DISABLED: 'DISABLED'
};

exports.StoreType = exports.$Enums.StoreType = {
  RESTAURANT: 'RESTAURANT',
  CONVENIENCE: 'CONVENIENCE',
  GROCERY: 'GROCERY',
  HOME_KITCHEN: 'HOME_KITCHEN',
  BAKERY: 'BAKERY',
  RETAIL: 'RETAIL',
  OTHER: 'OTHER',
  MEAL_PREP: 'MEAL_PREP',
  COFFEE: 'COFFEE',
  SPECIALTY: 'SPECIALTY',
  GENERAL: 'GENERAL'
};

exports.PriceRange = exports.$Enums.PriceRange = {
  BUDGET: 'BUDGET',
  MODERATE: 'MODERATE',
  PREMIUM: 'PREMIUM'
};

exports.MediaKind = exports.$Enums.MediaKind = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
};

exports.CartStatus = exports.$Enums.CartStatus = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  ABANDONED: 'ABANDONED'
};

exports.AffiliateAttributionSource = exports.$Enums.AffiliateAttributionSource = {
  CUSTOMER_REFERRAL: 'CUSTOMER_REFERRAL',
  STORE_REFERRAL: 'STORE_REFERRAL',
  CHECKOUT_CODE: 'CHECKOUT_CODE',
  REFERRAL_LINK: 'REFERRAL_LINK'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED'
};

exports.DeliveryType = exports.$Enums.DeliveryType = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP'
};

exports.DeliveryMode = exports.$Enums.DeliveryMode = {
  PICKUP: 'PICKUP',
  STORE_MANAGED_DELIVERY: 'STORE_MANAGED_DELIVERY',
  PLATFORM_DRIVER: 'PLATFORM_DRIVER',
  THIRD_PARTY_PROVIDER: 'THIRD_PARTY_PROVIDER'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED'
};

exports.DeliveryProvider = exports.$Enums.DeliveryProvider = {
  IN_HOUSE: 'IN_HOUSE',
  DOORDASH_DRIVE: 'DOORDASH_DRIVE',
  UBER_DIRECT: 'UBER_DIRECT'
};

exports.DeliveryJobStatus = exports.$Enums.DeliveryJobStatus = {
  REQUESTED: 'REQUESTED',
  DISPATCHED: 'DISPATCHED',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED'
};

exports.TipStatus = exports.$Enums.TipStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.PayoutStatus = exports.$Enums.PayoutStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.PayoutAdjustmentType = exports.$Enums.PayoutAdjustmentType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT'
};

exports.PaymentProvider = exports.$Enums.PaymentProvider = {
  TEST: 'TEST',
  STRIPE: 'STRIPE',
  SQUARE: 'SQUARE'
};

exports.PromotionType = exports.$Enums.PromotionType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_ITEM: 'FREE_ITEM',
  FREE_DELIVERY: 'FREE_DELIVERY'
};

exports.PromotionStatus = exports.$Enums.PromotionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED'
};

exports.PostSource = exports.$Enums.PostSource = {
  MANUAL: 'MANUAL',
  AUTO_STORE: 'AUTO_STORE',
  AUTO_PRODUCT: 'AUTO_PRODUCT'
};

exports.AffiliateStatus = exports.$Enums.AffiliateStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED'
};

exports.CommissionStatus = exports.$Enums.CommissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  REVERSED: 'REVERSED'
};

exports.VerificationStatus = exports.$Enums.VerificationStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

exports.InvitationStatus = exports.$Enums.InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
};

exports.BundlePricingType = exports.$Enums.BundlePricingType = {
  FIXED_PRICE: 'FIXED_PRICE',
  DISCOUNT_PERCENT: 'DISCOUNT_PERCENT',
  DISCOUNT_AMOUNT: 'DISCOUNT_AMOUNT',
  BEST_DEAL: 'BEST_DEAL'
};

exports.TagCategory = exports.$Enums.TagCategory = {
  DIETARY: 'DIETARY',
  FREE_FROM: 'FREE_FROM',
  CONTAINS_ALLERGEN: 'CONTAINS_ALLERGEN',
  CUISINE: 'CUISINE',
  FEATURE: 'FEATURE',
  MEAL_TIME: 'MEAL_TIME',
  ITEM_TYPE: 'ITEM_TYPE',
  OCCASION: 'OCCASION'
};

exports.TagTarget = exports.$Enums.TagTarget = {
  STORE: 'STORE',
  ITEM: 'ITEM',
  BOTH: 'BOTH'
};

exports.Prisma.ModelName = {
  User: 'User',
  Store: 'Store',
  GeocodingCache: 'GeocodingCache',
  Item: 'Item',
  MediaAsset: 'MediaAsset',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Order: 'Order',
  DeliveryJob: 'DeliveryJob',
  OrderItem: 'OrderItem',
  OrderEvent: 'OrderEvent',
  Tip: 'Tip',
  Address: 'Address',
  Payout: 'Payout',
  PayoutOrder: 'PayoutOrder',
  PayoutAdjustment: 'PayoutAdjustment',
  SystemSetting: 'SystemSetting',
  PaymentWebhook: 'PaymentWebhook',
  PaymentMethod: 'PaymentMethod',
  Promotion: 'Promotion',
  PromotionRedemption: 'PromotionRedemption',
  Post: 'Post',
  PostLike: 'PostLike',
  Comment: 'Comment',
  Affiliate: 'Affiliate',
  Commission: 'Commission',
  AffiliatePayout: 'AffiliatePayout',
  DeliveryZone: 'DeliveryZone',
  VendorVerification: 'VendorVerification',
  TeamMember: 'TeamMember',
  Invitation: 'Invitation',
  FavoriteStore: 'FavoriteStore',
  FavoriteItem: 'FavoriteItem',
  Bundle: 'Bundle',
  BundleItem: 'BundleItem',
  BundlePricing: 'BundlePricing',
  Tag: 'Tag',
  StoreTag: 'StoreTag',
  ItemTag: 'ItemTag',
  AdminAuditLog: 'AdminAuditLog',
  StoreDeliveryProviderConfig: 'StoreDeliveryProviderConfig',
  StoreDeliveryOption: 'StoreDeliveryOption',
  DeliveryProviderEvent: 'DeliveryProviderEvent',
  DeliveryTrackingPoint: 'DeliveryTrackingPoint'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
