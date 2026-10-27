import { MedusaError } from "@medusajs/framework/utils"
import { computeCjWebhookSignature, isValidCjWebhookSignature, parseCjWebhook } from "../webhooks"

// Ejemplo de la documentación oficial de CJ (Webhook → Signature Authentication)
const DOC_OPEN_ID = "123"
const DOC_BODY = '{"messageId":"123111","messageType":"INSERT","params":"123","type":"PRODUCT"}'
const DOC_SIGNATURE = "AHxoGFMoS/4mZfJ5vFes5//Pz2QibFQhh3GlrTtnWpk="

// Mensaje LOGISTIC de ejemplo de la documentación, con el id de un pedido de Medusa
const logisticParams = {
  orderId: "210823100016290555",
  storeOrderNumbers: ["order_123"],
  logisticName: "CJPacket Ordinary",
  trackingNumber: "number12345678",
  trackingProvider: "USPS",
  trackingStatus: 12,
  logisticsTrackEvents: "[]",
}
const logisticMessage = {
  messageId: "7cceede817dc47ed9748328b64353c5c",
  type: "LOGISTIC",
  messageType: "UPDATE",
  openId: 12312,
  params: logisticParams,
}

describe("firma de los webhooks de CJ", () => {
  it("coincide con el ejemplo de la documentación oficial", () => {
    expect(computeCjWebhookSignature(DOC_OPEN_ID, DOC_BODY)).toBe(DOC_SIGNATURE)
    expect(isValidCjWebhookSignature(DOC_OPEN_ID, Buffer.from(DOC_BODY), DOC_SIGNATURE)).toBe(true)
  })

  it("rechaza un cuerpo modificado, otro openId o una firma con otro formato", () => {
    expect(isValidCjWebhookSignature(DOC_OPEN_ID, DOC_BODY.replace("INSERT", "DELETE"), DOC_SIGNATURE)).toBe(false)
    expect(isValidCjWebhookSignature("124", DOC_BODY, DOC_SIGNATURE)).toBe(false)
    expect(isValidCjWebhookSignature(DOC_OPEN_ID, DOC_BODY, "firma-corta")).toBe(false)
  })
})

describe("parseCjWebhook", () => {
  it("interpreta un mensaje LOGISTIC", () => {
    expect(parseCjWebhook(logisticMessage)).toEqual({
      kind: "logistic",
      update: {
        message_id: "7cceede817dc47ed9748328b64353c5c",
        cj_order_id: "210823100016290555",
        store_order_numbers: ["order_123"],
        logistic_name: "CJPacket Ordinary",
        tracking_number: "number12345678",
        tracking_url: null,
        tracking_provider: "USPS",
        tracking_status: 12,
      },
    })
  })

  it("acepta params como texto JSON", () => {
    const parsed = parseCjWebhook({ ...logisticMessage, params: JSON.stringify(logisticParams) })
    expect(parsed.kind).toBe("logistic")
  })

  it("descarta los mensajes que no son de seguimiento", () => {
    expect(parseCjWebhook(JSON.parse(DOC_BODY))).toEqual({ kind: "ignored", type: "PRODUCT", messageId: "123111" })
  })

  it("rechaza un mensaje LOGISTIC sin número de seguimiento", () => {
    let error: unknown
    try {
      parseCjWebhook({ ...logisticMessage, params: { ...logisticParams, trackingNumber: "" } })
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(MedusaError)
    expect((error as MedusaError).type).toBe(MedusaError.Types.INVALID_DATA)
  })
})
