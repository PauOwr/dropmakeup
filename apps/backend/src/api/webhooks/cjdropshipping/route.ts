import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { errorMessage } from '../../../lib/error-message'
import { CJDROPSHIPPING_MODULE } from '../../../modules/cjdropshipping'
import CjDropshippingModuleService from '../../../modules/cjdropshipping/service'
import {
  CJ_LOGISTIC_UPDATED_EVENT,
  ParsedCjWebhook,
  parseCjWebhook,
} from '../../../modules/cjdropshipping/webhooks'

// CJ exige respuesta en menos de 3 segundos y no reintenta: aquí solo se verifica la firma y el mensaje
// se pasa como evento al suscriptor cj-logistic-updated, que es quien actualiza el pedido
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const cj = req.scope.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

  const sign = req.headers.sign
  const rawBody: unknown = req.rawBody
  const body = Buffer.isBuffer(rawBody) || typeof rawBody === 'string' ? rawBody : null

  let validSignature = false
  try {
    validSignature = typeof sign === 'string' && body !== null && (await cj.verifyWebhookSignature(body, sign))
  } catch (error) {
    logger.error(`No se pudo verificar un webhook de CJ: ${errorMessage(error)}`)
    res.status(500).json({ code: 500, result: 'fail', message: 'signature check unavailable' })
    return
  }
  if (!validSignature) {
    logger.warn('Webhook de CJ rechazado: falta la firma o no coincide')
    res.status(401).json({ code: 401, result: 'fail', message: 'invalid signature' })
    return
  }

  let message: ParsedCjWebhook
  try {
    message = parseCjWebhook(req.body)
  } catch (error) {
    logger.error(`Webhook de CJ con firma válida pero datos no válidos: ${errorMessage(error)}`)
    res.status(400).json({ code: 400, result: 'fail', message: 'invalid payload' })
    return
  }

  if (message.kind === 'logistic') {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit({ name: CJ_LOGISTIC_UPDATED_EVENT, data: message.update })
  } else {
    logger.info(`Webhook de CJ ${message.type} (${message.messageId}) descartado: solo se procesa el seguimiento`)
  }

  res.status(200).json({ code: 200, result: 'success', message: 'ok' })
}
