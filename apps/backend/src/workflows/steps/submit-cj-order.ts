import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { errorMessage } from "../../lib/error-message"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService from "../../modules/cjdropshipping/service"
import { buildCjOrderInput, CjSourceOrder } from "../utils/build-cj-order-input"

export type SubmitCjOrderStepInput = {
  order: CjSourceOrder
  logistic_name?: string
}

export type SubmitCjOrderStepOutput = {
  cj_order_id: string | null
  cj_shipment_order_id: string | null
  cj_order_status: string | null
  amount_paid_usd: number | null
}

// Estados de CJ en los que el pedido existe pero no se ha cobrado
const UNPAID_STATUSES = new Set(["CREATED", "IN_CART", "UNPAID"])
// Estados en los que CJ todavía deja borrar el pedido por la API
const DELETABLE_STATUSES = new Set(["CREATED", "IN_CART"])

// Crea el pedido en CJ con payType=2: CJ lo cobra del saldo prepagado de CJ Wallet
export const submitCjOrderStep = createStep(
  "submit-cj-order",
  async (input: SubmitCjOrderStepInput, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

    const { input: cjInput, warnings } = buildCjOrderInput(
      input.order,
      await cj.getOrderDefaults(),
      input.logistic_name
    )
    for (const warning of warnings) {
      logger.warn(warning)
    }

    const created = await cj.createOrder(cjInput)

    const problems = [...created.interceptReasons]
    if (created.logisticsMiss) {
      problems.push(`CJ no tiene el método de envío "${cjInput.logisticName}" para este destino`)
    }

    if (created.orderStatus && UNPAID_STATUSES.has(created.orderStatus)) {
      // CJ creó el pedido pero no lo cobró: se borra si todavía se puede, para poder reintentarlo
      if (created.orderId && DELETABLE_STATUSES.has(created.orderStatus)) {
        const cjOrderId = created.orderId
        await cj.deleteOrder(cjOrderId).catch((error: unknown) => {
          logger.error(`No se pudo borrar el pedido CJ ${cjOrderId}, que quedó sin cobrar: ${errorMessage(error)}`)
        })
      }
      const detail = problems.length ? `; ${problems.join("; ")}` : ""
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `CJ no cobró del saldo el pedido ${input.order.id} (estado ${created.orderStatus}${detail}). Pedido CJ: ${created.orderId ?? "sin id"}`
      )
    }

    if (problems.length) {
      // Ya está cobrado, así que no se deshace: hay que revisarlo en My CJ
      logger.warn(
        `CJ retuvo el pedido CJ ${created.orderId ?? "sin id"} (pedido ${input.order.id}): ${problems.join("; ")}`
      )
    }

    const output: SubmitCjOrderStepOutput = {
      cj_order_id: created.orderId,
      cj_shipment_order_id: created.shipmentOrderId,
      cj_order_status: created.orderStatus,
      amount_paid_usd: created.actualPayment,
    }
    return new StepResponse(output, created.orderId)
  },
  // Solo se ejecuta si falla un paso posterior del workflow
  async (cjOrderId, { container }) => {
    if (!cjOrderId) {
      return
    }
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

    try {
      await cj.deleteOrder(cjOrderId)
      logger.info(`Pedido CJ ${cjOrderId} borrado al deshacer el envío`)
    } catch (error) {
      // Un pedido ya cobrado no se puede borrar por la API: el importe sigue cargado en CJ Wallet
      logger.error(
        `No se pudo deshacer el pedido CJ ${cjOrderId}. Si ya estaba cobrado, gestiónalo desde My CJ: ${errorMessage(error)}`
      )
    }
  }
)
