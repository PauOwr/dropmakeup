import { model } from "@medusajs/framework/utils"

// Envío de un pedido de Medusa a CJ. order_id es único: un pedido no se puede enviar (ni cobrar) dos veces
const CjOrder = model
  .define("cj_order", {
    id: model.id({ prefix: "cjord" }).primaryKey(),
    order_id: model.text().unique(),
    // pending: registrado y en envío; submitted: CJ lo aceptó y cobró del saldo;
    // shipped y delivered: según el seguimiento que envía CJ por webhook
    status: model.enum(["pending", "submitted", "shipped", "delivered"]).default("pending"),
    is_sandbox: model.boolean().default(true),
    cj_order_id: model.text().nullable(),
    cj_shipment_order_id: model.text().nullable(),
    cj_order_status: model.text().nullable(),
    // Importe cobrado del saldo de CJ Wallet, en USD (unidad principal, no céntimos)
    amount_paid_usd: model.bigNumber().nullable(),
    logistic_name: model.text().nullable(),
    tracking_number: model.text().nullable(),
    tracking_url: model.text().nullable(),
    // Estado de seguimiento de CJ: 0 sin datos, 1 salió del almacén ... 12 entregado
    tracking_status: model.number().nullable(),
    // Envío de Medusa creado a partir del seguimiento de CJ
    fulfillment_id: model.text().nullable(),
  })
  .indexes([{ on: ["cj_order_id"] }])

export default CjOrder
