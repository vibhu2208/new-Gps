import { NextResponse } from 'next/server';
import { getAlertsFromDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const alerts = await getAlertsFromDb(vehicleId, limit);
    return NextResponse.json(alerts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        hint:
          process.env.USE_LOCAL_DATA === 'true'
            ? 'Local JSON mode: ensure data/alerts.json is deployed.'
            : 'MongoDB mode: check MONGODB_URI, Atlas Network Access (0.0.0.0/0), and run scripts/migrate-to-mongodb.js.',
        message: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
