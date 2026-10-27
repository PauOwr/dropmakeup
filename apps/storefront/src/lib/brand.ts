// Textos, enlaces y medios de la marca dropmakeup, en un solo sitio para editarlos.
//
// Medios: mientras una sección no tenga `media`, se muestra un marcador de
// posición con los colores de la marca. Para usar tus fotos o vídeos, copia los
// archivos a `apps/storefront/public/` y rellena `media`, por ejemplo:
//   media: { type: "image", src: "/home/hero.jpg", alt: "Modelo con labial nude" }
//   media: { type: "video", src: "/home/hero.mp4", poster: "/home/hero.jpg", alt: "" }

export type BrandMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster: string; alt: string }

export type BrandTone = "nude" | "blush" | "gold" | "ink" | "mist"

export type BrandLink = { label: string; href: string }

export const BRAND = {
  name: "dropmakeup",
  wordmark: "DROPMAKEUP",
  description:
    "Maquillaje en tonos nude, rosa y dorado: labiales, bases, coloretes e iluminadores para tu día a día.",
}

// Avisos de la barra superior. Deben ser ciertos para tu tienda.
export const ANNOUNCEMENTS: readonly string[] = [
  "Enviamos a España y a otros países de Europa",
  "Tienes 14 días para devolver tu pedido",
  "Descubre los nuevos tonos nude y rosa",
]

// Enlaces del menú cuando aún no hay categorías creadas en Medusa. En cuanto
// existan, el menú muestra las categorías principales detrás de «Tienda».
export const SHOP_LINK: BrandLink = { label: "Tienda", href: "/store" }
export const FALLBACK_NAV: readonly BrandLink[] = [
  { label: "Novedades", href: "/store?sortBy=created_at" },
]

export const FOOTER_HELP_LINKS: readonly BrandLink[] = [
  { label: "Envíos", href: "/shipping" },
  { label: "Devoluciones", href: "/returns" },
  { label: "Contacto", href: "/contact" },
  { label: "Términos y condiciones", href: "/terms" },
  { label: "Privacidad", href: "/privacy" },
]

// Redes sociales: añade aquí tus perfiles reales (la columna aparece al tener alguno).
export const SOCIAL_LINKS: readonly BrandLink[] = []

type HomeProductSection = {
  eyebrow: string
  title: string
  // Handle de una categoría de Medusa. Si no existe, se muestran las últimas novedades.
  categoryHandle: string
  media?: BrandMedia
}

type HomeContent = {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    cta: BrandLink
    media?: BrandMedia
  }
  lips: HomeProductSection
  essentials: HomeProductSection
  face: HomeProductSection
  banners: {
    eyebrow: string
    title: string
    text: string
    cta: BrandLink
    tone: BrandTone
    media?: BrandMedia
  }[]
  editorial: {
    eyebrow: string
    title: string
    subtitle: string
    text: string
    links: BrandLink[]
    media?: BrandMedia
  }
  community: {
    eyebrow: string
    title: string
    text: string
    looks: { caption: string; tone: BrandTone; media?: BrandMedia }[]
  }
}

export const HOME: HomeContent = {
  hero: {
    eyebrow: "Nueva colección",
    title: "Belleza sin filtros",
    subtitle:
      "Labiales, bases e iluminadores en tonos nude, rosa y dorado para cada momento del día.",
    cta: { label: "Comprar ahora", href: "/store" },
  },
  lips: { eyebrow: "Labios", title: "Para tus labios", categoryHandle: "labios" },
  essentials: {
    eyebrow: "Imprescindibles",
    title: "Kits y esenciales",
    categoryHandle: "kits",
  },
  face: { eyebrow: "Rostro", title: "Para tu rostro", categoryHandle: "rostro" },
  banners: [
    {
      eyebrow: "Rutina",
      title: "Glow en tres pasos",
      text: "Prebase, iluminador y bruma fijadora para una piel luminosa sin esfuerzo.",
      cta: { label: "Descubrir", href: "/store" },
      tone: "ink",
    },
    {
      eyebrow: "Labios",
      title: "Nudes que favorecen",
      text: "Tonos cálidos, rosados y tostados para encontrar el tuyo.",
      cta: { label: "Comprar", href: "/store" },
      tone: "blush",
    },
  ],
  editorial: {
    eyebrow: "Nuestra filosofía",
    title: "Menos pasos, más luz",
    subtitle: "Maquillaje pensado para el día a día",
    text: "En dropmakeup elegimos cada producto por su textura, su color y su relación calidad-precio. Tonos nude, rosas suaves y destellos dorados que funcionan solos o combinados, para que montar tu rutina sea fácil.",
    links: [
      { label: "Ver la tienda", href: "/store" },
      { label: "Envíos y devoluciones", href: "/shipping" },
    ],
  },
  community: {
    eyebrow: "Comunidad",
    title: "#dropmakeup",
    text: "Comparte tu look y etiquétanos para aparecer aquí.",
    looks: [
      { caption: "Look nude", tone: "nude" },
      { caption: "Glow dorado", tone: "gold" },
      { caption: "Rosa suave", tone: "blush" },
      { caption: "Labios intensos", tone: "mist" },
    ],
  },
}
