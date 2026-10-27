import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <Skeleton className="h-8 w-32" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className={cn("text-2xl font-semibold", isSale && "text-destructive")}>
        {!variant && (
          <span className="mr-1 text-sm font-normal text-muted-foreground">
            Desde
          </span>
        )}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </p>
      {isSale && (
        <>
          <p className="text-base text-muted-foreground line-through">
            <span className="sr-only">Antes </span>
            <span
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <Badge variant="sale">-{selectedPrice.percentage_diff}%</Badge>
        </>
      )}
    </div>
  )
}
