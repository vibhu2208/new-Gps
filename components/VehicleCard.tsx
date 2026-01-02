'use client';

import { Vehicle } from '@/types';
import { Car, Clock, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const statusConfig = {
    moving: { color: 'bg-green-500', text: 'Moving', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    idle: { color: 'bg-yellow-500', text: 'Idle', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    offline: { color: 'bg-gray-500', text: 'Offline', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
    maintenance: { color: 'bg-orange-500', text: 'Maintenance', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  };

  const status = statusConfig[vehicle.status];
  const [lastSeenText, setLastSeenText] = useState('');

  useEffect(() => {
    setLastSeenText(formatDistanceToNow(new Date(vehicle.lastSeen), { addSuffix: true }));
  }, [vehicle.lastSeen]);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
            <Car className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{vehicle.name}</h3>
            <p className="text-sm text-gray-500">{vehicle.plateNumber}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor}`}>
          <Circle className={`w-2 h-2 ${status.color} fill-current`} />
          <span className={`text-sm font-medium ${status.textColor}`}>{status.text}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Driver</span>
          <span className="font-medium text-gray-900">{vehicle.driver}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Model</span>
          <span className="font-medium text-gray-900">{vehicle.model}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Color</span>
          <span className="font-medium text-gray-900">{vehicle.color}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last seen {lastSeenText || 'recently'}</span>
        </div>
      </div>
    </div>
  );
}
