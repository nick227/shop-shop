export type CoverageReport = {
  readonly zips: { readonly total: number; readonly created: number; readonly updated: number }
  readonly neighborhoods: { readonly created: number; readonly preserved: number; readonly unpublished: number }
  readonly businesses: {
    readonly found: number
    readonly created: number
    readonly existing: number
    readonly unmatched: number
    readonly byCategory: Readonly<Record<string, number>>
  }
  readonly coverage: {
    readonly zipsWithListings: number
    readonly zipsWithoutListings: readonly string[]
    readonly listingsWithoutZip: number
    readonly listingsWithoutNeighborhood: number
  }
}

export function CoverageReportView({ report }: { readonly report: CoverageReport }) {
  const categories = Object.entries(report.businesses.byCategory)
  return (
    <section className="space-y-2 rounded-lg border border-border p-3 text-sm">
      <h2 className="font-semibold">Austin coverage</h2>
      <p>ZIPs: {report.zips.total} total, {report.zips.created} added, {report.zips.updated} refreshed. {report.coverage.zipsWithListings} have a listing.</p>
      <p>Neighborhoods: {report.neighborhoods.created} drafts created, {report.neighborhoods.preserved} existing profiles kept, {report.neighborhoods.unpublished} still unpublished.</p>
      <p>Businesses: {report.businesses.found} found, {report.businesses.created} added, {report.businesses.existing} already imported, {report.businesses.unmatched} outside a city ZIP boundary.</p>
      <p>Listings without a ZIP: {report.coverage.listingsWithoutZip}. Listings on the city rather than one neighborhood: {report.coverage.listingsWithoutNeighborhood}.</p>
      {categories.length > 0 ? <p>{categories.map(([label, count]) => `${label} ${count}`).join(' · ')}</p> : null}
      {report.coverage.zipsWithoutListings.length > 0 ? <p>ZIPs with no listing yet: {report.coverage.zipsWithoutListings.join(', ')}</p> : null}
    </section>
  )
}
