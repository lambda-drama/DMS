import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Secondary listing line: model (license). License is omitted when blank. */
export function formatVehicleListingSecondary(
  model?: string | null,
  license?: string | null
) {
  const m = (model || '').trim()
  const plate = (license || '').trim()
  if (m && plate) return `${m} (${plate})`
  return m || plate
}

export function vehicleListingLines(opts: {
  vin?: string | null
  model?: string | null
  license?: string | null
}) {
  return {
    primary: (opts.vin || '').trim() || '—',
    secondary: formatVehicleListingSecondary(opts.model, opts.license),
  }
}
