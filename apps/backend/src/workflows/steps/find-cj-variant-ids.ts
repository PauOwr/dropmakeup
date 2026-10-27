import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { errorMessage } from "../../lib/error-message"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService from "../../modules/cjdropshipping/service"

export type FindCjVariantIdsStepInput = {
  variants: { id: string; sku?: string | null; metadata?: Record<string, unknown> | null }[]
}

export type CjVariantLink = {
  id: string
  metadata: Record<string, unknown>
}

export type FindCjVariantIdsStepOutput = {
  updates: CjVariantLink[]
  // SKU que no existen en CJ
  not_found: string[]
  // Variantes sin SKU o que ya tenían cj_vid
  skipped: number
}

// Busca en CJ, por SKU, el id de variante de las variantes de Medusa que aún no lo tienen. Solo lee
export const findCjVariantIdsStep = createStep(
  "find-cj-variant-ids",
  async (input: FindCjVariantIdsStepInput, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)

    const pending = input.variants.flatMap((variant) => {
      const sku = variant.sku?.trim()
      return sku && typeof variant.metadata?.cj_vid !== "string" ? [{ ...variant, sku }] : []
    })

    // Cada consulta devuelve el producto de CJ con todas sus variantes, así que basta una por producto
    const found = new Map<string, { vid: string; pid: string }>()
    const notFound: string[] = []
    for (const variant of pending) {
      if (!found.has(variant.sku)) {
        try {
          const product = await cj.getProduct({ variantSku: variant.sku })
          for (const cjVariant of product.variants) {
            if (cjVariant.variantSku) {
              found.set(cjVariant.variantSku, { vid: cjVariant.vid, pid: product.pid })
            }
          }
        } catch (error) {
          logger.warn(`No se pudo consultar en CJ el SKU ${variant.sku}: ${errorMessage(error)}`)
        }
      }
      if (!found.has(variant.sku)) {
        notFound.push(variant.sku)
      }
    }

    const updates = pending.flatMap((variant) => {
      const match = found.get(variant.sku)
      return match
        ? [{ id: variant.id, metadata: { ...(variant.metadata ?? {}), cj_vid: match.vid, cj_pid: match.pid } }]
        : []
    })

    const output: FindCjVariantIdsStepOutput = {
      updates,
      not_found: notFound,
      skipped: input.variants.length - pending.length,
    }
    return new StepResponse(output)
  }
)
