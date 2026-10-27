import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Stripe solo se registra si hay clave: sin apiKey el proveedor impide arrancar el backend
const stripeModules = process.env.STRIPE_API_KEY
  ? [
      {
        resolve: '@medusajs/medusa/payment',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/payment-stripe',
              id: 'stripe',
              options: {
                apiKey: process.env.STRIPE_API_KEY,
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                // Cobro automático e inmediato: el pedido llega a order.placed ya cobrado
                capture: true,
              },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: './src/modules/cjdropshipping',
      options: {
        apiKey: process.env.CJ_API_KEY,
        // Secreto con el que CJ firma los webhooks. Si falta, se obtiene con la API key
        openId: process.env.CJ_OPEN_ID,
        // Sandbox salvo que se desactive explícitamente: así en desarrollo no se cobra del saldo real
        sandbox: process.env.CJ_SANDBOX !== 'false',
        defaultLogisticName: process.env.CJ_LOGISTIC_NAME,
        fromCountryCode: process.env.CJ_FROM_COUNTRY_CODE || 'CN',
      },
    },
    ...stripeModules,
  ],
})
