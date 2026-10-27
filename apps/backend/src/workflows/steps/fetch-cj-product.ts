import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CJDROPSHIPPING_MODULE } from "../../modules/cjdropshipping"
import CjDropshippingModuleService from "../../modules/cjdropshipping/service"

export type FetchCjProductStepInput = {
  pid?: string
  product_sku?: string
}

// Solo lee de CJ: no hay nada que deshacer
export const fetchCjProductStep = createStep(
  "fetch-cj-product",
  async (input: FetchCjProductStepInput, { container }) => {
    const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)
    const product = await cj.getProduct({ pid: input.pid, productSku: input.product_sku })
    return new StepResponse(product)
  }
)
