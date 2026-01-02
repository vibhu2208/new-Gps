import fs from 'fs';
import path from 'path';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  isStop?: boolean;
}

interface RouteSummary {
  totalDistance: number;
  drivingDuration: number;
  idleDuration: number;
  maxSpeed: number;
  avgSpeed: number;
  stops: number;
}

interface RouteData {
  points: RoutePoint[];
  summary: RouteSummary;
}

interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'overspeed' | 'geofence_entry' | 'geofence_exit' | 'long_idle' | 'maintenance';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
}

const indianCities: Record<string, Location[]> = {
  delhi: [
    { lat: 28.7041, lng: 77.1025, name: 'Connaught Place' },
    { lat: 28.6139, lng: 77.2090, name: 'India Gate' },
    { lat: 28.5244, lng: 77.1855, name: 'Saket' },
    { lat: 28.5355, lng: 77.3910, name: 'Noida Sector 18' },
    { lat: 28.4595, lng: 77.0266, name: 'Gurgaon Cyber City' },
    { lat: 28.6692, lng: 77.4538, name: 'Noida Sector 62' },
    { lat: 28.4089, lng: 77.3178, name: 'Greater Noida' },
    { lat: 28.7041, lng: 77.1025, name: 'Karol Bagh' },
  ],
  mumbai: [
    { lat: 19.0760, lng: 72.8777, name: 'Mumbai Central' },
    { lat: 19.0176, lng: 72.8561, name: 'Bandra' },
    { lat: 18.9220, lng: 72.8347, name: 'Andheri' },
    { lat: 19.1136, lng: 72.8697, name: 'Powai' },
    { lat: 19.2183, lng: 72.9781, name: 'Thane' },
  ],
  bangalore: [
    { lat: 12.9716, lng: 77.5946, name: 'MG Road' },
    { lat: 12.9352, lng: 77.6245, name: 'Koramangala' },
    { lat: 13.0358, lng: 77.5970, name: 'Indiranagar' },
    { lat: 12.8406, lng: 77.6602, name: 'Electronic City' },
    { lat: 13.0827, lng: 77.5877, name: 'Hebbal' },
  ],
  pune: [
    { lat: 18.5204, lng: 73.8567, name: 'Pune Station' },
    { lat: 18.5314, lng: 73.8446, name: 'Shivajinagar' },
    { lat: 18.5642, lng: 73.7769, name: 'Hinjewadi' },
    { lat: 18.4574, lng: 73.8567, name: 'Hadapsar' },
  ],
};

const vehicleNames = [
  'Swift Dzire', 'Honda City', 'Hyundai Creta', 'Maruti Ertiga', 'Toyota Innova',
  'Mahindra Scorpio', 'Tata Nexon', 'Kia Seltos', 'MG Hector', 'Hyundai Venue',
  'Maruti Baleno', 'Honda Amaze', 'Volkswagen Polo', 'Ford EcoSport', 'Renault Duster',
  'Nissan Magnite', 'Tata Harrier', 'Mahindra XUV700', 'Jeep Compass', 'Skoda Kushaq',
  'Toyota Fortuner', 'Hyundai i20', 'Maruti Vitara Brezza', 'Honda WR-V', 'Tata Altroz',
  'Kia Sonet', 'Renault Kiger', 'Nissan Kicks', 'MG Astor', 'Mahindra Thar'
];

const driverNames = [
  'Rajesh Kumar', 'Amit Sharma', 'Priya Singh', 'Vikram Patel', 'Sneha Reddy',
  'Arjun Verma', 'Pooja Gupta', 'Rahul Joshi', 'Neha Kapoor', 'Sanjay Mehta',
  'Kavita Desai', 'Rohan Nair', 'Anjali Iyer', 'Suresh Rao', 'Deepak Chopra',
  'Ritu Malhotra', 'Karan Singh', 'Meera Agarwal', 'Vishal Kumar', 'Simran Kaur',
  'Anil Pandey', 'Swati Jain', 'Nikhil Shah', 'Preeti Bansal', 'Gaurav Saxena',
  'Divya Menon', 'Manish Tiwari', 'Shruti Bhatt', 'Varun Khanna', 'Nisha Pillai'
];

const statuses: Array<'moving' | 'idle' | 'offline' | 'maintenance'> = ['moving', 'idle', 'offline', 'maintenance'];

function generateRegistrationNumber(): string {
  const states = ['DL', 'MH', 'KA', 'HR', 'UP', 'TN', 'GJ', 'RJ'];
  const state = states[Math.floor(Math.random() * states.length)];
  const district = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const series = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = String(Math.floor(Math.random() * 9000) + 1000);
  return `${state}-${district}-${series}-${number}`;
}

function interpolatePoints(start: Location, end: Location, segments: number): Location[] {
  const points: Location[] = [];
  for (let i = 0; i <= segments; i++) {
    const ratio = i / segments;
    points.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
      name: i === 0 ? start.name : i === segments ? end.name : 'En route'
    });
  }
  return points;
}

function generateRouteForDay(cityKey: string, date: Date): RouteData {
  const city = indianCities[cityKey];
  const startHour = 6 + Math.floor(Math.random() * 3);
  const numStops = 3 + Math.floor(Math.random() * 5);
  
  const points: RoutePoint[] = [];
  const stops: Location[] = [];
  
  for (let i = 0; i < numStops; i++) {
    stops.push(city[Math.floor(Math.random() * city.length)]);
  }
  
  let currentTime = new Date(date);
  currentTime.setHours(startHour, 0, 0, 0);
  
  let totalDistance = 0;
  let drivingDuration = 0;
  let idleDuration = 0;
  let maxSpeed = 0;
  let speedSum = 0;
  let speedCount = 0;
  
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    
    const distance = Math.sqrt(
      Math.pow((end.lat - start.lat) * 111, 2) + 
      Math.pow((end.lng - start.lng) * 111 * Math.cos(start.lat * Math.PI / 180), 2)
    );
    
    totalDistance += distance;
    
    const segmentPoints = 15 + Math.floor(Math.random() * 20);
    const interpolated = interpolatePoints(start, end, segmentPoints);
    
    for (let j = 0; j < interpolated.length; j++) {
      const point = interpolated[j];
      let speed = 0;
      
      if (j === 0 || j === interpolated.length - 1) {
        speed = 0;
      } else {
        const baseSpeed = 25 + Math.random() * 35;
        const variation = (Math.random() - 0.5) * 15;
        speed = Math.max(10, Math.min(80, baseSpeed + variation));
        
        if (Math.random() < 0.05) {
          speed = 80 + Math.random() * 25;
        }
      }
      
      maxSpeed = Math.max(maxSpeed, speed);
      if (speed > 0) {
        speedSum += speed;
        speedCount++;
      }
      
      points.push({
        lat: point.lat,
        lng: point.lng,
        timestamp: currentTime.toISOString(),
        speed: Math.round(speed),
        isStop: speed === 0 && j > 0 && j < interpolated.length - 1
      });
      
      const timeIncrement = speed > 0 ? (60000 * 2) : (60000 * 5);
      currentTime = new Date(currentTime.getTime() + timeIncrement);
      
      if (speed > 0) {
        drivingDuration += 2;
      } else if (j > 0 && j < interpolated.length - 1) {
        idleDuration += 5;
      }
    }
    
    if (i < stops.length - 2) {
      const idleTime = 10 + Math.floor(Math.random() * 20);
      idleDuration += idleTime;
      currentTime = new Date(currentTime.getTime() + idleTime * 60000);
    }
  }
  
  return {
    points,
    summary: {
      totalDistance: Math.round(totalDistance * 10) / 10,
      drivingDuration,
      idleDuration,
      maxSpeed: Math.round(maxSpeed),
      avgSpeed: speedCount > 0 ? Math.round(speedSum / speedCount) : 0,
      stops: numStops
    }
  };
}

function generateVehicles() {
  const vehicles = [];
  const usedPlates = new Set<string>();
  
  for (let i = 0; i < 30; i++) {
    let plateNumber;
    do {
      plateNumber = generateRegistrationNumber();
    } while (usedPlates.has(plateNumber));
    usedPlates.add(plateNumber);
    
    const statusWeights = [0.5, 0.3, 0.15, 0.05];
    const rand = Math.random();
    let status: typeof statuses[number];
    if (rand < statusWeights[0]) status = 'moving';
    else if (rand < statusWeights[0] + statusWeights[1]) status = 'idle';
    else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = 'offline';
    else status = 'maintenance';
    
    const now = new Date();
    const lastSeenOffset = status === 'offline' ? 
      Math.floor(Math.random() * 24 * 60 * 60 * 1000) : 
      Math.floor(Math.random() * 30 * 60 * 1000);
    
    vehicles.push({
      id: `v${i + 1}`,
      name: vehicleNames[i],
      plateNumber,
      status,
      lastSeen: new Date(now.getTime() - lastSeenOffset).toISOString(),
      driver: driverNames[i],
      model: `2022-2024 ${vehicleNames[i]}`,
      color: ['White', 'Silver', 'Black', 'Blue', 'Red', 'Grey'][Math.floor(Math.random() * 6)],
      city: Object.keys(indianCities)[i % Object.keys(indianCities).length]
    });
  }
  
  return vehicles;
}

function generateHistoryData(vehicles: any[]) {
  const historyDir = path.join(process.cwd(), 'public', 'data', 'history');
  
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  
  const endDate = new Date('2025-12-28');
  const startDate = new Date('2025-12-03');
  
  vehicles.forEach(vehicle => {
    const vehicleDir = path.join(historyDir, vehicle.id);
    if (!fs.existsSync(vehicleDir)) {
      fs.mkdirSync(vehicleDir, { recursive: true });
    }
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (Math.random() > 0.1) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const routeData = generateRouteForDay(vehicle.city, new Date(currentDate));
        
        fs.writeFileSync(
          path.join(vehicleDir, `${dateStr}.json`),
          JSON.stringify(routeData, null, 2)
        );
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
}

function generateAlerts(vehicles: any[]): Alert[] {
  const alerts: Alert[] = [];
  let alertId = 1;
  
  const endDate = new Date('2025-12-28');
  const startDate = new Date('2025-12-03');
  
  vehicles.forEach(vehicle => {
    const vehicleDir = path.join(process.cwd(), 'public', 'data', 'history', vehicle.id);
    
    if (!fs.existsSync(vehicleDir)) return;
    
    const files = fs.readdirSync(vehicleDir);
    
    files.forEach(file => {
      const filePath = path.join(vehicleDir, file);
      const routeData: RouteData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      routeData.points.forEach((point, idx) => {
        if (point.speed > 80 && Math.random() < 0.3) {
          alerts.push({
            id: `a${alertId++}`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            type: 'overspeed',
            message: `Vehicle exceeded speed limit (${point.speed} km/h in 60 km/h zone)`,
            timestamp: point.timestamp,
            severity: point.speed > 100 ? 'high' : 'medium',
            location: `Near ${vehicle.city}`
          });
        }
        
        if (point.isStop && Math.random() < 0.1) {
          alerts.push({
            id: `a${alertId++}`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            type: 'long_idle',
            message: `Vehicle idle for more than 15 minutes`,
            timestamp: point.timestamp,
            severity: 'low',
            location: `${vehicle.city} area`
          });
        }
      });
      
      if (Math.random() < 0.15) {
        const randomPoint = routeData.points[Math.floor(Math.random() * routeData.points.length)];
        alerts.push({
          id: `a${alertId++}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          type: Math.random() < 0.5 ? 'geofence_entry' : 'geofence_exit',
          message: Math.random() < 0.5 ? 'Vehicle entered restricted zone' : 'Vehicle exited authorized zone',
          timestamp: randomPoint.timestamp,
          severity: 'medium',
          location: `${vehicle.city} zone`
        });
      }
    });
  });
  
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return alerts.slice(0, 200);
}

console.log('Generating vehicles...');
const vehicles = generateVehicles();

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'vehicles.json'),
  JSON.stringify(vehicles, null, 2)
);
console.log(`✓ Generated ${vehicles.length} vehicles`);

console.log('Generating history data (this may take a moment)...');
generateHistoryData(vehicles);
console.log('✓ Generated 25 days of history for all vehicles');

console.log('Generating alerts...');
const alerts = generateAlerts(vehicles);
fs.writeFileSync(
  path.join(dataDir, 'alerts.json'),
  JSON.stringify(alerts, null, 2)
);
console.log(`✓ Generated ${alerts.length} alerts`);

console.log('\n✅ Data generation complete!');
