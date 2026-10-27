"use client"

import { deleteLineItem, retrieveCart, updateLineItem } from "@lib/data/cart"
import { CART_UPDATED_EVENT, notifyCartUpdated } from "@lib/util/cart-events"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import {
  HandbagIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { AnimatedSheetContent } from "@/components/animated-sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

const MAX_QUANTITY = 10

const countItems = (cart?: HttpTypes.StoreCart | null) =>
  cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0

const isCartOrCheckout = (pathname: string) =>
  /\/(cart|checkout)(\/|$)/.test(pathname)

export default function CartDrawer({
  cart: serverCart,
}: {
  cart?: HttpTypes.StoreCart | null
}) {
  // Las páginas estáticas no pueden leer la cookie de la cesta, así que se carga en el navegador.
  const [clientCart, setClientCart] = useState<HttpTypes.StoreCart | null>(null)
  const cart = serverCart ?? clientCart
  const totalItems = countItems(cart)
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()
  const { countryCode } = useParams<{ countryCode: string }>()
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const prefersReducedMotion = useReducedMotion()

  // Artículos que ya había; null mientras no se conoce la cesta inicial
  const [seenCount, setSeenCount] = useState<number | null>(
    serverCart ? countItems(serverCart) : null
  )
  // Sube cada vez que se añaden artículos: dispara la animación de la bolsa
  const [addedCount, setAddedCount] = useState(0)

  // Al añadir artículos se abre el panel (salvo en la cesta y en el checkout)
  if (seenCount !== totalItems) {
    if (seenCount !== null && totalItems > seenCount) {
      setAddedCount((count) => count + 1)
      if (!isCartOrCheckout(pathname)) {
        setOpen(true)
      }
    }
    setSeenCount(totalItems)
  }

  useEffect(() => {
    if (serverCart) {
      return
    }

    let isInitialLoad = true
    const load = () =>
      retrieveCart()
        .then((loadedCart) => {
          if (isInitialLoad) {
            // Lo que ya estaba en la cesta no debe abrir el panel
            setSeenCount(countItems(loadedCart))
            isInitialLoad = false
          }
          setClientCart(loadedCart)
        })
        .catch(() => {})

    load()
    window.addEventListener(CART_UPDATED_EVENT, load)
    return () => window.removeEventListener(CART_UPDATED_EVENT, load)
  }, [serverCart])

  // Microinteracción al añadir: la bolsa se agita y el contador rebota
  useEffect(() => {
    if (!addedCount || prefersReducedMotion || !scope.current) {
      return
    }
    animate(
      "[data-cart-icon]",
      { rotate: [0, -14, 10, -6, 0] },
      { duration: 0.55 }
    )
    // Tres fotogramas: los muelles de Motion solo admiten dos, así que va con tween
    animate(
      "[data-cart-count]",
      { scale: [1, 1.45, 1] },
      { duration: 0.4, ease: "easeOut" }
    )
  }, [addedCount, prefersReducedMotion, animate, scope])

  const close = () => setOpen(false)
  const itemsLabel = totalItems === 1 ? "1 artículo" : `${totalItems} artículos`

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Un enlace real a /cart: sin JavaScript lleva a la cesta; con JavaScript abre el panel */}
      <Link
        ref={triggerRef}
        href={`/${countryCode}/cart`}
        onClick={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
        className="relative flex size-11 items-center justify-center transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`Cesta, ${itemsLabel}`}
        data-testid="nav-cart-link"
      >
        <span ref={scope} className="relative flex">
          <HandbagIcon data-cart-icon className="size-[22px]" />
          {totalItems > 0 && (
            <span
              data-cart-count
              className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-none font-semibold text-white"
            >
              {totalItems}
            </span>
          )}
        </span>
      </Link>
      <span className="sr-only" aria-live="polite">
        {`La cesta tiene ${itemsLabel}`}
      </span>

      <AnimatedSheetContent
        open={open}
        side="right"
        finalFocus={triggerRef}
        className="data-[side=right]:max-w-md"
      >
        <SheetHeader className="gap-1 border-b px-5 py-5 pr-14">
          <SheetTitle className="text-display text-lg">Tu cesta</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {totalItems ? itemsLabel : "Todavía no has añadido nada"}
          </SheetDescription>
        </SheetHeader>

        {cart && items.length ? (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <ul className="relative flex flex-col" data-testid="nav-cart-dropdown">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 48 }}
                      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                      className="border-b py-5 last:border-b-0"
                      data-testid="cart-item"
                    >
                      <CartDrawerItem
                        item={item}
                        currencyCode={cart.currency_code}
                        onNavigate={close}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            <SheetFooter className="gap-3 border-t px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-eyebrow">Subtotal</span>
                <span
                  className="text-base font-semibold"
                  data-testid="cart-subtotal"
                  data-value={cart.item_subtotal ?? 0}
                >
                  {convertToLocale({
                    amount: cart.item_subtotal ?? 0,
                    currency_code: cart.currency_code,
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los gastos de envío y los impuestos se calculan al finalizar la
                compra.
              </p>
              <LocalizedClientLink
                href="/checkout?step=address"
                onClick={close}
                className={buttonVariants({ size: "xl", className: "w-full" })}
              >
                Finalizar compra
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/cart"
                onClick={close}
                className={buttonVariants({
                  variant: "outline",
                  size: "xl",
                  className: "w-full",
                })}
                data-testid="go-to-cart-button"
              >
                Ver la cesta
              </LocalizedClientLink>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-nude-soft text-ink">
              <HandbagIcon className="size-7" />
            </span>
            <p className="text-display text-xl">Tu cesta está vacía</p>
            <p className="text-sm text-muted-foreground">
              Descubre nuestros labiales, bases e iluminadores.
            </p>
            <LocalizedClientLink
              href="/store"
              onClick={close}
              className={buttonVariants({ size: "xl" })}
            >
              Ver productos
            </LocalizedClientLink>
          </div>
        )}
      </AnimatedSheetContent>
    </Sheet>
  )
}

function CartDrawerItem({
  item,
  currencyCode,
  onNavigate,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  onNavigate: () => void
}) {
  const [pending, setPending] = useState<"quantity" | "remove" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const variantTitle = item.variant?.title
  const showVariant = !!variantTitle && !/^default/i.test(variantTitle)

  const changeQuantity = async (quantity: number) => {
    setPending("quantity")
    setError(null)
    try {
      await updateLineItem({ lineId: item.id, quantity })
      notifyCartUpdated()
    } catch {
      setError("No se ha podido cambiar la cantidad. Inténtalo de nuevo.")
    } finally {
      setPending(null)
    }
  }

  const remove = async () => {
    setPending("remove")
    setError(null)
    try {
      await deleteLineItem(item.id)
      notifyCartUpdated()
    } catch {
      setError("No se ha podido eliminar el producto. Inténtalo de nuevo.")
      setPending(null)
    }
  }

  return (
    <div className="grid grid-cols-[88px_1fr] gap-4">
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-semibold uppercase">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              onClick={onNavigate}
              data-testid="product-link"
            >
              {item.product_title ?? item.title}
            </LocalizedClientLink>
          </h3>
          <div className="shrink-0 text-sm">
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>
        {showVariant && (
          <p className="text-xs text-muted-foreground" data-testid="cart-item-variant">
            {variantTitle}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center border" aria-busy={pending === "quantity"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={!!pending || item.quantity <= 1}
              aria-label={`Quitar una unidad de ${item.product_title ?? item.title}`}
            >
              <MinusIcon />
            </Button>
            <span
              className="flex w-8 justify-center text-sm tabular-nums"
              data-testid="cart-item-quantity"
              data-value={item.quantity}
            >
              {pending === "quantity" ? <Spinner className="size-3.5" /> : item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={!!pending || item.quantity >= MAX_QUANTITY}
              aria-label={`Añadir una unidad de ${item.product_title ?? item.title}`}
            >
              <PlusIcon />
            </Button>
          </div>

          <Button
            variant="link"
            size="sm"
            onClick={remove}
            disabled={!!pending}
            className="text-muted-foreground"
            data-testid="cart-item-remove-button"
          >
            {pending === "remove" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <TrashIcon data-icon="inline-start" />
            )}
            Eliminar
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
