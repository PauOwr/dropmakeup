import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CjProduct } from "../../modules/cjdropshipping/types"
import { buildMedusaProductFromCj } from "../utils/build-medusa-product-from-cj"

export type PrepareCjProductImportStepInput = {
  cj_product: CjProduct
  stores: { default_sales_channel_id?: string | null }[]
  shipping_profiles: { id: string; type: string }[]
  existing_products: { id: string }[]
  usd_to_eur: number
  markup: number
}

// Comprueba que el producto no esté ya importado y prepara el producto de Medusa. No modifica nada
export const prepareCjProductImportStep = createStep(
  "prepare-cj-product-import",
  async (input: PrepareCjProductImportStepInput, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const existing = input.existing_products[0]
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `El producto de CJ ${input.cj_product.pid} ya está importado (producto ${existing.id})`
      )
    }

    const salesChannelId = input.stores[0]?.default_sales_channel_id
    if (!salesChannelId) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "La tienda no tiene un canal de venta por defecto")
    }
    const shippingProfile =
      input.shipping_profiles.find((profile) => profile.type === "default") ?? input.shipping_profiles[0]
    if (!shippingProfile) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "No hay ningún perfil de envío en la tienda")
    }

    const { product, warnings } = buildMedusaProductFromCj(
      input.cj_product,
      { usdToEur: input.usd_to_eur, markup: input.markup },
      { salesChannelId, shippingProfileId: shippingProfile.id }
    )
    for (const warning of warnings) {
      logger.warn(warning)
    }

    return new StepResponse(product)
  }
)
