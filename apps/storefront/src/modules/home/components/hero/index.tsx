import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRightIcon } from "@phosphor-icons/react/ssr"

import BrandVisual from "@/components/brand-visual"
import { buttonVariants } from "@/components/ui/button"
import { HOME } from "@/lib/brand"

// La entrada del texto usa animaciones CSS: se ven sin esperar a que cargue
// JavaScript, que es lo que importa en el primer pantallazo.
const ENTER = "motion-safe:animate-in motion-safe:fade-in"

export default function Hero() {
  const { eyebrow, title, subtitle, cta, media } = HOME.hero

  return (
    <section className="relative isolate flex min-h-[calc(100svh-6.5rem)] items-end overflow-hidden bg-ink text-white small:min-h-[86svh]">
      <BrandVisual
        media={media}
        tone="ink"
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink/85 via-ink/30 to-ink/5"
      />

      <div className="content-container pt-28 pb-14 small:pb-24">
        <p
          className={`text-eyebrow text-gold-soft ${ENTER} motion-safe:slide-in-from-bottom-3 motion-safe:duration-700`}
        >
          {eyebrow}
        </p>
        <h1
          className={`text-display mt-5 max-w-[11ch] text-[13vw] xsmall:text-7xl small:text-8xl large:text-[8.5rem] ${ENTER} motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000`}
        >
          {title}
        </h1>
        <p
          className={`mt-6 max-w-md text-base/relaxed text-white/80 small:text-lg/relaxed ${ENTER} motion-safe:slide-in-from-bottom-4 motion-safe:duration-1000`}
        >
          {subtitle}
        </p>
        <LocalizedClientLink
          href={cta.href}
          className={buttonVariants({
            variant: "inverse",
            size: "xl",
            className: `mt-9 ${ENTER} motion-safe:duration-1000`,
          })}
        >
          {cta.label}
          <ArrowRightIcon data-icon="inline-end" />
        </LocalizedClientLink>
      </div>
    </section>
  )
}
