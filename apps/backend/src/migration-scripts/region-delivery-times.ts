import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  updateRegionsWorkflow,
  updateShippingOptionTypesWorkflow,
} from "@medusajs/medusa/core-flows";
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies";

// Sustituye los plazos y la política de devoluciones de la plantilla por los
// reales: CJdropshipping (estándar 7-12 y exprés 5-9 días laborables) y 14 días
// de devolución. Sobrescribe estas claves en todas las regiones.
const DELIVERY_DESCRIPTIONS: Record<string, string> = {
  standard: "Entrega en 7-12 días laborables, con seguimiento.",
  express: "Entrega en 5-9 días laborables, con seguimiento.",
};

export default async function regionDeliveryTimes({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "metadata"],
  });
  for (const region of regions) {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { metadata: { ...(region.metadata ?? {}), ...DEFAULT_REGION_STORE_POLICIES } },
      },
    });
  }

  const { data: types } = await query.graph({
    entity: "shipping_option_type",
    fields: ["id", "code"],
    filters: { code: Object.keys(DELIVERY_DESCRIPTIONS) },
  });
  for (const type of types) {
    await updateShippingOptionTypesWorkflow(container).run({
      input: { selector: { id: type.id }, update: { description: DELIVERY_DESCRIPTIONS[type.code] } },
    });
  }

  logger.info(
    `Updated delivery times and return policy in ${regions.length} regions and ${types.length} shipping option types`
  );
}
