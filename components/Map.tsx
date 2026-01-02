'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoutePoint } from '@/types';

interface MapProps {
  points: RoutePoint[];
  currentIndex?: number;
  showPlayback?: boolean;
}

export default function Map({ points, currentIndex = 0, showPlayback = false }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([40.7128, -74.0060], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
    }
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const latLngs: [number, number][] = points.map(p => [p.lat, p.lng]);

    const routeLine = L.polyline(latLngs, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
    }).addTo(mapRef.current);

    routeLayerRef.current = routeLine;

    const startIcon = L.divIcon({
      html: '<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const endIcon = L.divIcon({
      html: '<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    startMarkerRef.current = L.marker([points[0].lat, points[0].lng], { icon: startIcon })
      .addTo(mapRef.current)
      .bindPopup('Start Point');

    endMarkerRef.current = L.marker([points[points.length - 1].lat, points[points.length - 1].lng], { icon: endIcon })
      .addTo(mapRef.current)
      .bindPopup('End Point');

    if (showPlayback) {
      const carIcon = L.divIcon({
        html: `
          <div style="position: relative;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
              <path d="M5 17h14v-5H5v5zm0 0v2a1 1 0 001 1h1a1 1 0 001-1v-1m10 0v1a1 1 0 001 1h1a1 1 0 001-1v-1m-16-5l1.5-4.5A2 2 0 018.5 7h7a2 2 0 011.95 1.5L19 13"/>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const currentPoint = points[currentIndex];
      markerRef.current = L.marker([currentPoint.lat, currentPoint.lng], { icon: carIcon })
        .addTo(mapRef.current);
    }

    mapRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
  }, [points]);

  useEffect(() => {
    if (!mapRef.current || !showPlayback || !markerRef.current || points.length === 0) return;

    const currentPoint = points[currentIndex];
    if (currentPoint) {
      markerRef.current.setLatLng([currentPoint.lat, currentPoint.lng]);
      mapRef.current.panTo([currentPoint.lat, currentPoint.lng], { animate: true, duration: 0.5 });
    }
  }, [currentIndex, showPlayback, points]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
  );
}
