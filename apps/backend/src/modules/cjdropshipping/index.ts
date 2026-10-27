import { Module } from "@medusajs/framework/utils"
import CjDropshippingModuleService from "./service"

export const CJDROPSHIPPING_MODULE = "cjdropshipping"

export default Module(CJDROPSHIPPING_MODULE, {
  service: CjDropshippingModuleService,
})
