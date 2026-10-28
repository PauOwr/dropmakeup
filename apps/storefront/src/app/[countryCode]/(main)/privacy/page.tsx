import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Cómo trata ${STORE_NAME} tus datos personales.`,
}

export default function PrivacyPage() {
  return (
    <PolicyPage title="Política de privacidad">
      <PlaceholderNotice />
      <p>
        {STORE_NAME} recoge los datos que nos das al hacer un pedido, como tu
        nombre, tu email y tu dirección de envío, para tramitarlo y entregarlo.
      </p>
      <p>
        Los datos de pago los gestiona nuestro proveedor de pagos y la tienda no
        los guarda. Usamos cookies para conservar tu cesta y tu sesión.
      </p>
    </PolicyPage>
  )
}
