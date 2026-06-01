import { NextResponse } from 'next/server';
import { getRouteFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; date: string }> }
) {
  try {
    const { vehicleId, date } = await params;
    const route = await getRouteFromDb(vehicleId, date);

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    const { _id, ...routeData } = route as { _id?: unknown } & Record<string, unknown>;
    return NextResponse.json(routeData);
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}
