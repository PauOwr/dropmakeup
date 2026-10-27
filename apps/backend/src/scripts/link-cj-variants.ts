/**
 * Rellena metadata.cj_vid en variantes que ya existen en Medusa, buscando su SKU en CJdropshipping.
 * Para que encuentre la variante, el SKU en Medusa tiene que ser el SKU de variante de CJ.
 *
 *   pnpm --filter backend exec medusa exec ./src/scripts/link-cj-variants.ts [product_id ...]
 *
 * Sin argumentos revisa todas las variantes. Las que ya tienen cj_vid no se tocan.
 */
import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { linkCjVariantsWorkflow } from '../workflows/link-cj-variants'

export default async function linkCjVariants({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { result } = await linkCjVariantsWorkflow(container).run({
    input: { product_ids: args.length ? args : undefined },
  })

  logger.info(
    `Variantes vinculadas con CJ: ${result.updates.length}. ` +
      `Sin coincidencia en CJ: ${result.not_found.length}${result.not_found.length ? ` (${result.not_found.join(', ')})` : ''}. ` +
      `Sin SKU o ya vinculadas: ${result.skipped}`
  )
}
