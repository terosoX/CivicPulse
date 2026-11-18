export interface GISPOI {
  id: string;
  name: string;
  type: 'government' | 'hospital' | 'school';
  lat: number;
  lng: number;
  address: string;
  ward: string;
  details: string;
}

export interface GISWardBoundary {
  id: string;
  name: string;
  code: string;
  councillor: string;
  population: string;
  coordinates: [number, number][];
  color: string;
}

export interface GISZone {
  id: string;
  name: string;
  type: 'Residential' | 'Commercial' | 'Industrial' | 'Green Belt';
  color: string;
  coordinates: [number, number][];
}

export interface GISRoad {
  id: string;
  name: string;
  type: 'Expressway' | 'Arterial' | 'Avenue';
  coordinates: [number, number][];
}

export interface GISLandFeature {
  id: string;
  name: string;
  type: 'park' | 'water';
  color: string;
  coordinates: [number, number][];
}

// 1. Ward Boundaries (Polygons)
export const SMART_CITY_WARDS: GISWardBoundary[] = [
  {
    id: 'w1',
    name: 'Ward 1 - Metro North',
    code: 'W-01',
    councillor: 'Anita Anand',
    population: '45,000',
    color: '#3b82f6',
    coordinates: [
      [28.628, 77.195],
      [28.635, 77.215],
      [28.620, 77.215],
      [28.620, 77.195],
    ],
  },
  {
    id: 'w2',
    name: 'Ward 2 - Civic Tech Hub',
    code: 'W-02',
    councillor: 'Rahul Mehta',
    population: '62,000',
    color: '#8b5cf6',
    coordinates: [
      [28.635, 77.215],
      [28.635, 77.235],
      [28.620, 77.235],
      [28.620, 77.215],
    ],
  },
  {
    id: 'w3',
    name: 'Ward 3 - Heritage Square',
    code: 'W-03',
    councillor: 'Siddharth Roy',
    population: '38,000',
    color: '#f59e0b',
    coordinates: [
      [28.620, 77.195],
      [28.620, 77.210],
      [28.605, 77.210],
      [28.605, 77.195],
    ],
  },
  {
    id: 'w4',
    name: 'Ward 4 - Central Promenade',
    code: 'W-04',
    councillor: 'Kavita Reddy',
    population: '54,000',
    color: '#06b6d4',
    coordinates: [
      [28.620, 77.210],
      [28.620, 77.235],
      [28.605, 77.235],
      [28.605, 77.210],
    ],
  },
  {
    id: 'w5',
    name: 'Ward 5 - Waterfront East',
    code: 'W-05',
    councillor: 'Tariq Hussain',
    population: '41,000',
    color: '#10b981',
    coordinates: [
      [28.605, 77.215],
      [28.605, 77.235],
      [28.590, 77.235],
      [28.590, 77.215],
    ],
  },
  {
    id: 'w6',
    name: 'Ward 6 - Southern Industrial Park',
    code: 'W-06',
    councillor: 'Deepak Joshi',
    population: '70,000',
    color: '#ec4899',
    coordinates: [
      [28.605, 77.195],
      [28.605, 77.215],
      [28.590, 77.215],
      [28.590, 77.195],
    ],
  },
];

// 2. Municipal Zones
export const MUNICIPAL_ZONES: GISZone[] = [
  {
    id: 'z1',
    name: 'Central Business & Commercial Zone',
    type: 'Commercial',
    color: '#f59e0b',
    coordinates: [
      [28.618, 77.208],
      [28.622, 77.225],
      [28.610, 77.225],
      [28.610, 77.208],
    ],
  },
  {
    id: 'z2',
    name: 'High-Density Residential Hub',
    type: 'Residential',
    color: '#3b82f6',
    coordinates: [
      [28.625, 77.200],
      [28.632, 77.230],
      [28.622, 77.230],
      [28.622, 77.200],
    ],
  },
  {
    id: 'z3',
    name: 'Southern Logistics & Industrial Belt',
    type: 'Industrial',
    color: '#a855f7',
    coordinates: [
      [28.602, 77.198],
      [28.602, 77.230],
      [28.592, 77.230],
      [28.592, 77.198],
    ],
  },
];

// 3. Main Roads
export const MUNICIPAL_ROADS: GISRoad[] = [
  {
    id: 'r1',
    name: 'Central Promenade Expressway (Grand Avenue)',
    type: 'Expressway',
    coordinates: [
      [28.635, 77.210],
      [28.620, 77.210],
      [28.605, 77.210],
      [28.590, 77.210],
    ],
  },
  {
    id: 'r2',
    name: 'Ring Road 2 (Tech Hub Corridor)',
    type: 'Arterial',
    coordinates: [
      [28.628, 77.195],
      [28.628, 77.215],
      [28.628, 77.235],
    ],
  },
  {
    id: 'r3',
    name: 'Waterfront Boulevard',
    type: 'Avenue',
    coordinates: [
      [28.608, 77.195],
      [28.608, 77.220],
      [28.600, 77.235],
    ],
  },
];

// 4. Parks and Water Bodies
export const PARKS_AND_RECREATION: GISLandFeature[] = [
  {
    id: 'p1',
    name: 'Central Botanical Municipal Park',
    type: 'park',
    color: '#22c55e',
    coordinates: [
      [28.616, 77.200],
      [28.619, 77.206],
      [28.613, 77.206],
      [28.613, 77.200],
    ],
  },
  {
    id: 'p2',
    name: 'Waterfront Esplanade Green Belt',
    type: 'park',
    color: '#10b981',
    coordinates: [
      [28.598, 77.220],
      [28.603, 77.232],
      [28.594, 77.232],
      [28.594, 77.220],
    ],
  },
];

export const WATER_BODIES: GISLandFeature[] = [
  {
    id: 'w_body1',
    name: 'City Grand River & Spillway',
    type: 'water',
    color: '#0284c7',
    coordinates: [
      [28.635, 77.230],
      [28.620, 77.228],
      [28.600, 77.232],
      [28.590, 77.234],
    ],
  },
  {
    id: 'w_body2',
    name: 'Heritage Square Central Lake',
    type: 'water',
    color: '#0369a1',
    coordinates: [
      [28.611, 77.198],
      [28.614, 77.202],
      [28.608, 77.202],
      [28.608, 77.198],
    ],
  },
];

// 5. POIs: Government Offices, Hospitals, Schools
export const GOVERNMENT_OFFICES: GISPOI[] = [
  {
    id: 'gov_1',
    name: 'Municipal Corporation Head Office (City Hall)',
    type: 'government',
    lat: 28.6145,
    lng: 77.2085,
    address: '1 Civic Square, Ward 4 - Central Promenade',
    ward: 'Ward 4 - Central Promenade',
    details: 'Executive Offices, Public Grievance Desk & GIS Control Room.',
  },
  {
    id: 'gov_2',
    name: 'Central Police Headquarters & Emergency Cell',
    type: 'government',
    lat: 28.6180,
    lng: 77.2120,
    address: 'Police Line Road, Ward 4 - Central Promenade',
    ward: 'Ward 4 - Central Promenade',
    details: '24/7 Police Dispatch & Smart City CCTV Command Hub.',
  },
  {
    id: 'gov_3',
    name: 'Sub-Divisional Municipal Office (Tech Hub)',
    type: 'government',
    lat: 28.6270,
    lng: 77.2220,
    address: 'Sector 3 Tech Hub Road, Ward 2 - Civic Tech Hub',
    ward: 'Ward 2 - Civic Tech Hub',
    details: 'Property tax collection & ward civil work desk.',
  },
];

export const HOSPITALS: GISPOI[] = [
  {
    id: 'hosp_1',
    name: 'Smart City Civil Apex Hospital',
    type: 'hospital',
    lat: 28.6110,
    lng: 77.2150,
    address: 'Health Avenue, Ward 4 - Central Promenade',
    ward: 'Ward 4 - Central Promenade',
    details: '500-bed multispecialty public hospital with 24/7 Trauma Care.',
  },
  {
    id: 'hosp_2',
    name: 'Ward 2 Tech Hub Emergency Care Unit',
    type: 'hospital',
    lat: 28.6280,
    lng: 77.2250,
    address: 'Innovators Ring Road, Ward 2',
    ward: 'Ward 2 - Civic Tech Hub',
    details: 'Urgent care center & ambulance dispatch hub.',
  },
  {
    id: 'hosp_3',
    name: 'Southern Industrial General Dispensary',
    type: 'hospital',
    lat: 28.5980,
    lng: 77.2050,
    address: 'Factory Gate 4, Ward 6',
    ward: 'Ward 6 - Southern Industrial Park',
    details: 'Public occupational health clinic & emergency unit.',
  },
];

export const SCHOOLS: GISPOI[] = [
  {
    id: 'sch_1',
    name: 'Central Public Senior Academy',
    type: 'school',
    lat: 28.6170,
    lng: 77.2010,
    address: 'Heritage Boulevard, Ward 3',
    ward: 'Ward 3 - Heritage Square',
    details: 'Premier municipal model school.',
  },
  {
    id: 'sch_2',
    name: 'Smart City Institute of Engineering & Technology',
    type: 'school',
    lat: 28.6290,
    lng: 77.2210,
    address: 'University Road, Ward 2',
    ward: 'Ward 2 - Civic Tech Hub',
    details: 'Public higher education & innovation campus.',
  },
];

// Helper dictionaries for category icons and colors
export const CATEGORY_ICON_MAP: Record<string, { emoji: string; color: string }> = {
  'Road Damage': { emoji: '🛣️', color: '#ea580c' },
  'Potholes & Road Damage': { emoji: '🕳️', color: '#dc2626' },
  'Potholes': { emoji: '🕳️', color: '#dc2626' },
  'Water Leakage & Supply': { emoji: '💧', color: '#0284c7' },
  'Water Leakage': { emoji: '💧', color: '#0284c7' },
  'Garbage & Solid Waste': { emoji: '🗑️', color: '#16a34a' },
  'Garbage': { emoji: '🗑️', color: '#16a34a' },
  'Streetlighting & Electrical': { emoji: '💡', color: '#eab308' },
  'Streetlight': { emoji: '💡', color: '#eab308' },
  'Fallen Tree': { emoji: '🌳', color: '#15803d' },
  'Construction': { emoji: '🚧', color: '#d97706' },
  'Drainage & Sewage Overflow': { emoji: '🌊', color: '#0369a1' },
  'Drainage': { emoji: '🌊', color: '#0369a1' },
  'Electricity': { emoji: '⚡', color: '#ca8a04' },
  'Traffic Signal': { emoji: '🚦', color: '#b91c1c' },
  'Public Health': { emoji: '🏥', color: '#0284c7' },
  'Emergency': { emoji: '🔥', color: '#b91c1c' },
  'Other Civic Issues': { emoji: '🏢', color: '#64748b' },
};

export const STATUS_COLOR_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Pending': { label: 'Pending', color: '#ef4444', bg: 'bg-red-500', dot: '🔴' },
  'Submitted': { label: 'Pending', color: '#ef4444', bg: 'bg-red-500', dot: '🔴' },
  'Verified': { label: 'Verified', color: '#f97316', bg: 'bg-orange-500', dot: '🟠' },
  'Assigned': { label: 'Assigned', color: '#eab308', bg: 'bg-yellow-500', dot: '🟡' },
  'Work Started': { label: 'Work In Progress', color: '#3b82f6', bg: 'bg-blue-500', dot: '🔵' },
  'Work In Progress': { label: 'Work In Progress', color: '#3b82f6', bg: 'bg-blue-500', dot: '🔵' },
  'In Inspection': { label: 'Under Inspection', color: '#a855f7', bg: 'bg-purple-500', dot: '🟣' },
  'Under Inspection': { label: 'Under Inspection', color: '#a855f7', bg: 'bg-purple-500', dot: '🟣' },
  'Resolved': { label: 'Resolved', color: '#10b981', bg: 'bg-emerald-500', dot: '🟢' },
  'Closed': { label: 'Closed', color: '#6b7280', bg: 'bg-gray-500', dot: '⚫' },
  'Rejected': { label: 'Closed', color: '#6b7280', bg: 'bg-gray-500', dot: '⚫' },
};

export const PRIORITY_COLOR_MAP: Record<string, { label: string; color: string; badgeClass: string; dot: string }> = {
  'Critical': { label: 'Critical', color: '#ef4444', badgeClass: 'bg-red-100 text-red-800 border-red-300', dot: '🔴' },
  'High': { label: 'High', color: '#f97316', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300', dot: '🟠' },
  'Medium': { label: 'Medium', color: '#eab308', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: '🟡' },
  'Low': { label: 'Low', color: '#10b981', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: '🟢' },
};
