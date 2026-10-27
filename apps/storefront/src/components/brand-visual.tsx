import type { BrandMedia, BrandTone } from "@/lib/brand"
import { cn } from "@/lib/utils"
import Image from "next/image"

const TONES: Record<BrandTone, string> = {
  nude: "bg-linear-to-br from-nude-soft via-nude to-nude-deep",
  blush: "bg-linear-to-br from-blush-soft via-blush to-nude",
  gold: "bg-linear-to-br from-nude-soft via-gold-soft to-gold",
  ink: "bg-linear-to-br from-[#2b2321] via-ink to-[#3d2f2a]",
  mist: "bg-linear-to-br from-white via-nude-soft to-blush",
}

// Brillos suaves por encima del degradado: dan profundidad sin usar imágenes.
const GLOWS: Record<BrandTone, string> = {
  nude: "bg-[radial-gradient(ellipse_at_28%_22%,rgb(255_255_255/0.7),transparent_55%),radial-gradient(circle_at_80%_85%,rgb(201_169_147/0.45),transparent_50%)]",
  blush:
    "bg-[radial-gradient(ellipse_at_30%_25%,rgb(255_255_255/0.7),transparent_55%),radial-gradient(circle_at_78%_80%,rgb(227_169_178/0.5),transparent_50%)]",
  gold: "bg-[radial-gradient(ellipse_at_25%_20%,rgb(255_255_255/0.75),transparent_55%),radial-gradient(circle_at_80%_82%,rgb(176_141_87/0.45),transparent_52%)]",
  ink: "bg-[radial-gradient(ellipse_at_70%_30%,rgb(220_197_157/0.28),transparent_55%),radial-gradient(circle_at_20%_85%,rgb(241_205_211/0.14),transparent_50%)]",
  mist: "bg-[radial-gradient(ellipse_at_35%_25%,rgb(255_255_255/0.9),transparent_55%),radial-gradient(circle_at_75%_80%,rgb(220_197_157/0.35),transparent_50%)]",
}

type BrandVisualProps = {
  media?: BrandMedia
  tone?: BrandTone
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * Foto o vídeo de una sección de la marca. Mientras no haya archivo, muestra un
 * marcador de posición con los colores de dropmakeup (ver `src/lib/brand.ts`).
 */
export default function BrandVisual({
  media,
  tone = "nude",
  className,
  sizes = "100vw",
  priority,
}: BrandVisualProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {media?.type === "image" && (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      )}

      {media?.type === "video" && (
        <>
          <video
            className="absolute inset-0 size-full object-cover motion-reduce:hidden"
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
            aria-label={media.alt || undefined}
            aria-hidden={media.alt ? undefined : true}
          />
          {/* Con «reducir movimiento» se ve la imagen fija en lugar del vídeo */}
          <Image
            src={media.poster}
            alt={media.alt}
            fill
            sizes={sizes}
            className="hidden object-cover motion-reduce:block"
          />
        </>
      )}

      {!media && (
        <div aria-hidden className={cn("absolute inset-0", TONES[tone])}>
          <div className={cn("absolute inset-0", GLOWS[tone])} />
          <div className="absolute inset-0 bg-grain opacity-20 mix-blend-soft-light" />
        </div>
      )}
    </div>
  )
}
