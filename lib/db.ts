import { useLocalData } from '@/lib/data-source';

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
  return db.collection('vehicles').find({}).toArray();
}

export async function getVehicleByIdFromDb(id: string) {
  if (useLocalData()) {
    const { getLocalVehicleById } = await import('@/lib/local-data');
    return getLocalVehicleById(id);
  }

  const db = await getDb();
  return db.collection('vehicles').findOne({ id });
}

export async function getAlertsFromDb(vehicleId?: string | null, limit = 10) {
  if (useLocalData()) {
    const { getLocalAlerts } = await import('@/lib/local-data');
    return getLocalAlerts(vehicleId ?? undefined, limit);
  }

  const db = await getDb();
  const query = vehicleId ? { vehicleId } : {};
  return db
    .collection('alerts')
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

export async function getRouteFromDb(vehicleId: string, date: string) {
  if (useLocalData()) {
    const { getLocalRoute } = await import('@/lib/local-data');
    return getLocalRoute(vehicleId, date);
  }

  const db = await getDb();
  return db.collection('routes').findOne({ vehicleId, date });
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
