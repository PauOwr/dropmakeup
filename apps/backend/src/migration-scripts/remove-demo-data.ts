import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  deleteProductCategoriesWorkflow,
  deleteProductOptionsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

// Datos de demostración que creaba initial-data-seed antes de quitarlos de la plantilla.
// Handle -> título: un producto real que reutilice el handle no se toca.
const DEMO_PRODUCTS: Record<string, string> = {
  "t-shirt": "Medusa T-Shirt",
  sweatshirt: "Medusa Sweatshirt",
  sweatpants: "Medusa Sweatpants",
  shorts: "Medusa Shorts",
};
const DEMO_CATEGORIES = ["Shirts", "Sweatshirts", "Pants", "Merch"];
const DEMO_OPTIONS = ["Size", "Color"];

export default async function removeDemoData({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: { handle: Object.keys(DEMO_PRODUCTS) },
  });
  const productIds = products
    .filter((product) => DEMO_PRODUCTS[product.handle] === product.title)
    .map((product) => product.id);
  if (productIds.length) {
    // También borra los artículos de inventario de sus variantes
    await deleteProductsWorkflow(container).run({ input: { ids: productIds } });
  }

  // Solo las categorías que se han quedado vacías
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "products.id", "category_children.id"],
    filters: { name: DEMO_CATEGORIES },
  });
  const categoryIds = categories
    .filter((category) => !category.products?.length && !category.category_children?.length)
    .map((category) => category.id);
  if (categoryIds.length) {
    await deleteProductCategoriesWorkflow(container).run({ input: categoryIds });
  }

  // Solo las opciones globales que ya no usa ningún producto
  const { data: options } = await query.graph({
    entity: "product_option",
    fields: ["id", "products.id"],
    filters: { title: DEMO_OPTIONS, is_exclusive: false },
  });
  const optionIds = options.filter((option) => !option.products?.length).map((option) => option.id);
  if (optionIds.length) {
    await deleteProductOptionsWorkflow(container).run({ input: { ids: optionIds } });
  }

  logger.info(
    `Removed demo data: ${productIds.length} products, ${categoryIds.length} categories, ${optionIds.length} product options`
  );
}
