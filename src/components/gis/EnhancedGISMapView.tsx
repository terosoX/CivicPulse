import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Complaint } from '../../types';
import {
  MapPin,
  Flame,
  Layers,
  Filter,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Square,
  Printer,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  UserCheck,
  Building,
  Shield,
  Activity,
  Maximize,
  Sparkles,
  HelpCircle,
  SlidersHorizontal
} from 'lucide-react';
import {
  SMART_CITY_WARDS,
  MUNICIPAL_ZONES,
  MUNICIPAL_ROADS,
  PARKS_AND_RECREATION,
  WATER_BODIES,
  GOVERNMENT_OFFICES,
  HOSPITALS,
  SCHOOLS,
  CATEGORY_ICON_MAP,
  STATUS_COLOR_MAP,
  PRIORITY_COLOR_MAP
} from './GISDataLayers';
import { useTheme } from '../../context/ThemeContext';

interface EnhancedGISMapViewProps {
  complaints: Complaint[];
  onSelectComplaint: (c: Complaint) => void;
  isAdminView?: boolean;
}

type TileStyle = 'osm' | 'dark' | 'light' | 'satellite' | 'highcontrast';

export default function EnhancedGISMapView({
  complaints,
  onSelectComplaint,
  isAdminView = false,
}: EnhancedGISMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups references for clean dynamic updates
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const wardsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const parksLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const waterLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiGovLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiHospLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiSchoolLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const measurementLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawFenceLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const { isDark } = useTheme();
  // States
  const [tileStyle, setTileStyle] = useState<TileStyle>(isDark ? 'dark' : 'osm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setTileStyle((prev) => {
      if (prev === 'satellite' || prev === 'highcontrast') return prev;
      return isDark ? 'dark' : 'osm';
    });
  }, [isDark]);
  const [selectedComplaintModal, setSelectedComplaintModal] = useState<Complaint | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Layer Visibility Toggles
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [showParks, setShowParks] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showGovOffices, setShowGovOffices] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showSchools, setShowSchools] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [pendingOnlyToggle, setPendingOnlyToggle] = useState<'All' | 'Pending' | 'Resolved'>('All');

  // Interactive Tools State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number>(0);

  const [isDrawingFence, setIsDrawingFence] = useState(false);
  const [fencePoints, setFencePoints] = useState<L.LatLng[]>([]);
  const [isFenceActive, setIsFenceActive] = useState(false);

  // Panels Collapse State
  const [legendOpen, setLegendOpen] = useState(true);
  const [legendTab, setLegendTab] = useState<'status' | 'category' | 'priority' | 'heatmap'>('status');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [tileStyleDropdownOpen, setTileStyleDropdownOpen] = useState(false);

  // Mobile Bottom Sheet Legend State
  const [mobileLegendDrawerOpen, setMobileLegendDrawerOpen] = useState(false);

  // Filter complaints based on user selections and spatial draw fence
  const filteredComplaints = complaints.filter((c) => {
    // Quick Status Switch
    if (pendingOnlyToggle === 'Pending' && (c.status === 'Resolved' || c.status === 'Closed')) return false;
    if (pendingOnlyToggle === 'Resolved' && (c.status !== 'Resolved' && c.status !== 'Closed')) return false;

    // Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending' && !(c.status === 'Submitted' || c.status === 'Pending')) return false;
      if (statusFilter === 'Verified' && c.status !== 'Verified') return false;
      if (statusFilter === 'Assigned' && c.status !== 'Assigned') return false;
      if (statusFilter === 'Work In Progress' && !(c.status === 'Work Started')) return false;
      if (statusFilter === 'Under Inspection' && !(c.status === 'In Inspection')) return false;
      if (statusFilter === 'Resolved' && c.status !== 'Resolved') return false;
      if (statusFilter === 'Closed' && !(c.status === 'Closed' || c.status === 'Rejected')) return false;
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      if (!c.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    }

    // Priority Filter
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;

    // Ward Filter
    if (wardFilter !== 'All' && !c.location.ward.includes(wardFilter)) return false;

    // Department Filter
    if (departmentFilter !== 'All' && c.departmentAssigned !== departmentFilter) return false;

    // Date Range Filter
    if (dateRangeFilter !== 'All') {
      const createdAt = new Date(c.createdAt).getTime();
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (dateRangeFilter === 'Last 24 Hours' && now - createdAt > dayMs) return false;
      if (dateRangeFilter === 'Last 7 Days' && now - createdAt > 7 * dayMs) return false;
      if (dateRangeFilter === 'Last 30 Days' && now - createdAt > 30 * dayMs) return false;
    }

    // Spatial Draw Fence Filter
    if (isFenceActive && fencePoints.length >= 3) {
      const pt = L.latLng(c.location.lat, c.location.lng);
      // Ray-casting algorithm to test point in polygon
      let inside = false;
      for (let i = 0, j = fencePoints.length - 1; i < fencePoints.length; j = i++) {
        const xi = fencePoints[i].lat, yi = fencePoints[i].lng;
        const xj = fencePoints[j].lat, yj = fencePoints[j].lng;
        const intersect = ((yi > pt.lng) !== (yj > pt.lng)) &&
          (pt.lat < (xj - xi) * (pt.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (!inside) return false;
    }

    return true;
  });

  // Calculate Map KPIs
  const criticalCount = filteredComplaints.filter((c) => c.priority === 'Critical').length;
  const pendingCount = filteredComplaints.filter((c) => c.status === 'Submitted' || c.status === 'Pending' || c.status === 'Verified').length;
  const inProgressCount = filteredComplaints.filter((c) => c.status === 'Assigned' || c.status === 'Work Started' || c.status === 'In Inspection').length;
  const resolvedCount = filteredComplaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Layer Groups
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
      wardsLayerGroupRef.current = L.layerGroup().addTo(map);
      zonesLayerGroupRef.current = L.layerGroup().addTo(map);
      roadsLayerGroupRef.current = L.layerGroup().addTo(map);
      parksLayerGroupRef.current = L.layerGroup().addTo(map);
      waterLayerGroupRef.current = L.layerGroup().addTo(map);
      poiGovLayerGroupRef.current = L.layerGroup().addTo(map);
      poiHospLayerGroupRef.current = L.layerGroup().addTo(map);
      poiSchoolLayerGroupRef.current = L.layerGroup().addTo(map);
      measurementLayerGroupRef.current = L.layerGroup().addTo(map);
      drawFenceLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    // Set Base Tile Layer
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let tileAttr = '&copy; OpenStreetMap contributors';

    if (tileStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; CARTO Dark Matter';
    } else if (tileStyle === 'light') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; CARTO Positron';
    } else if (tileStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileAttr = 'Tiles &copy; Esri World Imagery';
    } else if (tileStyle === 'highcontrast') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      tileAttr = '&copy; OpenTopoMap High Contrast';
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: tileAttr,
    }).addTo(map);

  }, [tileStyle]);

  // Keep Leaflet viewport synced with container resizes across breakpoints
  useEffect(() => {
    const el = mapContainerRef.current;
    const map = mapInstanceRef.current;
    if (!el || !map || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Click Handlers for Measurement & Spatial Fence
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isMeasuring) {
        setMeasurePoints((prev) => [...prev, e.latlng]);
      } else if (isDrawingFence) {
        setFencePoints((prev) => [...prev, e.latlng]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMeasuring, isDrawingFence]);

  // Render Measurement Overlay
  useEffect(() => {
    if (!measurementLayerGroupRef.current || !mapInstanceRef.current) return;
    measurementLayerGroupRef.current.clearLayers();

    if (measurePoints.length > 0) {
      // Draw points
      measurePoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 6,
          color: '#2563eb',
          fillColor: '#60a5fa',
          fillOpacity: 0.9,
        });
        marker.bindTooltip(`Pt ${idx + 1}`, { permanent: true, direction: 'top' });
        measurementLayerGroupRef.current?.addLayer(marker);
      });

      // Draw polyline
      if (measurePoints.length >= 2) {
        const polyline = L.polyline(measurePoints, {
          color: '#2563eb',
          weight: 4,
          dashArray: '6, 6',
        });
        measurementLayerGroupRef.current.addLayer(polyline);

        // Calculate total length
        let total = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
          total += measurePoints[i].distanceTo(measurePoints[i + 1]);
        }
        setMeasureDistance(Math.round(total));
      }
    }
  }, [measurePoints]);

  // Render Spatial Fence Overlay
  useEffect(() => {
    if (!drawFenceLayerGroupRef.current || !mapInstanceRef.current) return;
    drawFenceLayerGroupRef.current.clearLayers();

    if (fencePoints.length > 0) {
      fencePoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 5,
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 1,
        });
        drawFenceLayerGroupRef.current?.addLayer(marker);
      });

      if (fencePoints.length >= 3) {
        const polygon = L.polygon(fencePoints, {
          color: '#ef4444',
          fillColor: '#f87171',
          fillOpacity: 0.25,
          weight: 3,
          dashArray: '5, 5',
        });
        polygon.bindTooltip(`Spatial Fence Active (${filteredComplaints.length} Issues Inside)`, {
          permanent: true,
          direction: 'center',
          className: 'spatial-fence-tooltip font-bold text-xs bg-red-900 text-white p-1 rounded',
        });
        drawFenceLayerGroupRef.current.addLayer(polygon);
      } else if (fencePoints.length === 2) {
        const line = L.polyline(fencePoints, { color: '#ef4444', weight: 3, dashArray: '4, 4' });
        drawFenceLayerGroupRef.current.addLayer(line);
      }
    }
  }, [fencePoints, filteredComplaints.length]);

  // Render Static GIS Layers (Wards, Zones, Roads, Parks, Water, POIs)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Wards Boundaries Layer
    if (wardsLayerGroupRef.current) {
      wardsLayerGroupRef.current.clearLayers();
      if (showWards) {
        SMART_CITY_WARDS.forEach((w) => {
          const poly = L.polygon(w.coordinates, {
            color: w.color,
            weight: 2.5,
            fillColor: w.color,
            fillOpacity: 0.12,
            dashArray: '4, 4',
          });
          poly.bindTooltip(
            `<div style="font-family: system-ui; font-size: 11px; font-weight: bold; padding: 2px 4px;">
              <span style="color: ${w.color}">● ${w.name} (${w.code})</span><br/>
              <span style="color: #64748b; font-weight: normal;">Councillor: ${w.councillor} • Pop: ${w.population}</span>
            </div>`,
            { sticky: true }
          );
          wardsLayerGroupRef.current?.addLayer(poly);
        });
      }
    }

    // 2. Municipal Zones Layer
    if (zonesLayerGroupRef.current) {
      zonesLayerGroupRef.current.clearLayers();
      if (showZones) {
        MUNICIPAL_ZONES.forEach((z) => {
          const poly = L.polygon(z.coordinates, {
            color: z.color,
            weight: 2,
            fillColor: z.color,
            fillOpacity: 0.2,
          });
          poly.bindTooltip(`<b>${z.name}</b> (${z.type} Zone)`, { sticky: true });
          zonesLayerGroupRef.current?.addLayer(poly);
        });
      }
    }

    // 3. Main Roads Layer
    if (roadsLayerGroupRef.current) {
      roadsLayerGroupRef.current.clearLayers();
      if (showRoads) {
        MUNICIPAL_ROADS.forEach((r) => {
          const line = L.polyline(r.coordinates, {
            color: '#64748b',
            weight: 3.5,
            opacity: 0.75,
            dashArray: '8, 4',
          });
          line.bindTooltip(`🛣️ <b>${r.name}</b> (${r.type})`, { sticky: true });
          roadsLayerGroupRef.current?.addLayer(line);
        });
      }
    }

    // 4. Parks Layer
    if (parksLayerGroupRef.current) {
      parksLayerGroupRef.current.clearLayers();
      if (showParks) {
        PARKS_AND_RECREATION.forEach((p) => {
          const poly = L.polygon(p.coordinates, {
            color: p.color,
            weight: 1.5,
            fillColor: p.color,
            fillOpacity: 0.35,
          });
          poly.bindTooltip(`🌳 <b>${p.name}</b> (Public Green Space)`, { sticky: true });
          parksLayerGroupRef.current?.addLayer(poly);
        });
      }
    }

    // 5. Water Bodies Layer
    if (waterLayerGroupRef.current) {
      waterLayerGroupRef.current.clearLayers();
      if (showWater) {
        WATER_BODIES.forEach((wb) => {
          const poly = L.polygon(wb.coordinates, {
            color: wb.color,
            weight: 1.5,
            fillColor: wb.color,
            fillOpacity: 0.45,
          });
          poly.bindTooltip(`🌊 <b>${wb.name}</b> (Water Resource)`, { sticky: true });
          waterLayerGroupRef.current?.addLayer(poly);
        });
      }
    }

    // 6. Government Offices POIs
    if (poiGovLayerGroupRef.current) {
      poiGovLayerGroupRef.current.clearLayers();
      if (showGovOffices) {
        GOVERNMENT_OFFICES.forEach((poi) => {
          const icon = L.divIcon({
            className: 'gis-poi-icon',
            html: `
              <div style="background-color: #1e3a8a; width: 28px; height: 28px; border-radius: 8px; border: 2px solid #60a5fa; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                🏛️
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const m = L.marker([poi.lat, poi.lng], { icon });
          m.bindPopup(`
            <div style="font-family: system-ui; text-align: left; padding: 4px;">
              <div style="font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Municipal Government Office</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${poi.name}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${poi.address}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">${poi.details}</div>
            </div>
          `);
          poiGovLayerGroupRef.current?.addLayer(m);
        });
      }
    }

    // 7. Hospitals POIs
    if (poiHospLayerGroupRef.current) {
      poiHospLayerGroupRef.current.clearLayers();
      if (showHospitals) {
        HOSPITALS.forEach((poi) => {
          const icon = L.divIcon({
            className: 'gis-poi-icon',
            html: `
              <div style="background-color: #dc2626; width: 28px; height: 28px; border-radius: 8px; border: 2px solid #fca5a5; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                🏥
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const m = L.marker([poi.lat, poi.lng], { icon });
          m.bindPopup(`
            <div style="font-family: system-ui; text-align: left; padding: 4px;">
              <div style="font-size: 10px; font-weight: bold; color: #dc2626; text-transform: uppercase;">Healthcare Facility</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${poi.name}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${poi.address}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">${poi.details}</div>
            </div>
          `);
          poiHospLayerGroupRef.current?.addLayer(m);
        });
      }
    }

    // 8. Schools POIs
    if (poiSchoolLayerGroupRef.current) {
      poiSchoolLayerGroupRef.current.clearLayers();
      if (showSchools) {
        SCHOOLS.forEach((poi) => {
          const icon = L.divIcon({
            className: 'gis-poi-icon',
            html: `
              <div style="background-color: #0284c7; width: 28px; height: 28px; border-radius: 8px; border: 2px solid #7dd3fc; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                🏫
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const m = L.marker([poi.lat, poi.lng], { icon });
          m.bindPopup(`
            <div style="font-family: system-ui; text-align: left; padding: 4px;">
              <div style="font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">Educational Institution</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${poi.name}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${poi.address}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">${poi.details}</div>
            </div>
          `);
          poiSchoolLayerGroupRef.current?.addLayer(m);
        });
      }
    }
  }, [showWards, showZones, showRoads, showParks, showWater, showGovOffices, showHospitals, showSchools]);

  // Render Dynamic Complaint Markers & Heatmap Circles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear dynamic layer groups
    if (markersLayerGroupRef.current) markersLayerGroupRef.current.clearLayers();
    if (heatmapLayerGroupRef.current) heatmapLayerGroupRef.current.clearLayers();

    // 1. Complaint Pins Mode
    if (showMarkers && markersLayerGroupRef.current) {
      filteredComplaints.forEach((c) => {
        const catInfo = CATEGORY_ICON_MAP[c.category] || { emoji: '🏢', color: '#3b82f6' };
        const statusInfo = STATUS_COLOR_MAP[c.status] || STATUS_COLOR_MAP['Pending'];
        const priorityInfo = PRIORITY_COLOR_MAP[c.priority] || PRIORITY_COLOR_MAP['Low'];

        let pinBgColor = statusInfo.color;
        if (c.priority === 'Critical') pinBgColor = '#ef4444';

        const customIcon = L.divIcon({
          className: 'custom-gis-pin-marker',
          html: `
            <div style="position: relative; cursor: pointer; transition: transform 0.2s;">
              ${c.priority === 'Critical' ? '<div style="position: absolute; -inset: 4px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
              <div style="background-color: ${pinBgColor}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 18px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">
                ${catInfo.emoji}
              </div>
              <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background-color: ${priorityInfo.color}; border: 2px solid white;"></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([c.location.lat, c.location.lng], { icon: customIcon });

        // Rich Information Popup Content
        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; width: 250px; text-align: left; padding: 2px;">
            <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 8px;">
              <img src="${c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}" onerror="this.src='https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'" style="width: 100%; height: 120px; object-fit: cover;" />
              <div style="position: absolute; top: 6px; left: 6px; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; background: rgba(15, 23, 42, 0.85); color: white; backdrop-filter: blur(4px);">
                ${c.ticketNumber}
              </div>
              <div style="position: absolute; top: 6px; right: 6px; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; background: ${pinBgColor}; color: white; text-transform: uppercase;">
                ${c.status}
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="font-size: 14px;">${catInfo.emoji}</span>
              <span style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">${c.category}</span>
              <span style="margin-left: auto; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; background: ${c.priority === 'Critical' ? '#fee2e2' : '#fef3c7'}; color: ${c.priority === 'Critical' ? '#991b1b' : '#92400e'}; border: 1px solid rgba(0,0,0,0.1);">
                ${c.priority} Priority
              </span>
            </div>

            <div style="font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 6px;">
              ${c.title}
            </div>

            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; display: flex; align-items: start; gap: 4px;">
              <span>📍</span>
              <span>${c.location.address}</span>
            </div>

            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; font-size: 10px; color: #475569; space-y: 2px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Assigned Dept:</span>
                <strong style="color: #1e293b;">${c.departmentAssigned || 'Triage Control'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Field Engineer:</span>
                <strong style="color: #2563eb;">${c.officerAssigned || 'Dispatched Unit'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Reported Date:</span>
                <span>${new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; color: #059669;">
                <span>Target Resolution:</span>
                <span>${c.estimatedResolutionDate ? new Date(c.estimatedResolutionDate).toLocaleDateString() : 'Within 48 hrs'}</span>
              </div>
            </div>

            <button id="btn-gis-detail-${c.id}" style="width: 100%; padding: 7px; background: #2563eb; color: white; font-weight: bold; font-size: 11px; border: none; border-radius: 8px; cursor: pointer; text-align: center;">
              🔍 View Detailed Ticket Dossier
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`btn-gis-detail-${c.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectComplaint(c);
                setSelectedComplaintModal(c);
              };
            }
          }, 50);
        });

        markersLayerGroupRef.current?.addLayer(marker);
      });
    }

    // 2. Heatmap Density Layer
    if (showHeatmap && heatmapLayerGroupRef.current) {
      filteredComplaints.forEach((c) => {
        let circleColor = '#3b82f6'; // Low Density Blue
        let circleOpacity = 0.4;
        let radius = 280;

        if (c.priority === 'Critical') {
          circleColor = '#ef4444'; // Critical Hotspot Red
          circleOpacity = 0.65;
          radius = 420;
        } else if (c.priority === 'High') {
          circleColor = '#f97316'; // Very High Orange
          circleOpacity = 0.55;
          radius = 360;
        } else if (c.priority === 'Medium') {
          circleColor = '#eab308'; // High Yellow
          circleOpacity = 0.5;
          radius = 300;
        } else if (c.status === 'Resolved') {
          circleColor = '#10b981'; // Moderate Green
          circleOpacity = 0.35;
          radius = 250;
        }

        const circle = L.circle([c.location.lat, c.location.lng], {
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: circleOpacity,
          weight: 1.5,
          radius: radius,
        });

        circle.bindTooltip(`
          <div style="font-family: system-ui; font-size: 11px; font-weight: bold; text-align: left;">
            <span style="color: ${circleColor}">● Hotspot Severity: ${c.priority}</span><br/>
            <b>${c.title}</b><br/>
            <span style="color: #64748b; font-weight: normal;">Ward: ${c.location.ward}</span>
          </div>
        `);

        circle.on('click', () => {
          onSelectComplaint(c);
        });

        heatmapLayerGroupRef.current?.addLayer(circle);
      });
    }

  }, [filteredComplaints, showMarkers, showHeatmap, onSelectComplaint]);

  // Handle Control Actions
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.5 });
            L.circleMarker([lat, lng], {
              radius: 9,
              color: '#3b82f6',
              fillColor: '#60a5fa',
              fillOpacity: 1,
            }).addTo(mapInstanceRef.current).bindPopup('<b>You are here (GPS Position)</b>').openPopup();
          }
        },
        () => {
          // Fallback to city center
          mapInstanceRef.current?.flyTo([28.6139, 77.2090], 14, { duration: 1.2 });
        }
      );
    } else {
      mapInstanceRef.current?.flyTo([28.6139, 77.2090], 14, { duration: 1.2 });
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => mapInstanceRef.current?.flyTo([28.6139, 77.2090], 13, { duration: 1.2 });

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen().catch((err) => {
        console.error('Fullscreen error', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePrintMap = () => {
    window.print();
  };

  const handleExportMapSnapshot = () => {
    const summaryData = {
      title: 'Smart City Operations GIS Heatmap & Incident Intelligence Export',
      generatedAt: new Date().toISOString(),
      activeFilters: {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        ward: wardFilter,
        department: departmentFilter,
        spatialFenceActive: isFenceActive,
      },
      stats: {
        totalFilteredIncidents: filteredComplaints.length,
        criticalHotspots: criticalCount,
        pendingAction: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
      incidents: filteredComplaints.map((c) => ({
        ticketNumber: c.ticketNumber,
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        ward: c.location.ward,
        coordinates: [c.location.lat, c.location.lng],
      })),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GIS_SmartCity_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearMeasurement = () => {
    setIsMeasuring(false);
    setMeasurePoints([]);
    setMeasureDistance(0);
    if (measurementLayerGroupRef.current) measurementLayerGroupRef.current.clearLayers();
  };

  const handleClearSpatialFence = () => {
    setIsDrawingFence(false);
    setIsFenceActive(false);
    setFencePoints([]);
    if (drawFenceLayerGroupRef.current) drawFenceLayerGroupRef.current.clearLayers();
  };

  // Check if any custom filter is active
  const hasActiveFilters =
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    priorityFilter !== 'All' ||
    wardFilter !== 'All' ||
    departmentFilter !== 'All' ||
    dateRangeFilter !== 'All' ||
    pendingOnlyToggle !== 'All' ||
    isFenceActive;

  const resetAllFilters = () => {
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setWardFilter('All');
    setDepartmentFilter('All');
    setDateRangeFilter('All');
    setPendingOnlyToggle('All');
    handleClearSpatialFence();
  };

  return (
    <div className="space-y-4 text-left font-sans select-none">
      {/* 1. TOP HEADER & GIS OPERATIONS KPIs PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <span className="truncate">Smart City Municipal Operations • Real-Time Spatial GIS Intelligence</span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold flex flex-wrap items-center gap-2">
            <span>Citywide Incident Heatmap & Asset Analytics Map</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
              ArcGIS Spatial Engine
            </span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Interactive multi-layered spatial visualization system for monitoring infrastructure anomalies, dispatching field personnel, and analyzing ward complaint density.
          </p>
        </div>

        {/* Live Map KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 tabular-nums">
          <div className="bg-white/10 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
            <div className="text-base sm:text-lg font-black text-white">{filteredComplaints.length}</div>
            <div className="text-[10px] font-semibold text-blue-200">Visible Pins</div>
          </div>

          <div className="bg-red-500/15 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-red-500/30 text-center">
            <div className="text-base sm:text-lg font-black text-red-400 flex items-center justify-center gap-1">
              <span>{criticalCount}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-[10px] font-semibold text-red-200">Critical Hotspots</div>
          </div>

          <div className="bg-amber-500/15 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-amber-500/30 text-center">
            <div className="text-base sm:text-lg font-black text-amber-400">{pendingCount + inProgressCount}</div>
            <div className="text-[10px] font-semibold text-amber-200">Active Work Orders</div>
          </div>

          <div className="bg-emerald-500/15 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-emerald-500/30 text-center">
            <div className="text-base sm:text-lg font-black text-emerald-400">{resolvedCount}</div>
            <div className="text-[10px] font-semibold text-emerald-200">Resolved SLA</div>
          </div>
        </div>
      </div>

      {/* 2. MAIN MAP CANVAS WRAPPER */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl h-[420px] sm:h-[540px] lg:h-[650px] bg-slate-900 group">
        
        {/* LEAFLET CANVAS CONTAINER */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* TOP-LEFT FLOATING GIS CONTROLS TOOLBAR */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-2">
          {/* Main Controls Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            <button
              onClick={handleLocateMe}
              title="Locate Me (GPS / City Center)"
              aria-label="Locate Me"
              className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-xl transition-all flex items-center justify-center text-xs font-bold"
            >
              <Navigation className="w-4 h-4" />
            </button>

            <button
              onClick={handleZoomIn}
              title="Zoom In (+)"
              aria-label="Zoom In"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              aria-label="Zoom Out"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetView}
              title="Reset Map View Orientation"
              aria-label="Reset View"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center text-xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen Mode"
              aria-label="Fullscreen"
              className="p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                const mapAny = mapInstanceRef.current as (L.Map & { setBearing?: (deg: number) => void }) | null;
                if (mapAny && typeof mapAny.setBearing === 'function') {
                  mapAny.setBearing(0);
                } else {
                  handleResetView();
                }
              }}
              title="Compass - Reset North Alignment"
              aria-label="Compass"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 rounded-xl transition-all flex items-center justify-center text-xs"
            >
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* Secondary Measurement & Drawing Tools Group */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            <button
              onClick={() => {
                if (isMeasuring) {
                  handleClearMeasurement();
                } else {
                  handleClearSpatialFence();
                  setIsMeasuring(true);
                }
              }}
              title="Measurement Ruler Tool (Click map points to measure distance)"
              aria-label="Measurement Tool"
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                isMeasuring
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (isDrawingFence || isFenceActive) {
                  handleClearSpatialFence();
                } else {
                  handleClearMeasurement();
                  setIsDrawingFence(true);
                  setIsFenceActive(true);
                }
              }}
              title="Spatial Fence / Draw Polygon Filter Tool"
              aria-label="Draw Spatial Area"
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                isDrawingFence || isFenceActive
                  ? 'bg-red-600 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

            <button
              onClick={handlePrintMap}
              title="Print Map View Report"
              aria-label="Print Map"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportMapSnapshot}
              title="Export GIS Data & Snapshot (JSON/PNG)"
              aria-label="Export Map"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 rounded-xl transition-all flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TOP-RIGHT FLOATING MAP STYLE & LAYERS TOGGLE TOOLBAR */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          {/* Base Map Style Selector */}
          <div className="relative">
            <button
              onClick={() => setTileStyleDropdownOpen(!tileStyleDropdownOpen)}
              className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xl flex items-center gap-1.5 sm:gap-2 transition-all hover:bg-white dark:hover:bg-slate-800"
            >
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Map Style:</span>
              <span className="capitalize font-extrabold text-blue-600 dark:text-blue-400 hidden min-[400px]:inline">
                {tileStyle === 'osm' ? 'Standard' : tileStyle}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {tileStyleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-30 space-y-1 text-xs">
                <button
                  onClick={() => { setTileStyle('osm'); setTileStyleDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between ${tileStyle === 'osm' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span>🗺️ Standard Street</span>
                  {tileStyle === 'osm' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTileStyle('dark'); setTileStyleDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between ${tileStyle === 'dark' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span>🌑 Dark GIS Mode</span>
                  {tileStyle === 'dark' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTileStyle('light'); setTileStyleDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between ${tileStyle === 'light' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span>☀️ Light Canvas</span>
                  {tileStyle === 'light' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTileStyle('satellite'); setTileStyleDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between ${tileStyle === 'satellite' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span>🛰️ Satellite Imagery</span>
                  {tileStyle === 'satellite' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTileStyle('highcontrast'); setTileStyleDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between ${tileStyle === 'highcontrast' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span>👓 High Contrast</span>
                  {tileStyle === 'highcontrast' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* GIS Layers Manager Toggle Button */}
          <button
            onClick={() => setLayersPanelOpen(!layersPanelOpen)}
            aria-label="Toggle Map Layers"
            className={`px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md border text-xs font-bold shadow-xl flex items-center gap-2 transition-all ${
              layersPanelOpen
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Map Layers</span>
          </button>

          {/* Filters Drawer Toggle Button */}
          <button
            onClick={() => setFiltersDrawerOpen(!filtersDrawerOpen)}
            aria-label="Filter Map"
            className={`px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md border text-xs font-bold shadow-xl flex items-center gap-2 transition-all ${
              hasActiveFilters || filtersDrawerOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter Map</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>
        </div>

        {/* TOP ACTIVE FILTERS & TOOL NOTIFICATION BANNER */}
        <div className="absolute top-14 sm:top-16 right-3 left-14 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-20 sm:max-w-xl sm:w-full px-0 sm:px-4 pointer-events-none space-y-2">
          {/* Measurement Banner */}
          {isMeasuring && (
            <div className="pointer-events-auto bg-blue-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 font-semibold">
                <Ruler className="w-4 h-4 text-blue-300 animate-bounce" />
                <span>Click map points to measure distance. Total: <strong className="text-yellow-300">{measureDistance >= 1000 ? `${(measureDistance/1000).toFixed(2)} km` : `${measureDistance} meters`}</strong></span>
              </div>
              <button onClick={handleClearMeasurement} className="p-1 hover:bg-white/20 rounded-lg text-white font-bold">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Spatial Fence Banner */}
          {(isDrawingFence || isFenceActive) && (
            <div className="pointer-events-auto bg-red-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-red-500/40 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 font-semibold">
                <Square className="w-4 h-4 text-red-300 animate-pulse" />
                <span>
                  {fencePoints.length < 3
                    ? `Click at least 3 points to enclose spatial area (${fencePoints.length}/3)`
                    : `Spatial Fence Active: Filtering ${filteredComplaints.length} issues inside area`}
                </span>
              </div>
              <button onClick={handleClearSpatialFence} className="p-1 hover:bg-white/20 rounded-lg text-white font-bold">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Filter Chips Strip */}
          {hasActiveFilters && (
            <div className="pointer-events-auto bg-slate-900/90 text-white backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-400">Active:</span>
                {statusFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold flex items-center gap-1">
                    Status: {statusFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('All')} />
                  </span>
                )}
                {categoryFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                    Cat: {categoryFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter('All')} />
                  </span>
                )}
                {priorityFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold flex items-center gap-1">
                    Priority: {priorityFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setPriorityFilter('All')} />
                  </span>
                )}
                {wardFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                    Ward: {wardFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setWardFilter('All')} />
                  </span>
                )}
              </div>

              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition-colors shrink-0"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* MAP LAYERS MANAGER PANEL (FLOATING SIDEBAR) */}
        {layersPanelOpen && (
          <div className="absolute top-14 sm:top-16 right-3 sm:right-4 z-20 w-[calc(100%-1.5rem)] max-w-[18rem] sm:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 text-xs space-y-3 max-h-[calc(100%-4.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Municipal Map Layers (6)</span>
              </div>
              <button onClick={() => setLayersPanelOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              {/* Primary Incident Layers */}
              <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider pt-1">
                Incident & Density Overlay
              </div>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-bold">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Complaint Markers</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-bold">
                <span className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Heatmap Density</span>
                </span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              {/* Administrative Spatial Layers */}
              <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider pt-2">
                Administrative Spatial Layers
              </div>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Ward Boundaries</span>
                </span>
                <input
                  type="checkbox"
                  checked={showWards}
                  onChange={(e) => setShowWards(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-amber-600" />
                  <span>Municipal Zones</span>
                </span>
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-slate-500" />
                  <span>Main Arterial Roads</span>
                </span>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={(e) => setShowRoads(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <span>🌳</span>
                  <span>Parks & Green Belts</span>
                </span>
                <input
                  type="checkbox"
                  checked={showParks}
                  onChange={(e) => setShowParks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <span>🌊</span>
                  <span>Water Bodies & River</span>
                </span>
                <input
                  type="checkbox"
                  checked={showWater}
                  onChange={(e) => setShowWater(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              {/* Points of Interest */}
              <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider pt-2">
                City Points of Interest (POIs)
              </div>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Government Offices</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGovOffices}
                  onChange={(e) => setShowGovOffices(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <span>🏥</span>
                  <span>Hospitals & Health</span>
                </span>
                <input
                  type="checkbox"
                  checked={showHospitals}
                  onChange={(e) => setShowHospitals(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-semibold">
                <span className="flex items-center gap-2">
                  <span>🏫</span>
                  <span>Schools & Colleges</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSchools}
                  onChange={(e) => setShowSchools(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE FILTER DRAWER (FLOATING TOP/RIGHT) */}
        {filtersDrawerOpen && (
          <div className="absolute top-14 sm:top-16 right-3 sm:right-4 z-20 w-[calc(100%-1.5rem)] max-w-[20rem] sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 sm:p-5 text-xs space-y-4 max-h-[calc(100%-4.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>GIS Incident Filters</span>
              </div>
              <button onClick={() => setFiltersDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Quick Switch */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Quick Resolution Toggle
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl font-bold">
                  <button
                    onClick={() => setPendingOnlyToggle('All')}
                    className={`py-1.5 rounded-lg transition-all ${pendingOnlyToggle === 'All' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPendingOnlyToggle('Pending')}
                    className={`py-1.5 rounded-lg transition-all ${pendingOnlyToggle === 'Pending' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setPendingOnlyToggle('Resolved')}
                    className={`py-1.5 rounded-lg transition-all ${pendingOnlyToggle === 'Resolved' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Issue Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">🔴 Pending</option>
                  <option value="Verified">🟠 Verified</option>
                  <option value="Assigned">🟡 Assigned</option>
                  <option value="Work In Progress">🔵 Work In Progress</option>
                  <option value="Under Inspection">🟣 Under Inspection</option>
                  <option value="Resolved">🟢 Resolved</option>
                  <option value="Closed">⚫ Closed</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Categories</option>
                  <option value="Road Damage">🛣️ Road Damage</option>
                  <option value="Potholes">🕳️ Potholes</option>
                  <option value="Water Leakage">💧 Water Leakage</option>
                  <option value="Garbage">🗑️ Garbage & Waste</option>
                  <option value="Streetlight">💡 Streetlight & Power</option>
                  <option value="Fallen Tree">🌳 Fallen Tree</option>
                  <option value="Construction">🚧 Construction</option>
                  <option value="Drainage">🌊 Drainage & Sewage</option>
                  <option value="Electricity">⚡ Electricity Grid</option>
                  <option value="Traffic Signal">🚦 Traffic Signal</option>
                  <option value="Public Health">🏥 Public Health</option>
                  <option value="Emergency">🔥 Emergency Hazard</option>
                  <option value="Other Civic Issues">🏢 Other Issues</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">🔴 Critical</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              {/* Ward */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Municipal Ward
                </label>
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Wards</option>
                  <option value="Ward 1">Ward 1 - Metro North</option>
                  <option value="Ward 2">Ward 2 - Civic Tech Hub</option>
                  <option value="Ward 3">Ward 3 - Heritage Square</option>
                  <option value="Ward 4">Ward 4 - Central Promenade</option>
                  <option value="Ward 5">Ward 5 - Waterfront East</option>
                  <option value="Ward 6">Ward 6 - Southern Industrial Park</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Departments</option>
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Solid Waste & Sanitation">Solid Waste & Sanitation</option>
                  <option value="Water Supply & Sewage">Water Supply & Sewage</option>
                  <option value="Electrical & Streetlighting">Electrical & Streetlighting</option>
                  <option value="Drainage & Stormwater">Drainage & Stormwater</option>
                  <option value="Parks & Horticulture">Parks & Horticulture</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Timeframe
                </label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="All">All Time</option>
                  <option value="Last 24 Hours">Last 24 Hours</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={resetAllFilters}
                  className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. FLOATING PROFESSIONAL MAP LEGEND PANEL (BOTTOM-RIGHT) */}
        <div className="hidden md:block absolute bottom-6 right-6 z-20 w-80 max-w-sm pointer-events-auto">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden transition-all duration-300">
            {/* Header / Collapse Bar */}
            <div
              onClick={() => setLegendOpen(!legendOpen)}
              className="p-3 bg-slate-100/80 dark:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2 font-extrabold text-xs text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Smart City GIS Map Legend</span>
              </div>
              <button title="Toggle Legend" className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                {legendOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Legend Content */}
            {legendOpen && (
              <div className="p-3.5 space-y-3 text-xs">
                {/* Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => setLegendTab('status')}
                    className={`py-1 rounded-lg transition-all ${legendTab === 'status' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Status
                  </button>

                  <button
                    onClick={() => setLegendTab('category')}
                    className={`py-1 rounded-lg transition-all ${legendTab === 'category' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Category
                  </button>

                  <button
                    onClick={() => setLegendTab('priority')}
                    className={`py-1 rounded-lg transition-all ${legendTab === 'priority' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Priority
                  </button>

                  <button
                    onClick={() => setLegendTab('heatmap')}
                    className={`py-1 rounded-lg transition-all ${legendTab === 'heatmap' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs' : 'text-slate-500'}`}
                  >
                    Heatmap
                  </button>
                </div>

                {/* Tab 1: Status Legend */}
                {legendTab === 'status' && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Pending</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-orange-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Verified</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Assigned</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Work In Progress</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Under Inspection</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Resolved</span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className="w-3 h-3 rounded-full bg-gray-500 border border-white dark:border-slate-800 shrink-0" />
                      <span>Closed / Rejected</span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Category Legend */}
                {legendTab === 'category' && (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>🛣️</span> <span>Road Damage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🕳️</span> <span>Potholes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>💧</span> <span>Water Leakage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🗑️</span> <span>Garbage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>💡</span> <span>Streetlight</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🌳</span> <span>Fallen Tree</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🚧</span> <span>Construction</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🌊</span> <span>Drainage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>⚡</span> <span>Electricity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🚦</span> <span>Traffic Signal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🏥</span> <span>Public Health</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🔥</span> <span>Emergency</span>
                    </div>
                  </div>
                )}

                {/* Tab 3: Priority Legend */}
                {legendTab === 'priority' && (
                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50">
                      <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold">
                        <span>🔴</span> <span>Critical</span>
                      </span>
                      <span className="text-[10px] text-red-600">Immediate Hazard (SLA &lt; 12h)</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/50">
                      <span className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold">
                        <span>🟠</span> <span>High</span>
                      </span>
                      <span className="text-[10px] text-orange-600">Urgent Attention (SLA &lt; 24h)</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/50">
                      <span className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400 font-bold">
                        <span>🟡</span> <span>Medium</span>
                      </span>
                      <span className="text-[10px] text-yellow-600">Routine Dispatch (SLA &lt; 48h)</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>🟢</span> <span>Low</span>
                      </span>
                      <span className="text-[10px] text-emerald-600">Scheduled Work (SLA &lt; 72h)</span>
                    </div>
                  </div>
                )}

                {/* Tab 4: Heatmap Gradient Density Scale */}
                {legendTab === 'heatmap' && (
                  <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Complaint Spatial Density</span>
                      <span className="text-[10px] text-amber-500 font-bold">Intensity Bar</span>
                    </div>

                    {/* Gradient Bar */}
                    <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="text-blue-500">Low Density</span>
                      <span className="text-emerald-500">Moderate</span>
                      <span className="text-yellow-500">High</span>
                      <span className="text-orange-500">Very High</span>
                      <span className="text-red-500">Critical Hotspot</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE FLOATING LEGEND EXPANDABLE BUTTON */}
        <div className="md:hidden absolute bottom-4 right-4 z-20">
          <button
            onClick={() => setMobileLegendDrawerOpen(true)}
            className="px-4 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-2xl border border-slate-700 flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Map Legend & Layers</span>
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET LEGEND DRAWER */}
      {mobileLegendDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center md:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 w-full max-h-[82dvh] overflow-y-auto p-5 pb-safe space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>GIS Legend & Layer Controls</span>
              </h3>
              <button
                onClick={() => setMobileLegendDrawerOpen(false)}
                aria-label="Close legend"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Status Legend Grid */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Status Indicators:</div>
              <div className="grid grid-cols-2 gap-2 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> 🔴 Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /> 🟠 Verified</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> 🟡 Assigned</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> 🔵 Work In Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> 🟣 Under Inspection</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> 🟢 Resolved</span>
              </div>

              <div className="font-bold text-slate-900 dark:text-white pt-2">Density Gradient Scale:</div>
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-400 via-orange-500 to-red-600" />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Hotspot</span>
              </div>
            </div>

            <button
              onClick={() => setMobileLegendDrawerOpen(false)}
              className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl"
            >
              Close Legend
            </button>
          </div>
        </div>
      )}

      {/* FULL COMPLAINT DOSSIER MODAL */}
      {selectedComplaintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 pb-safe space-y-5 text-left shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedComplaintModal.ticketNumber}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                  {selectedComplaintModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaintModal(null)}
                aria-label="Close complaint dossier"
                className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo & Map Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img
                src={selectedComplaintModal.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                alt={selectedComplaintModal.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                }}
                className="w-full h-48 object-cover rounded-2xl border border-[#E5E7EB] dark:border-[#374151] cursor-pointer"
                onClick={() => setSelectedPhotoPreview(selectedComplaintModal.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800')}
              />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Category:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedComplaintModal.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700">
                    {selectedComplaintModal.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Priority:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                    {selectedComplaintModal.priority} Priority
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Ward Location:</span>
                  <span className="font-semibold">{selectedComplaintModal.location.ward}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Assigned Department:</span>
                  <span className="font-semibold text-blue-600">{selectedComplaintModal.departmentAssigned || 'Roads & Infrastructure'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Field Engineer:</span>
                  <span className="font-semibold">{selectedComplaintModal.officerAssigned || 'Eng. Dispatched'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <strong className="block mb-1 text-slate-900 dark:text-white">Detailed Description:</strong>
              {selectedComplaintModal.description}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedComplaintModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE ZOOM MODAL */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              aria-label="Close zoom preview"
              className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center text-white font-bold text-sm bg-black/70 hover:bg-black rounded-full border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="Zoom Preview"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
              }}
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
