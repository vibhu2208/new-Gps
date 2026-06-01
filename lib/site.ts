/** Official site name shown in UI and all exports */
export const SITE_DISPLAY_NAME =
  'Bandhwari Gurgaon Faridabad Combined Solid Waste Management Facility';

/** Use for CSV/Excel Location column — always the site name, never legacy point labels */
export function formatExportLocation(
  _pointLocation?: string | null,
  vehicleCity?: string | null
): string {
  return vehicleCity?.trim() || SITE_DISPLAY_NAME;
}
