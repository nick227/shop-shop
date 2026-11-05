import { describe, expect, it } from 'vitest'
import { NO_SECTION, groupItemsBySection, matchesMenuSearch, sameSectionName, type MenuSection } from './menuSections'

const section = (id: string, name: string, sortIndex: number): MenuSection => ({
  id,
  name,
  description: null,
  sortIndex,
  isVisible: true,
  itemCount: 0,
})
const item = (title: string, sectionId: string | null, sortIndex = 0) => ({ title, sectionId, sortIndex })

describe('groupItemsBySection', () => {
  const sections = [section('d', 'Drinks', 2), section('b', 'Breakfast', 0), section('s', 'Sides', 1)]

  it('follows the vendor’s section order and each section’s item order', () => {
    const groups = groupItemsBySection(
      [item('Coffee', 'd'), item('Burrito', 'b', 2), item('Sandwich', 'b', 1), item('Fries', 's')],
      sections,
      { unsectionedName: 'More' },
    )
    expect(groups.map((g) => g.name)).toEqual(['Breakfast', 'Sides', 'Drinks'])
    expect(groups[0].items.map((i) => i.title)).toEqual(['Sandwich', 'Burrito'])
  })

  it('drops empty sections for shoppers and keeps them for the vendor', () => {
    const items = [item('Coffee', 'd')]
    expect(groupItemsBySection(items, sections, { unsectionedName: 'More' }).map((g) => g.name)).toEqual(['Drinks'])
    expect(
      groupItemsBySection(items, sections, { unsectionedName: 'More', includeEmpty: true }).map((g) => g.name),
    ).toEqual(['Breakfast', 'Sides', 'Drinks'])
  })

  it('puts items without a known section last', () => {
    const groups = groupItemsBySection([item('Mystery', null), item('Orphan', 'gone'), item('Coffee', 'd')], sections, {
      unsectionedName: 'More',
    })
    expect(groups.at(-1)).toMatchObject({ id: NO_SECTION, name: 'More' })
    expect(groups.at(-1)?.items.map((i) => i.title)).toEqual(['Mystery', 'Orphan'])
  })

  it('does not reorder the arrays it was given', () => {
    const items = [item('B', 'b', 2), item('A', 'b', 1)]
    groupItemsBySection(items, sections, { unsectionedName: 'More' })
    expect(items.map((i) => i.title)).toEqual(['B', 'A'])
  })
})

describe('sameSectionName', () => {
  it('ignores case and spacing, as the server’s unique names do', () => {
    expect(sameSectionName(' breakfast  plates', 'Breakfast Plates')).toBe(true)
    expect(sameSectionName('Drinks', 'Desserts')).toBe(false)
  })
})

describe('matchesMenuSearch', () => {
  it('matches title or description, ignoring case', () => {
    expect(matchesMenuSearch({ title: 'Al Pastor', description: 'pork, pineapple' }, 'PINE')).toBe(true)
    expect(matchesMenuSearch({ title: 'Horchata' }, 'taco')).toBe(false)
    expect(matchesMenuSearch({ title: 'Anything' }, '   ')).toBe(true)
  })
})
