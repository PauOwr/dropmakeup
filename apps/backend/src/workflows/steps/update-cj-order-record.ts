import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService from "../../modules/cjdropshipping/service"

export type CjOrderStatus = "pending" | "submitted" | "shipped" | "delivered"

// Solo se actualizan los campos que se indican
export type UpdateCjOrderRecordStepInput = {
  id: string
  status?: CjOrderStatus
  cj_order_id?: string | null
  cj_shipment_order_id?: string | null
  cj_order_status?: string | null
  amount_paid_usd?: number | null
  logistic_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  tracking_status?: number | null
  fulfillment_id?: string | null
}

export const updateCjOrderRecordStep = createStep(
  "update-cj-order-record",
  async (input: UpdateCjOrderRecordStepInput, { container }) => {
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

    const previous = await cj.retrieveCjOrder(input.id)
    const updated = await cj.updateCjOrders(input)

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)
    await cj.updateCjOrders({
      id: previous.id,
      status: previous.status,
      cj_order_id: previous.cj_order_id,
      cj_shipment_order_id: previous.cj_shipment_order_id,
      cj_order_status: previous.cj_order_status,
      amount_paid_usd: previous.amount_paid_usd,
      logistic_name: previous.logistic_name,
      tracking_number: previous.tracking_number,
      tracking_url: previous.tracking_url,
      tracking_status: previous.tracking_status,
      fulfillment_id: previous.fulfillment_id,
    })
  }
)
