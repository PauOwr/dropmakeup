import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { CjProduct, CjVariant } from "../../modules/cjdropshipping/types"

export type CjPricing = {
  // Euros por cada dólar
  usdToEur: number
  // Multiplicador sobre el coste para obtener el precio de venta
  markup: number
}

export type CjProductImportContext = {
  salesChannelId: string
  shippingProfileId: string
}

export type BuiltMedusaProduct = {
  product: CreateProductWorkflowInputDTO
  warnings: string[]
}

// La tienda vende en euros
const IMPORT_CURRENCY = "eur"
// Opción única que se usa cuando las opciones de CJ no se pueden separar de forma fiable
const FALLBACK_OPTION_TITLE = "Variante"

const unique = <T>(values: T[]) => [...new Set(values)]

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// CJ guarda la descripción en HTML y el storefront la muestra como texto
export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Precio de venta en EUR, en unidad principal (como guarda los precios Medusa v2) y redondeado a céntimos
export function retailPrice(costUsd: number, pricing: CjPricing): number {
  return Math.round(costUsd * pricing.usdToEur * pricing.markup * 100) / 100
}

type OptionPlan = {
  options: { title: string; values: string[] }[]
  valuesFor: (variant: CjVariant) => Record<string, string>
  usedFallback: boolean
}

// CJ da los nombres de las opciones ("Color-Size") y los valores de cada variante ("Black-XL") unidos por "-".
// Si algún valor contiene un "-" la separación no es fiable y se usa una sola opción
function planOptions(product: CjProduct): OptionPlan {
  const titles = (product.productKeyEn ?? "")
    .split("-")
    .map((title) => title.trim())
    .filter(Boolean)
  const valuesByVid = new Map(
    product.variants.map((variant) => [variant.vid, (variant.variantKey ?? "").split("-").map((value) => value.trim())])
  )
  const valuesOf = (variant: CjVariant) => valuesByVid.get(variant.vid) ?? []

  const separable =
    titles.length > 0 &&
    product.variants.every((variant) => valuesOf(variant).length === titles.length && valuesOf(variant).every(Boolean))
  const combinations = new Set(product.variants.map((variant) => valuesOf(variant).join("\u0000")))

  if (separable && combinations.size === product.variants.length) {
    return {
      options: titles.map((title, index) => ({
        title,
        values: unique(product.variants.map((variant) => valuesOf(variant)[index])),
      })),
      valuesFor: (variant) => Object.fromEntries(titles.map((title, index) => [title, valuesOf(variant)[index]])),
      usedFallback: false,
    }
  }

  const label = (variant: CjVariant) => variant.variantKey ?? variant.variantNameEn ?? variant.variantSku ?? variant.vid
  const labelsAreUnique = new Set(product.variants.map(label)).size === product.variants.length
  const valueFor = (variant: CjVariant) => (labelsAreUnique ? label(variant) : variant.variantSku ?? variant.vid)

  return {
    options: [{ title: FALLBACK_OPTION_TITLE, values: product.variants.map(valueFor) }],
    valuesFor: (variant) => ({ [FALLBACK_OPTION_TITLE]: valueFor(variant) }),
    usedFallback: true,
  }
}

// Producto de Medusa en borrador a partir de un producto de CJ, con el id de variante de CJ en cada variante
export function buildMedusaProductFromCj(
  product: CjProduct,
  pricing: CjPricing,
  context: CjProductImportContext
): BuiltMedusaProduct {
  const invalid = (detail: string) =>
    new MedusaError(MedusaError.Types.INVALID_DATA, `No se puede importar el producto de CJ ${product.pid}: ${detail}`)

  if (!product.productNameEn) {
    throw invalid("no tiene nombre en inglés")
  }
  if (!product.variants.length) {
    throw invalid("no tiene variantes")
  }
  if (!(pricing.usdToEur > 0) || !(pricing.markup > 0)) {
    throw invalid("el tipo de cambio y el margen tienen que ser números mayores que 0")
  }
  const withoutCost = product.variants.filter((variant) => !variant.variantSellPrice || variant.variantSellPrice <= 0)
  if (withoutCost.length) {
    throw invalid(`CJ no indica el coste de las variantes ${withoutCost.map((variant) => variant.vid).join(", ")}`)
  }

  const warnings: string[] = []
  if (product.status && product.status !== "3") {
    warnings.push(`CJ indica que el producto ${product.pid} no está aprobado para la venta (estado ${product.status})`)
  }

  const plan = planOptions(product)
  if (plan.usedFallback) {
    warnings.push(
      `Las opciones de CJ del producto ${product.pid} ("${product.productKeyEn ?? ""}") no se pudieron separar: ` +
        `se usa una sola opción "${FALLBACK_OPTION_TITLE}"`
    )
  }

  const images = unique(
    [product.bigImage, ...product.productImageSet, ...product.variants.map((variant) => variant.variantImage)].filter(
      (url): url is string => Boolean(url)
    )
  )

  return {
    product: {
      title: product.productNameEn,
      handle: `cj-${slug(product.productSku ?? product.pid)}`,
      // Se importa en borrador para revisar textos, precios e imágenes antes de publicarlo
      status: ProductStatus.DRAFT,
      external_id: product.pid,
      description: product.description ? htmlToText(product.description) : undefined,
      thumbnail: product.bigImage ?? images[0],
      images: images.map((url) => ({ url })),
      options: plan.options,
      variants: product.variants.map((variant) => ({
        title: variant.variantKey ?? variant.variantNameEn ?? variant.vid,
        sku: variant.variantSku ?? undefined,
        options: plan.valuesFor(variant),
        // El stock lo gestiona CJ, no Medusa
        manage_inventory: false,
        weight: variant.variantWeight ?? undefined,
        length: variant.variantLength ?? undefined,
        width: variant.variantWidth ?? undefined,
        height: variant.variantHeight ?? undefined,
        prices: [{ currency_code: IMPORT_CURRENCY, amount: retailPrice(variant.variantSellPrice ?? 0, pricing) }],
        metadata: { cj_vid: variant.vid, cj_pid: product.pid, cj_cost_usd: variant.variantSellPrice },
      })),
      sales_channels: [{ id: context.salesChannelId }],
      shipping_profile_id: context.shippingProfileId,
      metadata: { cj_pid: product.pid, cj_product_sku: product.productSku },
    },
    warnings,
  }
}
