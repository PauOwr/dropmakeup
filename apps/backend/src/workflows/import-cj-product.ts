import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { fetchCjProductStep } from "./steps/fetch-cj-product"
import { prepareCjProductImportStep } from "./steps/prepare-cj-product-import"

export type ImportCjProductWorkflowInput = {
  // Uno de los dos: id de producto de CJ o SKU de producto de CJ
  pid?: string
  product_sku?: string
  // Precio de venta en EUR = coste en USD × usd_to_eur × markup
  usd_to_eur: number
  markup: number
}

// Importa un producto de CJ como producto en borrador, con metadata.cj_vid en cada variante
export const importCjProductWorkflow = createWorkflow(
  "import-cj-product",
  function (input: ImportCjProductWorkflowInput) {
    const cjProduct = fetchCjProductStep({ pid: input.pid, product_sku: input.product_sku })

    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["default_sales_channel_id"],
    })
    const { data: shippingProfiles } = useQueryGraphStep({
      entity: "shipping_profile",
      fields: ["id", "type"],
    }).config({ name: "get-shipping-profiles" })

    // El external_id del producto es el pid de CJ: así se detecta si ya estaba importado
    const existingFilters = transform({ cjProduct }, (data) => ({ external_id: data.cjProduct.pid }))
    const { data: existingProducts } = useQueryGraphStep({
      entity: "product",
      fields: ["id"],
      filters: existingFilters,
    }).config({ name: "get-imported-cj-product" })

    const product = prepareCjProductImportStep({
      cj_product: cjProduct,
      stores,
      shipping_profiles: shippingProfiles,
      existing_products: existingProducts,
      usd_to_eur: input.usd_to_eur,
      markup: input.markup,
    })

    const createInput = transform({ product }, (data) => ({ products: [data.product] }))
    const products = createProductsWorkflow.runAsStep({ input: createInput })

    return new WorkflowResponse(products)
  }
)

export default importCjProductWorkflow
