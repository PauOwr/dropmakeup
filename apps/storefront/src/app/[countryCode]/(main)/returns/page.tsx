import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  LegalDataNotice,
  PoliciesUnavailable,
  PolicyPage,
  PolicySection,
  PolicyUpdated,
} from "@modules/policies/templates"

import { LEGAL } from "@/lib/brand"

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
      <LegalDataNotice />
      {current ? (
        <>
          <PolicySection title="Plazo para devolver">
            <p>
              Tienes {current.returnWindowDays} días naturales desde que recibes
              el pedido para devolverlo sin dar ninguna explicación. Es el
              derecho de desistimiento que reconoce la ley a las compras a
              distancia (artículos 102 y siguientes del Texto Refundido de la Ley
              General para la Defensa de los Consumidores y Usuarios).
            </p>
          </PolicySection>

          <PolicySection title="Productos que no se pueden devolver">
            <p>
              Por motivos de salud e higiene, no se pueden devolver los productos
              de maquillaje y cosmética que se hayan desprecintado o abierto
              después de la entrega (artículo 103.e de la misma ley). Sí puedes
              devolverlos si siguen precintados, sin usar y en su envase original.
            </p>
          </PolicySection>

          <PolicySection title="Cómo hacer una devolución">
            <ol className="flex list-decimal flex-col gap-2 pl-5">
              <li>
                Escríbenos a {LEGAL.email} dentro del plazo indicando tu número
                de pedido y los productos que quieres devolver. También puedes
                usar el formulario de desistimiento que encontrarás más abajo.
              </li>
              <li>
                Te responderemos con la dirección a la que enviar el paquete.
              </li>
              <li>
                Envíalo en los 14 días naturales siguientes a tu comunicación,
                bien protegido y con todo lo que recibiste.
              </li>
            </ol>
            <p>
              {current.freeReturns
                ? "El envío de la devolución es gratuito."
                : "Los gastos de envío de la devolución corren a cargo del cliente."}
            </p>
          </PolicySection>

          <PolicySection title="Reembolso">
            <p>
              Te devolveremos el importe del pedido, incluidos los gastos de
              envío estándar, en un plazo máximo de 14 días naturales desde que
              nos comuniques la devolución, con el mismo medio de pago que
              usaste. Podemos esperar a recibir los productos, o a que nos
              envíes el justificante de envío, antes de hacer el reembolso. Si
              elegiste un envío más caro que el estándar, la diferencia no se
              reembolsa.
            </p>
          </PolicySection>

          <PolicySection title="Productos defectuosos o equivocados">
            <p>
              Si un producto llega dañado, defectuoso o no es el que pediste,
              escríbenos con fotos lo antes posible. En ese caso nos hacemos
              cargo de los gastos y te ofrecemos su sustitución o el reembolso,
              según la garantía legal de tres años que tienen todos los
              productos.
            </p>
          </PolicySection>

          <PolicySection title="Formulario de desistimiento">
            <p>
              Si quieres, puedes copiar este texto, completarlo y enviárnoslo
              por email:
            </p>
            <blockquote className="border-l-2 border-gold pl-4 text-sm text-muted-foreground">
              A la atención de {LEGAL.owner}, {LEGAL.address}, {LEGAL.email}:
              por la presente le comunico que desisto de mi contrato de venta de
              los siguientes bienes: [productos]. Pedido el [fecha] y recibido el
              [fecha]. Número de pedido: [número]. Nombre del consumidor:
              [nombre]. Domicilio del consumidor: [domicilio]. Firma (solo si el
              formulario se presenta en papel). Fecha: [fecha].
            </blockquote>
          </PolicySection>

          <PolicyUpdated />
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
