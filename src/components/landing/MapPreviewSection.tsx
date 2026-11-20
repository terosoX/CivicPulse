import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { Complaint } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface MapPreviewSectionProps {
  complaints: Complaint[];
  onExploreMapClick: () => void;
  onSelectComplaint?: (c: Complaint) => void;
}

export default function MapPreviewSection({
  complaints,
  onExploreMapClick,
  onSelectComplaint,
}: MapPreviewSectionProps) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to City Center (28.6139, 77.2090)
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([28.6139, 77.2090], 12);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Update tile layer dynamically when theme changes
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add restrained civic pins
    complaints.slice(0, 20).forEach((c) => {
      if (!c.location || !c.location.lat || !c.location.lng) return;

      const isResolved = c.status === 'Resolved' || c.status === 'Closed';
      const isCritical = c.priority === 'Critical';

      const color = isCritical ? '#dc2626' : isResolved ? '#15803d' : '#2563eb';

      const customIcon = L.divIcon({
        className: 'custom-preview-marker',
        html: `
          <div style="
            background: ${color};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([c.location.lat, c.location.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="display:block; margin-bottom: 2px;">${c.title}</strong>
          <span style="color: #64748b; font-size: 11px;">${c.ticketNumber} · ${c.category}</span>
          <div style="margin-top: 4px; font-weight: 600; color: ${color};">${c.status}</div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectComplaint) onSelectComplaint(c);
      });
    });

    const containerEl = mapContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerEl) {
      observer = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      observer.observe(containerEl);
    }

    return () => {
      observer?.disconnect();
    };
  }, [complaints, onSelectComplaint, isDark]);

  return (
    <section className="py-12 sm:py-16 bg-[#F5F7FA] dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Geographic Information System</span>
            </div>
            <h2 className="fluid-section-title font-bold text-slate-900 dark:text-white">
              Citywide Civic Incident Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Real-time spatial visualization of complaints reported across municipal zones and wards.
            </p>
          </div>

          <button
            onClick={onExploreMapClick}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <span>Open Full GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Embedded Map Container */}
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#374151] overflow-hidden bg-white dark:bg-[#111827] shadow-xs relative">
          <div ref={mapContainerRef} className="h-[280px] sm:h-96 lg:h-[420px] w-full z-10" />

          {/* Map Legend Overlay */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[400] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border border-[#E5E7EB] dark:border-[#374151] rounded-lg p-2 sm:p-2.5 shadow-sm text-[10px] sm:text-xs space-y-1 sm:space-y-1.5 max-w-[165px] sm:max-w-none">
            <span className="font-semibold text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-200 block border-b border-slate-200 dark:border-slate-700 pb-1">
              Incident Status
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shrink-0" />
              <span className="truncate">Active / In Progress</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white shrink-0" />
              <span className="truncate">Verified Resolved</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shrink-0" />
              <span className="truncate">Critical Emergency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
