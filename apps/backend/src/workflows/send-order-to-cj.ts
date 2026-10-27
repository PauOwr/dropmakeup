import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createCjOrderRecordStep } from "./steps/create-cj-order-record"
import { submitCjOrderStep } from "./steps/submit-cj-order"
import { updateCjOrderRecordStep } from "./steps/update-cj-order-record"
import { validateOrderPaidStep } from "./steps/validate-order-paid"

export type SendOrderToCjWorkflowInput = {
  order_id: string
  // Método de envío de CJ para este pedido; si no se indica, se usa CJ_LOGISTIC_NAME
  logistic_name?: string
}

// Envía un pedido de Medusa ya pagado por el cliente a CJdropshipping y lo paga con el saldo de CJ Wallet (payType=2)
export const sendOrderToCjWorkflow = createWorkflow(
  "send-order-to-cj",
  function (input: SendOrderToCjWorkflowInput) {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "email",
        "status",
        "payment_collections.status",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.company",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        "shipping_address.phone",
        "items.id",
        "items.quantity",
        "items.variant_sku",
        "items.variant.metadata",
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })
    const order = transform({ orders }, (data) => data.orders[0])

    validateOrderPaidStep(order)

    // Se registra antes de llamar a CJ; si un paso posterior falla, la compensación lo borra
    const record = createCjOrderRecordStep({ order_id: input.order_id })

    const submitInput = transform({ order, input }, (data) => ({
      order: data.order,
      logistic_name: data.input.logistic_name,
    }))
    const submitted = submitCjOrderStep(submitInput)

    const updateInput = transform({ record, submitted }, (data) => ({
      id: data.record.id,
      status: "submitted" as const,
      ...data.submitted,
    }))
    const cjOrder = updateCjOrderRecordStep(updateInput)

    return new WorkflowResponse(cjOrder)
  }
)

export default sendOrderToCjWorkflow
