import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductVariantsWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { findCjVariantIdsStep } from "./steps/find-cj-variant-ids"

export type LinkCjVariantsWorkflowInput = {
  // Productos de Medusa que revisar; si no se indica ninguno, se revisan todas las variantes
  product_ids?: string[]
}

// Rellena metadata.cj_vid en variantes que ya existen en Medusa, buscando su SKU en CJ
export const linkCjVariantsWorkflow = createWorkflow(
  "link-cj-variants",
  function (input: LinkCjVariantsWorkflowInput) {
    const filters = transform({ input }, (data) =>
      data.input.product_ids?.length ? { product_id: data.input.product_ids } : {}
    )
    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "sku", "metadata"],
      filters,
    })

    const links = findCjVariantIdsStep({ variants })

    when("update-linked-variants", { links }, (data) => data.links.updates.length > 0).then(() => {
      const updateInput = transform({ links }, (data) => ({ product_variants: data.links.updates }))
      updateProductVariantsWorkflow.runAsStep({ input: updateInput })
    })

    return new WorkflowResponse(links)
  }
)

export default linkCjVariantsWorkflow
