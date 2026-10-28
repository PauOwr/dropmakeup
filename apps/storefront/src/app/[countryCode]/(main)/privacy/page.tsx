import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
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
  title: "Política de privacidad",
  description: `Cómo trata ${STORE_NAME} tus datos personales.`,
}

// Cookies que usa la tienda: todas técnicas (ver src/lib/data/cookies.ts)
const COOKIES = [
  ["_medusa_cart_id", "Guarda tu cesta.", "7 días"],
  ["_medusa_jwt", "Mantiene tu sesión si inicias sesión.", "7 días"],
  ["_medusa_pending_customer", "Completa el alta de una cuenta nueva.", "1 día"],
  ["_medusa_cache_id", "Muestra los datos actualizados de la tienda.", "1 día"],
  ["_medusa_locale", "Recuerda el idioma elegido.", "1 año"],
  ["__stripe_mid, __stripe_sid", "Las pone el proveedor de pagos al pagar, para prevenir el fraude.", "1 año / 30 minutos"],
]

export default function PrivacyPage() {
  return (
    <PolicyPage title="Política de privacidad">
      <LegalDataNotice />
      <p>
        En {STORE_NAME} tratamos tus datos personales conforme al Reglamento
        General de Protección de Datos (RGPD) y a la Ley Orgánica 3/2018 de
        Protección de Datos Personales y garantía de los derechos digitales
        (LOPDGDD). Aquí te explicamos qué datos usamos, para qué y cuáles son
        tus derechos.
      </p>

      <PolicySection title="1. Responsable del tratamiento">
        <p>
          {LEGAL.owner}, con NIF {LEGAL.taxId} y domicilio en {LEGAL.address}.
          Contacto para cualquier cuestión de privacidad: {LEGAL.email}.
        </p>
      </PolicySection>

      <PolicySection title="2. Qué datos tratamos">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Datos de identificación y contacto: nombre, apellidos, email,
            teléfono y direcciones de envío y facturación.
          </li>
          <li>Datos de tus pedidos: productos, importes, envíos y devoluciones.</li>
          <li>
            Datos de tu cuenta, si te registras: email y contraseña (guardada
            cifrada).
          </li>
          <li>
            Datos de pago: los gestiona nuestro proveedor de pagos. Nosotros solo
            recibimos la confirmación del pago y, como mucho, los últimos dígitos
            de la tarjeta.
          </li>
          <li>
            Datos técnicos: dirección IP y las cookies técnicas descritas más
            abajo.
          </li>
          <li>Lo que nos cuentes cuando nos escribas.</li>
        </ul>
      </PolicySection>

      <PolicySection title="3. Para qué los usamos y con qué base legal">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Gestionar tus pedidos, el pago, el envío, las devoluciones y la
            garantía. Base legal: la ejecución del contrato de compra (artículo
            6.1.b del RGPD).
          </li>
          <li>
            Gestionar tu cuenta de cliente, si la creas. Base legal: la ejecución
            del contrato de registro que aceptas al darte de alta.
          </li>
          <li>
            Atender tus consultas y reclamaciones. Base legal: la ejecución del
            contrato y nuestro interés legítimo en responderte.
          </li>
          <li>
            Cumplir nuestras obligaciones fiscales, contables y de consumo. Base
            legal: obligación legal (artículo 6.1.c del RGPD).
          </li>
          <li>
            Proteger la tienda y prevenir el fraude en los pagos. Base legal:
            nuestro interés legítimo (artículo 6.1.f del RGPD).
          </li>
        </ul>
        <p>
          No usamos tus datos para enviarte publicidad ni tomamos decisiones
          automatizadas sobre ti. Si en el futuro ofrecemos una newsletter, solo
          te la enviaremos si das tu consentimiento.
        </p>
      </PolicySection>

      <PolicySection title="4. Cuánto tiempo los guardamos">
        <p>
          Los datos de los pedidos, mientras dure la relación comercial y,
          después, durante los plazos legales: seis años para la documentación
          contable (Código de Comercio), cuatro para la fiscal (Ley General
          Tributaria) y cinco para atender posibles reclamaciones (Código
          Civil). Los de tu cuenta, hasta que la elimines. Pasados esos plazos,
          los borramos o los anonimizamos.
        </p>
      </PolicySection>

      <PolicySection title="5. Con quién los compartimos">
        <p>
          Solo con los proveedores que necesitamos para venderte y que tratan
          los datos por cuenta nuestra, con un contrato de encargo:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Nuestro proveedor logístico (CJdropshipping), que prepara y envía los
            pedidos, y las empresas de transporte que los entregan: reciben tu
            nombre, dirección y teléfono.
          </li>
          <li>Nuestro proveedor de pagos (Stripe), que procesa el cobro.</li>
          <li>
            Los proveedores de alojamiento e infraestructura de la tienda (como
            Vercel).
          </li>
        </ul>
        <p>
          También podemos comunicarlos a las administraciones públicas, jueces y
          tribunales cuando la ley lo exija.
        </p>
      </PolicySection>

      <PolicySection title="6. Transferencias internacionales">
        <p>
          Algunos de esos proveedores están fuera del Espacio Económico Europeo:
          nuestro proveedor logístico tiene sede en China, y el de pagos y el de
          alojamiento, en Estados Unidos. Estas transferencias se hacen con las
          garantías que prevé el RGPD (como el Marco de Privacidad de Datos
          UE-EE. UU. o las cláusulas contractuales tipo de la Comisión Europea)
          o, cuando hace falta para ejecutar tu pedido, al amparo del artículo
          49.1.b del RGPD.
        </p>
      </PolicySection>

      <PolicySection title="7. Tus derechos">
        <p>
          Puedes acceder a tus datos, rectificarlos o suprimirlos, oponerte a su
          tratamiento, pedir que lo limitemos y solicitar la portabilidad de tus
          datos. Escríbenos a {LEGAL.email} indicando qué derecho quieres
          ejercer; si es necesario, te pediremos que acredites tu identidad.
          Responderemos en el plazo de un mes.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes presentar una
          reclamación ante la Agencia Española de Protección de Datos
          (www.aepd.es).
        </p>
      </PolicySection>

      <PolicySection title="8. Menores de edad">
        <p>
          La tienda no está dirigida a menores de 14 años y no tratamos a
          sabiendas sus datos.
        </p>
      </PolicySection>

      <PolicySection title="9. Cookies">
        <p>
          Solo usamos cookies técnicas, necesarias para que la tienda funcione.
          Están exentas de consentimiento según el artículo 22.2 de la Ley
          34/2002 de Servicios de la Sociedad de la Información (LSSI). No usamos
          cookies de análisis ni de publicidad.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-normal">Cookie</th>
                <th scope="col" className="py-2 pr-4 font-normal">Para qué sirve</th>
                <th scope="col" className="py-2 font-normal">Duración</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map(([name, purpose, duration]) => (
                <tr key={name} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-mono text-xs">{name}</td>
                  <td className="py-2 pr-4">{purpose}</td>
                  <td className="py-2">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Puedes borrarlas o bloquearlas desde la configuración de tu navegador,
          aunque entonces la cesta y la sesión no funcionarán.
        </p>
      </PolicySection>

      <PolicySection title="10. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas para proteger tus datos:
          conexión cifrada (HTTPS), contraseñas cifradas y acceso restringido a
          los sistemas.
        </p>
      </PolicySection>

      <PolicySection title="11. Cambios en esta política">
        <p>
          Si cambiamos esta política, publicaremos aquí la nueva versión con su
          fecha de actualización.
        </p>
      </PolicySection>

      <PolicyUpdated />
    </PolicyPage>
  )
}
