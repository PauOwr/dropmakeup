import { MedusaError } from "@medusajs/framework/utils"
import { CjProduct, CjVariant } from "../../../modules/cjdropshipping/types"
import { buildMedusaProductFromCj, htmlToText, retailPrice } from "../build-medusa-product-from-cj"

const pricing = { usdToEur: 0.92, markup: 2.5 }
const context = { salesChannelId: "sc_1", shippingProfileId: "sp_1" }

const variant = (overrides: Partial<CjVariant>): CjVariant => ({
  vid: "vid-1",
  variantNameEn: null,
  variantSku: "CJBAR001-Rose-Mate",
  variantKey: "Rose-Mate",
  variantImage: null,
  variantSellPrice: 3.4,
  variantWeight: 40,
  variantLength: 100,
  variantWidth: 20,
  variantHeight: 20,
  ...overrides,
})

const cjProduct: CjProduct = {
  pid: "000B9312-456A-4D31-94BD-B083E2A198E8",
  productNameEn: "Matte liquid lipstick",
  productSku: "CJBAR001",
  bigImage: "https://cf.cjdropshipping.com/main.jpg",
  productImageSet: ["https://cf.cjdropshipping.com/main.jpg", "https://cf.cjdropshipping.com/2.jpg"],
  productKeyEn: "Color-Finish",
  description: "<p>Long lasting &amp; waterproof</p><p>12 colors<br/>Vegan</p>",
  status: "3",
  variants: [
    variant({}),
    variant({ vid: "vid-2", variantSku: "CJBAR001-Nude-Mate", variantKey: "Nude-Mate", variantSellPrice: 3.1 }),
  ],
}

describe("buildMedusaProductFromCj", () => {
  it("crea un producto en borrador con las opciones de CJ y el cj_vid en cada variante", () => {
    const { product, warnings } = buildMedusaProductFromCj(cjProduct, pricing, context)

    expect(warnings).toEqual([])
    expect(product).toMatchObject({
      title: "Matte liquid lipstick",
      handle: "cj-cjbar001",
      status: "draft",
      external_id: cjProduct.pid,
      thumbnail: "https://cf.cjdropshipping.com/main.jpg",
      images: [{ url: "https://cf.cjdropshipping.com/main.jpg" }, { url: "https://cf.cjdropshipping.com/2.jpg" }],
      options: [
        { title: "Color", values: ["Rose", "Nude"] },
        { title: "Finish", values: ["Mate"] },
      ],
      sales_channels: [{ id: "sc_1" }],
      shipping_profile_id: "sp_1",
    })
    expect(product.variants?.[0]).toMatchObject({
      title: "Rose-Mate",
      sku: "CJBAR001-Rose-Mate",
      options: { Color: "Rose", Finish: "Mate" },
      manage_inventory: false,
      prices: [{ currency_code: "eur", amount: 7.82 }],
      metadata: { cj_vid: "vid-1", cj_pid: cjProduct.pid, cj_cost_usd: 3.4 },
    })
    expect(product.variants?.[1]?.metadata).toMatchObject({ cj_vid: "vid-2" })
  })

  it("usa una sola opción si los valores de CJ no se pueden separar, y avisa", () => {
    const product: CjProduct = {
      ...cjProduct,
      variants: [variant({ variantKey: "Light-Pink-Mate" }), variant({ vid: "vid-2", variantKey: "Red-Mate" })],
    }

    const built = buildMedusaProductFromCj(product, pricing, context)

    expect(built.product.options).toEqual([{ title: "Variante", values: ["Light-Pink-Mate", "Red-Mate"] }])
    expect(built.product.variants?.[0]?.options).toEqual({ Variante: "Light-Pink-Mate" })
    expect(built.warnings).toHaveLength(1)
  })

  it("avisa si CJ no tiene el producto aprobado para la venta", () => {
    expect(buildMedusaProductFromCj({ ...cjProduct, status: "1" }, pricing, context).warnings).toHaveLength(1)
  })

  it.each([
    ["sin variantes", { ...cjProduct, variants: [] }],
    ["sin coste en una variante", { ...cjProduct, variants: [variant({ variantSellPrice: null })] }],
    ["sin nombre", { ...cjProduct, productNameEn: null }],
  ])("rechaza un producto %s", (_, product) => {
    let error: unknown
    try {
      buildMedusaProductFromCj(product, pricing, context)
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(MedusaError)
    expect((error as MedusaError).type).toBe(MedusaError.Types.INVALID_DATA)
  })

  it("rechaza un tipo de cambio o un margen no positivos", () => {
    expect(() => buildMedusaProductFromCj(cjProduct, { usdToEur: 0, markup: 2 }, context)).toThrow("mayores que 0")
  })
})

describe("retailPrice", () => {
  it("convierte el coste en USD a precio de venta en EUR redondeado a céntimos", () => {
    expect(retailPrice(3.4, pricing)).toBe(7.82)
    expect(retailPrice(10, { usdToEur: 1, markup: 3 })).toBe(30)
  })
})

describe("htmlToText", () => {
  it("convierte la descripción HTML de CJ en texto", () => {
    expect(htmlToText(cjProduct.description ?? "")).toBe("Long lasting & waterproof\n12 colors\nVegan")
  })
})
