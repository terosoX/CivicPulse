import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Layers,
  Filter,
  Maximize2,
  Minimize2,
  Navigation,
  Flame,
  Building2,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { Complaint, IssueCategory, PriorityLevel, ComplaintStatus } from '../../types';
import { formatDate } from '../../utils/i18n';

interface MapIntelligenceViewProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
}

export default function MapIntelligenceView({
  complaints,
  onSelectComplaint,
}: MapIntelligenceViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  // Active Selected Complaint on Map
  const [selectedMarkerComplaint, setSelectedMarkerComplaint] = useState<Complaint | null>(null);

  // Filtered Complaints for map display
  const filteredMapComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (selectedWard !== 'All' && c.location.ward !== selectedWard) return false;
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
      return true;
    });
  }, [complaints, selectedWard, selectedCategory, selectedStatus]);

  // Color mapping by category
  const getCategoryColor = (cat: string) => {
    if (cat.includes('Road') || cat.includes('Pothole')) return '#F59E0B'; // Amber
    if (cat.includes('Water')) return '#2563EB'; // Blue
    if (cat.includes('Garbage') || cat.includes('Waste')) return '#10B981'; // Green
    if (cat.includes('Streetlight') || cat.includes('Electrical')) return '#8B5CF6'; // Purple
    if (cat.includes('Health') || cat.includes('Sanitation')) return '#06B6D4'; // Cyan
    return '#DC2626'; // Red for others / hazards
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default city coordinates
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.209],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers & Heatmap Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !heatmapLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    heatmapLayerRef.current.clearLayers();

    filteredMapComplaints.forEach((c) => {
      const color = getCategoryColor(c.category);
      const isCritical = c.priority === 'Critical';

      // 1. Heatmap density circle
      if (showHeatmap) {
        const circle = L.circle([c.location.lat, c.location.lng], {
          radius: isCritical ? 280 : 160,
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1,
        });
        heatmapLayerRef.current?.addLayer(circle);
      }

      // 2. Custom Map Marker
      if (showMarkers) {
        const markerIcon = L.divIcon({
          className: 'custom-div-marker',
          html: `
            <div style="
              background-color: ${color};
              width: ${isCritical ? '24px' : '20px'};
              height: ${isCritical ? '24px' : '20px'};
              border-radius: 50%;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 10px;
              font-weight: bold;
              ${isCritical ? 'animation: pulse 1.8s infinite;' : ''}
            ">
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([c.location.lat, c.location.lng], { icon: markerIcon });

        // Popup Content
        const popupHtml = `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-family: monospace; font-weight: bold; color: #2563EB;">${c.ticketNumber}</div>
            <div style="font-weight: bold; font-size: 12px; margin-top: 2px;">${c.title}</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${c.location.address}</div>
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <span style="background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px;">${c.status}</span>
              <span style="background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px;">${c.priority}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          setSelectedMarkerComplaint(c);
        });

        markersLayerRef.current?.addLayer(marker);
      }
    });
  }, [filteredMapComplaints, showHeatmap, showMarkers]);

  const wards = [
    'All',
    'Ward 1 - North Sector',
    'Ward 2 - East Industrial',
    'Ward 3 - South Residential',
    'Ward 4 - Central Promenade',
    'Ward 5 - West Suburbs',
    'Ward 6 - Tech Corridor',
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
            Map Intelligence
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Geospatial command dashboard, cluster hotspots, and municipal hazard mapping
          </p>
        </div>

        {/* Heatmap & Marker Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-[#14B8A6]/10 text-[#0D9488] border-[#99F6E4]'
                : 'bg-white dark:bg-[#111827] text-[#667085] border-[#D0D5DD] dark:border-[#374151]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap Overlay</span>
          </button>

          <button
            onClick={() => setShowMarkers((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showMarkers
                ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#BFDBFE]'
                : 'bg-white dark:bg-[#111827] text-[#667085] border-[#D0D5DD] dark:border-[#374151]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pins ({filteredMapComplaints.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Row Card */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Ward Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#667085]">Ward:</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs font-medium text-[#101828] dark:text-white"
            >
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#667085]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs font-medium text-[#101828] dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="Work Started">Work Started</option>
              <option value="In Inspection">In Inspection</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-[#667085]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Roads
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Water
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Sanitation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Electrical
          </span>
        </div>
      </div>

      {/* Main Map Layout: Map Container with Side Intelligence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Leaflet Map (8 or 12 cols) */}
        <div className={`${selectedMarkerComplaint ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
          <div className="relative h-[560px] w-full rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden shadow-xs">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>
        </div>

        {/* Selected Complaint Slide-In Panel */}
        {selectedMarkerComplaint && (
          <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs p-5 flex flex-col justify-between space-y-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EAECF0] dark:border-[#374151]">
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {selectedMarkerComplaint.ticketNumber}
                </span>
                <button
                  onClick={() => setSelectedMarkerComplaint(null)}
                  className="p-1 rounded-md text-[#667085] hover:text-[#101828]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-sm text-[#101828] dark:text-white mt-2.5 leading-snug">
                {selectedMarkerComplaint.title}
              </h3>

              <div className="flex items-center gap-1.5 mt-2 text-xs text-[#667085]">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span className="truncate">{selectedMarkerComplaint.location.address}</span>
              </div>

              {/* Photo */}
              <div className="mt-3">
                <img
                  src={selectedMarkerComplaint.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600'}
                  alt="Complaint Evidence"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-36 object-cover rounded-lg border border-[#EAECF0] dark:border-[#374151]"
                />
              </div>

              {/* Specs */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F2F4F7] dark:border-[#374151]">
                  <span className="text-[#667085]">Ward:</span>
                  <span className="font-medium text-[#101828] dark:text-white">{selectedMarkerComplaint.location.ward}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F4F7] dark:border-[#374151]">
                  <span className="text-[#667085]">Status:</span>
                  <span className="font-semibold text-[#2563EB]">{selectedMarkerComplaint.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F2F4F7] dark:border-[#374151]">
                  <span className="text-[#667085]">Department:</span>
                  <span className="font-medium text-[#101828] dark:text-white">{selectedMarkerComplaint.departmentAssigned || 'Roads & Infrastructure'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085]">Priority:</span>
                  <span className="font-bold text-[#DC2626]">{selectedMarkerComplaint.priority}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onSelectComplaint) onSelectComplaint(selectedMarkerComplaint);
              }}
              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Full Lifecycle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
