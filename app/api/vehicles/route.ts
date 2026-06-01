import { NextResponse } from 'next/server';
import { getVehiclesFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vehicles = await getVehiclesFromDb();
    return NextResponse.json(vehicles);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vehicles',
        hint:
          process.env.USE_LOCAL_DATA === 'true'
            ? 'Local JSON mode: ensure data/vehicles.json is deployed.'
            : 'MongoDB mode: check MONGODB_URI, Atlas Network Access (0.0.0.0/0), and run scripts/migrate-to-mongodb.js.',
        message: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
