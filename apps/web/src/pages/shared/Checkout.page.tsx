/**
 * CheckoutPage - one page: how you'll get the order (pickup, or delivery to an address), an optional
 * tip, and payment, beside a summary of exactly what will be charged.
 *
 * Every amount and every "can this be delivered" answer comes from the checkout quote, the same pricing
 * code that creates the order. When the chosen method isn't possible, the page says why and offers the
 * next step instead of payment.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useCart } from '@shared/hooks/hooks/useCart'
import { useStore } from '@shared/hooks/hooks/useStores'
import { apiClient } from '@api/client'
import { handleApiError } from '@api/errors'
import { useAuthStore } from '@stores/authStore'
import { Button, Spinner } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { cn } from '@shared/lib/cn'
import { formatCurrency } from '@shared/lib/utils/format'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { checkoutLines, useCheckoutQuote, type CheckoutQuote, type DeliveryAddressDraft, type FulfillmentType } from '@features/checkout/hooks/useCheckoutQuote'
import { useAddresses, useSaveAddress, type SavedAddress } from '@features/checkout/hooks/useAddresses'
import { readCheckoutPrefs, writeCheckoutPrefs } from '@features/checkout/checkoutPrefs'
import { DELIVERY_AT_CHECKOUT } from '@features/checkout/fulfillment'
import { ChosenAddress, DeliveryAddress, FulfillmentChoice, PickupDetails, Unavailable } from '@features/checkout/components/Fulfillment'
import { OrderSummary } from '@features/checkout/components/OrderSummary'
import { PaymentSection, type CheckoutPaymentPayload } from '@features/checkout/components/PaymentSection/PaymentSection'
import { clearPendingOrderForCheckout, getPendingOrderForCart, setPendingOrderForCart } from '@shared/lib/checkoutPendingOrder'

/** Reasons that belong to the store, not the address: delivery simply isn't offered there. */
const STORE_LEVEL_DELIVERY_CODES = new Set(['STORE_DOES_NOT_DELIVER', 'NO_DELIVERY_AREA', 'STORE_LOCATION_MISSING'])
const TIPS = [0, 2, 3, 5] as const

function Step({ title, children, className }: { readonly title: string; readonly children: React.ReactNode; readonly className?: string }) {
  return (
    <section className={cn('space-y-4 border-b border-border pb-6 last:border-b-0', className)} aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function paymentHint({ fetching, needsAddress, blocked }: { readonly fetching: boolean; readonly needsAddress: boolean; readonly blocked: boolean }): string {
  if (fetching) return 'Updating your total…'
  if (needsAddress) return 'Add a delivery address to continue.'
  if (blocked) return 'Choose an option above to continue.'
  return 'Checking prices…'
}

function startSession({ cart, deliveryType, addressId, draft, tip, paymentMethod }: {
  readonly cart: NonNullable<ReturnType<typeof useCart>['cart']>
  readonly deliveryType: FulfillmentType
  readonly addressId: string | null
  readonly draft: DeliveryAddressDraft | null
  readonly tip: number
  readonly paymentMethod: { type: 'DIGITAL_WALLET' | 'CREDIT_CARD'; token: string }
}) {
  const delivering = deliveryType === 'DELIVERY'
  return apiClient.checkout.createSession({
    items: checkoutLines(cart),
    deliveryType,
    deliveryMode: delivering ? 'STORE_MANAGED_DELIVERY' : 'PICKUP',
    ...(delivering && addressId ? { deliveryAddressId: addressId } : {}),
    ...(delivering && !addressId && draft ? { deliveryAddress: draft } : {}),
    paymentMethod,
    ...(tip > 0 ? { tipAmount: tip } : {}),
  } as Parameters<typeof apiClient.checkout.createSession>[0])
}

function FulfillmentStep(props: {
  readonly deliveryType: FulfillmentType
  readonly onDeliveryType: (next: FulfillmentType) => void
  readonly offersPickup: boolean
  readonly offersDelivery: boolean
  readonly showPicker: boolean
  readonly loadingAddresses: boolean
  readonly signedIn: boolean
  readonly savedAddresses: readonly SavedAddress[]
  readonly addressId: string | null
  readonly draft: DeliveryAddressDraft | null
  readonly savingAddress: boolean
  readonly chosen: DeliveryAddressDraft | null
  readonly data: CheckoutQuote | undefined
  readonly storeName: string
  readonly storeAddress: string
  readonly storePath: string | null
  readonly readyInMinutes: number | null
  readonly onSelectAddress: (id: string) => void
  readonly onDraftAddress: (draft: DeliveryAddressDraft | null) => void
  readonly onSaveAddress: (draft: DeliveryAddressDraft) => Promise<void>
  readonly onEditAddress: () => void
}) {
  const { data } = props
  const delivering = props.deliveryType === 'DELIVERY'
  let where: React.ReactNode = <PickupDetails storeName={props.storeName} address={props.storeAddress} readyInMinutes={props.readyInMinutes} />
  if (delivering && props.showPicker) {
    where = props.loadingAddresses ? (
      <p className="text-sm text-muted-foreground">Loading your addresses…</p>
    ) : (
      <DeliveryAddress
        signedIn={props.signedIn}
        saved={props.savedAddresses}
        selectedId={props.addressId}
        draft={props.draft}
        saving={props.savingAddress}
        onSelect={props.onSelectAddress}
        onDraft={props.onDraftAddress}
        onSave={props.onSaveAddress}
      />
    )
  } else if (delivering) {
    where = props.chosen ? (
      <ChosenAddress address={props.chosen} approximate={Boolean(data?.destination?.approximate)} onChange={props.onEditAddress} />
    ) : null
  }
  const deliveryOk = delivering && data && !data.blocked && data.fulfillment.delivery.available ? data.fulfillment.delivery : null
  return (
    <Step title="How you’ll get it">
      <FulfillmentChoice
        value={props.deliveryType}
        onChange={props.onDeliveryType}
        offersPickup={props.offersPickup}
        offersDelivery={props.offersDelivery}
      />
      {where}
      {data ? (
        <Unavailable quote={data} storePath={props.storePath} onPickup={() => props.onDeliveryType('PICKUP')} onChangeAddress={props.onEditAddress} />
      ) : null}
      {deliveryOk?.available ? (
        <p className="text-sm text-muted-foreground">
          Delivery {formatCurrency(deliveryOk.fee)}
          {deliveryOk.distanceMiles !== null ? ` · ${deliveryOk.distanceMiles} mi away` : ''}
        </p>
      ) : null}
    </Step>
  )
}

function TipStep({ tip, customTip, storeName, onTip }: {
  readonly tip: number
  readonly customTip: string
  readonly storeName: string
  readonly onTip: (amount: number, custom: string) => void
}) {
  return (
    <Step title="Tip">
      <div role="radiogroup" aria-label="Tip" className="flex flex-wrap gap-2">
        {TIPS.map((amount) => (
          <button
            key={amount}
            type="button"
            role="radio"
            aria-checked={tip === amount && customTip === ''}
            onClick={() => onTip(amount, '')}
            className={cn(
              'h-10 min-w-[4rem] rounded-full border px-4 text-sm font-semibold',
              tip === amount && customTip === '' ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40',
            )}
          >
            {amount === 0 ? 'None' : `$${amount}`}
          </button>
        ))}
        <label className="sr-only" htmlFor="custom-tip">Custom tip</label>
        <input
          id="custom-tip"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          placeholder="Other"
          value={customTip}
          onChange={(e) => onTip(Math.max(0, Math.round((Number.parseFloat(e.target.value) || 0) * 100) / 100), e.target.value)}
          className="h-10 w-24 rounded-full border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <p className="text-sm text-muted-foreground">Tips go to {storeName}.</p>
    </Step>
  )
}

/** Starts (or reuses) the checkout session for these exact choices, then completes it. */
function usePlaceOrder({ cart, sessionKey, payable, deliveryType, addressId, draft, tip, onPriceChanged }: {
  readonly cart: ReturnType<typeof useCart>['cart']
  readonly sessionKey: string
  readonly payable: boolean
  readonly deliveryType: FulfillmentType
  readonly addressId: string | null
  readonly draft: DeliveryAddressDraft | null
  readonly tip: number
  readonly onPriceChanged: () => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | undefined>()
  const lastPaymentRef = useRef<CheckoutPaymentPayload | null>(null)

  const handlePayment = async (payload: CheckoutPaymentPayload) => {
    if (!cart || !payable) return
    setIsSubmitting(true)
    setPaymentError(undefined)
    lastPaymentRef.current = payload
    const paymentMethod = {
      type: payload.rail === 'COD' ? ('DIGITAL_WALLET' as const) : ('CREDIT_CARD' as const),
      token: payload.rail === 'COD' ? 'cod' : payload.paymentMethodId,
    }
    try {
      let sessionId = getPendingOrderForCart(sessionKey)
      if (!sessionId) {
        sessionId = (await startSession({ cart, deliveryType, addressId, draft, tip, paymentMethod })).sessionId
        setPendingOrderForCart(sessionKey, sessionId)
      }
      const affiliateReferralCode = localStorage.getItem('affiliateReferralCode') || undefined
      const completion = await apiClient.checkout.complete({
        sessionId,
        paymentMethod,
        paymentRail: payload.rail,
        ...(tip > 0 ? { tipAmount: tip } : {}),
        ...(affiliateReferralCode ? { affiliateReferralCode } : {}),
      })
      clearPendingOrderForCheckout()
      clearCart()
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (completion.referralCodeApplied) {
        localStorage.removeItem('affiliateReferralCode')
        localStorage.removeItem('affiliateReferralId')
      }
      toast.success('Order placed')
      navigate(`/orders/${completion.order.id}`)
    } catch (error: unknown) {
      const appError = await handleApiError(error)
      // A changed price or expired session needs a fresh session and a fresh look at the totals.
      if (/prices changed|expired|already created/i.test(appError.message)) {
        clearPendingOrderForCheckout()
        onPriceChanged()
      }
      setPaymentError(appError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryPayment = () => {
    if (lastPaymentRef.current) void handlePayment(lastPaymentRef.current)
  }

  return { handlePayment, retryPayment, isSubmitting, paymentError, setPaymentError }
}

/** A signed-in shopper with saved addresses starts from their default one (their own choice, never the browsing ZIP). */
function useDefaultAddress({ active, savedAddresses, onPick }: {
  readonly active: boolean
  readonly savedAddresses: readonly SavedAddress[]
  readonly onPick: (id: string) => void
}) {
  useEffect(() => {
    if (!active || savedAddresses.length === 0) return
    onPick((savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]).id)
  }, [active, savedAddresses, onPick])
}

/** Which ways of getting the order this store offers; switches to the offered one if the choice isn't. */
function useOfferedMethods(data: CheckoutQuote | undefined, deliveryType: FulfillmentType, setDeliveryType: (next: FulfillmentType) => void) {
  const deliveryReason = data && !data.fulfillment.delivery.available ? data.fulfillment.delivery.code : null
  const offersDelivery = DELIVERY_AT_CHECKOUT && !(deliveryReason && STORE_LEVEL_DELIVERY_CODES.has(deliveryReason))
  const offersPickup = data?.fulfillment.pickup.available ?? true
  useEffect(() => {
    if (!data) return
    if (deliveryType === 'DELIVERY' && !offersDelivery && offersPickup) setDeliveryType('PICKUP')
    if (deliveryType === 'PICKUP' && !offersPickup && offersDelivery) setDeliveryType('DELIVERY')
  }, [data, deliveryType, offersDelivery, offersPickup, setDeliveryType])
  return { offersPickup, offersDelivery }
}

function storeLocation(store: { addressStreet?: string | null; addressCity?: string | null; addressState?: string | null; addressZip?: string | null } | undefined): string {
  if (!store) return ''
  return [store.addressStreet, store.addressCity, [store.addressState, store.addressZip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

function checkoutSessionKey(cart: ReturnType<typeof useCart>['cart'], choices: readonly unknown[]): string {
  return cart ? `${cart.id}:${JSON.stringify([checkoutLines(cart), ...choices])}` : ''
}

function PaymentStep({ quote, hint, onPay, onRetry, onBackToCart, isSubmitting, paymentError }: {
  /** Set only when the order can be paid as quoted. */
  readonly quote: CheckoutQuote | undefined
  readonly hint: string
  readonly onPay: (payload: CheckoutPaymentPayload) => void
  readonly onRetry: () => void
  readonly onBackToCart: () => void
  readonly isSubmitting: boolean
  readonly paymentError: string | undefined
}) {
  if (!quote) {
    return (
      <>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hint}
        </p>
        {paymentError ? (
          <p role="alert" className="text-sm text-destructive">
            {paymentError}
          </p>
        ) : null}
      </>
    )
  }
  return (
    <PaymentSection
      amount={quote.total}
      subtotal={quote.subtotal}
      deliveryFee={quote.deliveryFee}
      tax={quote.tax}
      tip={quote.tip}
      onPaymentReady={onPay}
      onBackToCart={onBackToCart}
      onRetryPayment={onRetry}
      isProcessing={isSubmitting}
      paymentError={paymentError}
      enableCod={import.meta.env.VITE_ENABLE_COD_PAYMENTS === 'true'}
      showBreakdown={false}
    />
  )
}

function CheckoutMessage({ children }: { readonly children: React.ReactNode }) {
  return (
    <PageShell className="bg-background" containerClassName="max-w-6xl">
      {children}
    </PageShell>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, isLoading } = useCart()
  const signedIn = Boolean(useAuthStore((state) => state.token))
  const { data: store } = useStore(cart?.storeId ?? '')

  const initial = useMemo(() => readCheckoutPrefs(), [])
  const [deliveryType, setDeliveryType] = useState<FulfillmentType>(initial.deliveryType)
  const [addressId, setAddressId] = useState<string | null>(initial.addressId)
  const [draft, setDraft] = useState<DeliveryAddressDraft | null>(initial.draft)
  const [editingAddress, setEditingAddress] = useState(false)
  const [tip, setTip] = useState(0)
  const [customTip, setCustomTip] = useState('')

  useEffect(() => writeCheckoutPrefs({ deliveryType, addressId, draft }), [deliveryType, addressId, draft])

  const delivering = deliveryType === 'DELIVERY'
  const { data: savedAddresses = [], isLoading: loadingAddresses } = useAddresses(signedIn && delivering)
  const saveAddress = useSaveAddress()

  useDefaultAddress({ active: delivering && !addressId && !draft, savedAddresses, onPick: setAddressId })

  const quote = useCheckoutQuote(cart, {
    deliveryType,
    tipAmount: tip,
    deliveryAddressId: delivering ? addressId : null,
    deliveryAddress: delivering && !addressId ? draft : null,
  })
  const data = quote.data

  const { offersPickup, offersDelivery } = useOfferedMethods(data, deliveryType, setDeliveryType)

  const hasAddress = Boolean(addressId || draft)
  const chosen = data?.destination?.address ?? savedAddresses.find((a) => a.id === addressId) ?? draft
  const showPicker = delivering && (editingAddress || !hasAddress)
  const payable = Boolean(data && !data.blocked && !quote.isFetching && !quote.error)

  const storeName = store?.name ?? 'the store'
  const storePath = store ? getStoreRoute({ id: store.id, name: store.name }) : null
  const storeAddress = storeLocation(store)

  /** A checkout session belongs to these exact choices; change any and a new one is started. */
  const sessionKey = checkoutSessionKey(cart, [deliveryType, addressId, delivering && !addressId ? draft : null, tip])

  const { handlePayment, retryPayment, isSubmitting, paymentError, setPaymentError } = usePlaceOrder({
    cart,
    sessionKey,
    payable,
    deliveryType,
    addressId,
    draft,
    tip,
    onPriceChanged: () => void quote.refetch(),
  })

  if (isLoading) {
    return (
      <CheckoutMessage>
        <div className="flex min-h-[320px] items-center justify-center gap-3 text-muted-foreground">
          <Spinner size="large" />
          Loading checkout…
        </div>
      </CheckoutMessage>
    )
  }

  if (!cart?.items?.length) {
    return (
      <CheckoutMessage>
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add something from a store to check out."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Browse stores
            </Button>
          }
        />
      </CheckoutMessage>
    )
  }

  const summary = <OrderSummary quote={data} loading={quote.isFetching} error={quote.error} storeName={store?.name} />

  return (
    <PageShell className="bg-background" containerClassName="max-w-6xl" contentClassName="py-6 md:py-10">
      <Link to="/cart" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Cart
      </Link>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FulfillmentStep
            deliveryType={deliveryType}
            onDeliveryType={(next) => {
              setDeliveryType(next)
              setPaymentError(undefined)
            }}
            offersPickup={offersPickup}
            offersDelivery={offersDelivery}
            showPicker={showPicker}
            loadingAddresses={loadingAddresses}
            signedIn={signedIn}
            savedAddresses={savedAddresses}
            addressId={addressId}
            draft={draft}
            savingAddress={saveAddress.isPending}
            chosen={chosen ?? null}
            data={data}
            storeName={storeName}
            storeAddress={storeAddress}
            storePath={storePath}
            readyInMinutes={store?.prepTimeMin ?? null}
            onSelectAddress={(id) => {
              setAddressId(id)
              setDraft(null)
              setEditingAddress(false)
            }}
            onDraftAddress={(next) => {
              setDraft(next)
              setAddressId(null)
              setEditingAddress(false)
            }}
            onSaveAddress={async (next) => {
              const saved = await saveAddress.mutateAsync(next)
              setAddressId(saved.id)
              setDraft(null)
              setEditingAddress(false)
            }}
            onEditAddress={() => setEditingAddress(true)}
          />

          <TipStep
            tip={tip}
            customTip={customTip}
            storeName={storeName}
            onTip={(amount, custom) => {
              setTip(amount)
              setCustomTip(custom)
            }}
          />

          {/* Phones: the total, right before paying. */}
          <div className="rounded-xl border border-border p-4 lg:hidden">{summary}</div>

          <Step title="Payment">
            <PaymentStep
              quote={payable ? data : undefined}
              hint={paymentHint({ fetching: quote.isFetching, needsAddress: delivering && !hasAddress, blocked: Boolean(data?.blocked) })}
              onPay={(payload) => void handlePayment(payload)}
              onRetry={retryPayment}
              onBackToCart={() => navigate('/cart')}
              isSubmitting={isSubmitting}
              paymentError={paymentError}
            />
          </Step>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border p-5">{summary}</div>
        </aside>
      </div>
    </PageShell>
  )
}
