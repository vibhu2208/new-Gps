# GPS Tracking Dashboard - Enhanced Edition

A production-ready GPS tracking and fleet management dashboard built with Next.js, TypeScript, Tailwind CSS, and Mapbox. Features India-focused mapping, realistic GPS data for 30 vehicles across 25 days, comprehensive settings, and advanced reporting capabilities.

## Features

### 🔐 Authentication
- Email and password sign-in
- Form validation
- Local storage session management
- Forgot password UI (prototype)

### 📊 Dashboard
- Real-time fleet overview
- Vehicle status monitoring (Moving, Idle, Offline)
- Quick stats and metrics
- Recent alerts panel

### 🚗 Vehicle Management
- Complete vehicle list with search and filtering
- Individual vehicle details
- Driver assignments
- Status tracking

### 🗺️ Enhanced Route History & Playback (India-Focused)
- **Mapbox Integration** with Street and Satellite views
- **India-centered maps** (Delhi NCR default)
- **Realistic route rendering** with smooth curves
- **Overspeed highlighting** in red
- **Stop markers** with timestamps
- **Map controls**: Zoom, style switcher, fullscreen
- **Playback controls**: Play/pause/restart with 1x/2x/4x speed
- **Live indicators**: Current speed, timestamp, stop status
- **Interactive tooltips** on route points

### 📈 Trip Analytics
- Total distance traveled
- Driving duration
- Idle time tracking
- Maximum speed monitoring

### 🚨 Alerts System
- Overspeed alerts
- Geofence entry/exit notifications
- Long idle warnings
- Severity levels (Low, Medium, High)

### 📄 Enhanced Reports
- **Daily trip reports** with GPS coordinates and stop indicators
- **Fleet summary reports** with city and status data
- **Weekly summary reports** with 7-day aggregated metrics
- **Monthly summary reports** with full month analytics
- **Alerts export** with vehicle IDs and severity levels
- All reports in CSV format with enriched data fields

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS (with India-focused styling)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Data**: Pre-seeded JSON files (30 vehicles, 25 days history)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Mapbox account (free tier works)

### Installation

1. Navigate to the project directory:
```bash
cd gps-tracking-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. **Set up Mapbox token**:
   - Sign up at https://mapbox.com
   - Create a new access token
   - Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

- **Email**: admin@gps.com
- **Password**: admin123

Alternative:
- **Email**: demo@gps.com
- **Password**: demo123

## Project Structure

```
gps-tracking-dashboard/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard pages
│   │   ├── vehicles/        # Vehicle management
│   │   ├── reports/         # Reports page
│   │   └── settings/        # Settings page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Login page
├── components/              # React components
│   ├── LoginForm.tsx        # Authentication form
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Navbar.tsx           # Top navigation
│   ├── Map.tsx              # Leaflet map component
│   ├── VehicleCard.tsx      # Vehicle display card
│   └── AlertCard.tsx        # Alert display card
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication state
├── data/                    # Pre-seeded JSON data
│   ├── users.json           # User credentials
│   ├── vehicles.json        # Vehicle information
│   ├── routes.json          # GPS route data
│   └── alerts.json          # Alert records
├── lib/                     # Utility functions
│   ├── auth.ts              # Authentication helpers
│   └── data.ts              # Data access functions
└── types/                   # TypeScript definitions
    └── index.ts             # Type definitions
```

## Features in Detail

### Authentication System
- Client-side validation
- Secure credential checking
- Session persistence with localStorage
- Protected routes with automatic redirects

### Vehicle Tracking
- Real-time status updates
- Last seen timestamps
- Driver information
- Vehicle specifications

### Map & Route Playback
- Interactive OpenStreetMap integration
- Animated route playback
- Speed indicators
- Start/end point markers
- Custom vehicle icon

### Reporting System
- CSV export functionality
- Multiple report types
- Date-based filtering
- Summary statistics

## Data Structure

### Pre-seeded Realistic Data

The dashboard includes comprehensive pre-seeded data:

- **users.json**: 2 demo users with authentication credentials
- **vehicles.json**: 30 vehicles with Indian registration numbers
  - Realistic vehicle names (Swift Dzire, Honda City, etc.)
  - Indian driver names
  - Status: Moving, Idle, Offline, Maintenance
  - Assigned cities: Delhi, Mumbai, Bangalore, Pune
  
- **history/{vehicleId}/{date}.json**: 25 days of GPS data per vehicle
  - Realistic routes around Indian cities
  - Variable speeds (10-100 km/h)
  - Idle periods and stop events
  - Overspeed incidents
  - Timestamps across working hours (6 AM - 11 PM)
  
- **alerts.json**: 200+ alerts including:
  - Overspeed violations
  - Geofence entry/exit events
  - Long idle warnings
  - Maintenance alerts

## Responsive Design

The dashboard is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## New Features in Enhanced Version

### ✨ India-Focused Mapping
- Mapbox integration with realistic map styles
- Default center on Delhi NCR
- Accurate Indian roads and landmarks
- Satellite view toggle
- Fullscreen map support

### 🎯 Realistic Data Generation
- 30 vehicles with Indian registration plates
- 25 days of historical GPS data
- Routes across major Indian cities
- Realistic speed variations and stops
- Overspeed and geofence events

### ⚙️ Comprehensive Settings Module
- **Profile Settings**: Name, email, phone, password, timezone (IST), language
- **Application Settings**: Map style, zoom level, units (km/mph), playback speed
- **Tracking Settings**: Update frequency, idle threshold, overspeed limit, data retention
- **Notifications**: Email/push alerts with category filters
- **Fleet Management**: Vehicle list with add/edit/delete UI
- **Billing**: Usage summary, plan comparison, upgrade options

### 📊 Advanced Reporting
- Weekly summary reports (7-day aggregated data)
- Monthly summary reports (full month analytics)
- Enhanced CSV exports with additional fields
- Async data loading for better performance

### 🎨 Enhanced Route Playback
- Overspeed segments highlighted in red
- Stop points with special markers
- Playback speed control (1x, 2x, 4x)
- Real-time speed and status indicators
- Smooth animations and transitions

## Future Production Enhancements

- Real-time WebSocket integration for live tracking
- Backend API with database (PostgreSQL/MongoDB)
- User authentication with JWT
- Advanced geofence drawing and management
- Driver behavior scoring and analytics
- Maintenance scheduling and reminders
- Fuel consumption tracking
- Multi-language support (Hindi, regional languages)
- Mobile app (React Native)
- SMS/WhatsApp notifications

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This is a prototype project for demonstration purposes.

## Notes

This is a **prototype version** with pre-seeded data. In a production environment, this would connect to a real backend API with live GPS data, user management, and database integration.
