import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { CjLogisticUpdate } from "../modules/cjdropshipping/types"
import { updateCjOrderRecordStep } from "./steps/update-cj-order-record"

// Estados de seguimiento de CJ: desde el 1 el paquete ha salido de su almacén; el 12 es entregado
const CJ_TRACKING_SHIPPED = 1
const CJ_TRACKING_DELIVERED = 12

export type ProcessCjTrackingWorkflowInput = CjLogisticUpdate & {
  // Registro de cj_order al que corresponde el mensaje
  cj_order_record_id: string
}

// Guarda el seguimiento de CJ y lo refleja en el pedido de Medusa: crea el envío con su número de
// seguimiento (eventos order.fulfillment_created y shipment.created) y lo marca como entregado (delivery.created)
export const processCjTrackingWorkflow = createWorkflow(
  "process-cj-tracking",
  function (input: ProcessCjTrackingWorkflowInput) {
    const { data: cjOrders } = useQueryGraphStep({
      entity: "cj_order",
      fields: ["id", "order_id", "status", "fulfillment_id"],
      filters: { id: input.cj_order_record_id },
      options: { throwIfKeyNotFound: true },
    })
    const cjOrder = transform({ cjOrders }, (data) => data.cjOrders[0])

    const orderFilters = transform({ cjOrder }, (data) => ({ id: data.cjOrder.order_id }))
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "items.id", "items.quantity", "fulfillments.id"],
      filters: orderFilters,
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-order-for-cj-tracking" })

    const plan = transform({ input, cjOrder, orders }, (data) => {
      const order = data.orders[0]
      const trackingStatus = data.input.tracking_status ?? 0
      const fulfillmentId = data.cjOrder.fulfillment_id
      // El envío se crea una sola vez, y nunca si el pedido ya tiene envíos hechos a mano
      const ship = !fulfillmentId && !(order.fulfillments ?? []).length && trackingStatus >= CJ_TRACKING_SHIPPED
      return {
        order_id: order.id,
        ship,
        deliver:
          trackingStatus === CJ_TRACKING_DELIVERED &&
          data.cjOrder.status !== "delivered" &&
          (ship || Boolean(fulfillmentId)),
        items: (order.items ?? []).flatMap((item) => (item ? [{ id: item.id, quantity: Number(item.quantity) }] : [])),
        labels: [
          {
            tracking_number: data.input.tracking_number,
            tracking_url: data.input.tracking_url ?? "",
            label_url: data.input.tracking_url ?? "",
          },
        ],
      }
    })

    const trackingUpdate = transform({ input }, (data) => ({
      id: data.input.cj_order_record_id,
      logistic_name: data.input.logistic_name,
      tracking_number: data.input.tracking_number,
      tracking_url: data.input.tracking_url,
      tracking_status: data.input.tracking_status,
    }))
    updateCjOrderRecordStep(trackingUpdate)

    const shipment = when("create-cj-shipment", { plan }, (data) => data.plan.ship).then(() => {
      const fulfillmentInput = transform({ plan }, (data) => ({
        order_id: data.plan.order_id,
        items: data.plan.items,
      }))
      const fulfillment = createOrderFulfillmentWorkflow.runAsStep({ input: fulfillmentInput })

      const shipmentInput = transform({ plan, fulfillment }, (data) => ({
        order_id: data.plan.order_id,
        fulfillment_id: data.fulfillment.id,
        items: data.plan.items,
        labels: data.plan.labels,
      }))
      createOrderShipmentWorkflow.runAsStep({ input: shipmentInput })

      const shippedUpdate = transform({ input, fulfillment }, (data) => ({
        id: data.input.cj_order_record_id,
        status: "shipped" as const,
        fulfillment_id: data.fulfillment.id,
      }))
      updateCjOrderRecordStep(shippedUpdate).config({ name: "mark-cj-order-shipped" })

      return fulfillment
    })

    when("mark-cj-delivered", { plan }, (data) => data.plan.deliver).then(() => {
      const deliveredInput = transform({ plan, cjOrder, shipment }, (data) => ({
        orderId: data.plan.order_id,
        fulfillmentId: data.cjOrder.fulfillment_id ?? data.shipment?.id ?? "",
      }))
      markOrderFulfillmentAsDeliveredWorkflow.runAsStep({ input: deliveredInput })

      const deliveredUpdate = transform({ input }, (data) => ({
        id: data.input.cj_order_record_id,
        status: "delivered" as const,
      }))
      updateCjOrderRecordStep(deliveredUpdate).config({ name: "mark-cj-order-delivered" })
    })

    return new WorkflowResponse(plan)
  }
)

export default processCjTrackingWorkflow
