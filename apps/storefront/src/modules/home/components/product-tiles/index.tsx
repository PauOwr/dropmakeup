import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

import BrandVisual from "@/components/brand-visual"
import type { BrandTone } from "@/lib/brand"
import { cn } from "@/lib/utils"

const COMING_SOON_TONES: BrandTone[] = ["nude", "blush", "gold", "mist"]

type ProductTilesProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  // Huecos que se muestran como «Próximamente» mientras la sección no tenga productos
  placeholders: number
  className?: string
}

export default function ProductTiles({
  products,
  region,
  placeholders,
  className,
}: ProductTilesProps) {
  const gridClassName = cn(
    "grid grid-cols-2 gap-x-4 gap-y-10 small:gap-x-6",
    className
  )

  if (!products.length) {
    return (
      <>
        <p className="sr-only">Muy pronto habrá productos en esta sección.</p>
        <ul aria-hidden className={gridClassName}>
          {COMING_SOON_TONES.concat(COMING_SOON_TONES)
            .slice(0, placeholders)
            .map((tone, index) => (
              <li key={index}>
                <BrandVisual tone={tone} className="aspect-4/5" />
                <p className="text-eyebrow mt-4 text-muted-foreground">
                  Próximamente
                </p>
              </li>
            ))}
        </ul>
      </>
    )
  }

  return (
    <ul className={gridClassName}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductPreview product={product} region={region} />
        </li>
      ))}
    </ul>
  )
}
