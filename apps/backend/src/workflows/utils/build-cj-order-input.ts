import { MedusaError } from "@medusajs/framework/utils"
import {
  CjCreateOrderInput,
  CjOrderDefaults,
  CjOrderProduct,
} from "../../modules/cjdropshipping/types"

// Datos del pedido de Medusa que hacen falta para crearlo en CJ
export type CjSourceOrder = {
  id: string
  email?: string | null
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    company?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
    phone?: string | null
  } | null
  items?: ({
    id: string
    quantity: number
    variant_sku?: string | null
    variant?: { metadata?: Record<string, unknown> | null } | null
  } | null)[] | null
}

export type BuiltCjOrderInput = {
  input: CjCreateOrderInput
  warnings: string[]
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" })

const clean = (value: string | null | undefined) => value?.trim() || undefined

function countryName(code: string): string {
  try {
    return countryNames.of(code) ?? code
  } catch {
    return code
  }
}

export function buildCjOrderInput(
  order: CjSourceOrder,
  defaults: CjOrderDefaults,
  logisticNameOverride?: string
): BuiltCjOrderInput {
  const address = order.shipping_address
  const missing: string[] = []
  const warnings: string[] = []

  const required = (value: string | undefined, label: string): string => {
    if (!value) {
      missing.push(label)
    }
    return value ?? ""
  }

  const countryCode = required(clean(address?.country_code)?.toUpperCase(), "país")
  const city = required(clean(address?.city), "ciudad")
  const street = required(clean(address?.address_1), "dirección")
  const customerName = required(
    clean([address?.first_name, address?.last_name].filter(Boolean).join(" ")) ?? clean(address?.company),
    "nombre del destinatario"
  )
  const logisticName = required(
    clean(logisticNameOverride) ?? defaults.logisticName ?? undefined,
    "método de envío de CJ (configura CJ_LOGISTIC_NAME)"
  )

  // CJ exige provincia; si el checkout no la pide, se usa la ciudad
  const province = clean(address?.province)
  if (!province && city) {
    warnings.push(`El pedido ${order.id} no tiene provincia: se envía a CJ la ciudad (${city}) en su lugar`)
  }

  const products: CjOrderProduct[] = []
  const withoutReference: string[] = []
  const invalidQuantity: string[] = []
  for (const item of order.items ?? []) {
    if (!item) {
      continue
    }

    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      invalidQuantity.push(item.id)
      continue
    }

    // Se prefiere el id de variante de CJ guardado al importar el producto; si no existe, CJ busca por SKU
    const cjVid = item.variant?.metadata?.cj_vid
    const vid = typeof cjVid === "string" ? clean(cjVid) : undefined
    const sku = clean(item.variant_sku)
    if (!vid && !sku) {
      withoutReference.push(item.id)
      continue
    }

    const product: CjOrderProduct = { quantity, storeLineItemId: item.id }
    if (vid) {
      product.vid = vid
    } else {
      product.sku = sku
    }
    products.push(product)
  }

  if (withoutReference.length) {
    missing.push(`referencia de CJ (metadata.cj_vid o SKU) en los artículos ${withoutReference.join(", ")}`)
  }
  if (invalidQuantity.length) {
    missing.push(`cantidad válida en los artículos ${invalidQuantity.join(", ")}`)
  }
  if (!products.length && !withoutReference.length && !invalidQuantity.length) {
    missing.push("artículos")
  }

  if (missing.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `No se puede enviar el pedido ${order.id} a CJ. Falta: ${missing.join("; ")}`
    )
  }

  return {
    input: {
      // El id de Medusa es único: CJ rechaza un orderNumber repetido, lo que evita cobros duplicados
      orderNumber: order.id,
      shippingCountryCode: countryCode,
      shippingCountry: countryName(countryCode),
      shippingProvince: province ?? city,
      shippingCity: city,
      shippingCustomerName: customerName,
      shippingAddress: street,
      shippingAddress2: clean(address?.address_2),
      shippingZip: clean(address?.postal_code),
      shippingPhone: clean(address?.phone),
      email: clean(order.email),
      logisticName,
      fromCountryCode: defaults.fromCountryCode,
      products,
    },
    warnings,
  }
}
