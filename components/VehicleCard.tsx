'use client';

import { Vehicle } from '@/types';
import { SITE_DISPLAY_NAME } from '@/lib/site';
import { Truck, MapPin, ArrowRight } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border-2 border-gray-200 p-5 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{vehicle.name}</h3>
            <p className="text-sm text-gray-500 font-medium">{vehicle.model}</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-600 font-medium">Vehicle No.</span>
            <span className="font-bold text-gray-900">{vehicle.plateNumber}</span>
          </div>
          <div className="flex items-start justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 gap-2">
            <span className="text-gray-600 font-medium shrink-0">Site</span>
            <span className="font-bold text-gray-900 flex items-start gap-1 text-right leading-snug">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              {SITE_DISPLAY_NAME}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t-2 border-gray-100">
          <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
