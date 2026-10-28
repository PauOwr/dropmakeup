import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  PoliciesUnavailable,
  PolicyPage,
  PolicySection,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Envíos",
  description: "Gastos y plazos de envío.",
}

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="Envíos">
      {current ? (
        <>
          <p>
            Gastos y plazos de envío para pedidos a{" "}
            {countryCode.toUpperCase()}:
          </p>
          <ShippingSummary policies={current} currencyCode={currencyCode} />

          <PolicySection title="Cómo se prepara tu pedido">
            <p>
              Trabajamos con proveedores logísticos que preparan y envían los
              pedidos desde sus almacenes. Por eso los plazos son de días
              laborables (de lunes a viernes, sin festivos) y empiezan a contar
              cuando se confirma el pago.
            </p>
            <p>
              Todos los envíos llevan número de seguimiento. Si tu pedido incluye
              varios productos, es posible que lleguen en paquetes separados.
            </p>
          </PolicySection>

          <PolicySection title="Retrasos e incidencias">
            <p>
              Los plazos son estimados y pueden alargarse en temporadas de mucha
              demanda o por causas ajenas a nosotros, como incidencias del
              transportista. Si tu pedido no llega en el plazo indicado, escríbenos
              desde la página de{" "}
              <LocalizedClientLink href="/contact" className="underline">
                contacto
              </LocalizedClientLink>{" "}
              con tu número de pedido y lo revisamos.
            </p>
          </PolicySection>

          <p className="text-ui-fg-subtle">
            Los métodos de envío disponibles y el coste final se muestran en el
            checkout.
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
