import { MedusaError, OrderStatus, PaymentCollectionStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type OrderPaymentInfo = {
  id: string
  status: string
  payment_collections?: ({ status: string } | null)[] | null
}

// Solo cuenta el pago cobrado (capturado) por completo: un pago solo autorizado aún puede no llegar a cobrarse,
// y CJ cobraría el pedido entero del saldo
const PAID_STATUSES = new Set<string>([PaymentCollectionStatus.COMPLETED])

// Devuelve por qué el pedido no se puede enviar a CJ, o null si está cobrado
export function getUnpaidReason(order: OrderPaymentInfo): string | null {
  if (order.status === OrderStatus.CANCELED || order.status === OrderStatus.DRAFT) {
    return `está en estado ${order.status}`
  }

  const statuses = (order.payment_collections ?? []).flatMap((collection) => (collection ? [collection.status] : []))
  if (statuses.some((status) => PAID_STATUSES.has(status))) {
    return null
  }
  if (statuses.includes(PaymentCollectionStatus.AUTHORIZED)) {
    return "su pago está autorizado pero todavía no se ha cobrado"
  }
  return statuses.length ? `su pago está en estado ${statuses.join(", ")}` : "no tiene ningún pago"
}

// Con payType=2 el envío se paga con el saldo de CJ Wallet: nunca se envía un pedido que el cliente no ha pagado
export const validateOrderPaidStep = createStep(
  "validate-order-paid",
  async (order: OrderPaymentInfo) => {
    const reason = getUnpaidReason(order)
    if (reason) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `El pedido ${order.id} no se envía a CJ porque ${reason}. Solo se envían pedidos con el pago ya cobrado`
      )
    }
    return new StepResponse(true)
  }
)
