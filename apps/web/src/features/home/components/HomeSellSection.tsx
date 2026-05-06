/**
 * Vendor acquisition — account required for /vendor routes.
 */
import { Link } from 'react-router-dom'

export function HomeSellSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div className="relative z-10 max-w-xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">For sellers</p>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Add your kitchen</h2>
        <p className="text-sm text-muted-foreground">
          Create an account, set up your store profile, and start listing items when you&apos;re ready. Pickup-first;
          delivery options expand as we grow.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            to="/signup"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create seller account
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-input bg-background px-4 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
