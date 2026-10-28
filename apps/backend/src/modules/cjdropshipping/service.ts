import { Logger } from "@medusajs/framework/types"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import CjOrder from "./models/cj-order"
import {
  CjCreatedOrder,
  CjCreateOrderInput,
  CjModuleOptions,
  CjOrderDefaults,
  CjProduct,
  CjProductQuery,
  cjAccessTokenSchema,
  cjBalanceSchema,
  cjCreateOrderDataSchema,
  cjEnvelopeSchema,
  cjProductSchema,
} from "./types"
import { isValidCjWebhookSignature } from "./webhooks"

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const REQUEST_TIMEOUT_MS = 30_000
// El token dura 180 días; se renueva una hora antes de que caduque
const TOKEN_REFRESH_MARGIN_MS = 60 * 60 * 1000
// Si CJ no devuelve una fecha de caducidad legible, el token se reutiliza 24 horas
const FALLBACK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
// CJ admite como máximo 1 petición por segundo
const RATE_LIMIT_RETRY_DELAY_MS = 1_100
// Separación mínima entre dos peticiones al mismo endpoint, para no llegar a ese límite
const MIN_REQUEST_INTERVAL_MS = 1_050
// payType=2: CJ cobra el pedido del saldo prepagado de CJ Wallet al crearlo
const PAY_TYPE_BALANCE = 2

export const CJ_ERROR_CODES = {
  INVALID_TOKEN: 1600001,
  EMPTY_TOKEN: 1600002,
  PARAM_ERROR: 1600100,
  TOO_MANY_REQUESTS: 1600200,
  QUOTA_EXCEEDED: 1600201,
  PRODUCT_NOT_FOUND: 1602001,
  ORDER_EXISTS: 1603003,
  INSUFFICIENT_BALANCE: 1604000,
  BALANCE_PAYMENT_RESTRICTED: 1604001,
} as const

const TOKEN_ERROR_CODES = new Set<number>([CJ_ERROR_CODES.INVALID_TOKEN, CJ_ERROR_CODES.EMPTY_TOKEN])
const RATE_LIMIT_CODES = new Set<number>([CJ_ERROR_CODES.TOO_MANY_REQUESTS, CJ_ERROR_CODES.QUOTA_EXCEEDED])
// API key incorrecta, cuenta no encontrada o acceso a la API desactivado en My CJ
const AUTH_FAILED_CODES = new Set<number>([1600004, 1600005, 1600006, 1600008, 1600014, 1601000])

type InjectedDependencies = {
  logger: Logger
}

type CjRequest<T> = {
  method: "GET" | "POST" | "DELETE"
  path: string
  schema: z.ZodType<T>
  body?: Record<string, unknown>
  query?: Record<string, string>
  authenticated?: boolean
}

type CjResponse<T> = {
  data: T
  requestId: string | null
}

type RetryState = {
  token: number
  rateLimit: number
}

export class CjApiError extends MedusaError {
  readonly cjCode: number | null
  readonly requestId: string | null

  constructor(type: string, message: string, cjCode: number | null = null, requestId: string | null = null) {
    super(type, message)
    this.cjCode = cjCode
    this.requestId = requestId
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

function toCjApiError(
  code: number,
  message: string | null | undefined,
  requestId: string | null,
  path: string
): CjApiError {
  const detail = `[CJ ${code}${requestId ? `, requestId ${requestId}` : ""}: ${message || "sin mensaje"}]`

  switch (code) {
    case CJ_ERROR_CODES.INSUFFICIENT_BALANCE:
      return new CjApiError(
        MedusaError.Types.NOT_ALLOWED,
        `Saldo insuficiente en CJ Wallet para pagar el pedido. Recarga el saldo y vuelve a enviarlo ${detail}`,
        code,
        requestId
      )
    case CJ_ERROR_CODES.BALANCE_PAYMENT_RESTRICTED:
      return new CjApiError(
        MedusaError.Types.NOT_ALLOWED,
        `CJ ha restringido temporalmente el pago con saldo: el pedido hay que pagarlo desde My CJ ${detail}`,
        code,
        requestId
      )
    case CJ_ERROR_CODES.ORDER_EXISTS:
      return new CjApiError(
        MedusaError.Types.DUPLICATE_ERROR,
        `El pedido ya existe en CJ: no se ha vuelto a crear ni a cobrar ${detail}`,
        code,
        requestId
      )
    case CJ_ERROR_CODES.PARAM_ERROR:
      return new CjApiError(
        MedusaError.Types.INVALID_DATA,
        `CJ rechazó los datos enviados a ${path} ${detail}`,
        code,
        requestId
      )
  }

  if (TOKEN_ERROR_CODES.has(code) || AUTH_FAILED_CODES.has(code)) {
    // No es UNAUTHORIZED: falla la credencial del servidor con CJ, no la de quien hace la petición
    return new CjApiError(
      MedusaError.Types.UNEXPECTED_STATE,
      `CJ rechazó la autenticación: revisa CJ_API_KEY y que el acceso a la API siga activo en My CJ ${detail}`,
      code,
      requestId
    )
  }

  return new CjApiError(MedusaError.Types.UNEXPECTED_STATE, `Error de CJ en ${path} ${detail}`, code, requestId)
}

class CjDropshippingModuleService extends MedusaService({
  CjOrder,
}) {
  protected readonly logger_: Logger
  protected readonly options_: CjModuleOptions
  // El CJ-Access-Token se guarda solo en memoria: no se escribe en la base de datos
  private accessToken_: { value: string; expiresAt: number } | null = null
  private pendingAccessToken_: Promise<string> | null = null
  private openId_: string | null = null
  private readonly lastRequestAt_ = new Map<string, number>()

  constructor(container: InjectedDependencies, options: CjModuleOptions = {}) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.options_.apiKey)
  }

  async isSandbox(): Promise<boolean> {
    return this.sandbox_()
  }

  async getOrderDefaults(): Promise<CjOrderDefaults> {
    return {
      logisticName: this.options_.defaultLogisticName || null,
      fromCountryCode: this.options_.fromCountryCode || "CN",
    }
  }

  // Reutiliza el token mientras sea válido y solo pide uno nuevo si no hay o está a punto de caducar
  async getAccessToken(): Promise<string> {
    if (this.accessToken_ && Date.now() < this.accessToken_.expiresAt - TOKEN_REFRESH_MARGIN_MS) {
      return this.accessToken_.value
    }

    // Si llegan varias peticiones a la vez, comparten una única solicitud de token
    if (!this.pendingAccessToken_) {
      this.pendingAccessToken_ = this.requestAccessToken_().finally(() => {
        this.pendingAccessToken_ = null
      })
    }
    return this.pendingAccessToken_
  }

  async createOrder(input: CjCreateOrderInput): Promise<CjCreatedOrder> {
    let response: CjResponse<z.infer<typeof cjCreateOrderDataSchema>>
    try {
      response = await this.request_({
        method: "POST",
        path: "/shopping/order/createOrderV2",
        body: { ...input, payType: PAY_TYPE_BALANCE, isSandbox: this.sandbox_() ? 1 : 0 },
        schema: cjCreateOrderDataSchema,
      })
    } catch (error) {
      if (error instanceof CjApiError && error.cjCode === CJ_ERROR_CODES.INSUFFICIENT_BALANCE) {
        throw await this.withBalance_(error)
      }
      throw error
    }

    const { data, requestId } = response
    return {
      orderId: data.orderId,
      shipmentOrderId: data.shipmentOrderId,
      orderStatus: data.orderStatus,
      actualPayment: data.actualPayment,
      logisticsMiss: data.logisticsMiss,
      interceptReasons: (data.interceptOrderReasons ?? []).map(
        (reason) => `${reason.code ?? "?"}: ${reason.message ?? "sin detalle"}`
      ),
      requestId,
    }
  }

  // CJ solo permite borrar pedidos en estado CREATED o IN_CART; uno ya cobrado no se puede borrar por la API
  async deleteOrder(cjOrderId: string): Promise<void> {
    await this.request_({
      method: "DELETE",
      path: "/shopping/order/deleteOrder",
      query: { orderId: cjOrderId },
      schema: z.unknown(),
    })
  }

  // Saldo disponible en CJ Wallet, en USD
  async getBalance(): Promise<number> {
    const { data } = await this.request_({
      method: "GET",
      path: "/shopping/pay/getBalance",
      schema: cjBalanceSchema,
    })
    return data.amount
  }

  // Secreto con el que CJ firma los webhooks: el configurado o, si falta, el que devuelve getAccessToken
  async getOpenId(): Promise<string> {
    if (this.options_.openId) {
      return this.options_.openId
    }
    if (!this.openId_) {
      await this.getAccessToken()
    }
    if (!this.openId_) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "CJ no devolvió el openId: configúralo en CJ_OPEN_ID para poder verificar sus webhooks"
      )
    }
    return this.openId_
  }

  async verifyWebhookSignature(rawBody: Buffer | string, sign: string): Promise<boolean> {
    return isValidCjWebhookSignature(await this.getOpenId(), rawBody, sign)
  }

  // Producto de CJ con todas sus variantes. Se puede buscar por pid, SKU de producto o SKU de variante
  async getProduct(query: CjProductQuery): Promise<CjProduct> {
    const params = Object.fromEntries(
      Object.entries(query).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""
      )
    )
    if (!Object.keys(params).length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Indica el pid, el SKU de producto o el SKU de variante del producto de CJ"
      )
    }

    const { data } = await this.request_({
      method: "GET",
      path: "/product/query",
      query: params,
      schema: cjProductSchema,
    })
    return data
  }

  // Registra la URL que recibirá los mensajes de logística de CJ. Tiene que ser HTTPS y pública
  async setLogisticsWebhook(callbackUrl: string): Promise<void> {
    const topic = (type: "ENABLE" | "CANCEL") => ({ type, callbackUrls: [callbackUrl] })
    await this.request_({
      method: "POST",
      path: "/webhook/set",
      // CJ exige las cuatro secciones; solo se activa logística, que es lo que procesa esta integración
      body: {
        product: topic("CANCEL"),
        stock: topic("CANCEL"),
        order: topic("CANCEL"),
        logistics: topic("ENABLE"),
      },
      schema: z.unknown(),
    })
  }

  private sandbox_(): boolean {
    return this.options_.sandbox !== false
  }

  private async requestAccessToken_(): Promise<string> {
    const { apiKey } = this.options_
    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Falta CJ_API_KEY: añádela al .env del backend para conectar con CJdropshipping"
      )
    }

    const { data } = await this.request_({
      method: "POST",
      path: "/authentication/getAccessToken",
      body: { apiKey },
      schema: cjAccessTokenSchema,
      authenticated: false,
    })

    const expiresAt = Date.parse(data.accessTokenExpiryDate)
    this.accessToken_ = {
      value: data.accessToken,
      expiresAt: Number.isNaN(expiresAt) ? Date.now() + FALLBACK_TOKEN_TTL_MS : expiresAt,
    }
    this.openId_ = data.openId
    return data.accessToken
  }

  // Añade el saldo disponible al error de saldo insuficiente, si se puede consultar
  private async withBalance_(error: CjApiError): Promise<CjApiError> {
    try {
      const balance = await this.getBalance()
      return new CjApiError(
        error.type,
        `${error.message} Saldo disponible: ${balance.toFixed(2)} USD.`,
        error.cjCode,
        error.requestId
      )
    } catch {
      return error
    }
  }

  private async request_<T>(
    request: CjRequest<T>,
    retries: RetryState = { token: 0, rateLimit: 0 }
  ): Promise<CjResponse<T>> {
    const url = new URL(`${CJ_API_URL}${request.path}`)
    for (const [key, value] of Object.entries(request.query ?? {})) {
      url.searchParams.set(key, value)
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (request.authenticated !== false) {
      headers["CJ-Access-Token"] = await this.getAccessToken()
    }

    // Se espera lo necesario desde la petición anterior al mismo endpoint (CJ admite 1 por segundo)
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - (this.lastRequestAt_.get(request.path) ?? 0))
    if (wait > 0) {
      await delay(wait)
    }
    this.lastRequestAt_.set(request.path, Date.now())

    let response: Response
    try {
      response = await fetch(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw new CjApiError(
        MedusaError.Types.UNEXPECTED_STATE,
        `No se pudo conectar con CJ en ${request.path}: ${errorMessage(error)}`
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new CjApiError(
        MedusaError.Types.UNEXPECTED_STATE,
        `CJ devolvió una respuesta que no es JSON en ${request.path} (HTTP ${response.status})`
      )
    }

    const envelope = cjEnvelopeSchema.safeParse(payload)
    if (!envelope.success) {
      throw new CjApiError(
        MedusaError.Types.UNEXPECTED_STATE,
        `CJ devolvió una respuesta con un formato inesperado en ${request.path} (HTTP ${response.status})`
      )
    }

    const { code, result, message } = envelope.data
    const requestId = envelope.data.requestId ?? null

    if (result && code === 200) {
      const parsed = request.schema.safeParse(envelope.data.data)
      if (!parsed.success) {
        throw new CjApiError(
          MedusaError.Types.UNEXPECTED_STATE,
          `CJ devolvió datos inesperados en ${request.path}: ${z.prettifyError(parsed.error)}`,
          code,
          requestId
        )
      }
      return { data: parsed.data, requestId }
    }

    // Token caducado o revocado: se pide uno nuevo y se repite una vez
    if (request.authenticated !== false && TOKEN_ERROR_CODES.has(code) && retries.token === 0) {
      this.logger_.warn(`CJ rechazó el token en ${request.path}; se pide uno nuevo y se repite la petición`)
      this.accessToken_ = null
      return this.request_(request, { ...retries, token: 1 })
    }

    // Límite de peticiones: CJ no ha procesado la petición, así que repetirla una vez es seguro
    if (RATE_LIMIT_CODES.has(code) && retries.rateLimit === 0) {
      this.logger_.warn(`CJ limitó la petición a ${request.path}; se repite en ${RATE_LIMIT_RETRY_DELAY_MS} ms`)
      await delay(RATE_LIMIT_RETRY_DELAY_MS)
      return this.request_(request, { ...retries, rateLimit: 1 })
    }

    throw toCjApiError(code, message, requestId, request.path)
  }
}

export default CjDropshippingModuleService
