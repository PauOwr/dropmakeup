import { MedusaError } from "@medusajs/framework/utils"
import { buildCjOrderInput, CjSourceOrder } from "../build-cj-order-input"

const defaults = { logisticName: "CJPacket Ordinary", fromCountryCode: "CN" }

const order: CjSourceOrder = {
  id: "order_123",
  email: "ana@example.com",
  shipping_address: {
    first_name: "Ana",
    last_name: "García",
    address_1: "Carrer de Mallorca 1",
    address_2: "3º 2ª",
    city: "Barcelona",
    province: "Barcelona",
    postal_code: "08013",
    country_code: "es",
    phone: "+34600000000",
  },
  items: [
    { id: "item_1", quantity: 2, variant_sku: "CJ-SKU-1", variant: { metadata: { cj_vid: "vid-1" } } },
    { id: "item_2", quantity: 1, variant_sku: "CJ-SKU-2", variant: { metadata: null } },
  ],
}

describe("buildCjOrderInput", () => {
  it("convierte el pedido de Medusa al formato de createOrderV2", () => {
    const { input, warnings } = buildCjOrderInput(order, defaults)

    expect(warnings).toEqual([])
    expect(input).toEqual({
      orderNumber: "order_123",
      shippingCountryCode: "ES",
      shippingCountry: "Spain",
      shippingProvince: "Barcelona",
      shippingCity: "Barcelona",
      shippingCustomerName: "Ana García",
      shippingAddress: "Carrer de Mallorca 1",
      shippingAddress2: "3º 2ª",
      shippingZip: "08013",
      shippingPhone: "+34600000000",
      email: "ana@example.com",
      logisticName: "CJPacket Ordinary",
      fromCountryCode: "CN",
      products: [
        { vid: "vid-1", quantity: 2, storeLineItemId: "item_1" },
        { sku: "CJ-SKU-2", quantity: 1, storeLineItemId: "item_2" },
      ],
    })
  })

  it("usa la ciudad como provincia si el pedido no la tiene, y lo avisa", () => {
    const { input, warnings } = buildCjOrderInput(
      { ...order, shipping_address: { ...order.shipping_address, province: null } },
      defaults
    )

    expect(input.shippingProvince).toBe("Barcelona")
    expect(warnings).toHaveLength(1)
  })

  it("permite indicar otro método de envío para un pedido concreto", () => {
    expect(buildCjOrderInput(order, defaults, "YunExpress").input.logisticName).toBe("YunExpress")
  })

  it("rechaza el pedido antes de llamar a CJ si faltan datos obligatorios", () => {
    const incomplete: CjSourceOrder = {
      id: "order_456",
      shipping_address: { country_code: "es" },
      items: [{ id: "item_9", quantity: 1, variant_sku: null, variant: null }],
    }

    let error: unknown
    try {
      buildCjOrderInput(incomplete, { logisticName: null, fromCountryCode: "CN" })
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(MedusaError)
    const medusaError = error as MedusaError
    expect(medusaError.type).toBe(MedusaError.Types.INVALID_DATA)
    for (const missing of ["ciudad", "dirección", "nombre del destinatario", "CJ_LOGISTIC_NAME", "item_9"]) {
      expect(medusaError.message).toContain(missing)
    }
  })
})
