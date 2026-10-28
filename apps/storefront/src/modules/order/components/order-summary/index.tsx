import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

// Mismos totales que la cesta y el checkout (importes con IVA incluido)
const OrderSummary = ({ order }: OrderSummaryProps) => {
  return (
    <div>
      <h2 className="text-base-semi mb-4">Resumen del pedido</h2>
      <CartTotals totals={order} />
    </div>
  )
}

export default OrderSummary
