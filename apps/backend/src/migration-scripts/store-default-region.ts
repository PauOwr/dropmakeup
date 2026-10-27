import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows";

// La región que incluye este país pasa a ser la región por defecto de la tienda
const DEFAULT_COUNTRY_CODE = "es";

export default async function storeDefaultRegion({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name", "default_region_id"],
  });
  const store = stores[0];
  if (!store || store.default_region_id) {
    return;
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { countries: { iso_2: DEFAULT_COUNTRY_CODE } },
  });
  const region = regions[0];
  if (!region) {
    logger.warn(`No region includes country "${DEFAULT_COUNTRY_CODE}", store default region not set`);
    return;
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_region_id: region.id },
    },
  });
  logger.info(`Set region "${region.name}" as the default region of store "${store.name}"`);
}
