import { cn } from "@/lib/utils"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isSale = price.price_type === "sale"

  return (
    <p className="flex items-baseline gap-2 text-sm">
      {isSale && (
        <span
          className="text-muted-foreground line-through"
          data-testid="original-price"
        >
          <span className="sr-only">Antes </span>
          {price.original_price}
        </span>
      )}
      <span
        className={cn("font-semibold", isSale && "text-destructive")}
        data-testid="price"
      >
        {isSale && <span className="sr-only">Ahora </span>}
        {price.calculated_price}
      </span>
    </p>
  )
}
