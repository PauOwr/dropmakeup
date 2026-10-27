import { Metadata } from "next"

import Community from "@modules/home/components/community"
import Editorial from "@modules/home/components/editorial"
import Hero from "@modules/home/components/hero"
import ProductShowcase from "@modules/home/components/product-showcase"
import SplitBanners from "@modules/home/components/split-banners"
import { getHomeSectionProducts } from "@modules/home/data"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"

import { BRAND, HOME } from "@/lib/brand"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: `${STORE_NAME} | Maquillaje en tonos nude, rosa y dorado`,
    description: BRAND.description,
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `es-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const [[lipsProducts, essentialsProducts, faceProducts], origin, regions] =
    await Promise.all([
      getHomeSectionProducts(region.id, [
        { categoryHandle: HOME.lips.categoryHandle, limit: 4 },
        { categoryHandle: HOME.essentials.categoryHandle, limit: 3 },
        { categoryHandle: HOME.face.categoryHandle, limit: 4 },
      ]),
      getSiteOrigin(),
      listRegions(),
    ])

  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero />
      <ProductShowcase
        eyebrow={HOME.lips.eyebrow}
        title={HOME.lips.title}
        products={lipsProducts}
        region={region}
        feature={{ media: HOME.lips.media, tone: "blush" }}
      />
      <ProductShowcase
        eyebrow={HOME.essentials.eyebrow}
        title={HOME.essentials.title}
        products={essentialsProducts}
        region={region}
        columns={3}
      />
      <SplitBanners />
      <ProductShowcase
        eyebrow={HOME.face.eyebrow}
        title={HOME.face.title}
        products={faceProducts}
        region={region}
        columns={4}
      />
      <Editorial />
      <Community />
    </>
  )
}
