import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

// Nombres en español de las opciones de envío que creaba la plantilla
// (sus tipos se traducen en spanish-shipping-option-types.ts)
const RENAMES: Record<string, string> = {
  "Standard Shipping": "Envío estándar",
  "Express Shipping": "Envío exprés",
};

export default async function spanishShippingOptions({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
    filters: { name: Object.keys(RENAMES) },
  });

  if (options.length) {
    await updateShippingOptionsWorkflow(container).run({
      input: options.map((option) => ({ id: option.id, name: RENAMES[option.name] })),
    });
  }

  logger.info(`Renamed ${options.length} shipping options to Spanish`);
}
