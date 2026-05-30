import { connectToDatabase } from '@/lib/mongodb';
import {
  useLocalData,
  getLocalVehicles,
  getLocalVehicleById,
  getLocalAlerts,
  getLocalRoute,
  getLocalRouteDates,
} from '@/lib/local-data';

export { useLocalData };

export async function getVehiclesFromDb() {
  if (useLocalData()) return getLocalVehicles();

  const db = await connectToDatabase();
  return db.collection('vehicles').find({}).toArray();
}

export async function getVehicleByIdFromDb(id: string) {
  if (useLocalData()) return getLocalVehicleById(id);

  const db = await connectToDatabase();
  return db.collection('vehicles').findOne({ id });
}

export async function getAlertsFromDb(vehicleId?: string | null, limit = 10) {
  if (useLocalData()) return getLocalAlerts(vehicleId ?? undefined, limit);

  const db = await connectToDatabase();
  const query = vehicleId ? { vehicleId } : {};
  return db
    .collection('alerts')
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

export async function getRouteFromDb(vehicleId: string, date: string) {
  if (useLocalData()) return getLocalRoute(vehicleId, date);

  const db = await connectToDatabase();
  return db.collection('routes').findOne({ vehicleId, date });
}

export async function getRouteDatesFromDb(vehicleId: string): Promise<string[]> {
  if (useLocalData()) return getLocalRouteDates(vehicleId);

  const db = await connectToDatabase();
  const routes = await db
    .collection('routes')
    .find({ vehicleId })
    .project({ date: 1, _id: 0 })
    .toArray();
  return routes.map((r) => r.date as string).sort().reverse();
}
