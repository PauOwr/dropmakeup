import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import * as motion from "motion/react-client"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  href?: string
  linkLabel?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "Ver todo",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 small:mb-12"
    >
      <div className="flex flex-col gap-3">
        <span className="text-eyebrow text-gold-deep">{eyebrow}</span>
        {/* Tamaño fluido en móvil: títulos de una sola palabra como «#DROPMAKEUP» caben desde 320 px */}
        <h2 className="text-display text-[clamp(1.5rem,8vw,2.25rem)] xsmall:text-5xl small:text-6xl">
          {title}
        </h2>
      </div>
      {href && (
        <LocalizedClientLink
          href={href}
          className="group text-eyebrow inline-flex shrink-0 items-center gap-2 border-b border-ink pb-1"
        >
          {linkLabel}
          <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
        </LocalizedClientLink>
      )}
    </motion.div>
  )
}
