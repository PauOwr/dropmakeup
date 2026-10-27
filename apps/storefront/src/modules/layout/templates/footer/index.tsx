import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import BrandLogo from "@/components/brand-logo"
import { Separator } from "@/components/ui/separator"
import {
  BRAND,
  FALLBACK_NAV,
  FOOTER_HELP_LINKS,
  SOCIAL_LINKS,
  type BrandLink,
} from "@/lib/brand"

const MAX_CATEGORY_LINKS = 6

export default async function Footer() {
  const categories = await listCategories({
    fields: "id,name,handle,parent_category_id",
  }).catch(() => [])
  const shopLinks: BrandLink[] = [
    { label: "Todos los productos", href: "/store" },
    ...FALLBACK_NAV,
    ...categories
      .filter((category) => !category.parent_category_id)
      .slice(0, MAX_CATEGORY_LINKS)
      .map((category) => ({
        label: category.name,
        href: `/categories/${category.handle}`,
      })),
  ]

  return (
    // Tokens locales: los componentes (Separator...) se adaptan al fondo oscuro
    <footer className="mt-24 bg-ink text-white [--border:rgb(255_255_255/0.14)]">
      <div className="content-container grid gap-12 pt-16 pb-12 small:grid-cols-[1.5fr_1fr_1fr_1fr] small:pt-24">
        <div className="max-w-sm">
          <h2 className="text-eyebrow text-gold-soft">{BRAND.name}</h2>
          <p className="mt-5 text-sm/relaxed text-white/70">
            {BRAND.description}
          </p>
        </div>
        <FooterColumn title="Comprar" links={shopLinks} />
        <FooterColumn title="Ayuda" links={FOOTER_HELP_LINKS} />
        {SOCIAL_LINKS.length > 0 && (
          <FooterColumn title="Síguenos" links={SOCIAL_LINKS} external />
        )}
      </div>

      <div className="content-container flex justify-center pt-4 pb-2">
        <BrandLogo variant="light" className="h-auto w-full max-w-[860px]" />
      </div>

      <div className="content-container">
        <Separator className="mt-8" />
        <div className="flex flex-col gap-3 py-6 text-xs text-white/60 small:flex-row small:items-center small:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Todos los derechos
            reservados.
          </p>
          <ul className="flex gap-5">
            <li>
              <LocalizedClientLink href="/privacy" className="hover:text-white">
                Privacidad
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/terms" className="hover:text-white">
                Términos
              </LocalizedClientLink>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  external,
}: {
  title: string
  links: readonly BrandLink[]
  external?: boolean
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-eyebrow text-gold-soft">{title}</h2>
      <ul className="mt-5 flex flex-col gap-3 text-sm text-white/75">
        {links.map((link) => (
          <li key={link.href}>
            {external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <LocalizedClientLink
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </LocalizedClientLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
