import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { errorMessage } from "../lib/error-message"
import { CJDROPSHIPPING_MODULE } from "../modules/cjdropshipping"
import CjDropshippingModuleService from "../modules/cjdropshipping/service"
import { CjLogisticUpdate } from "../modules/cjdropshipping/types"
import { CJ_LOGISTIC_UPDATED_EVENT } from "../modules/cjdropshipping/webhooks"
import { processCjTrackingWorkflow } from "../workflows/process-cj-tracking"

// Aplica en Medusa el seguimiento que CJ envía por webhook. CJ no reintenta, así que los fallos quedan en el log
export default async function cjLogisticUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<CjLogisticUpdate>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

  try {
    // El orderNumber que se envió a CJ es el id del pedido de Medusa. Se busca primero por él porque,
    // si CJ divide el pedido, los mensajes llegan con otro id de pedido de CJ
    const byOrderNumber = data.store_order_numbers.length
      ? await cj.listCjOrders({ order_id: data.store_order_numbers }, { take: 1 })
      : []
    const [record] = byOrderNumber.length
      ? byOrderNumber
      : await cj.listCjOrders({ cj_order_id: data.cj_order_id }, { take: 1 })

    if (!record) {
      logger.info(
        `Seguimiento de CJ del pedido CJ ${data.cj_order_id}, que no se envió desde esta tienda: se ignora`
      )
      return
    }

    const { result } = await processCjTrackingWorkflow(container).run({
      input: { ...data, cj_order_record_id: record.id },
    })
    logger.info(
      `Seguimiento de CJ aplicado al pedido ${record.order_id}: ${data.tracking_number} ` +
        `(estado ${data.tracking_status ?? "desconocido"})` +
        `${result.ship ? ", envío creado" : ""}${result.deliver ? ", marcado como entregado" : ""}`
    )
  } catch (error) {
    logger.error(
      `No se pudo aplicar el seguimiento de CJ del pedido CJ ${data.cj_order_id} ` +
        `(mensaje ${data.message_id}): ${errorMessage(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: CJ_LOGISTIC_UPDATED_EVENT,
}
