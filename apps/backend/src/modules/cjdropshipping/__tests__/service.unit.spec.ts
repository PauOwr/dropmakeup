import { Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import CjDropshippingModuleService, { CjApiError } from "../service"
import { CjCreateOrderInput, CjModuleOptions } from "../types"

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })

const ok = (data: unknown) =>
  jsonResponse({ code: 200, result: true, message: "Success", data, requestId: "req-ok" })

const fail = (code: number, message: string) =>
  jsonResponse({ code, result: false, message, data: null, requestId: "req-fail" })

const tokenResponse = (accessToken = "token-1") =>
  ok({
    openId: 123456789,
    accessToken,
    accessTokenExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    refreshToken: "refresh-1",
    refreshTokenExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  })

const orderInput: CjCreateOrderInput = {
  orderNumber: "order_123",
  shippingCountryCode: "ES",
  shippingCountry: "Spain",
  shippingProvince: "Barcelona",
  shippingCity: "Barcelona",
  shippingCustomerName: "Ana García",
  shippingAddress: "Carrer de Mallorca 1",
  logisticName: "CJPacket Ordinary",
  fromCountryCode: "CN",
  products: [{ vid: "vid-1", quantity: 2, storeLineItemId: "item_1" }],
}

const paidOrder = {
  orderId: "CJ-1",
  shipmentOrderId: "SO-1",
  orderStatus: "UNSHIPPED",
  actualPayment: 12.5,
  logisticsMiss: false,
  interceptOrderReasons: [],
}

const createService = (options: CjModuleOptions = {}) =>
  new CjDropshippingModuleService({ logger }, { apiKey: "CJ000@api@test", ...options })

describe("CjDropshippingModuleService", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>

  // URL, cabeceras y cuerpo JSON de la llamada número `index` a fetch
  const call = (index: number) => {
    const [url, init] = fetchMock.mock.calls[index]
    return {
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }
  }

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    fetchMock.mockRestore()
    jest.clearAllMocks()
  })

  it("pide el token con la API key una sola vez y lo reutiliza", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
    const service = createService()

    await expect(service.getAccessToken()).resolves.toBe("token-1")
    await expect(service.getAccessToken()).resolves.toBe("token-1")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(call(0).url).toBe(`${CJ_API_URL}/authentication/getAccessToken`)
    expect(call(0).body).toEqual({ apiKey: "CJ000@api@test" })
  })

  it("comparte una única petición de token entre llamadas simultáneas", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
    const service = createService()

    const tokens = await Promise.all([service.getAccessToken(), service.getAccessToken()])

    expect(tokens).toEqual(["token-1", "token-1"])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("crea el pedido con payType=2, en sandbox y con la cabecera CJ-Access-Token", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(ok(paidOrder))

    const created = await createService().createOrder(orderInput)

    expect(call(1).url).toBe(`${CJ_API_URL}/shopping/order/createOrderV2`)
    expect(call(1).headers["CJ-Access-Token"]).toBe("token-1")
    expect(call(1).body).toEqual({ ...orderInput, payType: 2, isSandbox: 1 })
    expect(created).toEqual({
      orderId: "CJ-1",
      shipmentOrderId: "SO-1",
      orderStatus: "UNSHIPPED",
      actualPayment: 12.5,
      logisticsMiss: false,
      interceptReasons: [],
      requestId: "req-ok",
    })
  })

  it("envía isSandbox=0 cuando el sandbox está desactivado", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(ok(paidOrder))

    await createService({ sandbox: false }).createOrder(orderInput)

    expect(call(1).body).toMatchObject({ payType: 2, isSandbox: 0 })
  })

  it("renueva el token y repite la petición una vez si CJ lo rechaza", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse("token-1"))
      .mockResolvedValueOnce(fail(1600001, "Invalid API key or access token"))
      .mockResolvedValueOnce(tokenResponse("token-2"))
      .mockResolvedValueOnce(ok(paidOrder))

    const created = await createService().createOrder(orderInput)

    expect(created.orderId).toBe("CJ-1")
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(call(3).headers["CJ-Access-Token"]).toBe("token-2")
  })

  it("repite una vez la petición si CJ aplica el límite de peticiones", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(fail(1600200, "Too much request"))
      .mockResolvedValueOnce(ok(paidOrder))

    const created = await createService().createOrder(orderInput)

    expect(created.orderId).toBe("CJ-1")
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("convierte el saldo insuficiente en un error NOT_ALLOWED con el saldo disponible", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(fail(1604000, "Balance is insufficient"))
      .mockResolvedValueOnce(ok({ amount: 3.2, noWithdrawalAmount: null, freezeAmount: null }))

    const error = await createService()
      .createOrder(orderInput)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(CjApiError)
    const cjError = error as CjApiError
    expect(cjError.type).toBe(MedusaError.Types.NOT_ALLOWED)
    expect(cjError.cjCode).toBe(1604000)
    expect(cjError.message).toContain("Saldo insuficiente en CJ Wallet")
    expect(cjError.message).toContain("3.20 USD")
  })

  it("incluye el código y el requestId de CJ cuando la API falla", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(fail(1603000, "Order create fail"))

    const error = await createService()
      .createOrder(orderInput)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(CjApiError)
    const cjError = error as CjApiError
    expect(cjError.type).toBe(MedusaError.Types.UNEXPECTED_STATE)
    expect(cjError.message).toContain("1603000")
    expect(cjError.message).toContain("req-fail")
  })

  it("no llama a CJ si falta CJ_API_KEY", async () => {
    const service = new CjDropshippingModuleService({ logger }, {})

    await expect(service.createOrder(orderInput)).rejects.toThrow("Falta CJ_API_KEY")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("usa el openId configurado para verificar webhooks sin llamar a CJ", async () => {
    const service = createService({ openId: "123" })
    const body = '{"messageId":"123111","messageType":"INSERT","params":"123","type":"PRODUCT"}'

    await expect(service.getOpenId()).resolves.toBe("123")
    await expect(service.verifyWebhookSignature(body, "AHxoGFMoS/4mZfJ5vFes5//Pz2QibFQhh3GlrTtnWpk=")).resolves.toBe(true)
    await expect(service.verifyWebhookSignature(body, "AAAAGFMoS/4mZfJ5vFes5//Pz2QibFQhh3GlrTtnWpk=")).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("obtiene el openId de getAccessToken si no está configurado", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())

    await expect(createService().getOpenId()).resolves.toBe("123456789")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("consulta un producto por SKU de variante y valida su respuesta", async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(
      ok({
        pid: "PID-1",
        productNameEn: "Lipstick",
        productSku: "CJBAR001",
        productImageSet: '["https://cf.cjdropshipping.com/1.jpg"]',
        variants: [{ vid: "VID-1", variantSku: "CJBAR001-Rose", variantKey: "Rose", variantSellPrice: 3.4 }],
      })
    )

    const product = await createService().getProduct({ variantSku: "CJBAR001-Rose" })

    expect(call(1).url).toBe(`${CJ_API_URL}/product/query?variantSku=CJBAR001-Rose`)
    expect(product.productImageSet).toEqual(["https://cf.cjdropshipping.com/1.jpg"])
    expect(product.variants[0]).toMatchObject({ vid: "VID-1", variantSku: "CJBAR001-Rose", variantSellPrice: 3.4 })
  })
})
