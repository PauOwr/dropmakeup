import { getUnpaidReason } from "../validate-order-paid"

const order = (status: string, paymentStatuses: string[]) => ({
  id: "order_123",
  status,
  payment_collections: paymentStatuses.map((paymentStatus) => ({ status: paymentStatus })),
})

describe("getUnpaidReason", () => {
  it("acepta pedidos con el pago cobrado", () => {
    expect(getUnpaidReason(order("pending", ["completed"]))).toBeNull()
  })

  it("rechaza pedidos con el pago solo autorizado", () => {
    expect(getUnpaidReason(order("pending", ["authorized"]))).toBe(
      "su pago está autorizado pero todavía no se ha cobrado"
    )
  })

  it.each(["not_paid", "awaiting", "partially_authorized", "partially_captured", "failed", "canceled"])(
    "rechaza pedidos con el pago %s",
    (paymentStatus) => {
      expect(getUnpaidReason(order("pending", [paymentStatus]))).toContain(paymentStatus)
    }
  )

  it("rechaza pedidos sin ningún pago", () => {
    expect(getUnpaidReason(order("pending", []))).toBe("no tiene ningún pago")
    expect(getUnpaidReason({ id: "order_123", status: "pending", payment_collections: null })).toBe(
      "no tiene ningún pago"
    )
  })

  it.each(["canceled", "draft"])("rechaza pedidos en estado %s aunque estén cobrados", (status) => {
    expect(getUnpaidReason(order(status, ["completed"]))).toContain(status)
  })
})
