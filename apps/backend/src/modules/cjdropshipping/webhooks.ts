import { createHmac, timingSafeEqual } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { CjLogisticUpdate, cjLogisticParamsSchema, cjWebhookMessageSchema } from "./types"

// Evento de Medusa que se emite al recibir un mensaje LOGISTIC de CJ con la firma verificada
export const CJ_LOGISTIC_UPDATED_EVENT = "cjdropshipping.logistic_updated"

export type ParsedCjWebhook =
  | { kind: "logistic"; update: CjLogisticUpdate }
  | { kind: "ignored"; type: string; messageId: string }

// Firma de CJ: HMAC-SHA256 del cuerpo original, con el openId como secreto, codificada en Base64
export function computeCjWebhookSignature(openId: string, rawBody: Buffer | string): string {
  return createHmac("sha256", openId).update(rawBody).digest("base64")
}

export function isValidCjWebhookSignature(openId: string, rawBody: Buffer | string, sign: string): boolean {
  const expected = Buffer.from(computeCjWebhookSignature(openId, rawBody))
  const received = Buffer.from(sign.trim())
  // Comparación en tiempo constante, para no dar pistas sobre la firma con el tiempo de respuesta
  return expected.length === received.length && timingSafeEqual(expected, received)
}

// Según el tipo de mensaje, params llega como objeto o como texto JSON
function parseParams(params: unknown): unknown {
  if (typeof params !== "string") {
    return params
  }
  try {
    return JSON.parse(params)
  } catch {
    return params
  }
}

export function parseCjWebhook(body: unknown): ParsedCjWebhook {
  const message = cjWebhookMessageSchema.safeParse(body)
  if (!message.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Webhook de CJ con un formato no válido: ${z.prettifyError(message.error)}`
    )
  }

  const { messageId, type } = message.data
  if (type !== "LOGISTIC") {
    return { kind: "ignored", type, messageId }
  }

  const params = cjLogisticParamsSchema.safeParse(parseParams(message.data.params))
  if (!params.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Mensaje LOGISTIC de CJ con datos no válidos: ${z.prettifyError(params.error)}`
    )
  }

  const logistic = params.data
  return {
    kind: "logistic",
    update: {
      message_id: messageId,
      cj_order_id: logistic.orderId,
      store_order_numbers: logistic.storeOrderNumbers,
      logistic_name: logistic.logisticName || null,
      tracking_number: logistic.trackingNumber,
      tracking_url: logistic.trackingUrl || null,
      tracking_provider: logistic.trackingProvider || null,
      tracking_status: logistic.trackingStatus ?? null,
    },
  }
}
