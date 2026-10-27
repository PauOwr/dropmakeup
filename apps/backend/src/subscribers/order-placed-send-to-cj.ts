import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { errorMessage } from "../lib/error-message"
import { CJDROPSHIPPING_MODULE } from "../modules/cjdropshipping"
import CjDropshippingModuleService from "../modules/cjdropshipping/service"
import { sendOrderToCjWorkflow } from "../workflows/send-order-to-cj"
import { getUnpaidReason } from "../workflows/steps/validate-order-paid"

// Envía a CJ cada pedido pagado en cuanto se crea. No relanza errores: el workflow ya deshace lo que puede
export default async function orderPlacedSendToCjHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

  if (!(await cj.isConfigured())) {
    logger.warn(`CJ no está configurado (falta CJ_API_KEY): el pedido ${data.id} no se ha enviado a CJ`)
    return
  }

  try {
    // order.placed también se emite al convertir un pedido borrador, que puede no estar pagado
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "payment_collections.status"],
      filters: { id: data.id },
    })
    const order = orders[0]
    if (!order) {
      logger.error(`No se encontró el pedido ${data.id} para enviarlo a CJ`)
      return
    }

    const unpaidReason = getUnpaidReason(order)
    if (unpaidReason) {
      logger.info(`El pedido ${data.id} no se envía a CJ porque ${unpaidReason}`)
      return
    }

    const { result } = await sendOrderToCjWorkflow(container).run({
      input: { order_id: data.id },
    })
    logger.info(
      `Pedido ${data.id} enviado a CJ${result.is_sandbox ? " en modo sandbox" : ""}: pedido CJ ${result.cj_order_id ?? "sin id"}`
    )
  } catch (error) {
    logger.error(
      `No se pudo enviar el pedido ${data.id} a CJ: ${errorMessage(error)}. ` +
        `Cuando esté resuelto, reenvíalo con: medusa exec ./src/scripts/send-order-to-cj.ts ${data.id}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
