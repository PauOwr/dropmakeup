import { cn } from "@/lib/utils"
import Image from "next/image"

// Archivos en public/brand (720 × 237, fondo transparente)
const LOGOS = {
  dark: "/brand/logo.png",
  // Para fondos oscuros: «drop» en crema en lugar de gris oscuro
  light: "/brand/logo-light.png",
}

type BrandLogoProps = {
  variant?: keyof typeof LOGOS
  priority?: boolean
  className?: string
}

/** Logo de dropmakeup. El tamaño se controla con la altura (`h-*`) en `className`. */
export default function BrandLogo({
  variant = "dark",
  priority,
  className,
}: BrandLogoProps) {
  return (
    <Image
      src={LOGOS[variant]}
      alt="dropmakeup"
      width={720}
      height={237}
      priority={priority}
      className={cn("h-10 w-auto select-none", className)}
      draggable={false}
    />
  )
}
