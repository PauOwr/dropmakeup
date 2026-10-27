import "server-only"

import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

type HomeSectionQuery = {
  categoryHandle: string
  limit: number
}

/**
 * Productos de cada sección de la Home, en el mismo orden que `sections`.
 * Si la categoría de la sección existe en Medusa, se usan sus productos; si no,
 * las últimas novedades, repartidas para que no se repitan entre secciones.
 */
export async function getHomeSectionProducts(
  regionId: string,
  sections: HomeSectionQuery[]
): Promise<HttpTypes.StoreProduct[][]> {
  const categories = await listCategories({ fields: "id,handle" }).catch(
    () => []
  )
  const categoryIds = new Map(
    categories.map((category) => [category.handle, category.id])
  )

  const latest = await listProducts({
    regionId,
    queryParams: {
      limit: sections.reduce((total, section) => total + section.limit, 0),
      order: "-created_at",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

  let offset = 0
  return Promise.all(
    sections.map(async (section) => {
      const start = offset
      offset += section.limit
      const categoryId = categoryIds.get(section.categoryHandle)

      if (!categoryId) {
        return latest.slice(start, start + section.limit)
      }

      return listProducts({
        regionId,
        queryParams: { category_id: [categoryId], limit: section.limit },
      })
        .then(({ response }) => response.products)
        .catch(() => [])
    })
  )
}
