import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  createTaxRatesWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// IVA general de cada país de la región «Europe» (porcentaje).
// Canarias, Ceuta y Melilla no llevan IVA (IGIC/IPSI): no están en la región.
const VAT_RATES: Record<string, number> = {
  es: 21,
  fr: 20,
  it: 22,
  de: 19,
  dk: 25,
  se: 25,
  gb: 20,
};

// La región que incluye este país y su divisa pasan a precios con IVA incluido
const REGION_COUNTRY_CODE = "es";
const TAX_INCLUSIVE_CURRENCY = "eur";

export default async function regionVat({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Tipo por defecto en cada país que todavía no tenga uno
  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code", "parent_id", "tax_rates.id", "tax_rates.is_default"],
    filters: { country_code: Object.keys(VAT_RATES) },
  });
  const newRates = taxRegions
    .filter((taxRegion) => !taxRegion.parent_id && !taxRegion.tax_rates?.some((rate) => rate?.is_default))
    .map((taxRegion) => {
      const countryCode = taxRegion.country_code.toLowerCase();
      return {
        tax_region_id: taxRegion.id,
        name: countryCode === "es" ? "IVA general" : "VAT standard rate",
        code: `VAT-${countryCode.toUpperCase()}`,
        rate: VAT_RATES[countryCode],
        is_default: true,
      };
    });
  if (newRates.length) {
    await createTaxRatesWorkflow(container).run({ input: newRates });
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { countries: { iso_2: REGION_COUNTRY_CODE } },
  });
  const region = regions[0];
  if (region) {
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { is_tax_inclusive: true } },
    });
  }

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  });
  const store = stores[0];
  const currencies = (store?.supported_currencies ?? []).filter(
    (currency): currency is NonNullable<typeof currency> => !!currency
  );
  if (store && currencies.length) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: currencies.map((currency) => ({
            currency_code: currency.currency_code,
            is_default: currency.is_default,
            is_tax_inclusive: currency.currency_code === TAX_INCLUSIVE_CURRENCY,
          })),
        },
      },
    });
  }

  logger.info(
    `VAT configured: ${newRates.length} default tax rates, tax-inclusive prices for region "${region?.name ?? "-"}" and ${TAX_INCLUSIVE_CURRENCY}`
  );
}
