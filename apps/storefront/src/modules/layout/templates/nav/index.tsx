import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SiteHeader from "@modules/layout/components/site-header"
import { HandbagIcon } from "@phosphor-icons/react/ssr"

import {
  ANNOUNCEMENTS,
  FALLBACK_NAV,
  SHOP_LINK,
  type BrandLink,
} from "@/lib/brand"

const MAX_CATEGORY_LINKS = 4

export default async function Nav() {
  // Categorías principales de Medusa; mientras no haya, enlaces fijos
  const categories = await listCategories({
    fields: "id,name,handle,parent_category_id",
  }).catch(() => [])
  const categoryLinks: BrandLink[] = categories
    .filter((category) => !category.parent_category_id)
    .slice(0, MAX_CATEGORY_LINKS)
    .map((category) => ({
      label: category.name,
      href: `/categories/${category.handle}`,
    }))
  const links = [
    SHOP_LINK,
    ...(categoryLinks.length ? categoryLinks : FALLBACK_NAV),
  ]

  return (
    <>
      <AnnouncementBar messages={ANNOUNCEMENTS} />
      <SiteHeader
        links={links}
        search={<Search />}
        cart={
          <Suspense
            fallback={
              <LocalizedClientLink
                href="/cart"
                aria-label="Cesta"
                className="flex size-11 items-center justify-center"
                data-testid="nav-cart-link"
              >
                <HandbagIcon className="size-[22px]" />
              </LocalizedClientLink>
            }
          >
            <CartButton />
          </Suspense>
        }
      />
    </>
  )
}
