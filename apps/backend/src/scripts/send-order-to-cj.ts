/**
 * Envía a CJdropshipping un pedido de Medusa y lo paga con el saldo de CJ Wallet
 * (o simula el pago, mientras CJ_SANDBOX no sea false).
 *
 *   pnpm --filter backend exec medusa exec ./src/scripts/send-order-to-cj.ts <order_id> [logisticName]
 *
 * Sirve para probar la integración a mano mientras no haya un suscriptor que envíe los pedidos al recibirlos.
 */
import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { sendOrderToCjWorkflow } from '../workflows/send-order-to-cj'

export default async function sendOrderToCj({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const [orderId, logisticName] = args

  if (!orderId) {
    logger.error('Indica el id del pedido: medusa exec ./src/scripts/send-order-to-cj.ts <order_id> [logisticName]')
    return
  }

  const { result } = await sendOrderToCjWorkflow(container).run({
    input: { order_id: orderId, logistic_name: logisticName },
  })

  logger.info(
    `Pedido ${orderId} enviado a CJ${result.is_sandbox ? ' en modo sandbox' : ''}: ` +
      `pedido CJ ${result.cj_order_id ?? 'sin id'}, estado ${result.cj_order_status ?? 'desconocido'}, ` +
      `cobrado ${result.amount_paid_usd ?? '?'} USD`
  )
}
