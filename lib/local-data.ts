import fs from 'fs';
import path from 'path';
import { RouteData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');
const localRoadDir = path.join(dataDir, 'local-road');
const routesJsonPath = path.join(process.cwd(), 'public/data/routes.json');

const routeCache = new Map<string, Record<string, RouteData>>();

function readJsonFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function istToUtc(istTimestamp: string): string {
  const [datePart, timePart] = istTimestamp.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  const istDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  istDate.setUTCHours(istDate.getUTCHours() - 5);
  istDate.setUTCMinutes(istDate.getUTCMinutes() - 30);
  return istDate.toISOString();
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateSpeed(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  timeDiffMinutes: number
): number {
  if (timeDiffMinutes === 0) return 0;
  return Math.round((calculateDistance(lat1, lng1, lat2, lng2) / timeDiffMinutes) * 60);
}

function parseCsvRoutes(csvFilePath: string): Record<string, RouteData> {
  const lines = fs.readFileSync(csvFilePath, 'utf-8').split('\n').filter((l) => l.trim());
  const routes: Record<string, RouteData> = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(',');
    if (parts.length < 7) continue;

    const [timestamp, , , phase, locationName, latStr, lngStr] = parts;
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const date = timestamp.split(' ')[0];

    if (!routes[date]) {
      routes[date] = {
        points: [],
        summary: { totalDistance: 0, drivingDuration: 0, idleDuration: 0, maxSpeed: 0 },
      };
    }

    routes[date].points.push({
      lat: latitude,
      lng: longitude,
      timestamp: istToUtc(timestamp),
      speed: 0,
      location: locationName,
      status: phase,
      phase,
      isStop: phase === 'BREAK' || phase === 'WORKING',
    });
  }

  for (const date of Object.keys(routes)) {
    const points = routes[date].points;
    let totalDistance = 0;
    let drivingDuration = 0;
    let idleDuration = 0;
    let maxSpeed = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff =
        (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000;
      const speed = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, timeDiff);
      curr.speed = speed;
      maxSpeed = Math.max(maxSpeed, speed);

      if (curr.phase === 'WORKING' && speed > 5) drivingDuration += timeDiff;
      else if (curr.phase === 'WORKING' || curr.phase === 'BREAK') idleDuration += timeDiff;
      else drivingDuration += timeDiff;
    }

    routes[date].summary = {
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      drivingDuration: Math.round(drivingDuration),
      idleDuration: Math.round(idleDuration),
      maxSpeed: Math.round(maxSpeed),
    };
  }

  return routes;
}

function loadVehicleRoutes(vehicleId: string): Record<string, RouteData> {
  const cached = routeCache.get(vehicleId);
  if (cached) return cached;

  if (fs.existsSync(routesJsonPath)) {
    try {
      const allRoutes = JSON.parse(fs.readFileSync(routesJsonPath, 'utf-8')) as Record<
        string,
        Record<string, RouteData>
      >;
      if (allRoutes[vehicleId]) {
        routeCache.set(vehicleId, allRoutes[vehicleId]);
        return allRoutes[vehicleId];
      }
    } catch {
      // fall through to CSV
    }
  }

  const csvPath = path.join(localRoadDir, `${vehicleId}.csv`);
  if (!fs.existsSync(csvPath)) {
    routeCache.set(vehicleId, {});
    return {};
  }

  const routes = parseCsvRoutes(csvPath);
  routeCache.set(vehicleId, routes);
  return routes;
}

/** When true, reads data/*.json and CSVs instead of MongoDB. Set on Vercel if DB is not migrated yet. */
export function useLocalData(): boolean {
  return process.env.USE_LOCAL_DATA === 'true';
}

export async function getLocalVehicles() {
  return readJsonFile('vehicles.json', []);
}

export async function getLocalVehicleById(id: string) {
  const vehicles = await getLocalVehicles();
  return vehicles.find((v: { id: string }) => v.id === id);
}

export async function getLocalAlerts(vehicleId?: string, limit = 10) {
  const alerts = readJsonFile<Array<{ vehicleId: string; timestamp: string }>>('alerts.json', []);
  const filtered = vehicleId ? alerts.filter((a) => a.vehicleId === vehicleId) : alerts;
  return filtered
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getLocalRoute(vehicleId: string, date: string) {
  const routes = loadVehicleRoutes(vehicleId);
  return routes[date] ?? null;
}

export async function getLocalRouteDates(vehicleId: string): Promise<string[]> {
  const routes = loadVehicleRoutes(vehicleId);
  return Object.keys(routes).sort().reverse();
}
