"use client"

import { HttpTypes } from "@medusajs/types"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion, type PanInfo } from "motion/react"
import Image from "next/image"
import { useId, useState } from "react"

import BrandVisual from "@/components/brand-visual"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title: string
}

// Desplazamiento o velocidad mínimos para que un gesto de arrastre cambie de imagen
const SWIPE_OFFSET = 70
const SWIPE_VELOCITY = 450

const slide = {
  enter: (direction: number) => ({ x: `${direction * 8}%`, opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: `${direction * -8}%`, opacity: 0 }),
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const gallery = images.filter(
    (image): image is HttpTypes.StoreProductImage & { url: string } =>
      !!image.url
  )
  const count = gallery.length
  const imagesKey = gallery.map((image) => image.id).join()
  const [[index, direction], setPosition] = useState<[number, number]>([0, 0])
  const [shownImagesKey, setShownImagesKey] = useState(imagesKey)
  const thumbIndicatorId = useId()

  // Al cambiar de variante cambian las imágenes: se vuelve a la primera
  if (shownImagesKey !== imagesKey) {
    setShownImagesKey(imagesKey)
    setPosition([0, 0])
  }

  if (!count) {
    return (
      <BrandVisual tone="nude" className="aspect-4/5 w-full" />
    )
  }

  const current = Math.min(index, count - 1)
  const image = gallery[current]

  const paginate = (step: number) =>
    setPosition(([position]) => [(position + step + count) % count, step])

  const goTo = (target: number) =>
    setPosition(([position]) => [target, target > position ? 1 : -1])

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) {
      paginate(1)
    } else if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) {
      paginate(-1)
    }
  }

  return (
    <div className="flex flex-col gap-3 small:flex-row-reverse small:items-start">
      <div
        role="group"
        aria-roledescription="carrusel"
        aria-label={`Imágenes de ${title}`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") paginate(1)
          if (event.key === "ArrowLeft") paginate(-1)
        }}
        className="relative aspect-4/5 w-full overflow-hidden bg-nude-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={image.id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", duration: 0.55, bounce: 0 },
              opacity: { duration: 0.3 },
            }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="absolute inset-0 touch-pan-y"
          >
            <Image
              src={image.url}
              alt={`${title}, imagen ${current + 1} de ${count}`}
              fill
              priority={current === 0}
              sizes="(min-width: 1024px) 55vw, 100vw"
              draggable={false}
              className="pointer-events-none object-cover select-none"
            />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between *:pointer-events-auto">
              <Button
                variant="inverse"
                size="icon-touch"
                onClick={() => paginate(-1)}
                aria-label="Imagen anterior"
                className="shadow-sm"
              >
                <CaretLeftIcon />
              </Button>
              <Button
                variant="inverse"
                size="icon-touch"
                onClick={() => paginate(1)}
                aria-label="Imagen siguiente"
                className="shadow-sm"
              >
                <CaretRightIcon />
              </Button>
            </div>
            <p
              aria-live="polite"
              className="text-eyebrow absolute right-3 bottom-3 bg-white/90 px-2.5 py-1 tabular-nums"
            >
              {current + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto small:w-20 small:shrink-0 small:flex-col">
          {gallery.map((thumb, thumbIndex) => {
            const isActive = thumbIndex === current
            return (
              <li key={thumb.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(thumbIndex)}
                  aria-label={`Ver imagen ${thumbIndex + 1} de ${count}`}
                  aria-current={isActive || undefined}
                  className={cn(
                    "relative block aspect-4/5 w-16 overflow-hidden bg-nude-soft transition-opacity small:w-20",
                    !isActive && "opacity-60 hover:opacity-100"
                  )}
                >
                  <Image
                    src={thumb.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {isActive && (
                    <motion.span
                      layoutId={thumbIndicatorId}
                      className="absolute inset-0 border-2 border-ink"
                      transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ImageGallery
