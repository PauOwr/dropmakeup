import { HttpTypes } from "@medusajs/types"
import * as motion from "motion/react-client"

import BrandVisual from "@/components/brand-visual"
import type { BrandMedia, BrandTone } from "@/lib/brand"
import { cn } from "@/lib/utils"
import ProductTiles from "../product-tiles"
import SectionHeading from "../section-heading"

type ProductShowcaseProps = {
  eyebrow: string
  title: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  // Con imagen destacada: foto grande a un lado y 4 productos al otro
  feature?: { media?: BrandMedia; tone: BrandTone }
  columns?: 3 | 4
}

export default function ProductShowcase({
  eyebrow,
  title,
  products,
  region,
  feature,
  columns = 4,
}: ProductShowcaseProps) {
  const tiles = (
    <ProductTiles
      products={products}
      region={region}
      placeholders={feature ? 4 : columns}
      className={cn(
        !feature && columns === 3 && "small:grid-cols-3",
        !feature && columns === 4 && "small:grid-cols-4"
      )}
    />
  )

  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeading eyebrow={eyebrow} title={title} href="/store" />
      {feature ? (
        <div className="grid gap-x-8 gap-y-10 small:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandVisual
              media={feature.media}
              tone={feature.tone}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-4/5 small:sticky small:top-28"
            />
          </motion.div>
          {tiles}
        </div>
      ) : (
        tiles
      )}
    </section>
  )
}
