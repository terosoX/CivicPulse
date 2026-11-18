import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  INITIAL_COMPLAINTS,
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DEPARTMENTS,
  INITIAL_OFFICERS,
  INITIAL_WARD_PERFORMANCE,
} from '../data/initialSeedData';
import {
  INITIAL_SUPER_ADMIN_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_CATEGORY_CONFIGS,
  INITIAL_SECURITY_SESSIONS,
  INITIAL_HEALTH_METRICS,
  INITIAL_EMERGENCY_BROADCASTS,
} from '../data/superAdminSeedData';
import {
  Complaint,
  User,
  Announcement,
  AuditLog,
  SystemSettings,
  ComplaintCategoryConfig,
  SecuritySession,
  SystemHealthMetrics,
  EmergencyBroadcast,
  Department,
  WardPerformanceStats,
  OfficerPerformance,
  NotificationItem,
} from '../types';

export interface DatabaseStore {
  version: string;
  lastUpdated: string;
  users: User[];
  complaints: Complaint[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  categoryConfigs: ComplaintCategoryConfig[];
  securitySessions: SecuritySession[];
  healthMetrics: SystemHealthMetrics;
  emergencyBroadcasts: EmergencyBroadcast[];
  departments: Department[];
  wardPerformance: WardPerformanceStats[];
  officers: OfficerPerformance[];
  notifications: NotificationItem[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_FILE || path.join(DATA_DIR, 'civic_store.json');

// In-memory cache synced with disk
let dbCache: DatabaseStore | null = null;
let cachedDefaultHash: string | null = null;

function getDefaultDemoPasswordHash(): string {
  if (!cachedDefaultHash) {
    cachedDefaultHash = bcrypt.hashSync('password123', 10);
  }
  return cachedDefaultHash;
}

function ensureUserPasswordHash(user: User): { user: User; changed: boolean } {
  if (user.passwordHash && user.passwordHash.startsWith('$2')) {
    return { user, changed: false };
  }
  return {
    user: {
      ...user,
      passwordHash: getDefaultDemoPasswordHash(),
    },
    changed: true,
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initializeDefaultData(): DatabaseStore {
  const userMap = new Map<string, User>();
  [...INITIAL_SUPER_ADMIN_USERS, ...INITIAL_USERS].forEach(u => {
    const normalized = ensureUserPasswordHash(u).user;
    userMap.set(normalized.email.toLowerCase(), normalized);
  });
  const users = Array.from(userMap.values());

  const initialNotifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'user_citizen_1',
      complaintId: 'cmp_1001',
      title: 'Ticket Status Updated',
      message: 'Your ticket CIV-2026-8812 is now Under Inspection by Roads & Infrastructure Dept.',
      type: 'status_update',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    users,
    complaints: [...INITIAL_COMPLAINTS],
    announcements: [...INITIAL_ANNOUNCEMENTS],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    systemSettings: { ...INITIAL_SYSTEM_SETTINGS },
    categoryConfigs: [...INITIAL_CATEGORY_CONFIGS],
    securitySessions: [...INITIAL_SECURITY_SESSIONS],
    healthMetrics: { ...INITIAL_HEALTH_METRICS },
    emergencyBroadcasts: [...INITIAL_EMERGENCY_BROADCASTS],
    departments: [...INITIAL_DEPARTMENTS],
    wardPerformance: [...INITIAL_WARD_PERFORMANCE],
    officers: [...INITIAL_OFFICERS],
    notifications: initialNotifications,
  };
}

export function loadDatabase(): DatabaseStore {
  if (dbCache) return dbCache;

  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData) as DatabaseStore;
      if (parsed && Array.isArray(parsed.complaints) && Array.isArray(parsed.users)) {
        let needsSave = false;
        parsed.users = parsed.users.map((u) => {
          const checked = ensureUserPasswordHash(u);
          if (checked.changed) needsSave = true;
          return checked.user;
        });
        const existingEmails = new Set(parsed.users.map(u => u.email.toLowerCase()));
        [...INITIAL_SUPER_ADMIN_USERS, ...INITIAL_USERS].forEach(u => {
          if (!existingEmails.has(u.email.toLowerCase())) {
            parsed.users.push(ensureUserPasswordHash(u).user);
            existingEmails.add(u.email.toLowerCase());
            needsSave = true;
          }
        });
        dbCache = parsed;
        if (needsSave) {
          saveDatabase(dbCache);
        }
        return dbCache;
      }
    } catch (err) {
      console.error('[DB] Error reading existing database file. Creating fresh snapshot:', err);
    }
  }

  // First time initialization
  dbCache = initializeDefaultData();
  saveDatabase(dbCache);
  return dbCache;
}

export function saveDatabase(data?: DatabaseStore): void {
  try {
    ensureDataDir();
    const toSave = data || dbCache;
    if (!toSave) return;

    toSave.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to persist database store to disk:', err);
  }
}

export function getDatabase(): DatabaseStore {
  if (!dbCache) {
    return loadDatabase();
  }
  return dbCache;
}
