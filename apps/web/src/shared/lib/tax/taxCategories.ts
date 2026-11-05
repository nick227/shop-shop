/** Sales tax categories, as vendors see them. The server maps each to a tax provider code. */
export const TAX_CATEGORY_OPTIONS = [
  ['PREPARED_FOOD', 'Prepared food and meals'],
  ['GROCERY', 'Groceries (food to prepare at home)'],
  ['CANDY', 'Candy'],
  ['SOFT_DRINK', 'Soft drinks'],
  ['BOTTLED_WATER', 'Bottled water'],
  ['ALCOHOL', 'Alcohol'],
  ['GENERAL', 'General merchandise'],
] as const

export type TaxCategoryId = (typeof TAX_CATEGORY_OPTIONS)[number][0]
