/**
 * Registra en CJdropshipping la URL que recibirá el seguimiento de los envíos (mensajes de logística).
 * CJ solo acepta URLs HTTPS públicas: ni localhost ni 127.0.0.1.
 *
 *   pnpm --filter backend exec medusa exec ./src/scripts/cj-set-webhook.ts https://<tu-dominio>/webhooks/cjdropshipping
 */
import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { CJDROPSHIPPING_MODULE } from '../modules/cjdropshipping'
import CjDropshippingModuleService from '../modules/cjdropshipping/service'

export default async function cjSetWebhook({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  let url: URL | null = null
  try {
    url = new URL(args[0] ?? '')
  } catch {
    url = null
  }
  if (!url || url.protocol !== 'https:') {
    logger.error('Indica una URL HTTPS pública: medusa exec ./src/scripts/cj-set-webhook.ts https://<tu-dominio>/webhooks/cjdropshipping')
    return
  }

  const cj = container.resolve<CjDropshippingModuleService>(CJDROPSHIPPING_MODULE)
  await cj.setLogisticsWebhook(url.toString())
  logger.info(`CJ enviará el seguimiento de los envíos a ${url.toString()}`)
}
