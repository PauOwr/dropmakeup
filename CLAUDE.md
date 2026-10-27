# REGLAS Y ESTÁNDARES TÉCNICOS: PROYECTO DROPMAKEUP

Lee también `AGENTS.md`, que viene con la plantilla oficial de Medusa: describe la estructura del monorepo, sus comandos y los archivos que no se deben tocar. Si algo de `AGENTS.md` contradice este archivo, prevalece este archivo.

## 1. ARQUITECTURA Y RESTRICCIONES DE FRAMEWORK

- Backend: Medusa.js v2 (Node.js / TypeScript). PROHIBIDO utilizar sintaxis o patrones de Medusa v1 (TypeORM, v1 Services o v1 Plugins).
- Modelado de datos: Utilizar exclusivamente Medusa Data Model Language (DML) mediante `model` de `@medusajs/framework/utils`.
- Lógica transaccional: Toda mutación compleja o integración entre módulos DEBE ejecutarse mediante Workflows de Medusa (`@medusajs/framework/workflows-sdk`) aplicando el patrón Saga con pasos de compensación.
- Frontend: Next.js (App Router, Server Actions, Tailwind CSS, shadcn/ui y Motion) ubicado en `apps/storefront`.
  - Componentes de UI: shadcn/ui. Se añaden con `pnpm dlx shadcn@latest` ejecutado dentro de `apps/storefront` y quedan como código propio del proyecto.
  - Animaciones: Motion (paquete `motion`). Se importa desde `motion/react` en componentes cliente y desde `motion/react-client` en Server Components. No instalar `framer-motion`, que es el nombre antiguo de la misma librería.
- Pasarela de pagos: Módulo oficial de Stripe (`@medusajs/medusa/payment-stripe`).
- Logística y Proveedor: Módulo de fulfillment personalizado para la API REST v2.0/v3.0 de CJdropshipping.

## 2. CONVENCIONES DE CÓDIGO

- TypeScript estricto habilitado (`strict: true`). Prohibido el uso de `any`.
- Los importes monetarios siguen la convención de Medusa v2: se guardan en la unidad principal de la divisa (p. ej. `19.99` EUR), nunca en céntimos. Solo se pasan a céntimos al llamar a una API externa que lo pida (el módulo de Stripe ya lo hace internamente).
- Estructura de archivos backend:
  - Modelos DML: `src/modules/{modulo}/models/`
  - Servicios: `src/modules/{modulo}/service.ts`
  - Workflows: `src/workflows/`
  - Suscriptores de eventos: `src/subscribers/`
- Eventos de envío y seguimiento: los suscriptores deben usar los nombres oficiales que emiten los workflows de Medusa v2. Esta lista prevalece sobre cualquier skill: `medusa-subscribers` usa `fulfillment.created` y `fulfillment.canceled`, y `building-with-medusa` usa `order.shipment_created`; ninguno de esos tres es un evento de workflow de Medusa v2.
  - `order.fulfillment_created`: se crea un fulfillment para un pedido. Payload: `{ order_id, fulfillment_id, no_notification }`.
  - `order.fulfillment_canceled`: se cancela el fulfillment de un pedido. Payload: `{ order_id, fulfillment_id, no_notification }`.
  - `shipment.created`: se crea el envío de un pedido. Payload: `{ id, no_notification }` (`id` es el ID del fulfillment).
  - `delivery.created`: el fulfillment se marca como entregado. Payload: `{ id }` (`id` es el ID del fulfillment).

## 3. SEGURIDAD Y CIBERSEGURIDAD (OWASP)

- Validación estricta de todas las entradas públicas mediante esquemas de Zod.
- Conservar el Buffer crudo (`rawBody`) en la ruta de Webhooks de Stripe (`bodyParser: { preserveRawBody: true }`) para validar la firma HMAC sobre los bytes originales del payload.
- Validar el encabezado de firma `sign` con la clave `openId` de CJdropshipping en los webhooks de logística.
- Queda estrictamente prohibido exponer claves privadas o variables de entorno sensibles en variables cliente (`NEXT_PUBLIC_`).
- Registros de shadcn/ui: solo se usa el registro oficial (componentes sin prefijo, como `button`, o con el prefijo `@shadcn/`). Cualquier otro origen (otros registros con `@`, repositorios `owner/repo` o URLs) y cualquier registro nuevo en `components.json` requieren autorización expresa del usuario.

## 4. COMANDOS PRINCIPALES

- Servidor Backend: `pnpm --filter backend dev` (http://localhost:9000)
- Servidor Frontend: `pnpm --filter storefront dev` (http://localhost:8000)
- Migraciones de Base de Datos: `pnpm --filter backend exec medusa db:migrate`. No ejecutar nunca `npx medusa` fuera de `apps/backend`: en npm existe un paquete ajeno llamado `medusa` que npx descargaría y ejecutaría.
