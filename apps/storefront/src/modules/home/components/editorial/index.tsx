import LocalizedClientLink from "@modules/common/components/localized-client-link"
import * as motion from "motion/react-client"

import BrandVisual from "@/components/brand-visual"
import { buttonVariants } from "@/components/ui/button"
import { HOME } from "@/lib/brand"

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
}

export default function Editorial() {
  const { eyebrow, title, subtitle, text, links, media } = HOME.editorial

  return (
    <section className="mt-16 bg-nude-soft">
      <div className="content-container grid items-center gap-12 py-20 small:grid-cols-2 small:gap-16 small:py-28">
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5"
        >
          <span className="text-eyebrow text-gold-deep">{eyebrow}</span>
          <h2 className="text-display text-5xl small:text-7xl">{title}</h2>
          <p className="font-heading text-lg font-bold tracking-wide uppercase">
            {subtitle}
          </p>
          <p className="max-w-lg text-base/relaxed text-muted-foreground">
            {text}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {links.map((link) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                className={buttonVariants({ variant: "outline", size: "xl" })}
              >
                {link.label}
              </LocalizedClientLink>
            ))}
          </div>
        </motion.div>
        <motion.div
          {...reveal}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrandVisual
            media={media}
            tone="gold"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-4/5"
          />
        </motion.div>
      </div>
    </section>
  )
}
