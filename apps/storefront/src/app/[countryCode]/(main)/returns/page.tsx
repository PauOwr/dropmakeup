import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import { PoliciesUnavailable, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Política de devoluciones",
  description: "Cómo devolver un pedido y recibir el reembolso.",
}

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="Política de devoluciones">
      {current ? (
        <>
          <p>
            Puedes devolver los productos en los {current.returnWindowDays} días
            siguientes a la entrega. Las devoluciones se envían por correo.
          </p>
          <p>
            {current.freeReturns
              ? "El envío de la devolución es gratuito."
              : "Los gastos de envío de la devolución corren a cargo del cliente."}
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
