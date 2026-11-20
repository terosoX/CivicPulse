export type UserRole = 'citizen' | 'admin' | 'officer' | 'field_worker' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  ward?: string;
  department?: string;
  avatarUrl?: string;
  status?: 'active' | 'suspended' | 'pending';
  lastLogin?: string;
  dutyStatus?: 'On Duty' | 'Off Duty' | 'On Leave';
  mfaEnabled?: boolean;
  preferredLanguage?: Language;
  passwordHash?: string;
  createdAt: string;
}

export type IssueCategory =
  | 'Potholes & Road Damage'
  | 'Garbage & Solid Waste'
  | 'Water Leakage & Supply'
  | 'Streetlighting & Electrical'
  | 'Drainage & Sewage Overflow'
  | 'Illegal Dumping & Encroachment'
  | 'Fallen Tree & Horticulture'
  | 'Parks & Public Amenities'
  | 'Public Health & Sanitation'
  | 'Traffic & Signage Issues';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Pending'
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'Officer En Route'
  | 'Work Started'
  | 'Inspection'
  | 'In Inspection'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  ward: string;
  landmark?: string;
}

export interface StatusHistoryItem {
  status: ComplaintStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
  photoUrl?: string;
}

export interface FeedbackData {
  rating: number; // 1 - 5
  review: string;
  verificationImage?: string;
  confirmedResolved: boolean;
  createdAt: string;
}

export interface AIAnalysisResult {
  detectedCategory: IssueCategory;
  suggestedPriority: PriorityLevel;
  recommendedDepartment: string;
  fakeScore: number; // 0 (genuine) to 100 (suspicious)
  isFakeOrSpam: boolean;
  duplicateFound: boolean;
  duplicateComplaintId?: string;
  duplicateReason?: string;
  summary: string;
  keyKeywords: string[];
  priorityConfidence?: number;
  classificationMethod?: 'rule-based-bilingual-ontology' | 'hybrid-ml-adapter';
  trainedModelLoaded?: boolean;
  visionAdapter?: string;
  matchedRuleCount?: number;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: PriorityLevel;
  status: ComplaintStatus;
  location: LocationData;
  images: string[];
  beforeImage?: string;
  afterImage?: string;
  citizenId: string;
  citizenName: string;
  isAnonymous: boolean;
  departmentAssigned?: string;
  officerAssigned?: string;
  officerPhone?: string;
  aiAnalysis?: AIAnalysisResult;
  statusHistory: StatusHistoryItem[];
  feedback?: FeedbackData;
  govtComments?: string[];
  estimatedResolutionDate?: string;
  upvotes: number;
  supportedUserIds?: string[];
  isEmergency?: boolean;
  emergencyCategory?: 'Fire' | 'Gas Leakage' | 'Electric Hazard' | 'Road Accident' | 'Flooding';
  createdAt: string;
  updatedAt: string;
}

export interface OfficerPerformance {
  id: string;
  name: string;
  department: string;
  phone: string;
  assignedCount: number;
  resolvedCount: number;
  avgResponseMinutes: number;
  avgCompletionHours: number;
  rating: number; // 1-5
  status: 'On Duty' | 'Off Duty' | 'On Field';
  avatarUrl?: string;
}

export interface WardPerformanceStats {
  id: string;
  name: string;
  code: string;
  councillor: string;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  avgResolutionHours: number;
  citizenSatisfactionRate: number; // 0-100%
  slaCompliancePercent: number; // 0-100%
  rank: number;
}

export interface Department {
  id: string;
  name: string;
  headName: string;
  email: string;
  phone: string;
  activeTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  councillor: string;
  activeComplaints: number;
  resolvedComplaints: number;
  population: number;
}

export type AnnouncementCategory =
  | 'Road Closure'
  | 'Traffic Advisory'
  | 'Water Supply'
  | 'Electricity Maintenance'
  | 'Garbage Collection'
  | 'Drainage'
  | 'Public Health'
  | 'Emergency'
  | 'Weather Alert'
  | 'Events'
  | 'Municipal Notice'
  | 'Construction'
  | 'Environment'
  | 'Education'
  | 'Public Safety'
  | 'Others';

export type AnnouncementPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'docx' | 'image' | 'zip';
}

export interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: AnnouncementCategory | string;
  priority: AnnouncementPriority | 'Normal' | 'Urgent' | 'Emergency';
  department?: string;
  bannerImage?: string;
  attachments?: AnnouncementAttachment[];
  targetWards?: string[];
  ward?: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  scheduledAt?: string;
  author?: string;
  createdBy?: string;
  authorRole?: string;
  status?: 'Published' | 'Scheduled' | 'Draft' | 'Archived';
  isPinned?: boolean;
  isFeatured?: boolean;
  views?: number;
  bookmarks?: number;
  location?: string;
  duration?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  complaintId?: string;
  title: string;
  message: string;
  type: 'status_update' | 'assignment' | 'announcement' | 'message';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalComplaints: number;
  todayComplaints: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  criticalCount: number;
  avgResolutionHours: number;
  citizenSatisfactionRate: number; // 0-100%
  categoryCounts: Record<string, number>;
  wardCounts: Record<string, number>;
  monthlyTrend: { month: string; complaints: number; resolved: number }[];
  departmentPerformance: { name: string; avgHours: number; total: number; resolved: number }[];
}

export type Language = 'en' | 'hi';

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  targetEntity: string;
  entityId: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
  details?: string;
}

export interface SystemSettings {
  portalName: string;
  cityCorporationName: string;
  helplinePhone: string;
  supportEmail: string;
  maintenanceMode: boolean;
  aiClassificationEnabled: boolean;
  aiSpamDetectionSensitivity: number; // 0-100
  slaBreachHoursThreshold: number;
  autoAssignComplaints: boolean;
  mfaEnforcedForAllAdmins: boolean;
  maxFileUploadSizeMB: number;
  emergencyBroadcastBanner: string;
  emergencyBannerActive: boolean;
}

export interface ComplaintCategoryConfig {
  id: string;
  name: IssueCategory | string;
  defaultSlaHours: number;
  priorityWeight: 'Low' | 'Medium' | 'High' | 'Critical';
  defaultDepartment: string;
  iconName: string;
  color: string;
  active: boolean;
  autoTriage: boolean;
}

export interface SecuritySession {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  ipAddress: string;
  device: string;
  loginTime: string;
  lastActive: string;
  status: 'Active' | 'Terminated';
}

export interface SystemHealthMetrics {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  databaseConnections: number;
  apiResponseLatencyMs: number;
  geminiApiQuotaUsedPercent: number;
  geminiTokenCountToday: number;
  systemUptime: string;
  status: 'Healthy' | 'Degraded' | 'Critical';
}

export interface EmergencyBroadcast {
  id: string;
  title: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Critical' | 'Disaster';
  targetWards: string[];
  sentAt: string;
  sentBy: string;
  reachCount: number;
  channels: ('SMS' | 'Push' | 'Web Banner' | 'Email')[];
}

