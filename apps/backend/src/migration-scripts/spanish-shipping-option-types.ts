import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateShippingOptionTypesWorkflow } from "@medusajs/medusa/core-flows";

// Tipos de envío de la plantilla. Sus plazos («2-3 días», «24 horas») no son
// ciertos con CJ, así que la descripción no promete plazos.
const TYPES: Record<string, { label: string; description: string }> = {
  Standard: { label: "Estándar", description: "Envío a domicilio con seguimiento." },
  Express: { label: "Exprés", description: "Envío a domicilio más rápido, con seguimiento." },
};

export default async function spanishShippingOptionTypes({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: types } = await query.graph({
    entity: "shipping_option_type",
    fields: ["id", "label"],
    filters: { label: Object.keys(TYPES) },
  });

  for (const type of types) {
    await updateShippingOptionTypesWorkflow(container).run({
      input: { selector: { id: type.id }, update: TYPES[type.label] },
    });
  }

  logger.info(`Translated ${types.length} shipping option types to Spanish`);
}
