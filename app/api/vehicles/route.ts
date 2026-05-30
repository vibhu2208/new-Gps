import { NextResponse } from 'next/server';
import { getVehiclesFromDb } from '@/lib/db';

export async function GET() {
  try {
    const vehicles = await getVehiclesFromDb();
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
