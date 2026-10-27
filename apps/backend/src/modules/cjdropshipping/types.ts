import { z } from "@medusajs/framework/zod"

export type CjModuleOptions = {
  apiKey?: string
  // Secreto con el que CJ firma los webhooks (lo devuelve getAccessToken). Si falta, se obtiene con la API key
  openId?: string
  // true: los pedidos se crean con isSandbox=1 (pago simulado, sin cargos reales en CJ Wallet)
  sandbox?: boolean
  // Método de envío de CJ (logisticName) que se usa si el workflow no indica otro
  defaultLogisticName?: string
  // País desde el que envía CJ (fromCountryCode)
  fromCountryCode?: string
}

export type CjOrderDefaults = {
  logisticName: string | null
  fromCountryCode: string
}

export type CjOrderProduct = {
  vid?: string
  sku?: string
  quantity: number
  storeLineItemId?: string
}

// Campos de createOrderV2 que envía la integración. payType e isSandbox los añade el servicio
export type CjCreateOrderInput = {
  orderNumber: string
  shippingCountryCode: string
  shippingCountry: string
  shippingProvince: string
  shippingCity: string
  shippingCustomerName: string
  shippingAddress: string
  shippingAddress2?: string
  shippingZip?: string
  shippingPhone?: string
  email?: string
  logisticName: string
  fromCountryCode: string
  products: CjOrderProduct[]
}

export type CjCreatedOrder = {
  orderId: string | null
  shipmentOrderId: string | null
  orderStatus: string | null
  actualPayment: number | null
  logisticsMiss: boolean
  interceptReasons: string[]
  requestId: string | null
}

// CJ devuelve a veces "" o números donde la documentación indica texto; se normaliza a texto o null
const optionalText = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) => (value === null || value === undefined || value === "" ? null : String(value)))

const optionalAmount = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null
    }
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : null
  })

export const cjEnvelopeSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string().nullish(),
  data: z.unknown(),
  requestId: z.string().nullish(),
})

export const cjAccessTokenSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiryDate: z.string(),
  openId: optionalText,
})

export const cjCreateOrderDataSchema = z.object({
  orderId: optionalText,
  shipmentOrderId: optionalText,
  orderStatus: optionalText,
  actualPayment: optionalAmount,
  logisticsMiss: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((value) => value === true || value === "true"),
  interceptOrderReasons: z
    .array(z.object({ code: z.number().nullish(), message: z.string().nullish() }))
    .nullish(),
})

export const cjBalanceSchema = z.object({
  amount: z.number(),
})

export type CjProductQuery = {
  pid?: string
  productSku?: string
  variantSku?: string
}

export const cjVariantSchema = z.object({
  vid: z.string().min(1),
  variantNameEn: optionalText,
  variantSku: optionalText,
  // Valores de las opciones unidos por "-", p. ej. "Black-XXL"
  variantKey: optionalText,
  variantImage: optionalText,
  // Coste en USD
  variantSellPrice: optionalAmount,
  // Peso en gramos y medidas en milímetros
  variantWeight: optionalAmount,
  variantLength: optionalAmount,
  variantWidth: optionalAmount,
  variantHeight: optionalAmount,
})

// Lista de imágenes; se acepta también como texto JSON, el formato que CJ usa en otros campos
const imageList = z
  .union([z.array(z.string()), z.string()])
  .nullish()
  .transform((value): string[] => {
    if (!value) {
      return []
    }
    if (Array.isArray(value)) {
      return value
    }
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === "string") : [value]
    } catch {
      return [value]
    }
  })

export const cjProductSchema = z.object({
  pid: z.string().min(1),
  productNameEn: optionalText,
  productSku: optionalText,
  bigImage: optionalText,
  productImageSet: imageList,
  // Nombres de las opciones unidos por "-", p. ej. "Color-Size"
  productKeyEn: optionalText,
  description: optionalText,
  // "3" significa aprobado para la venta
  status: optionalText,
  variants: z
    .array(cjVariantSchema)
    .nullish()
    .transform((variants) => variants ?? []),
})

export type CjVariant = z.infer<typeof cjVariantSchema>
export type CjProduct = z.infer<typeof cjProductSchema>

export const cjWebhookMessageSchema = z.object({
  messageId: z.string().min(1),
  type: z.string().min(1),
  messageType: z.string().nullish(),
  params: z.unknown(),
})

export const cjLogisticParamsSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform(String),
  storeOrderNumbers: z
    .array(z.string())
    .nullish()
    .transform((numbers) => numbers ?? []),
  logisticName: z.string().nullish(),
  trackingNumber: z.string().trim().min(1),
  trackingUrl: z.string().nullish(),
  trackingProvider: z.string().nullish(),
  trackingStatus: z.coerce.number().int().min(0).nullish(),
})

// Datos de un mensaje LOGISTIC de CJ, ya verificado, tal como viajan en el evento de Medusa
export type CjLogisticUpdate = {
  message_id: string
  cj_order_id: string
  store_order_numbers: string[]
  logistic_name: string | null
  tracking_number: string
  tracking_url: string | null
  tracking_provider: string | null
  tracking_status: number | null
}
