import LocalizedClientLink from "@modules/common/components/localized-client-link"
import * as motion from "motion/react-client"

import BrandVisual from "@/components/brand-visual"
import { buttonVariants } from "@/components/ui/button"
import { HOME } from "@/lib/brand"
import { cn } from "@/lib/utils"

export default function SplitBanners() {
  return (
    <section className="content-container grid gap-4 py-8 small:grid-cols-2 small:gap-6">
      {HOME.banners.map((banner, index) => {
        // Sobre foto o fondo oscuro el texto va en blanco
        const onDark = !!banner.media || banner.tone === "ink"
        return (
          <motion.article
            key={banner.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "group relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden p-8 small:min-h-[580px] small:p-12",
              onDark ? "text-white" : "text-ink"
            )}
          >
            <BrandVisual
              media={banner.media}
              tone={banner.tone}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 -z-20 transition-transform duration-1000 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {banner.media && (
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-linear-to-t from-ink/75 via-ink/20 to-transparent"
              />
            )}
            <span
              className={cn(
                "text-eyebrow",
                onDark ? "text-gold-soft" : "text-gold-deep"
              )}
            >
              {banner.eyebrow}
            </span>
            <h3 className="text-display mt-3 text-4xl small:text-5xl">
              {banner.title}
            </h3>
            <p
              className={cn(
                "mt-4 max-w-sm text-sm/relaxed",
                onDark ? "text-white/80" : "text-ink/75"
              )}
            >
              {banner.text}
            </p>
            <LocalizedClientLink
              href={banner.cta.href}
              className={buttonVariants({
                variant: onDark ? "inverse" : "default",
                size: "xl",
                className: "mt-8 self-start",
              })}
            >
              {banner.cta.label}
            </LocalizedClientLink>
          </motion.article>
        )
      })}
    </section>
  )
}
