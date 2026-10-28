"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    tax_total?: number | null
    currency_code: string
    item_total?: number | null
    shipping_total?: number | null
    discount_total?: number | null
    shipping_methods?: unknown[] | null
  }
}

// Los precios llevan el IVA incluido (región «Europe»): todos los importes se
// muestran con IVA y el impuesto aparece aparte solo como información.
const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_total,
    shipping_total,
    discount_total,
    shipping_methods,
  } = totals
  const format = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currency_code })
  const hasShipping = !!shipping_methods?.length

  return (
    <div>
      <dl className="flex flex-col gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd data-testid="cart-subtotal" data-value={item_total || 0}>
            {format(item_total)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Envío</dt>
          <dd data-testid="cart-shipping" data-value={shipping_total || 0}>
            {hasShipping ? format(shipping_total) : "Se calcula en el checkout"}
          </dd>
        </div>
        {!!discount_total && (
          <div className="flex items-center justify-between">
            <dt>Descuento</dt>
            <dd
              className="text-foreground"
              data-testid="cart-discount"
              data-value={discount_total || 0}
            >
              - {format(discount_total)}
            </dd>
          </div>
        )}
      </dl>
      <div className="my-4 h-px w-full bg-border" />
      <div className="flex items-baseline justify-between text-foreground">
        <span className="text-eyebrow">Total</span>
        <span
          className="text-xl font-semibold"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {format(total)}
        </span>
      </div>
      <p
        className="mt-1 text-right text-xs text-muted-foreground"
        data-testid="cart-taxes"
        data-value={tax_total || 0}
      >
        {/* Sin dirección de envío Medusa aún no ha calculado el IVA */}
        {tax_total ? `IVA incluido: ${format(tax_total)}` : "IVA incluido"}
      </p>
      <div className="mt-4 h-px w-full bg-border" />
    </div>
  )
}

export default CartTotals
