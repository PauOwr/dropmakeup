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
import { reindexSearchIndexesWorkflow } from '@medusajs/medusa/core-flows'
import { importCjProductWorkflow } from '../workflows/import-cj-product'

// Espera máxima a que termine la actualización del índice de búsqueda
const SEARCH_SYNC_TIMEOUT_MS = 120_000

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

  // La tienda y el buscador leen del índice de búsqueda. Desde la consola los
  // eventos de producto no llegan a indexarse antes de que el proceso termine,
  // así que se reindexan aquí los productos importados y se espera al resultado.
  const startedAt = new Date()
  await reindexSearchIndexesWorkflow(container).run({
    input: { index: 'product', strategy: 'in_place', filters: { id: result.map((product) => product.id) } },
  })
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  for (let waited = 0; waited < SEARCH_SYNC_TIMEOUT_MS; waited += 2000) {
    const { rows } = await pg.raw(
      'select status, error from search_index_sync where created_at >= ? order by created_at desc',
      [startedAt]
    )
    const syncs = rows as { status: string; error: string | null }[]
    if (syncs.length && syncs.every((sync) => sync.status === 'done' || sync.status === 'failed')) {
      const failed = syncs.find((sync) => sync.status === 'failed')
      if (failed) {
        logger.error(`No se pudo actualizar el índice de búsqueda: ${failed.error}`)
      } else {
        logger.info('Índice de búsqueda actualizado')
      }
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  logger.warn('El índice de búsqueda no terminó de actualizarse: reindexa desde el admin')
}
