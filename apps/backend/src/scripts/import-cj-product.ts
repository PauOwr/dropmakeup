/**
 * Importa un producto de CJdropshipping como producto en borrador, con el id de variante de CJ
 * (metadata.cj_vid) en cada variante. Precio de venta en EUR = coste en USD × CJ_USD_TO_EUR × CJ_PRICE_MARKUP.
 *
 *   pnpm --filter backend exec medusa exec ./src/scripts/import-cj-product.ts <pid o SKU de CJ>
 *
 * El SKU puede ser el del producto o el de cualquiera de sus variantes: se importa el producto entero.
 *
 * El producto queda en borrador: revisa textos, precios e imágenes y publícalo desde el panel.
 */
import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { importCjProductWorkflow } from '../workflows/import-cj-product'

export default async function importCjProduct({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const [reference] = args

  if (!reference) {
    logger.error('Indica el pid o el SKU de producto de CJ: medusa exec ./src/scripts/import-cj-product.ts <pid o SKU>')
    return
  }

  const usdToEur = Number(process.env.CJ_USD_TO_EUR)
  const markup = Number(process.env.CJ_PRICE_MARKUP)
  if (!(usdToEur > 0) || !(markup > 0)) {
    logger.error('Configura en el .env CJ_USD_TO_EUR y CJ_PRICE_MARKUP con números mayores que 0 (por ejemplo 0.92 y 2.5)')
    return
  }

  // Los SKU de producto de CJ empiezan por "CJ"; un pid (UUID o número) nunca empieza así
  const isSku = /^CJ/i.test(reference)
  const { result } = await importCjProductWorkflow(container).run({
    input: {
      pid: isSku ? undefined : reference,
      product_sku: isSku ? reference : undefined,
      usd_to_eur: usdToEur,
      markup,
    },
  })

  for (const product of result) {
    logger.info(
      `Producto importado en borrador: ${product.title} (${product.id}), ${product.variants?.length ?? 0} variantes`
    )
  }
}
