import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de las compras en ${STORE_NAME}.`,
}

export default function TermsPage() {
  return (
    <PolicyPage title="Términos y condiciones">
      <PlaceholderNotice />
      <p>
        Al hacer un pedido en {STORE_NAME} aceptas estas condiciones. Los
        precios incluyen el IVA. Los precios, la disponibilidad y las opciones
        de envío se muestran en cada producto y en el checkout, y pueden cambiar.
      </p>
      <p>
        El pedido queda confirmado cuando recibimos el pago. Las devoluciones y
        los reembolsos se rigen por nuestra política de devoluciones.
      </p>
    </PolicyPage>
  )
}
