/**
 * Store policy values kept in each region's `metadata`. The storefront renders
 * the shipping/returns pages and structured data from these keys, and merchants
 * can change them in Settings → Regions → Metadata.
 *
 * Plazos en días laborables. El plazo de entrega que ve el cliente es la suma
 * de preparación (handling) y tránsito (transit). Los `express_*` son los del
 * envío exprés; los demás, los del envío estándar.
 */
export type RegionStorePolicies = {
  return_window_days: number;
  free_returns: boolean;
  shipping_rate: number;
  handling_days_min: number;
  handling_days_max: number;
  transit_days_min: number;
  transit_days_max: number;
  express_shipping_rate: number;
  express_handling_days_min: number;
  express_handling_days_max: number;
  express_transit_days_min: number;
  express_transit_days_max: number;
};

// Plazos reales de CJdropshipping: estándar 7-12 días laborables y exprés 5-9.
// Devoluciones: 14 días naturales, el derecho de desistimiento legal en la UE.
export const DEFAULT_REGION_STORE_POLICIES: RegionStorePolicies = {
  return_window_days: 14,
  free_returns: false,
  shipping_rate: 10,
  handling_days_min: 1,
  handling_days_max: 2,
  transit_days_min: 6,
  transit_days_max: 10,
  express_shipping_rate: 10,
  express_handling_days_min: 1,
  express_handling_days_max: 2,
  express_transit_days_min: 4,
  express_transit_days_max: 7,
};
