"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ListIcon } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useState } from "react"

import { AnimatedSheetContent } from "@/components/animated-sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BRAND, type BrandLink } from "@/lib/brand"

const SECONDARY_LINKS: BrandLink[] = [
  { label: "Mi cuenta", href: "/account" },
  { label: "Cesta", href: "/cart" },
  { label: "Envíos y devoluciones", href: "/shipping" },
  { label: "Contacto", href: "/contact" },
]

export default function MobileMenu({ links }: { links: BrandLink[] }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-touch"
            aria-label="Abrir menú"
            data-testid="nav-menu-button"
          />
        }
      >
        <ListIcon className="size-[22px]" />
      </SheetTrigger>

      <AnimatedSheetContent open={open} side="left" closeLabel="Cerrar menú">
        <SheetHeader className="border-b px-6 py-5 pr-14">
          <SheetTitle className="text-display text-lg">Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Secciones de la tienda
          </SheetDescription>
        </SheetHeader>

        <nav
          aria-label="Menú principal"
          className="flex flex-1 flex-col overflow-y-auto px-6 py-8"
          data-testid="nav-menu-popup"
        >
          <ul className="flex flex-col gap-5">
            {links.map((link, index) => (
              <motion.li
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  duration: 0.45,
                  bounce: 0,
                  delay: 0.1 + index * 0.05,
                }}
              >
                <LocalizedClientLink
                  href={link.href}
                  onClick={close}
                  className="text-display text-3xl transition-colors hover:text-gold"
                >
                  {link.label}
                </LocalizedClientLink>
              </motion.li>
            ))}
          </ul>

          <Separator className="my-8" />

          <ul className="flex flex-col gap-4 text-sm">
            {SECONDARY_LINKS.map((link) => (
              <li key={link.href}>
                <LocalizedClientLink
                  href={link.href}
                  onClick={close}
                  className="transition-colors hover:text-gold"
                >
                  {link.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="border-t px-6 py-5 text-xs text-muted-foreground">
          {BRAND.description}
        </p>
      </AnimatedSheetContent>
    </Sheet>
  )
}
