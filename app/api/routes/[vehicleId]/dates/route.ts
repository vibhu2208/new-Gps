import { NextResponse } from 'next/server';
import { getRouteDatesFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const dates = await getRouteDatesFromDb(vehicleId);
    return NextResponse.json(dates);
  } catch (error) {
    console.error('Error fetching dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dates' },
      { status: 500 }
    );
  }
}
