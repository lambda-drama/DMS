/**
 * Vehicle Service Package lookups for job card autofill.
 */
import { apiRequest } from './apiClient';
import type {
  ServicePackageForVehicleResponse,
  ServicePackageLinesResponse,
} from '@/types/dms';

const API = 'dms.api.service_packages';

export async function fetchServicePackagesForVin(
  vin: string,
  search?: string
): Promise<ServicePackageForVehicleResponse> {
  return apiRequest<ServicePackageForVehicleResponse>(
    `/api/method/${API}.get_service_packages_for_vehicle`,
    {
      method: 'POST',
      body: JSON.stringify({ vin, search: search || null }),
    }
  );
}

export async function fetchServicePackageLines(
  packageName: string
): Promise<ServicePackageLinesResponse> {
  return apiRequest<ServicePackageLinesResponse>(
    `/api/method/${API}.get_service_package_lines`,
    {
      method: 'POST',
      body: JSON.stringify({ package_name: packageName }),
    }
  );
}
