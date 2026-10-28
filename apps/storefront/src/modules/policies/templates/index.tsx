import { convertToLocale } from "@lib/util/money"
import {
  deliveryDays,
  formatDayRange,
  ShippingPolicy,
  StorePolicies,
} from "@lib/util/store-policies"

import { isLegalDataComplete, LEGAL } from "@/lib/brand"

export const formatShippingRate = (rate: number, currencyCode: string) =>
  rate === 0 ? "Gratis" : convertToLocale({ amount: rate, currency_code: currencyCode })

export const PolicyPage = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="content-container py-12 max-w-3xl" data-testid="policy-page">
    <h1 className="text-display mb-8 text-3xl">{title}</h1>
    <div className="flex flex-col gap-6 text-base-regular text-ui-fg-base">
      {children}
    </div>
  </div>
)

/** Apartado numerado de un texto legal. */
export const PolicySection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
)

export const PolicyUpdated = () => (
  <p className="text-sm text-muted-foreground">
    Última actualización: {LEGAL.lastUpdated}
  </p>
)

export const PoliciesUnavailable = () => (
  <p className="text-ui-fg-subtle">
    Todavía no hemos publicado esta información para tu país.
  </p>
)

const ShippingRow = ({
  name,
  policy,
  currencyCode,
}: {
  name: string
  policy: ShippingPolicy
  currencyCode: string
}) => (
  <tr className="border-b last:border-b-0">
    <th scope="row" className="py-3 pr-4 text-left font-medium">
      {name}
    </th>
    <td className="py-3 pr-4">{formatDayRange(deliveryDays(policy))} días laborables</td>
    <td className="py-3 text-right">
      {formatShippingRate(policy.shippingRate, currencyCode)}
    </td>
  </tr>
)

export const ShippingSummary = ({
  policies,
  currencyCode,
}: {
  policies: StorePolicies
  currencyCode: string
}) => (
  <div className="flex flex-col gap-3">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-normal">Método</th>
          <th scope="col" className="py-2 pr-4 font-normal">Entrega</th>
          <th scope="col" className="py-2 text-right font-normal">Precio</th>
        </tr>
      </thead>
      <tbody>
        <ShippingRow name="Envío estándar" policy={policies} currencyCode={currencyCode} />
        {policies.express && (
          <ShippingRow
            name="Envío exprés"
            policy={policies.express}
            currencyCode={currencyCode}
          />
        )}
      </tbody>
    </table>
    <p className="text-sm text-muted-foreground">
      Los plazos cuentan desde que haces el pedido e incluyen{" "}
      {formatDayRange(policies.handlingDays)} días laborables de preparación.
      Los precios incluyen el IVA.
    </p>
  </div>
)

/** Aviso visible mientras falten los datos del titular en `src/lib/brand.ts`. */
export const LegalDataNotice = () =>
  isLegalDataComplete() ? null : (
    <p
      className="border border-gold bg-nude-soft p-4 text-sm"
      data-testid="policy-placeholder"
    >
      Borrador: faltan los datos del titular de la tienda (los textos entre
      corchetes). Complétalos en <code>src/lib/brand.ts</code> y haz revisar
      este texto por un profesional antes de abrir la tienda.
    </p>
  )
