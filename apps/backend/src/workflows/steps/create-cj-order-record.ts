import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService from "../../modules/cjdropshipping/service"

export type CreateCjOrderRecordStepInput = {
  order_id: string
}

// Registra el envío antes de llamar a CJ. El order_id único impide enviar (y cobrar) dos veces el mismo pedido
export const createCjOrderRecordStep = createStep(
  "create-cj-order-record",
  async (input: CreateCjOrderRecordStepInput, { container }) => {
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

    const [existing] = await cj.listCjOrders({ order_id: input.order_id }, { take: 1 })
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        existing.status === "submitted"
          ? `El pedido ${input.order_id} ya se envió a CJ (pedido CJ ${existing.cj_order_id ?? "sin id"})`
          : `El pedido ${input.order_id} tiene un envío a CJ pendiente o interrumpido: comprueba en My CJ si existe antes de reintentarlo`
      )
    }

    const record = await cj.createCjOrders({ order_id: input.order_id, is_sandbox: await cj.isSandbox() })
    return new StepResponse(record, record.id)
  },
  async (recordId, { container }) => {
    if (!recordId) {
      return
    }
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)
    await cj.deleteCjOrders(recordId)
  }
)
