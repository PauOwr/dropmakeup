"use client"

import { HttpTypes } from "@medusajs/types"
import { motion } from "motion/react"
import React, { useId } from "react"

import { toggleVariants } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  "data-testid"?: string
}

// Radios nativos con aspecto de botones: el formulario sigue funcionando sin
// JavaScript y la opción elegida se marca con un fondo que se desliza (Motion).
const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  name,
  "data-testid": dataTestId,
  disabled,
}) => {
  const selectedLayoutId = useId()
  const values = (option.values ?? []).map((v) => v.value)

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="text-eyebrow mb-3">
        {title}
        {current && (
          <span className="ml-2 font-normal tracking-normal text-muted-foreground normal-case">
            {current}
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {values.map((v) => {
          const id = `${name}-${v}`.replace(/[^A-Za-z0-9_-]/g, "-")
          const isSelected = v === current
          return (
            <div key={v}>
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={isSelected}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  toggleVariants({ variant: "outline", size: "lg" }),
                  "relative h-11 min-w-14 cursor-pointer px-4 text-sm peer-checked:border-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                  isSelected && "text-white hover:bg-transparent hover:text-white"
                )}
                data-testid="option-button"
              >
                {isSelected && (
                  <motion.span
                    layoutId={selectedLayoutId}
                    className="absolute inset-0 bg-ink"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <span className="relative">{v}</span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
