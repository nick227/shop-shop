/** Columns the menu importer reads. `category` becomes the item's menu section. */
export const MENU_CSV_COLUMNS = [
  'title',
  'description',
  'price',
  'category',
  'tags',
  'imageUrl',
  'isActive',
  'isSoldOut',
  'stockQty',
] as const

export const MENU_CSV_EXAMPLE = [
  MENU_CSV_COLUMNS.join(','),
  'Horchata,Rice milk with cinnamon,3.50,Drinks,cold;sweet,,true,false,',
  '"Al Pastor","Marinated pork, pineapple",4.00,Tacos,pork,,true,false,40',
].join('\n')

export const MENU_CSV_FILENAME = 'menu-example.csv'
