"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { UserIcon } from "@phosphor-icons/react"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import { useState } from "react"

import BrandLogo from "@/components/brand-logo"
import { BRAND, type BrandLink } from "@/lib/brand"
import MobileMenu from "../mobile-menu"

// A partir de aquí la cabecera pasa a su versión compacta
const SCROLL_THRESHOLD = 24

export default function SiteHeader({
  links,
  search,
  cart,
}: {
  links: BrandLink[]
  search: React.ReactNode
  cart: React.ReactNode
}) {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (y) =>
    setIsScrolled(y > SCROLL_THRESHOLD)
  )

  return (
    <header
      data-scrolled={isScrolled || undefined}
      className="sticky top-0 z-40 border-b border-transparent bg-background/95 transition-[border-color,box-shadow] duration-300 supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-md data-scrolled:border-border data-scrolled:shadow-[0_10px_30px_-24px_rgb(20_17_16/0.45)]"
    >
      <div className="content-container grid h-16 grid-cols-[1fr_auto_1fr] items-center px-2 small:h-[88px] small:px-6">
        <div className="flex items-center">
          <div className="small:hidden">
            <MobileMenu links={links} />
          </div>
          <nav aria-label="Principal" className="hidden small:block">
            <ul className="flex items-center gap-7">
              {links.map((link) => (
                <li key={link.href}>
                  <LocalizedClientLink
                    href={link.href}
                    className="text-eyebrow relative py-2 after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none"
                  >
                    {link.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <LocalizedClientLink
          href="/"
          aria-label={`${BRAND.name}, ir al inicio`}
          className="px-1 small:px-2"
          data-testid="nav-store-link"
        >
          <motion.span
            className="block origin-center"
            animate={{ scale: isScrolled ? 0.86 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <BrandLogo priority className="h-[50px] small:h-[70px]" />
          </motion.span>
        </LocalizedClientLink>

        <div className="flex items-center justify-end">
          {search}
          <LocalizedClientLink
            href="/account"
            aria-label="Mi cuenta"
            className="hidden size-11 items-center justify-center transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-ring small:flex"
            data-testid="nav-account-link"
          >
            <UserIcon className="size-[22px]" />
          </LocalizedClientLink>
          {cart}
        </div>
      </div>
    </header>
  )
}
