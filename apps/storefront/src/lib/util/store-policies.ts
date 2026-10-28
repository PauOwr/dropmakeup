import { HttpTypes } from "@medusajs/types"

type DayRange = { min: number; max: number }

export type ShippingPolicy = {
  shippingRate: number
  handlingDays: DayRange
  transitDays: DayRange
}

// Los plazos de envío estándar están en las claves de siempre; los del envío
// exprés, en las claves `express_*` (null si la región no las tiene)
export type StorePolicies = ShippingPolicy & {
  returnWindowDays: number
  freeReturns: boolean
  express: ShippingPolicy | null
}

const toNumber = (value: unknown) => {
  const number =
    typeof value === "string" && value.trim() === "" ? NaN : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

/**
 * Reads the store policy keys set on a region's metadata in Medusa Admin.
 * Returns null when any value is missing or invalid, so callers omit policy
 * data instead of publishing guesses.
 */
export const getRegionPolicies = (
  region: Pick<HttpTypes.StoreRegion, "metadata"> | null | undefined
): StorePolicies | null => {
  const metadata = region?.metadata ?? {}
  const values = {
    returnWindowDays: toNumber(metadata.return_window_days),
    shippingRate: toNumber(metadata.shipping_rate),
    handlingMin: toNumber(metadata.handling_days_min),
    handlingMax: toNumber(metadata.handling_days_max),
    transitMin: toNumber(metadata.transit_days_min),
    transitMax: toNumber(metadata.transit_days_max),
  }
  if (Object.values(values).some((value) => value === null)) {
    return null
  }

  const express = {
    shippingRate: toNumber(metadata.express_shipping_rate),
    handlingMin: toNumber(metadata.express_handling_days_min),
    handlingMax: toNumber(metadata.express_handling_days_max),
    transitMin: toNumber(metadata.express_transit_days_min),
    transitMax: toNumber(metadata.express_transit_days_max),
  }
  const hasExpress = Object.values(express).every((value) => value !== null)

  return {
    returnWindowDays: values.returnWindowDays!,
    freeReturns:
      metadata.free_returns === true || metadata.free_returns === "true",
    shippingRate: values.shippingRate!,
    handlingDays: { min: values.handlingMin!, max: values.handlingMax! },
    transitDays: { min: values.transitMin!, max: values.transitMax! },
    express: hasExpress
      ? {
          shippingRate: express.shippingRate!,
          handlingDays: { min: express.handlingMin!, max: express.handlingMax! },
          transitDays: { min: express.transitMin!, max: express.transitMax! },
        }
      : null,
  }
}

/** Plazo total de entrega que ve el cliente: preparación + tránsito. */
export const deliveryDays = (policy: ShippingPolicy): DayRange => ({
  min: policy.handlingDays.min + policy.transitDays.min,
  max: policy.handlingDays.max + policy.transitDays.max,
})

const businessDays = (range: { min: number; max: number }) => ({
  "@type": "QuantitativeValue",
  minValue: range.min,
  maxValue: range.max,
  unitCode: "DAY",
})

export const buildShippingDetails = (
  policies: StorePolicies,
  countryCode: string,
  currencyCode: string
) => ({
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: policies.shippingRate,
    currency: currencyCode.toUpperCase(),
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: countryCode.toUpperCase(),
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: businessDays(policies.handlingDays),
    transitTime: businessDays(policies.transitDays),
  },
})

export const buildReturnPolicy = (
  policies: StorePolicies,
  countryCode: string
) => ({
  "@type": "MerchantReturnPolicy",
  applicableCountry: countryCode.toUpperCase(),
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: policies.returnWindowDays,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: policies.freeReturns
    ? "https://schema.org/FreeReturn"
    : "https://schema.org/ReturnFeesCustomerResponsibility",
})

export const buildRegionsReturnPolicies = (regions: HttpTypes.StoreRegion[]) =>
  regions.flatMap((region) => {
    const policies = getRegionPolicies(region)
    if (!policies) {
      return []
    }
    return (region.countries ?? [])
      .filter((country) => country.iso_2)
      .map((country) => buildReturnPolicy(policies, country.iso_2!))
  })

export const formatDayRange = ({ min, max }: DayRange) =>
  min === max ? `${min}` : `${min}-${max}`
