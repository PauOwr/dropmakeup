import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService, {
  CJ_ERROR_CODES,
  CjApiError,
} from "../../modules/cjdropshipping/service"

export type FetchCjProductStepInput = {
  pid?: string
  product_sku?: string
}

// Solo lee de CJ: no hay nada que deshacer
export const fetchCjProductStep = createStep(
  "fetch-cj-product",
  async (input: FetchCjProductStepInput, { container }) => {
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)
    try {
      const product = await cj.getProduct({ pid: input.pid, productSku: input.product_sku })
      return new StepResponse(product)
    } catch (error) {
      // Un SKU que no es de producto puede ser el de una de sus variantes (p. ej. CJXX123456701AZ)
      if (
        input.product_sku &&
        error instanceof CjApiError &&
        error.cjCode === CJ_ERROR_CODES.PRODUCT_NOT_FOUND
      ) {
        const product = await cj.getProduct({ variantSku: input.product_sku })
        return new StepResponse(product)
      }
      throw error
    }
  }
)
