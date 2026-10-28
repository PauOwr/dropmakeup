import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LegalDataNotice, PolicyPage } from "@modules/policies/templates"

import { LEGAL } from "@/lib/brand"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Contacto",
  description: `Cómo contactar con ${STORE_NAME}.`,
}

export default function ContactPage() {
  return (
    <PolicyPage title="Contacto">
      <LegalDataNotice />
      <p>
        ¿Tienes dudas sobre un pedido, un envío o una devolución? Escríbenos a{" "}
        <strong>{LEGAL.email}</strong> e indica tu número de pedido. Te
        responderemos lo antes posible.
      </p>
      <p>
        Antes de escribirnos, quizá encuentres la respuesta en las páginas de{" "}
        <LocalizedClientLink href="/shipping" className="underline">
          envíos
        </LocalizedClientLink>{" "}
        y de{" "}
        <LocalizedClientLink href="/returns" className="underline">
          devoluciones
        </LocalizedClientLink>
        .
      </p>
    </PolicyPage>
  )
}
