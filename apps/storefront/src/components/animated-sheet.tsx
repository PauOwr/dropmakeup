"use client"

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const OFFSCREEN = { left: "-100%", right: "100%" } as const

type AnimatedSheetContentProps = {
  open: boolean
  side?: "left" | "right"
  className?: string
  closeLabel?: string
  finalFocus?: RefObject<HTMLElement | null>
  children: React.ReactNode
}

/**
 * Panel de la Sheet de shadcn/ui (Base UI Dialog) que entra y sale deslizándose
 * con Motion. Va dentro de `<Sheet open onOpenChange>` y recibe también `open`:
 * AnimatePresence necesita saberlo para animar la salida antes de desmontarlo.
 * Dentro se usan SheetHeader, SheetTitle, SheetFooter... de `ui/sheet`.
 */
export function AnimatedSheetContent({
  open,
  side = "right",
  className,
  closeLabel = "Cerrar",
  finalFocus,
  children,
}: AnimatedSheetContentProps) {
  return (
    <AnimatePresence>
      {open && (
        <SheetPrimitive.Portal keepMounted>
          <SheetPrimitive.Backdrop
            className="fixed inset-0 z-50 bg-ink/30 supports-backdrop-filter:backdrop-blur-[2px]"
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            }
          />
          <SheetPrimitive.Popup
            data-slot="sheet-content"
            data-side={side}
            finalFocus={finalFocus}
            className={cn(
              "fixed inset-y-0 z-50 flex h-dvh w-full max-w-md flex-col bg-background text-foreground shadow-2xl outline-none",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
              className
            )}
            render={
              <motion.div
                initial={{ x: OFFSCREEN[side] }}
                animate={{ x: 0 }}
                exit={{ x: OFFSCREEN[side] }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.06 }}
              />
            }
          >
            {children}
            <SheetPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-touch"
                  className="absolute top-2 right-2"
                />
              }
            >
              <XIcon />
              <span className="sr-only">{closeLabel}</span>
            </SheetPrimitive.Close>
          </SheetPrimitive.Popup>
        </SheetPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}
