"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"

const ROTATE_EVERY_MS = 5000

const slide = {
  enter: (direction: number) => ({ x: direction * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -28, opacity: 0 }),
}

export default function AnnouncementBar({
  messages,
}: {
  messages: readonly string[]
}) {
  const [[index, direction], setPosition] = useState<[number, number]>([0, 1])
  const [isPaused, setIsPaused] = useState(false)
  // Si alguien usa las flechas, deja de rotar solo
  const [isManual, setIsManual] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const count = messages.length
  const autoRotate = count > 1 && !isPaused && !isManual && !prefersReducedMotion

  useEffect(() => {
    if (!autoRotate) {
      return
    }
    const timer = window.setTimeout(
      () => setPosition(([current]) => [(current + 1) % count, 1]),
      ROTATE_EVERY_MS
    )
    return () => window.clearTimeout(timer)
  }, [autoRotate, index, count])

  if (!count) {
    return null
  }

  const go = (step: number) => {
    setIsManual(true)
    setPosition(([current]) => [(current + step + count) % count, step])
  }

  return (
    <section
      aria-label="Avisos de la tienda"
      className="bg-ink text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="content-container flex h-10 items-center justify-between gap-2 px-2 small:px-6">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Aviso anterior"
            className="flex size-10 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-gold"
          >
            <CaretLeftIcon className="size-3.5" />
          </button>
        )}
        <div className="relative h-full flex-1 overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.p
              key={index}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              className="text-eyebrow absolute inset-0 flex items-center justify-center text-center"
            >
              {messages[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Aviso siguiente"
            className="flex size-10 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-gold"
          >
            <CaretRightIcon className="size-3.5" />
          </button>
        )}
      </div>
    </section>
  )
}
