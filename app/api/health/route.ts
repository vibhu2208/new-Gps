import { NextResponse } from 'next/server';
import { getDbStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUri = Boolean(process.env.MONGODB_URI);
  const useLocal = process.env.USE_LOCAL_DATA === 'true';

  try {
    const stats = await getDbStats();
    const ok =
      stats.mode === 'local'
        ? stats.vehicles > 0
        : stats.vehicles > 0 && (stats.routes ?? 0) > 0;

    return NextResponse.json({
      ok,
      useLocalData: useLocal,
      hasMongoUri: hasUri,
      ...stats,
      hint: ok
        ? undefined
        : useLocal
          ? 'Local mode: add data/vehicles.json and routes on the server.'
          : 'MongoDB empty or unreachable. Run: node scripts/push-fleet-to-mongodb.js and set MONGODB_URI on Vercel.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        useLocalData: useLocal,
        hasMongoUri: hasUri,
        error: message,
        hint:
          'Set MONGODB_URI and MONGODB_DB_NAME in Vercel → Settings → Environment Variables. Atlas → Network Access must allow 0.0.0.0/0.',
      },
      { status: 503 }
    );
  }
}
