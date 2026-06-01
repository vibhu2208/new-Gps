import { useLocalData } from '@/lib/data-source';
import { serializeDoc, serializeDocs } from '@/lib/mongo-serialize';

export { useLocalData };

async function getDb() {
  const { connectToDatabase } = await import('@/lib/mongodb');
  return connectToDatabase();
}

export async function getVehiclesFromDb() {
  if (useLocalData()) {
    const { getLocalVehicles } = await import('@/lib/local-data');
    return getLocalVehicles();
  }

  const db = await getDb();
  const vehicles = await db.collection('vehicles').find({}).toArray();
  return serializeDocs(vehicles);
}

export async function getVehicleByIdFromDb(id: string) {
  if (useLocalData()) {
    const { getLocalVehicleById } = await import('@/lib/local-data');
    return getLocalVehicleById(id);
  }

  const db = await getDb();
  const vehicle = await db.collection('vehicles').findOne({ id });
  return serializeDoc(vehicle);
}

export async function getAlertsFromDb(vehicleId?: string | null, limit = 10) {
  if (useLocalData()) {
    const { getLocalAlerts } = await import('@/lib/local-data');
    return getLocalAlerts(vehicleId ?? undefined, limit);
  }

  const db = await getDb();
  const query = vehicleId ? { vehicleId } : {};
  const alerts = await db
    .collection('alerts')
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return serializeDocs(alerts);
}

export async function getRouteFromDb(vehicleId: string, date: string) {
  if (useLocalData()) {
    const { getLocalRoute } = await import('@/lib/local-data');
    return getLocalRoute(vehicleId, date);
  }

  const db = await getDb();
  const route = await db.collection('routes').findOne({ vehicleId, date });
  return serializeDoc(route);
}

export async function getRouteDatesFromDb(vehicleId: string): Promise<string[]> {
  if (useLocalData()) {
    const { getLocalRouteDates } = await import('@/lib/local-data');
    return getLocalRouteDates(vehicleId);
  }

  const db = await getDb();
  const routes = await db
    .collection('routes')
    .find({ vehicleId })
    .project({ date: 1, _id: 0 })
    .toArray();
  return routes.map((r) => r.date as string).sort().reverse();
}

/** Quick counts for /api/health */
export async function getDbStats() {
  if (useLocalData()) {
    const { getLocalVehicles } = await import('@/lib/local-data');
    const vehicles = await getLocalVehicles();
    return { mode: 'local' as const, vehicles: vehicles.length, routes: null };
  }

  const db = await getDb();
  const [vehicles, routes] = await Promise.all([
    db.collection('vehicles').countDocuments(),
    db.collection('routes').countDocuments(),
  ]);
  return { mode: 'mongodb' as const, vehicles, routes };
}
