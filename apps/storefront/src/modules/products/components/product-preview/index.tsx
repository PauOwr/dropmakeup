import { getProductPrice } from "@lib/util/get-product-price"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

import BrandVisual from "@/components/brand-visual"
import { Badge } from "@/components/ui/badge"
import PreviewPrice from "./price"

const IMAGE_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 512px) 50vw, 100vw"

export default function ProductPreview({
  product,
  priority,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isFeatured?: boolean
  priority?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const images = Array.from(
    new Set(
      [product.thumbnail, ...(product.images ?? []).map((image) => image.url)]
        .filter((url): url is string => !!url)
    )
  )
  const [primaryImage, hoverImage] = images
  const label =
    product.categories?.[0]?.name ??
    product.collection?.title ??
    product.type?.value
  const isSale = cheapestPrice?.price_type === "sale"
  const isSoldOut =
    !!product.variants?.length && !product.variants.some(isVariantInStock)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      data-testid="product-wrapper"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-linear-to-b from-nude-soft to-white">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title ?? ""}
            fill
            sizes={IMAGE_SIZES}
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <BrandVisual tone="nude" className="absolute inset-0" />
        )}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt=""
            fill
            sizes={IMAGE_SIZES}
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {(isSale || isSoldOut) && (
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {isSale && (
              <Badge variant="sale">-{cheapestPrice?.percentage_diff}%</Badge>
            )}
            {isSoldOut && <Badge variant="secondary">Agotado</Badge>}
          </div>
        )}

        <span
          aria-hidden
          className="text-eyebrow absolute inset-x-3 bottom-3 hidden translate-y-2 bg-white/95 py-3 text-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 small:block motion-reduce:translate-y-0"
        >
          Ver producto
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {label && (
          <span className="text-eyebrow text-muted-foreground">{label}</span>
        )}
        <h3
          className="font-heading text-sm leading-snug font-bold uppercase"
          data-testid="product-title"
        >
          {product.title}
        </h3>
        {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
      </div>
    </LocalizedClientLink>
  )
}
