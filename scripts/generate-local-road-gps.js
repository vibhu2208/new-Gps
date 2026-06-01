/**
 * Generate GPS data for a vehicle on open ground (no roads).
 * Moves slowly back and forth in a straight line within RADIUS_METERS of your
 * center coordinates. Runs 24/7 (one GPS point per minute).
 *
 * Usage:
 *   node scripts/generate-local-road-gps.js --vehicle-index 1
 *   node scripts/generate-local-road-gps.js --lat 28.478120 --lng 77.016554
 */

const fs = require('fs');
const path = require('path');

const FLEET_CONFIG_PATH = path.join(__dirname, '../data/local-fleet-config.json');

const CONFIG = {
  FLEET_CONFIG_PATH,
  CENTER: { lat: 28.402999, lng: 77.172291 },
  RADIUS_METERS: 200,
  VEHICLE: 'VEHICLE-01',
  WARD: '10',
  LOCATION: 'Site 1',
  START_DATE: new Date('2026-03-08'),
  END_DATE: new Date('2026-05-31'),
  POINTS_PER_DAY: 24 * 60,
  VEHICLE_INDEX: null,
  OUTPUT_CSV: path.join(__dirname, '../data/local-road/VEHICLE-01.csv'),
  BREAKS: [
    { startHour: 8, startMinute: 0, durationMinutes: 30 },
    { startHour: 20, startMinute: 0, durationMinutes: 30 },
  ],
};

function loadFleetConfig() {
  if (!fs.existsSync(CONFIG.FLEET_CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG.FLEET_CONFIG_PATH, 'utf-8'));
}

function applyFleetVehicle(fleet, vehicleIndex) {
  const vehicle = fleet.vehicles.find((v) => v.index === vehicleIndex);
  if (!vehicle) throw new Error(`Vehicle index ${vehicleIndex} not found in local-fleet-config.json`);
  if (!vehicle.center?.lat || !vehicle.center?.lng) {
    throw new Error(`Vehicle ${vehicleIndex} (${vehicle.id}) has no coordinates yet`);
  }

  CONFIG.VEHICLE_INDEX = vehicleIndex;
  CONFIG.VEHICLE = vehicle.id;
  CONFIG.WARD = vehicle.ward || '10';
  CONFIG.LOCATION = vehicle.location || `Site ${vehicleIndex}`;
  CONFIG.CENTER = { lat: vehicle.center.lat, lng: vehicle.center.lng };
  CONFIG.OUTPUT_CSV = path.join(__dirname, `../data/local-road/${vehicle.id}.csv`);

  if (fleet.startDate) CONFIG.START_DATE = new Date(fleet.startDate);
  if (fleet.endDate) CONFIG.END_DATE = new Date(fleet.endDate);
  if (fleet.radiusMeters) CONFIG.RADIUS_METERS = fleet.radiusMeters;
  if (fleet.pointsPerDay) CONFIG.POINTS_PER_DAY = fleet.pointsPerDay;
  if (fleet.breaks?.length) CONFIG.BREAKS = fleet.breaks;
}

function minuteOfDay(hour, minute) {
  return hour * 60 + minute;
}

function getBreakWindow(breaks) {
  return breaks.map((b) => ({
    start: b.startHour * 60 + (b.startMinute || 0),
    end: b.startHour * 60 + (b.startMinute || 0) + b.durationMinutes,
  }));
}

function getBreakAnchorIndex(breakStartMinute) {
  return Math.max(0, breakStartMinute - 1);
}

function resolvePhaseAndPosition(i, pointTime, allWorkPoints, center, breakWindows) {
  const mins = minuteOfDay(pointTime.getHours(), pointTime.getMinutes());
  const workPt = allWorkPoints[i] ?? center;

  for (const window of breakWindows) {
    if (mins >= window.start && mins < window.end) {
      const anchor = allWorkPoints[getBreakAnchorIndex(window.start)] ?? workPt;
      return { phase: 'BREAK', lat: anchor.lat, lng: anchor.lng };
    }
  }

  return { phase: 'WORKING', lat: workPt.lat, lng: workPt.lng };
}

function parseArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lat' && args[i + 1]) CONFIG.CENTER.lat = parseFloat(args[++i]);
    if (args[i] === '--lng' && args[i + 1]) CONFIG.CENTER.lng = parseFloat(args[++i]);
    if (args[i] === '--radius' && args[i + 1]) CONFIG.RADIUS_METERS = parseFloat(args[++i]);
    if (args[i] === '--vehicle' && args[i + 1]) CONFIG.VEHICLE = args[++i];
    if (args[i] === '--location' && args[i + 1]) CONFIG.LOCATION = args[++i];
    if (args[i] === '--ward' && args[i + 1]) CONFIG.WARD = args[++i];
    if (args[i] === '--output' && args[i + 1]) CONFIG.OUTPUT_CSV = path.resolve(args[++i]);
    if (args[i] === '--start-date' && args[i + 1]) CONFIG.START_DATE = new Date(args[++i]);
    if (args[i] === '--end-date' && args[i + 1]) CONFIG.END_DATE = new Date(args[++i]);
    if (args[i] === '--vehicle-index' && args[i + 1]) CONFIG.VEHICLE_INDEX = parseInt(args[++i], 10);
  }
}

function destinationFromCenter(center, bearingDeg, distanceMeters) {
  const R = 6371000;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;
  const d = distanceMeters / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createDayRandom(center, dayOffset) {
  let seed =
    dayOffset * 7919 +
    Math.floor(center.lat * 1e6) +
    Math.floor(center.lng * 1e6) * 97;
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function bearingBetween(from, to) {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function metersToLatDegrees(meters) {
  return meters / 111000;
}

function metersToLngDegrees(meters, atLat) {
  return meters / (111000 * Math.cos((atLat * Math.PI) / 180));
}

function randomPointInWorkArea(center, halfWidthM, halfHeightM, rand) {
  const latSpan = metersToLatDegrees(halfHeightM);
  const lngSpan = metersToLngDegrees(halfWidthM, center.lat);
  return {
    lat: center.lat + (rand() - 0.5) * 2 * latSpan,
    lng: center.lng + (rand() - 0.5) * 2 * lngSpan,
  };
}

function clampToWorkArea(lat, lng, center, halfWidthM, halfHeightM) {
  const latSpan = metersToLatDegrees(halfHeightM);
  const lngSpan = metersToLngDegrees(halfWidthM, center.lat);
  return {
    lat: Math.max(center.lat - latSpan, Math.min(center.lat + latSpan, lat)),
    lng: Math.max(center.lng - lngSpan, Math.min(center.lng + lngSpan, lng)),
  };
}

/**
 * Irregular random movement: hops between random spots in a small work area.
 * No circle, grid, or straight-line pattern — different every day.
 */
function generateLocalWorkingPoints(center, radiusMeters, numPoints, dayOffset = 0) {
  const rand = createDayRandom(center, dayOffset);
  const halfWidth = radiusMeters * 0.38;
  const halfHeight = radiusMeters * (0.28 + (dayOffset % 7) * 0.025);
  const minStep = 0.7;
  const maxStep = 1.8;
  const arriveDist = 2.0;

  let lat = center.lat;
  let lng = center.lng;
  let target = randomPointInWorkArea(center, halfWidth, halfHeight, rand);
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    if (haversineDistance(lat, lng, target.lat, target.lng) < arriveDist) {
      target = randomPointInWorkArea(center, halfWidth, halfHeight, rand);
    }

    let heading = bearingBetween({ lat, lng }, target);
    heading += (rand() - 0.5) * 42;
    const step = minStep + rand() * (maxStep - minStep);

    const next = destinationFromCenter({ lat, lng }, heading, step);
    lat = next.lat;
    lng = next.lng;

    ({ lat, lng } = clampToWorkArea(lat, lng, center, halfWidth, halfHeight));

    lat += (rand() - 0.5) * (0.2 / 111000);
    lng += (rand() - 0.5) * metersToLngDegrees(0.2, lat);

    points.push({ lat, lng });
  }

  return points;
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function generateDayData(date, dayOffset = 0) {
  const rows = [];
  const center = CONFIG.CENTER;
  const pointsPerDay = CONFIG.POINTS_PER_DAY;
  const breakWindows = getBreakWindow(CONFIG.BREAKS);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const allWorkPoints = generateLocalWorkingPoints(
    center,
    CONFIG.RADIUS_METERS,
    pointsPerDay,
    dayOffset
  );

  for (let i = 0; i < pointsPerDay; i++) {
    const pointTime = new Date(dayStart);
    pointTime.setMinutes(pointTime.getMinutes() + i);
    const { phase, lat, lng } = resolvePhaseAndPosition(
      i,
      pointTime,
      allWorkPoints,
      center,
      breakWindows
    );

    rows.push({
      timestamp: formatTimestamp(pointTime),
      vehicle: CONFIG.VEHICLE,
      ward: CONFIG.WARD,
      phase,
      location_name: CONFIG.LOCATION,
      latitude: lat,
      longitude: lng,
    });
  }

  return rows;
}

function writeCSV(rows, outputPath) {
  const header = 'timestamp,vehicle,ward,phase,location_name,latitude,longitude\n';
  const body = rows
    .map(
      (row) =>
        `${row.timestamp},${row.vehicle},${row.ward},${row.phase},${row.location_name},` +
        `${row.latitude.toFixed(6)},${row.longitude.toFixed(6)}`
    )
    .join('\n');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, header + body, 'utf8');
  console.log(`Saved ${rows.length} points → ${outputPath}`);
}

function main() {
  parseArgs();

  const fleet = loadFleetConfig();
  const vehicleIndex = CONFIG.VEHICLE_INDEX ?? 1;
  if (fleet) {
    applyFleetVehicle(fleet, vehicleIndex);
  }

  console.log('Generating open-ground GPS data');
  console.log(`  Vehicle: ${CONFIG.VEHICLE} (index ${vehicleIndex})`);
  console.log(`  Center:  ${CONFIG.CENTER.lat}, ${CONFIG.CENTER.lng}`);
  console.log(`  Radius:  ${CONFIG.RADIUS_METERS} m (irregular random walk, small area)`);
  console.log(`  Dates:   ${CONFIG.START_DATE.toISOString().split('T')[0]} → ${CONFIG.END_DATE.toISOString().split('T')[0]}`);
  const breakDesc = CONFIG.BREAKS.map(
    (b) => `${String(b.startHour).padStart(2, '0')}:${String(b.startMinute || 0).padStart(2, '0')} (${b.durationMinutes} min)`
  ).join(', ');
  console.log(`  Schedule: ${CONFIG.POINTS_PER_DAY} points/day, breaks at ${breakDesc}`);

  const allRows = [];
  let dayCount = 0;
  const current = new Date(CONFIG.START_DATE);
  const end = new Date(CONFIG.END_DATE);

  while (current <= end) {
    dayCount++;
    const dateLabel = current.toISOString().split('T')[0];
    console.log(`  Day ${dayCount}: ${dateLabel}`);
    allRows.push(...generateDayData(new Date(current), dayCount - 1));
    current.setDate(current.getDate() + 1);
  }

  writeCSV(allRows, CONFIG.OUTPUT_CSV);
  console.log(`\nNext: import into MongoDB with:`);
  console.log(`  node scripts/convert-local-road-to-routes.js ${CONFIG.VEHICLE}`);
}

module.exports = { CONFIG, loadFleetConfig, applyFleetVehicle, generateDayData, writeCSV };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
