import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  LegalDataNotice,
  PolicyPage,
  PolicySection,
  PolicyUpdated,
} from "@modules/policies/templates"

import { LEGAL } from "@/lib/brand"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Datos del titular y condiciones de uso de ${STORE_NAME}.`,
}

export default function LegalNoticePage() {
  return (
    <PolicyPage title="Aviso legal">
      <LegalDataNotice />

      <PolicySection title="1. Titular del sitio web">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la
          Sociedad de la Información y de Comercio Electrónico (LSSI), estos son
          los datos del titular de la tienda online {STORE_NAME}:
        </p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 xsmall:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">Titular</dt>
          <dd>{LEGAL.owner}</dd>
          <dt className="text-muted-foreground">NIF</dt>
          <dd>{LEGAL.taxId}</dd>
          <dt className="text-muted-foreground">Domicilio</dt>
          <dd>{LEGAL.address}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{LEGAL.email}</dd>
          {LEGAL.registry && (
            <>
              <dt className="text-muted-foreground">Registro</dt>
              <dd>{LEGAL.registry}</dd>
            </>
          )}
        </dl>
      </PolicySection>

      <PolicySection title="2. Objeto">
        <p>
          Este sitio web ofrece información sobre productos de maquillaje y
          cosmética y permite comprarlos online. Las compras se rigen por los{" "}
          <LocalizedClientLink href="/terms" className="underline">
            términos y condiciones
          </LocalizedClientLink>
          .
        </p>
      </PolicySection>

      <PolicySection title="3. Condiciones de uso">
        <p>
          Al navegar por este sitio te conviertes en usuario y te comprometes a
          usarlo de forma lícita, sin dañar el sitio ni a terceros, y a dar datos
          veraces cuando hagas un pedido o crees una cuenta. Eres responsable de
          mantener en secreto tu contraseña.
        </p>
      </PolicySection>

      <PolicySection title="4. Propiedad intelectual e industrial">
        <p>
          La marca {STORE_NAME}, el logotipo, el diseño del sitio y sus textos
          pertenecen al titular o se usan con autorización. Las marcas e
          imágenes de los productos pertenecen a sus respectivos propietarios.
          No está permitido reproducir, distribuir ni transformar estos
          contenidos sin autorización, salvo para uso personal y privado.
        </p>
      </PolicySection>

      <PolicySection title="5. Responsabilidad">
        <p>
          Procuramos que la información del sitio sea correcta y esté
          actualizada, y que el sitio funcione sin interrupciones, pero no
          podemos garantizarlo en todo momento. No somos responsables de los
          daños derivados de interrupciones técnicas ajenas a nosotros ni del mal
          uso del sitio por parte de los usuarios.
        </p>
      </PolicySection>

      <PolicySection title="6. Enlaces">
        <p>
          Si el sitio incluye enlaces a páginas de terceros, no controlamos sus
          contenidos ni respondemos de ellos. Si detectas un contenido ilícito
          enlazado desde aquí, avísanos y lo retiraremos.
        </p>
      </PolicySection>

      <PolicySection title="7. Protección de datos y cookies">
        <p>
          Cómo tratamos tus datos y qué cookies usamos se explica en la{" "}
          <LocalizedClientLink href="/privacy" className="underline">
            política de privacidad
          </LocalizedClientLink>
          .
        </p>
      </PolicySection>

      <PolicySection title="8. Ley aplicable">
        <p>
          Este aviso legal se rige por la ley española. Si eres consumidor,
          puedes acudir a los tribunales de tu domicilio.
        </p>
      </PolicySection>

      <PolicyUpdated />
    </PolicyPage>
  )
}
