import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  // Estados de Medusa (fulfillment_status y payment_status) en español
  const STATUS_LABELS: Record<string, string> = {
    not_fulfilled: "Pendiente de envío",
    partially_fulfilled: "Enviado en parte",
    fulfilled: "Preparado",
    partially_shipped: "Enviado en parte",
    shipped: "Enviado",
    partially_delivered: "Entregado en parte",
    delivered: "Entregado",
    canceled: "Cancelado",
    not_paid: "Sin pagar",
    awaiting: "Pendiente",
    authorized: "Autorizado",
    partially_authorized: "Autorizado en parte",
    captured: "Pagado",
    partially_captured: "Pagado en parte",
    partially_refunded: "Reembolsado en parte",
    refunded: "Reembolsado",
    requires_action: "Requiere una acción",
  }
  const formatStatus = (str: string) => {
    if (STATUS_LABELS[str]) {
      return STATUS_LABELS[str]
    }
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Email del pedido:{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
      </Text>
      <Text className="mt-2">
        Fecha del pedido:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("es-ES")}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Número de pedido: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Estado del pedido:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Estado del pago:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
