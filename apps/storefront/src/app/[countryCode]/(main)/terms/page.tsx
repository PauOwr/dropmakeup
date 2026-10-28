import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import { STORE_NAME } from "@lib/util/site"
import { deliveryDays, formatDayRange } from "@lib/util/store-policies"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  LegalDataNotice,
  PolicyPage,
  PolicySection,
  PolicyUpdated,
} from "@modules/policies/templates"

import { DELIVERY_TIMES, LEGAL } from "@/lib/brand"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de las compras en ${STORE_NAME}.`,
}

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <LocalizedClientLink href={href} className="underline">
    {children}
  </LocalizedClientLink>
)

export default async function TermsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  // Plazos y devoluciones salen de la región en Medusa; si no están, los de brand.ts
  const standard = current
    ? `${formatDayRange(deliveryDays(current))} días laborables`
    : DELIVERY_TIMES.standard
  const express = current?.express
    ? `${formatDayRange(deliveryDays(current.express))} días laborables`
    : DELIVERY_TIMES.express
  const returnDays = current?.returnWindowDays ?? DELIVERY_TIMES.returnDays

  return (
    <PolicyPage title="Términos y condiciones">
      <LegalDataNotice />
      <p>
        Estas condiciones regulan las compras que hagas en la tienda online{" "}
        {STORE_NAME}. Léelas antes de hacer un pedido: al realizarlo, declaras
        que las conoces y las aceptas.
      </p>

      <PolicySection title="1. Quién vende">
        <p>
          El vendedor es {LEGAL.owner}, con NIF {LEGAL.taxId} y domicilio en{" "}
          {LEGAL.address}. Puedes escribirnos a {LEGAL.email}. Tienes el resto
          de datos en el <Link href="/legal">aviso legal</Link>.
        </p>
      </PolicySection>

      <PolicySection title="2. A quién se aplican">
        <p>
          A las compras que hagan consumidores (personas que compran con fines
          ajenos a una actividad profesional) con entrega en los países a los
          que enviamos, que son los que aparecen al elegir la dirección en el
          checkout. Para comprar debes ser mayor de edad o contar con la
          autorización de tus padres o tutores.
        </p>
      </PolicySection>

      <PolicySection title="3. Cómo se hace un pedido">
        <p>
          El pedido se hace en español, siguiendo estos pasos: añades los
          productos a la cesta, pulsas «Finalizar compra», indicas tus datos y tu
          dirección, eliges el método de envío y el de pago, y revisas el resumen
          antes de pulsar «Realizar pedido». Hasta ese momento puedes corregir
          cualquier dato con los botones «Editar» o cambiar la cesta.
        </p>
        <p>
          El contrato se perfecciona cuando se completa el pago. Entonces te
          mostramos la confirmación del pedido con su número y su resumen, que
          puedes guardar o imprimir. Conservamos el pedido en nuestros sistemas
          y, si tienes cuenta, puedes consultarlo en «Mi cuenta».
        </p>
      </PolicySection>

      <PolicySection title="4. Precios e impuestos">
        <p>
          Los precios están en euros e incluyen el IVA del país de entrega. Los
          gastos de envío dependen del método que elijas y se muestran antes de
          pagar, en el resumen del pedido. Si un producto apareciera con un
          precio claramente erróneo, te avisaremos y podrás confirmar el pedido
          con el precio correcto o cancelarlo con el reembolso íntegro.
        </p>
      </PolicySection>

      <PolicySection title="5. Pago">
        <p>
          El pago se hace con los métodos que aparecen en el checkout y se cobra
          al confirmar el pedido. Los datos de tu tarjeta los trata directamente
          nuestro proveedor de pagos: {STORE_NAME} no los ve ni los guarda.
        </p>
      </PolicySection>

      <PolicySection title="6. Envío y entrega">
        <p>
          Los pedidos los preparan y envían nuestros proveedores logísticos. El
          plazo estimado de entrega es de {standard} con el envío estándar y de{" "}
          {express} con el envío exprés, contados desde la confirmación del
          pago. En cualquier caso, entregaremos el pedido en un plazo máximo de
          30 días naturales. Si no fuera posible, te avisaremos y podrás cancelar
          el pedido con el reembolso de todo lo pagado.
        </p>
        <p>
          Tienes más información en la página de <Link href="/shipping">envíos</Link>.
          El riesgo de pérdida o daño de los productos pasa a ti cuando los
          recibes.
        </p>
      </PolicySection>

      <PolicySection title="7. Derecho de desistimiento y devoluciones">
        <p>
          Tienes {returnDays} días naturales desde la entrega para desistir de la
          compra sin dar explicaciones. Por motivos de salud e higiene, quedan
          excluidos los productos de maquillaje y cosmética desprecintados tras
          la entrega. Cómo ejercerlo, los gastos y los plazos de reembolso están
          en la <Link href="/returns">política de devoluciones</Link>.
        </p>
      </PolicySection>

      <PolicySection title="8. Garantía">
        <p>
          Todos los productos tienen la garantía legal de conformidad de tres
          años desde la entrega que establece el Texto Refundido de la Ley
          General para la Defensa de los Consumidores y Usuarios. Si un producto
          no es conforme, puedes pedir su reparación o sustitución y, si no es
          posible, una rebaja del precio o la resolución del contrato. La
          garantía no cubre el desgaste normal ni el uso de un cosmético después
          de su fecha de caducidad o de su periodo después de abierto.
        </p>
      </PolicySection>

      <PolicySection title="9. Uso de los productos">
        <p>
          Antes de usar un cosmético, lee su lista de ingredientes y sus
          instrucciones, sobre todo si tienes alergias o piel sensible. Te
          recomendamos hacer una prueba en una zona pequeña de la piel. Si notas
          irritación, deja de usarlo.
        </p>
      </PolicySection>

      <PolicySection title="10. Atención al cliente y reclamaciones">
        <p>
          Para cualquier consulta, incidencia o reclamación, escríbenos a{" "}
          {LEGAL.email} indicando tu número de pedido. Te responderemos lo antes
          posible y, en todo caso, en el plazo máximo que fija la ley. Tienes a
          tu disposición hojas de reclamación. También puedes acudir a la Junta
          Arbitral de Consumo o a los servicios de consumo de tu comunidad
          autónoma.
        </p>
      </PolicySection>

      <PolicySection title="11. Datos personales">
        <p>
          Tratamos tus datos para gestionar tu pedido como se explica en la{" "}
          <Link href="/privacy">política de privacidad</Link>.
        </p>
      </PolicySection>

      <PolicySection title="12. Cambios en estas condiciones">
        <p>
          Podemos modificar estas condiciones. A cada pedido se le aplican las
          vigentes en el momento en que lo hiciste.
        </p>
      </PolicySection>

      <PolicySection title="13. Ley aplicable y tribunales">
        <p>
          Estas condiciones se rigen por la ley española, sin perjuicio de las
          normas de protección de los consumidores de tu país de residencia que
          te sean más favorables. Si eres consumidor, puedes acudir a los
          tribunales de tu domicilio.
        </p>
      </PolicySection>

      <PolicyUpdated />
    </PolicyPage>
  )
}
