import { Vehicle, RouteData, Alert } from '@/types';
import { formatExportLocation } from '@/lib/site';

export type FetchResult<T> = { data: T; error?: string };

async function apiFetch<T>(url: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const hint = typeof body.hint === 'string' ? body.hint : undefined;
      const message = typeof body.error === 'string' ? body.error : response.statusText;
      return { data: [] as T, error: hint || message || `Request failed (${response.status})` };
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`API error ${url}:`, error);
    return {
      data: [] as T,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data } = await apiFetch<Vehicle[]>('/api/vehicles');
  return Array.isArray(data) ? data : [];
};

export const getVehiclesWithStatus = async (): Promise<FetchResult<Vehicle[]>> => {
  const result = await apiFetch<Vehicle[]>('/api/vehicles');
  return {
    data: Array.isArray(result.data) ? result.data : [],
    error: result.error,
  };
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  try {
    const response = await fetch(`/api/vehicles/${id}`, { cache: 'no-store' });
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return undefined;
  }
};

export const getRouteData = async (
  vehicleId: string, 
  date: string,
  options: { useRawCoordinates?: boolean } = {}
): Promise<RouteData | null> => {
  try {
    const response = await fetch(`/api/routes/${vehicleId}/${date}`, { cache: 'no-store' });
    if (!response.ok) return null;
    
    const routeData = await response.json();
    
    // If useRawCoordinates is true and raw coordinates exist, swap them
    if (options.useRawCoordinates && routeData.points) {
      routeData.points = routeData.points.map((point: any) => ({
        ...point,
        lat: point.raw_lat ?? point.lat,
        lng: point.raw_lng ?? point.lng,
      }));
    }
    
    return routeData;
  } catch (error) {
    console.error('Error fetching route data:', error);
    return null;
  }
};

export const getAvailableDates = async (vehicleId: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/routes/${vehicleId}/dates`, { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await fetch('/api/alerts', { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const getAlertsByVehicle = async (vehicleId: string): Promise<Alert[]> => {
  try {
    const response = await fetch(`/api/alerts?vehicleId=${vehicleId}`, { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle alerts:', error);
    return [];
  }
};

export const getRecentAlerts = async (limit: number = 10): Promise<Alert[]> => {
  try {
    const response = await fetch(`/api/alerts?limit=${limit}`, { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return [];
  }
};

export const getAllVehicleData = async (vehicleId: string): Promise<any[]> => {
  try {
    // Get all dates for this vehicle
    const dates = await getAvailableDates(vehicleId);
    if (dates.length === 0) return [];
    
    const vehicle = await getVehicleById(vehicleId);
    const allDataPoints: any[] = [];
    
    // Fetch route data for each date
    for (const date of dates) {
      const routeData = await getRouteData(vehicleId, date);
      if (routeData && routeData.points) {
        routeData.points.forEach((point: any) => {
          allDataPoints.push({
            Vehicle: vehicle?.name || vehicleId,
            PlateNumber: vehicle?.plateNumber || vehicleId,
            Date: date,
            Timestamp: new Date(point.timestamp).toLocaleString(),
            Latitude: point.lat,
            Longitude: point.lng,
            Location: formatExportLocation(point.location, vehicle?.city),
            Status: point.status || 'Unknown'
          });
        });
      }
    }
    
    // Sort by timestamp
    allDataPoints.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
    
    return allDataPoints;
  } catch (error) {
    console.error('Error fetching all vehicle data:', error);
    return [];
  }
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Wrap all values in quotes to ensure proper Excel formatting
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
