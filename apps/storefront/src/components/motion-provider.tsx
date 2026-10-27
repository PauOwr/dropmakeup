"use client"

import { MotionConfig } from "motion/react"

// Con «reducir movimiento» activado en el sistema, Motion quita los
// desplazamientos y escalados y deja solo los fundidos.
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
