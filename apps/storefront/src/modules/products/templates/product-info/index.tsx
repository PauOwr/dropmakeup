import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const category = product.categories?.[0]

  return (
    <div id="product-info" className="flex flex-col gap-4">
      {category ? (
        <LocalizedClientLink
          href={`/categories/${category.handle}`}
          className="text-eyebrow text-muted-foreground transition-colors hover:text-ink"
        >
          {category.name}
        </LocalizedClientLink>
      ) : (
        product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-eyebrow text-muted-foreground transition-colors hover:text-ink"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )
      )}
      <h1
        className="font-heading text-2xl leading-tight font-extrabold tracking-tight uppercase small:text-3xl"
        data-testid="product-title"
      >
        {product.title}
      </h1>
      {product.subtitle && (
        <p className="text-base text-muted-foreground">{product.subtitle}</p>
      )}
      {product.description && (
        <p
          className="text-sm/relaxed whitespace-pre-line text-muted-foreground"
          data-testid="product-description"
        >
          {product.description}
        </p>
      )}
    </div>
  )
}

export default ProductInfo
