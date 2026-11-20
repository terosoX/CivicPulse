import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_COMPLAINTS,
  INITIAL_USERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DEPARTMENTS,
  INITIAL_OFFICERS,
  INITIAL_WARD_PERFORMANCE,
} from './src/data/initialSeedData';
import {
  INITIAL_SUPER_ADMIN_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_CATEGORY_CONFIGS,
  INITIAL_SECURITY_SESSIONS,
  INITIAL_HEALTH_METRICS,
  INITIAL_EMERGENCY_BROADCASTS,
} from './src/data/superAdminSeedData';
import { Complaint, User, Announcement, DashboardStats, AIAnalysisResult, IssueCategory, PriorityLevel, NotificationItem, AuditLog, SystemSettings, ComplaintCategoryConfig, SecuritySession, SystemHealthMetrics, EmergencyBroadcast, Department, WardPerformanceStats } from './src/types';
import { loadDatabase, saveDatabase } from './src/db/storage';
import {
  analyzeCivicIssue,
  calculateHammingSimilarity,
  computeImageHash,
  computeRealDashboardStats,
  computeStatisticalForecast,
  detectDuplicateComplaint,
  getVisionAdapterStatus,
} from './src/ai/civicClassifier';

// Self-Managed Storage & Configuration Defaults (100% Optional Environment Variables)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DATABASE_FILE = process.env.DATABASE_FILE || path.join(DATA_DIR, 'civic_store.json');
const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const AI_ENGINE = process.env.AI_ENGINE || 'local_self_managed';
const PORT = Number(process.env.PORT) || 3000;

// Automatically create data and uploads directories if missing
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Automatically retrieve or generate a cryptographically secure 256-bit persistent JWT Secret
function getOrGenerateJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.join(DATA_DIR, '.jwt_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const stored = fs.readFileSync(secretFile, 'utf-8').trim();
      if (stored.length >= 32) {
        return stored;
      }
    }
  } catch {
    // fallback to generation
  }

  // Generate cryptographically secure 256-bit random secret
  const newSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(secretFile, newSecret, { mode: 0o600 });
  } catch (err) {
    console.warn('[Security] Could not persist JWT secret to disk:', err);
  }
  return newSecret;
}

const JWT_SECRET = getOrGenerateJwtSecret();

const ALLOWED_IMAGE_DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function validateBase64Image(imageBase64: string): { valid: true; ext: string; buffer: Buffer } | { valid: false; error: string } {
  const match = imageBase64.match(ALLOWED_IMAGE_DATA_URL_REGEX);
  if (!match) {
    return { valid: false, error: 'Invalid image format. Only base64 PNG, JPEG, or WEBP data URLs are allowed.' };
  }
  const mimeSubType = match[1].split('/')[1];
  const ext = mimeSubType === 'jpeg' ? 'jpg' : mimeSubType;
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    return { valid: false, error: 'Image size must be between 1 byte and 5 MB.' };
  }
  return { valid: true, ext, buffer };
}

function isSafeMediaRef(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const trimmed = val.trim();
  if (trimmed.startsWith('data:')) {
    return validateBase64Image(trimmed).valid;
  }
  if (/^javascript:/i.test(trimmed)) return false;
  return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/uploads/');
}

// Persistent Database Collections (Auto-persisted to disk at data/civic_store.json)
const db = loadDatabase();
let users: User[] = db.users;
let complaints: Complaint[] = db.complaints;
let announcements: Announcement[] = db.announcements;
let auditLogs: AuditLog[] = db.auditLogs;
let systemSettings: SystemSettings = db.systemSettings;
let categoryConfigs: ComplaintCategoryConfig[] = db.categoryConfigs;
let securitySessions: SecuritySession[] = db.securitySessions;
let healthMetrics: SystemHealthMetrics = db.healthMetrics;
let emergencyBroadcasts: EmergencyBroadcast[] = db.emergencyBroadcasts;
let departmentsList = db.departments;
let wardsList = db.wardPerformance;
let officersList = db.officers;
let wardPerformanceList = db.wardPerformance;
let notifications: NotificationItem[] = db.notifications;

// Allowed lifecycle transitions:
// Reported (Submitted) -> Under Verification -> Assigned -> In Progress (Work Started/En Route/Inspection) -> Resolved -> Closed
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Submitted': ['Verified', 'Rejected', 'Assigned'],
  'Pending': ['Verified', 'Submitted', 'Rejected', 'Assigned'],
  'Verified': ['Assigned', 'Work Started', 'In Inspection', 'Officer En Route', 'Rejected'],
  'Assigned': ['Officer En Route', 'Work Started', 'In Inspection', 'Verified', 'Rejected'],
  'Officer En Route': ['Work Started', 'In Inspection', 'Assigned', 'Rejected'],
  'Work Started': ['In Inspection', 'Resolved', 'Assigned', 'Rejected'],
  'In Inspection': ['Work Started', 'Resolved', 'Rejected'],
  'Inspection': ['Work Started', 'Resolved', 'Rejected'],
  'Resolved': ['Closed', 'Work Started', 'Assigned', 'Rejected'], // 'Work Started'/'Assigned' allows reopening
  'Closed': ['Work Started'], // Reopened by municipal supervisor
  'Rejected': ['Submitted', 'Verified'], // Appealed or re-evaluated
};

async function startServer() {
  const app = express();

  // Reverse proxy configuration (sensible default for Cloud Run / Nginx / Docker)
  const trustProxySetting = process.env.TRUST_PROXY;
  if (trustProxySetting === 'false' || trustProxySetting === '0') {
    app.set('trust proxy', false);
  } else {
    app.set('trust proxy', 1);
  }

  // Cross-Origin Resource Sharing (CORS) with sensible defaults
  const allowedOriginsSetting = process.env.ALLOWED_ORIGINS;
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOriginsSetting && allowedOriginsSetting !== '*') {
      const allowed = allowedOriginsSetting.split(',').map(s => s.trim().toLowerCase());
      if (origin && allowed.includes(origin.toLowerCase())) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '15mb' }));

  // Strip sensitive passwordHash from all API user responses
  const sanitizeUser = (u: User): User => {
    const { passwordHash: _passwordHash, ...safe } = u;
    return safe as User;
  };

  // Helper middleware for JWT check
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return res.status(401).json({ error: 'Invalid or expired token' });
      const dbUser = users.find(u => u.id === decoded.id);
      if (dbUser && dbUser.status === 'suspended') {
        return res.status(403).json({ error: 'Account is suspended' });
      }
      req.user = decoded;
      next();
    });
  };

  // Optional JWT extractor for routes that support both authenticated users and public reporting
  const extractOptionalUser = (req: any): { id: string; name: string; role: string; email: string } | null => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return null;
      return jwt.verify(token, JWT_SECRET) as { id: string; name: string; role: string; email: string };
    } catch {
      return null;
    }
  };

  // Role-based access control middleware
  const requireRoles = (...allowedRoles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this operation' });
    }
    next();
  };

  // Static Uploads Directory
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ==========================================
  // SYSTEM HEALTH & DIAGNOSTICS
  // ==========================================
  app.get('/api/health', (req, res) => {
    const visionStatus = getVisionAdapterStatus();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      complaintsCount: complaints.length,
      usersCount: users.length,
      storageEngine: `Atomic JSON File Database (${DATABASE_FILE})`,
      environment: process.env.NODE_ENV || 'production',
      aiEngine: AI_ENGINE === 'local_self_managed'
        ? 'CivicPulse Bilingual Rule-Based Ontology & dHash Engine (Zero External API Keys)'
        : AI_ENGINE,
      visionAdapter: visionStatus,
      offlineReady: true,
      supportedRoles: ['Citizen', 'Administrator', 'Department Officer', 'Field Worker', 'Super Administrator'],
      jwtSecurity: process.env.JWT_SECRET ? 'Environment-Configured' : 'Auto-Generated Cryptographic Key (256-bit Persistent)',
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Register Citizen
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, phone, ward } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingUser) {
        return res.status(400).json({ error: 'Email address is already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser: User = {
        id: `user_citizen_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'citizen',
        phone: phone || '',
        ward: ward || 'Ward 4 - Central Promenade',
        status: 'active',
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveDatabase();

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: sanitizeUser(newUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    const passwordValid = user.passwordHash
      ? await bcrypt.compare(String(password), user.passwordHash)
      : false;
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role check: If logging into official portal, citizen role is blocked
    if (role && role !== 'citizen') {
      if (user.role === 'citizen') {
        return res.status(403).json({ error: 'Citizen accounts cannot access government administrative portals.' });
      }
    }

    user.lastLogin = new Date().toISOString();
    saveDatabase();

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  });

  // Demo Session Switcher (issues signed JWT only for seeded demo personas)
  app.post('/api/auth/demo-session', (req, res) => {
    const { role } = req.body || {};
    const canonicalEmails: Record<string, string> = {
      citizen: 'citizen@smartcity.gov',
      admin: 'admin@smartcity.gov',
      officer: 'roads@smartcity.gov',
      field_worker: 'worker@smartcity.gov',
      super_admin: 'superadmin@smartcity.gov',
    };
    const targetEmail = canonicalEmails[String(role || 'admin')];
    if (!targetEmail) {
      return res.status(400).json({ error: 'Invalid demo role requested' });
    }
    const user = users.find(u => u.email.toLowerCase() === targetEmail) || users.find(u => u.role === role);
    if (!user) {
      return res.status(404).json({ error: 'Demo persona not found' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
    if (user) {
      return res.json({ message: `Password reset link has been dispatched to ${email}. Check your inbox.` });
    }
    res.json({ message: 'If an account exists with this email, a reset link was sent.' });
  });

  // Get Current Profile
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  });

  // ==========================================
  // LOCAL AI & MACHINE LEARNING ENDPOINTS
  // 100% Self-Managed • Zero External API Keys
  // ==========================================

  // 1. AI Analysis of Civic Issue
  app.post('/api/ai/analyze-issue', async (req, res) => {
    try {
      const { title, description, imageBase64, location } = req.body;

      if (imageBase64 !== undefined && imageBase64 !== null && imageBase64 !== '') {
        if (typeof imageBase64 !== 'string') {
          return res.status(400).json({ error: 'Invalid image payload.' });
        }
        if (imageBase64.startsWith('data:') || imageBase64.length > 20) {
          const check = validateBase64Image(imageBase64);
          if ('error' in check) {
            return res.status(400).json({ error: check.error });
          }
        }
      }

      const aiResult = await analyzeCivicIssue(title, description, imageBase64, location);
      const dupCheck = detectDuplicateComplaint(complaints, {
        title,
        description,
        category: aiResult.detectedCategory,
        imageBase64,
        location,
      });

      if (dupCheck.duplicateFound && dupCheck.existingComplaint) {
        aiResult.duplicateFound = true;
        aiResult.duplicateComplaintId = dupCheck.existingComplaint.ticketNumber;
        aiResult.duplicateReason = dupCheck.reason;
      }

      res.json({ aiAnalysis: aiResult });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI analysis failed' });
    }
  });

  // 2. AI Voice Parse Endpoint
  app.post('/api/ai/voice-parse', async (req, res) => {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    const analysis = await analyzeCivicIssue(transcript.slice(0, 50), transcript);
    res.json({
      title: transcript.length > 60 ? `${transcript.slice(0, 57)}...` : transcript,
      description: transcript,
      category: analysis.detectedCategory,
      priority: analysis.suggestedPriority,
    });
  });

  // 3. AI Bilingual Assistant (English & Hindi)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const lowerMsg = message.toLowerCase();
      const isHindi = /[\u0900-\u097F]/.test(message);
      let reply = '';

      // Check Ticket Status Match
      const ticketMatch = message.match(/CIV-2026-\d+|CIV-\d+/i);
      if (ticketMatch) {
        const found = complaints.find(c => c.ticketNumber.toUpperCase() === ticketMatch[0].toUpperCase());
        if (found) {
          if (isHindi) {
            reply = `### शिकायत विवरण: **${found.ticketNumber}**\n\n` +
              `• **शीर्षक:** ${found.title}\n` +
              `• **स्थिति:** \`${found.status}\`\n` +
              `• **श्रेणी:** ${found.category}\n` +
              `• **वार्ड:** ${found.location.ward}\n` +
              `• **आवंटित विभाग:** ${found.departmentAssigned || 'सड़क एवं अवसंरचना'}\n` +
              `• **प्रभारी अधिकारी:** ${found.officerAssigned || 'इंजीनियर विक्रम सेठी'}\n` +
              `• **पंजीकरण दिनांक:** ${new Date(found.createdAt).toLocaleDateString()}\n\n` +
              `आप **Citizen Portal** पर इस शिकायत की वास्तविक समय स्थिति और प्रगति ट्रैक कर सकते हैं।`;
          } else {
            reply = `### Ticket Details for **${found.ticketNumber}**\n\n` +
              `• **Title:** ${found.title}\n` +
              `• **Status:** \`${found.status}\`\n` +
              `• **Category:** ${found.category}\n` +
              `• **Ward:** ${found.location.ward}\n` +
              `• **Assigned Dept:** ${found.departmentAssigned || 'Roads & Infrastructure'}\n` +
              `• **Assigned Officer:** ${found.officerAssigned || 'Eng. Vikram Sethi'}\n` +
              `• **Reported Date:** ${new Date(found.createdAt).toLocaleDateString()}\n\n` +
              `You can view live updates and verify completion in the **Citizen Portal** timeline.`;
          }
        } else {
          reply = isHindi
            ? `नगर निगम डेटाबेस में **${ticketMatch[0]}** से संबंधित कोई शिकायत नहीं मिली। कृपया टिकट नंबर की पुष्टि करें।`
            : `I searched our local municipal database, but could not find a ticket matching **${ticketMatch[0]}**. Please verify your ticket ID on your receipt or in your Citizen Dashboard.`;
        }
      } else if (lowerMsg.includes('report') || lowerMsg.includes('file') || lowerMsg.includes('शिकायत') || lowerMsg.includes('दर्ज')) {
        if (isHindi) {
          reply = `### CivicPulse पर शिकायत दर्ज करने की प्रक्रिया\n\n` +
            `1. मुख्य नेविगेशन में **"Report an Issue"** बटन पर क्लिक करें।\n` +
            `2. **साक्ष्य अपलोड:** समस्या (गड्ढा, कचरा, लीकेज) की स्पष्ट फोटो अपलोड करें।\n` +
            `3. **स्थानीय AI वर्गीकरण:** हमारा ऑन-प्रिमाइसेस AI स्वतः समस्या की श्रेणी व प्राथमिकता निर्धारित करता है।\n` +
            `4. **स्थान चयन:** इंटरैक्टिव GIS मानचित्र पर स्थान चुनें या जीपीएस ऑटो-डिटेक्ट चालू करें।\n` +
            `5. **सबमिट:** आपको तुरंत यूनिक ट्रैकिंग आईडी और डिजिटल क्यूआर कोड प्राप्त होगा।`;
        } else {
          reply = `### How to File a Civic Complaint on CivicPulse\n\n` +
            `1. Click the **"Report an Issue"** button in the top navigation bar or citizen dashboard.\n` +
            `2. **Upload Evidence:** Select or capture a photo of the damaged road, street light, or garbage heap.\n` +
            `3. **Local AI Auto-Triage:** Our on-premise AI automatically detects the category, priority, and assigns the responsible department.\n` +
            `4. **Select Location:** Tap on the interactive GIS map or enable GPS auto-detect.\n` +
            `5. **Submit:** Receive your instant tracking ticket ID and QR code!`;
        }
      } else if (lowerMsg.includes('helpline') || lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('नंबर') || lowerMsg.includes('हेल्पलाइन')) {
        if (isHindi) {
          reply = `### नगर निगम आपातकालीन एवं विभागीय हेल्पलाइन\n\n` +
            `• **24/7 नागरिक टोल-फ्री:** 1800-233-CIVIC (1800-233-2484)\n` +
            `• **आपदा एवं आपातकालीन नियंत्रण कक्ष:** 112\n` +
            `• **ठोस अपशिष्ट एवं स्वच्छता हेल्पलाइन:** 1800-555-WASTE\n` +
            `• **जल आपूर्ति एवं सीवर आपातकाल:** 1800-444-WATER\n` +
            `• **स्ट्रीटलाइट एवं विद्युत मरम्मत:** 1800-777-LIGHT\n\n` +
            `*नगर निगम केंद्रीय नियंत्रण कक्ष 24 घंटे कार्यरत रहता है।*`;
        } else {
          reply = `### Municipal Emergency & Department Helplines\n\n` +
            `• **24/7 Civic Toll-Free:** 1800-233-CIVIC (1800-233-2484)\n` +
            `• **Disaster & Emergency Control:** 112\n` +
            `• **Solid Waste & Sanitation:** 1800-555-WASTE\n` +
            `• **Water Supply Leakage:** 1800-444-WATER\n` +
            `• **Streetlighting Repair:** 1800-777-LIGHT\n\n` +
            `*Municipal Control Center operates 24/7 at City Hall.*`;
        }
      } else if (lowerMsg.includes('department') || lowerMsg.includes('ward') || lowerMsg.includes('विभाग') || lowerMsg.includes('वार्ड')) {
        if (isHindi) {
          reply = `### नगर निगम विभाग एवं वार्ड कवरेज\n\n` +
            `CivicPulse शहर के 6 प्रमुख वार्डों में 7 विभागों को एकीकृत करता है:\n\n` +
            `1. **सड़क एवं अवसंरचना:** सड़क के गड्ढे, पेवर ब्लॉक, डिवाइडर मरम्मत\n` +
            `2. **ठोस अपशिष्ट एवं स्वच्छता:** कचरा डिपो, डस्टबिन ओवरफ्लो, सफाई\n` +
            `3. **जल आपूर्ति एवं सीवेज:** पाइपलाइन लीकेज, गंदा पानी, जल दबाव\n` +
            `4. **विद्युत एवं स्ट्रीटलाइट:** बंद बत्तियां, ढीले तार, नया पोल\n` +
            `5. **जल निकासी एवं बरसाती नाले:** नाला चोक, जलभराव निवारण\n` +
            `6. **उद्यान एवं बागवानी:** गिरे हुए पेड़, शाखा छंटाई, पार्क रखरखाव\n` +
            `7. **सार्वजनिक स्वास्थ्य एवं अतिक्रमण:** कीटनाशक छिड़काव, अवैध कब्जा हटाना`;
        } else {
          reply = `### Municipal Departments & Ward Coverage\n\n` +
            `CivicPulse integrates 7 core municipal departments across 6 urban wards:\n\n` +
            `1. **Roads & Infrastructure** (Potholes, pavers, road cuts)\n` +
            `2. **Solid Waste & Sanitation** (Garbage dumps, bin overflowing)\n` +
            `3. **Water Supply & Sewage** (Pipeline bursts, contaminated water)\n` +
            `4. **Electrical & Streetlighting** (Dark streets, hanging wires)\n` +
            `5. **Drainage & Stormwater** (Waterlogging, choked drains)\n` +
            `6. **Parks & Horticulture** (Fallen trees, overgrown parks)\n` +
            `7. **Public Health & Encroachment** (Stray animals, illegal stalls)`;
        }
      } else if (lowerMsg.includes('sla') || lowerMsg.includes('time') || lowerMsg.includes('समय') || lowerMsg.includes('कितना')) {
        reply = isHindi
          ? `### नगर निगम संकल्प समय-सीमा (SLA Matrix)\n\n• **क्रिटिकल (Critical):** 4 घंटे के भीतर निवारण\n• **उच्च (High):** 12 घंटे के भीतर निवारण\n• **मध्यम (Medium):** 24 घंटे के भीतर निवारण\n• **सामान्य (Low):** 48 घंटे के भीतर निवारण`
          : `### Municipal Service Level Agreement (SLA Matrix)\n\n• **Critical Priority:** < 4 hours emergency response\n• **High Priority:** < 12 hours resolution target\n• **Medium Priority:** < 24 hours standard dispatch\n• **Low Priority:** < 48 hours scheduled maintenance`;
      } else {
        reply = isHindi
          ? `नमस्ते! मैं **CivicPulse AI** हूँ, आपका 24/7 स्थानीय स्मार्ट सिटी नगर निगम सहायक।\n\nमैं आपकी निम्नलिखित में सहायता कर सकता हूँ:\n• शिकायत स्थिति ट्रैकिंग (उदा. "CIV-2026-8812 की स्थिति")\n• नई शिकायत दर्ज करने के नियम\n• आपातकालीन हेल्पलाइन व विभाग विवरण\n• वार्ड समाधान समय सीमा (SLA)\n\nमैं आपकी किस प्रकार सहायता करूँ?`
          : `Hello! I am **CivicPulse AI**, your 24/7 On-Premise Smart City Municipal Assistant.\n\nI can help you with:\n• Tracking your complaint status (e.g., type "Status of CIV-2026-8812")\n• Step-by-step guidance on filing reports\n• Department contacts and emergency helplines\n• Information on ward coverage & resolution SLAs\n\nHow can I assist you today?`;
      }

      res.json({ reply });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI Chat service error' });
    }
  });

  // 4. Predictive Analytics Forecast Endpoint (Real DB Queue & Moving-Average Estimator)
  app.get('/api/ai/predict', (req, res) => {
    try {
      res.json(computeStatisticalForecast(complaints, wardsList));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Predictive analytics failed' });
    }
  });

  // 5. Image & Issue Similarity Engine
  app.post('/api/ai/similarity', (req, res) => {
    try {
      const { imageBase64, category, ward } = req.body;
      const queryHash = imageBase64 ? computeImageHash(imageBase64) : null;

      const matches = complaints
        .filter(c => c.status !== 'Resolved' && c.status !== 'Closed')
        .map(c => {
          let score = 0;
          if (c.category === category) score += 40;
          if (c.location.ward === ward) score += 30;
          if (queryHash && c.images && c.images.length > 0) {
            const h = computeImageHash(c.images[0]);
            score += Math.round(calculateHammingSimilarity(queryHash, h) * 0.3);
          }
          return {
            ticketNumber: c.ticketNumber,
            title: c.title,
            category: c.category,
            ward: c.location.ward,
            status: c.status,
            similarityScore: Math.min(99, score),
          };
        })
        .filter(m => m.similarityScore > 40)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5);

      res.json({ matches });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Similarity search failed' });
    }
  });

  // 6. Local Image Upload Storage Endpoint
  app.post('/api/upload', (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Base64 image data required' });
      }

      const validation = validateBase64Image(imageBase64);
      if ('error' in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const safeName = `civic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${validation.ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, validation.buffer);

      res.json({
        url: `/uploads/${safeName}`,
        filename: safeName,
        sizeBytes: validation.buffer.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'File upload failed' });
    }
  });

  // ==========================================
  // COMPLAINT MANAGEMENT ENDPOINTS
  // ==========================================

  // Get All Complaints with Filtering & Search
  app.get('/api/complaints', (req, res) => {
    let result = [...complaints];
    const { status, category, ward, priority, search, citizenId } = req.query;

    if (status) result = result.filter(c => c.status === status);
    if (category) result = result.filter(c => c.category === category);
    if (ward) result = result.filter(c => c.location.ward === ward);
    if (priority) result = result.filter(c => c.priority === priority);
    if (citizenId) result = result.filter(c => c.citizenId === citizenId);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(result);
  });

  // Get Single Complaint by ID or Ticket Number
  app.get('/api/complaints/:id', (req, res) => {
    const complaint = complaints.find(
      c => c.id === req.params.id || c.ticketNumber.toLowerCase() === req.params.id.toLowerCase()
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  });

  // Create Complaint
  app.post('/api/complaints', (req, res) => {
    const {
      title,
      description,
      category,
      priority,
      location,
      images,
      isAnonymous,
      citizenId,
      citizenName,
      aiAnalysis,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 4) {
      return res.status(400).json({ error: 'Title is required and must be at least 4 characters long' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 8) {
      return res.status(400).json({ error: 'Description is required and must be at least 8 characters long' });
    }
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || !location.address) {
      return res.status(400).json({ error: 'Valid location with latitude, longitude, and address is required' });
    }
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return res.status(400).json({ error: 'Coordinates are out of geographical range (-90..90, -180..180)' });
    }
    if (Array.isArray(images)) {
      for (const img of images) {
        if (!isSafeMediaRef(img)) {
          return res.status(400).json({ error: 'Invalid image attachment. Only PNG, JPEG, WEBP data URLs (<= 5 MB) or safe image URLs are allowed.' });
        }
      }
    }

    const tokenUser = extractOptionalUser(req);
    const resolvedCitizenId = tokenUser?.id || citizenId || 'user_citizen_1';
    const resolvedCitizenName = isAnonymous
      ? 'Anonymous Citizen'
      : (tokenUser?.name || citizenName || 'Citizen');

    let ticketNumber = `CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    while (complaints.some(c => c.ticketNumber === ticketNumber)) {
      ticketNumber = `CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const newComplaint: Complaint = {
      id: `cmp_${Date.now()}`,
      ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Potholes & Road Damage',
      priority: priority || 'Medium',
      status: 'Submitted',
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: location.address.trim(),
        ward: location.ward || 'Ward 4 - Central Promenade',
        landmark: location.landmark,
      },
      images: images || [],
      beforeImage: images && images[0] ? images[0] : undefined,
      citizenId: resolvedCitizenId,
      citizenName: resolvedCitizenName,
      isAnonymous: Boolean(isAnonymous),
      departmentAssigned: aiAnalysis?.recommendedDepartment || 'Roads & Infrastructure',
      aiAnalysis,
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString(),
          updatedBy: resolvedCitizenName,
          notes: 'Ticket lodged via Smart City Mobile/Web Portal.',
        },
      ],
      upvotes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaints.unshift(newComplaint);

    // Push notification
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newComplaint.citizenId,
      complaintId: newComplaint.id,
      title: 'Complaint Lodged Successfully',
      message: `Your complaint ${newComplaint.ticketNumber} has been logged. Our AI engine is verifying department routing.`,
      type: 'status_update',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    res.status(201).json(newComplaint);
  });

  // Upvote / Support Complaint with priority escalation threshold
  app.post('/api/complaints/:id/upvote', (req, res) => {
    const complaint = complaints.find(c => c.id === req.params.id || c.ticketNumber === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const userId = req.body.userId || 'user_citizen_1';
    if (!complaint.supportedUserIds) complaint.supportedUserIds = [];

    if (complaint.supportedUserIds.includes(userId)) {
      return res.status(400).json({ error: 'You have already supported this complaint.', upvotes: complaint.upvotes });
    }

    complaint.supportedUserIds.push(userId);
    complaint.upvotes = (complaint.upvotes || 0) + 1;

    // Automatic priority escalation based on citizen support thresholds
    if (complaint.upvotes >= 10 && complaint.priority !== 'Critical') {
      complaint.priority = 'Critical';
      complaint.statusHistory.push({
        status: complaint.status,
        timestamp: new Date().toISOString(),
        updatedBy: 'AI Priority Escalation Engine',
        notes: `Priority automatically escalated to Critical due to high community support (${complaint.upvotes} citizens supported).`,
      });
    } else if (complaint.upvotes >= 5 && complaint.priority === 'Low') {
      complaint.priority = 'Medium';
    } else if (complaint.upvotes >= 7 && complaint.priority === 'Medium') {
      complaint.priority = 'High';
    }

    // Add audit log
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Citizen Action',
      adminEmail: 'citizen@smartcity.gov',
      adminRole: 'citizen',
      action: 'COMPLAINT_SUPPORTED',
      targetEntity: 'Complaint Ticket',
      entityId: complaint.ticketNumber,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Citizen supported ticket ${complaint.ticketNumber}. Total votes: ${complaint.upvotes}`,
    });

    saveDatabase();
    res.json({ success: true, upvotes: complaint.upvotes, priority: complaint.priority });
  });

  // Emergency SOS Reporting
  app.post('/api/complaints/emergency', (req, res) => {
    const { emergencyCategory, description, location, citizenName, citizenPhone, imageBase64 } = req.body;

    if (!emergencyCategory || !location) {
      return res.status(400).json({ error: 'Emergency category and location are required' });
    }
    if (imageBase64 && !isSafeMediaRef(imageBase64)) {
      return res.status(400).json({ error: 'Invalid emergency image attachment. Only PNG, JPEG, or WEBP up to 5 MB allowed.' });
    }

    const deptMap: Record<string, string> = {
      'Fire': 'Disaster & Fire Safety Command',
      'Gas Leakage': 'Hazardous Pipeline Control',
      'Electric Hazard': 'Electrical & Streetlighting',
      'Road Accident': 'Emergency Response & Traffic Police',
      'Flooding': 'Drainage & Stormwater Emergency Unit',
    };

    const ticketNumber = `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmergencyComplaint: Complaint = {
      id: `cmp_sos_${Date.now()}`,
      ticketNumber,
      title: `🚨 EMERGENCY SOS: ${emergencyCategory.toUpperCase()} REPORTED`,
      description: description || `Urgent municipal emergency report for ${emergencyCategory}. Immediate field unit intervention required.`,
      category: emergencyCategory === 'Fire' || emergencyCategory === 'Electric Hazard' ? 'Streetlighting & Electrical' : emergencyCategory === 'Flooding' ? 'Drainage & Sewage Overflow' : 'Public Health & Sanitation',
      priority: 'Critical',
      status: 'Submitted',
      location: {
        lat: location.lat || 28.6139,
        lng: location.lng || 77.2090,
        address: location.address || 'Emergency Incident Location',
        ward: location.ward || 'Ward 4 - Central Promenade',
      },
      images: imageBase64 ? [imageBase64] : ['https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=800&auto=format&fit=crop'],
      citizenId: 'user_citizen_1',
      citizenName: citizenName || 'Aarav Sharma',
      isAnonymous: false,
      departmentAssigned: deptMap[emergencyCategory] || 'Disaster & Emergency Command',
      officerAssigned: 'Emergency Response Captain',
      officerPhone: '112 / +1 555-0100',
      isEmergency: true,
      emergencyCategory,
      upvotes: 5,
      estimatedResolutionDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // 2-Hour SLA
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString(),
          updatedBy: 'EMERGENCY SOS BUTTON',
          notes: `🚨 CRITICAL SOS ALERT DISPATCHED. Priority: CRITICAL. 2-Hour SLA activated.`,
        },
      ],
      aiAnalysis: {
        detectedCategory: 'Public Health & Sanitation',
        suggestedPriority: 'Critical',
        recommendedDepartment: deptMap[emergencyCategory] || 'Disaster Command',
        fakeScore: 0,
        isFakeOrSpam: false,
        duplicateFound: false,
        summary: `🚨 CRITICAL EMERGENCY: ${emergencyCategory} hazard at ${location.address || 'location'}. High impact hazard!`,
        keyKeywords: ['emergency', 'sos', emergencyCategory.toLowerCase(), 'hazard'],
        priorityConfidence: 99,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaints.unshift(newEmergencyComplaint);

    // Push high priority emergency notification
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: 'user_citizen_1',
      complaintId: newEmergencyComplaint.id,
      title: `🚨 EMERGENCY SOS LOGGED: ${ticketNumber}`,
      message: `Your emergency alert for ${emergencyCategory} has been dispatched to ${newEmergencyComplaint.departmentAssigned} with top priority!`,
      type: 'status_update',
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Audit log
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'EMERGENCY SOS SYSTEM',
      adminEmail: 'emergency@smartcity.gov',
      adminRole: 'system',
      action: 'EMERGENCY_SOS_DISPATCHED',
      targetEntity: 'Emergency Incident',
      entityId: ticketNumber,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Warning',
      details: `🚨 Critical emergency report created: ${emergencyCategory} at ${location.address || 'location'}.`,
    });

    saveDatabase();
    res.status(201).json(newEmergencyComplaint);
  });

  // Update Status & Progress (Govt Officials)
  app.put('/api/complaints/:id/status', authenticateToken, requireRoles('admin', 'officer', 'field_worker', 'super_admin'), (req, res) => {
    const complaint = complaints.find(c => c.id === req.params.id || c.ticketNumber === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const { status, notes, updatedBy, afterImage, estimatedResolutionDate } = req.body;

    if (status && status !== complaint.status) {
      const allowed = VALID_TRANSITIONS[complaint.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid status transition from '${complaint.status}' to '${status}'. Permitted next stages: ${allowed.join(', ')}`,
        });
      }

      if (status === 'Rejected' && (!notes || notes.trim().length < 5)) {
        return res.status(400).json({
          error: 'A documented rejection reason (minimum 5 characters) is required to reject a complaint.',
        });
      }

      if (complaint.status === 'Resolved' && (status === 'Work Started' || status === 'Assigned') && (!notes || notes.trim().length < 5)) {
        return res.status(400).json({
          error: 'Reopening a resolved complaint requires a documented explanation/grounds.',
        });
      }

      complaint.status = status;
    }

    if (afterImage) {
      if (!isSafeMediaRef(afterImage)) {
        return res.status(400).json({ error: 'Invalid resolution evidence image format.' });
      }
      complaint.afterImage = afterImage;
    }
    if (estimatedResolutionDate) complaint.estimatedResolutionDate = estimatedResolutionDate;
    complaint.updatedAt = new Date().toISOString();

    complaint.statusHistory.push({
      status: complaint.status,
      timestamp: new Date().toISOString(),
      updatedBy: updatedBy || 'Municipal Authority',
      notes,
      photoUrl: afterImage,
    });

    // Notify citizen
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: complaint.citizenId,
      complaintId: complaint.id,
      title: `Ticket ${complaint.ticketNumber} Updated`,
      message: `Status changed to '${complaint.status}'. ${notes || ''}`,
      type: 'status_update',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    res.json(complaint);
  });

  // Assign Department & Officer
  app.post('/api/complaints/:id/assign', authenticateToken, requireRoles('admin', 'officer', 'field_worker', 'super_admin'), (req, res) => {
    const complaint = complaints.find(c => c.id === req.params.id || c.ticketNumber === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const { department, officerName, officerPhone, priority, estimatedResolutionDate } = req.body;

    if (priority && !['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value. Must be Low, Medium, High, or Critical.' });
    }

    if (department) complaint.departmentAssigned = department;
    if (officerName) complaint.officerAssigned = officerName;
    if (officerPhone) complaint.officerPhone = officerPhone;
    if (priority) complaint.priority = priority;
    if (estimatedResolutionDate) complaint.estimatedResolutionDate = estimatedResolutionDate;

    if (complaint.status === 'Submitted' || complaint.status === 'Verified') {
      complaint.status = 'Assigned';
    }
    complaint.updatedAt = new Date().toISOString();

    complaint.statusHistory.push({
      status: complaint.status,
      timestamp: new Date().toISOString(),
      updatedBy: 'Admin Control Center',
      notes: `Assigned to ${department || complaint.departmentAssigned} (${officerName || 'Field Officer'})`,
    });

    saveDatabase();
    res.json(complaint);
  });

  // Citizen Feedback Submission
  app.post('/api/complaints/:id/feedback', (req, res) => {
    const complaint = complaints.find(c => c.id === req.params.id || c.ticketNumber === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      return res.status(400).json({ error: 'Citizen feedback can only be submitted on resolved or closed complaints.' });
    }

    const { rating, review, verificationImage, confirmedResolved } = req.body;
    if (verificationImage && !isSafeMediaRef(verificationImage)) {
      return res.status(400).json({ error: 'Invalid verification image format. Only PNG, JPEG, or WEBP up to 5 MB allowed.' });
    }

    const safeRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));

    complaint.feedback = {
      rating: safeRating,
      review: typeof review === 'string' ? review.trim() : '',
      verificationImage,
      confirmedResolved: Boolean(confirmedResolved),
      createdAt: new Date().toISOString(),
    };

    if (confirmedResolved) {
      complaint.status = 'Closed';
      complaint.updatedAt = new Date().toISOString();
      complaint.statusHistory.push({
        status: 'Closed',
        timestamp: new Date().toISOString(),
        updatedBy: complaint.citizenName || 'Citizen',
        notes: `Citizen verified resolution. Rating: ${safeRating}/5 stars.`,
      });
    }

    saveDatabase();
    res.json(complaint);
  });

  // AI Duplicate Complaint Detection Endpoint
  app.post('/api/ai/check-duplicate', (req, res) => {
    const { title, description, category, location, imageBase64 } = req.body;
    const dupCheck = detectDuplicateComplaint(complaints, {
      title,
      description,
      category,
      location,
      imageBase64,
    });

    if (dupCheck.duplicateFound && dupCheck.existingComplaint) {
      return res.json({
        duplicateFound: true,
        existingComplaint: dupCheck.existingComplaint,
        distanceMeters: dupCheck.distanceMeters,
        message: `An active ticket (${dupCheck.existingComplaint.ticketNumber}: "${dupCheck.existingComplaint.title}") was already reported nearby. Support it to prioritize resolution!`,
      });
    }

    res.json({ duplicateFound: false });
  });

  // Officer Performance Leaderboard Stats
  app.get('/api/stats/officers', (req, res) => {
    res.json(officersList);
  });

  // Ward Performance Stats
  app.get('/api/stats/wards', (req, res) => {
    res.json(wardPerformanceList);
  });

  // Public Transparency Portal API (No Auth, PII Anonymized, 100% Real DB Numbers)
  app.get('/api/public/transparency', (req, res) => {
    const realStats = computeRealDashboardStats(complaints, departmentsList);
    const total = realStats.totalComplaints;
    const resolved = realStats.resolved;
    const pending = Math.max(0, total - resolved);

    // Anonymized complaints (strip PII)
    const publicComplaints = [...complaints]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(c => ({
        id: c.id,
        ticketNumber: c.ticketNumber,
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        location: {
          address: c.location.address,
          ward: c.location.ward,
          lat: c.location.lat,
          lng: c.location.lng,
        },
        departmentAssigned: c.departmentAssigned,
        isEmergency: c.isEmergency,
        upvotes: c.upvotes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        images: c.images,
        beforeImage: c.beforeImage,
        afterImage: c.afterImage,
      }));

    res.json({
      summary: {
        totalComplaints: total,
        resolvedComplaints: resolved,
        pendingComplaints: pending,
        resolutionRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
        avgResolutionHours: realStats.avgResolutionHours,
        citizenSatisfactionPercent: realStats.citizenSatisfactionRate,
      },
      categoryCounts: realStats.categoryCounts,
      wardCounts: realStats.wardCounts,
      recentComplaints: publicComplaints.slice(0, 50),
    });
  });

  // ==========================================
  // ANNOUNCEMENTS ENDPOINTS
  // ==========================================

  app.get('/api/announcements', (req, res) => {
    const { search, category, priority, department, status, sortBy } = req.query;
    let filtered = [...announcements];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category === category);
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter(a => a.priority === priority);
    }

    if (department && department !== 'All') {
      filtered = filtered.filter(a => a.department === department);
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(a => (a.status || 'Published') === status);
    }

    // Sort: Pinned & Critical first, then by selected sortBy
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'oldest') {
        return new Date(a.publishedAt || a.createdAt || 0).getTime() - new Date(b.publishedAt || b.createdAt || 0).getTime();
      }
      if (sortBy === 'most_viewed') {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === 'priority') {
        const priorityScore: Record<string, number> = { Critical: 4, High: 3, Urgent: 3, Medium: 2, Low: 1, Normal: 1 };
        return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
      }
      // Default: newest
      return new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime();
    });

    res.json(filtered);
  });

  app.get('/api/announcements/:id', (req, res) => {
    const item = announcements.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Announcement not found' });
    
    // Increment view count
    item.views = (item.views || 0) + 1;
    res.json(item);
  });

  app.post('/api/announcements', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const { title, subtitle, content, category, priority, department, bannerImage, attachments, targetWards, author, authorRole, status, expiresAt, scheduledAt, isPinned, isFeatured, location, duration } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      title,
      subtitle: subtitle || '',
      content,
      category: category || 'Municipal Notice',
      priority: priority || 'Medium',
      department: department || 'Municipal Executive Administration',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop',
      attachments: attachments || [],
      targetWards: targetWards || ['All Wards'],
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt || '',
      scheduledAt: scheduledAt || '',
      author: author || 'Dr. Rajesh Verma',
      authorRole: authorRole || 'Municipal Commissioner',
      status: status || 'Published',
      isPinned: isPinned || false,
      isFeatured: isFeatured || false,
      views: 0,
      bookmarks: 0,
      location: location || 'Citywide',
      duration: duration || 'Active Notice',
    };

    announcements.unshift(newAnnouncement);

    // Create in-app notification for citizens
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: 'user_citizen_1',
      title: `Announcement: ${title.slice(0, 45)}`,
      message: `${category}: ${content.slice(0, 90)}`,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    res.status(201).json(newAnnouncement);
  });

  app.put('/api/announcements/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const index = announcements.findIndex(a => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Announcement not found' });

    const allowedKeys: (keyof Announcement)[] = [
      'title', 'subtitle', 'content', 'category', 'priority', 'department',
      'bannerImage', 'attachments', 'targetWards', 'ward', 'expiresAt',
      'scheduledAt', 'status', 'isPinned', 'isFeatured', 'location', 'duration',
    ];
    const sanitizedPatch: Partial<Announcement> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        (sanitizedPatch as any)[key] = req.body[key];
      }
    }

    announcements[index] = {
      ...announcements[index],
      ...sanitizedPatch,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase();
    res.json(announcements[index]);
  });

  app.delete('/api/announcements/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    announcements = announcements.filter(a => a.id !== req.params.id);
    db.announcements = announcements;
    saveDatabase();
    res.json({ success: true });
  });

  app.post('/api/announcements/:id/bookmark', (req, res) => {
    const item = announcements.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Announcement not found' });
    
    const { isBookmarked } = req.body;
    if (isBookmarked) {
      item.bookmarks = Math.max(0, (item.bookmarks || 0) + 1);
    } else {
      item.bookmarks = Math.max(0, (item.bookmarks || 1) - 1);
    }

    saveDatabase();
    res.json({ success: true, bookmarks: item.bookmarks });
  });

  app.post('/api/announcements/:id/view', (req, res) => {
    const item = announcements.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Announcement not found' });
    
    item.views = (item.views || 0) + 1;
    saveDatabase();
    res.json({ success: true, views: item.views });
  });

  app.post('/api/announcements/:id/archive', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const item = announcements.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Announcement not found' });
    
    item.status = item.status === 'Archived' ? 'Published' : 'Archived';
    item.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json(item);
  });

  // ==========================================
  // NOTIFICATIONS & STATS ENDPOINTS
  // ==========================================

  app.get('/api/notifications', (req, res) => {
    res.json(notifications);
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const n = notifications.find(notif => notif.id === req.params.id);
    if (n) {
      n.read = true;
      saveDatabase();
    }
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    notifications.forEach(n => {
      n.read = true;
    });
    saveDatabase();
    res.json({ success: true });
  });

  app.get('/api/stats/dashboard', (req, res) => {
    const stats = computeRealDashboardStats(complaints, departmentsList);
    res.json(stats);
  });

  app.get('/api/departments', (req, res) => {
    res.json(departmentsList);
  });

  app.post('/api/departments', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const { name, headName, email, phone, avgResolutionHours } = req.body;
    if (!name || !headName || !email) {
      return res.status(400).json({ error: 'Department name, headName, and email are required' });
    }
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      name: String(name).trim(),
      headName: String(headName).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : '+1 555-0100',
      activeTickets: 0,
      resolvedTickets: 0,
      avgResolutionHours: Number(avgResolutionHours) || 24,
    };
    departmentsList.push(newDept);
    db.departments = departmentsList;
    saveDatabase();
    res.status(201).json(newDept);
  });

  app.put('/api/departments/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const idx = departmentsList.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Department not found' });
    const { name, headName, email, phone, avgResolutionHours } = req.body;
    departmentsList[idx] = {
      ...departmentsList[idx],
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(headName !== undefined ? { headName: String(headName).trim() } : {}),
      ...(email !== undefined ? { email: String(email).trim() } : {}),
      ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
      ...(avgResolutionHours !== undefined ? { avgResolutionHours: Number(avgResolutionHours) || 24 } : {}),
    };
    saveDatabase();
    res.json(departmentsList[idx]);
  });

  app.get('/api/wards', (req, res) => {
    res.json(wardsList);
  });

  app.post('/api/wards', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const { name, code, councillor, activeComplaints, resolvedComplaints } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Ward name and code are required' });
    }
    const pendingCount = Number(activeComplaints) || 0;
    const resolvedCount = Number(resolvedComplaints) || 0;
    const newWard: WardPerformanceStats = {
      id: `w_${Date.now()}`,
      name: String(name).trim(),
      code: String(code).trim(),
      councillor: councillor ? String(councillor).trim() : 'Municipal Representative',
      totalComplaints: pendingCount + resolvedCount,
      resolvedComplaints: resolvedCount,
      pendingComplaints: pendingCount,
      avgResolutionHours: 18.0,
      citizenSatisfactionRate: 92,
      slaCompliancePercent: 94,
      rank: wardsList.length + 1,
    };
    wardsList.push(newWard);
    db.wardPerformance = wardsList;
    saveDatabase();
    res.status(201).json(newWard);
  });

  app.put('/api/wards/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const idx = wardsList.findIndex(w => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Ward not found' });
    const { name, code, councillor, activeComplaints, resolvedComplaints, pendingComplaints } = req.body;
    const nextPending = pendingComplaints !== undefined
      ? Number(pendingComplaints)
      : activeComplaints !== undefined
      ? Number(activeComplaints)
      : wardsList[idx].pendingComplaints;
    const nextResolved = resolvedComplaints !== undefined
      ? Number(resolvedComplaints)
      : wardsList[idx].resolvedComplaints;
    wardsList[idx] = {
      ...wardsList[idx],
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(code !== undefined ? { code: String(code).trim() } : {}),
      ...(councillor !== undefined ? { councillor: String(councillor).trim() } : {}),
      pendingComplaints: nextPending,
      resolvedComplaints: nextResolved,
      totalComplaints: nextPending + nextResolved,
    };
    saveDatabase();
    res.json(wardsList[idx]);
  });

  // ==========================================
  // SUPER ADMIN PORTAL ENDPOINTS (RBAC Protected)
  // ==========================================

  // Users Management
  app.get('/api/admin/users', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    let result = users.map(sanitizeUser);
    const { role, ward, status, search } = req.query;

    if (role && role !== 'All') result = result.filter(u => u.role === role);
    if (ward && ward !== 'All') result = result.filter(u => u.ward === ward);
    if (status && status !== 'All') result = result.filter(u => (u.status || 'active') === status);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    }

    res.json(result);
  });

  app.post('/api/admin/users', authenticateToken, requireRoles('admin', 'super_admin'), async (req, res) => {
    const { name, email, role, phone, ward, department, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password && typeof password === 'string' && password.length >= 6 ? password : 'password123', 10);

    const newUser: User = {
      id: `user_${role}_${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      role,
      phone: phone || '',
      ward: ward || 'Ward 4 - Central Promenade',
      department: department || '',
      status: 'active',
      dutyStatus: 'On Duty',
      mfaEnabled: role === 'admin' || role === 'super_admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.unshift(newUser);

    // Audit log
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'USER_ACCOUNT_CREATED',
      targetEntity: 'User Account',
      entityId: newUser.id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Created new ${role} account for ${newUser.name} (${newUser.email}).`,
    });

    saveDatabase();
    res.status(201).json(sanitizeUser(newUser));
  });

  app.put('/api/admin/users/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    const allowedKeys: (keyof User)[] = [
      'name', 'role', 'phone', 'ward', 'department', 'status',
      'dutyStatus', 'mfaEnabled', 'preferredLanguage', 'avatarUrl',
    ];
    const safeUpdate: Partial<User> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        (safeUpdate as any)[key] = req.body[key];
      }
    }

    users[index] = {
      ...users[index],
      ...safeUpdate,
    };

    // Audit log
    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'USER_ACCOUNT_UPDATED',
      targetEntity: 'User Account',
      entityId: users[index].id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Updated details for ${users[index].name}.`,
    });

    saveDatabase();
    res.json(sanitizeUser(users[index]));
  });

  app.delete('/api/admin/users/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    users = users.filter(u => u.id !== req.params.id);
    db.users = users;

    if (user) {
      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminName: 'Super Admin',
        adminEmail: 'superadmin@smartcity.gov',
        adminRole: 'Super Admin',
        action: 'USER_ACCOUNT_DELETED',
        targetEntity: 'User Account',
        entityId: req.params.id,
        ipAddress: req.ip || '127.0.0.1',
        status: 'Warning',
        details: `Deleted user account ${user.name} (${user.email}).`,
      });
    }

    saveDatabase();
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reset-password', authenticateToken, requireRoles('admin', 'super_admin'), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempPassword = `CivicPass#${Math.floor(1000 + Math.random() * 9000)}`;
    user.passwordHash = await bcrypt.hash(tempPassword, 10);

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'PASSWORD_RESET_DISPATCHED',
      targetEntity: 'User Credential',
      entityId: user.id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Temporary password reset generated and hashed for ${user.email}.`,
    });

    saveDatabase();
    res.json({ message: `Password reset dispatched to ${user.email}`, tempPassword });
  });

  // Audit Logs
  app.get('/api/admin/audit-logs', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    res.json(auditLogs);
  });

  // System Settings
  app.get('/api/admin/settings', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    res.json(systemSettings);
  });

  app.put('/api/admin/settings', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const allowedKeys: (keyof SystemSettings)[] = [
      'portalName', 'cityCorporationName', 'helplinePhone', 'supportEmail',
      'maintenanceMode', 'aiClassificationEnabled', 'aiSpamDetectionSensitivity',
      'slaBreachHoursThreshold', 'autoAssignComplaints', 'mfaEnforcedForAllAdmins',
      'maxFileUploadSizeMB', 'emergencyBroadcastBanner', 'emergencyBannerActive',
    ];
    const safeSettings: Partial<SystemSettings> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        (safeSettings as any)[key] = req.body[key];
      }
    }

    systemSettings = { ...systemSettings, ...safeSettings };
    db.systemSettings = systemSettings;

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'SYSTEM_SETTINGS_UPDATED',
      targetEntity: 'System Config',
      entityId: 'global_config',
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Updated global system configuration settings.`,
    });

    saveDatabase();
    res.json(systemSettings);
  });

  // Categories Config
  app.get('/api/admin/categories', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    res.json(categoryConfigs);
  });

  app.put('/api/admin/categories/:id', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const idx = categoryConfigs.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Category config not found' });

    const { defaultSlaHours, priorityWeight, defaultDepartment, active, autoTriage, color } = req.body;
    categoryConfigs[idx] = {
      ...categoryConfigs[idx],
      ...(defaultSlaHours !== undefined ? { defaultSlaHours: Number(defaultSlaHours) } : {}),
      ...(priorityWeight !== undefined ? { priorityWeight } : {}),
      ...(defaultDepartment !== undefined ? { defaultDepartment } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
      ...(autoTriage !== undefined ? { autoTriage: Boolean(autoTriage) } : {}),
      ...(color !== undefined ? { color } : {}),
    };

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'CATEGORY_SLA_CONFIG_UPDATED',
      targetEntity: 'Complaint Category',
      entityId: categoryConfigs[idx].id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success',
      details: `Updated SLA hours & rules for ${categoryConfigs[idx].name}.`,
    });

    saveDatabase();
    res.json(categoryConfigs[idx]);
  });

  // System Health
  app.get('/api/admin/health', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    res.json(healthMetrics);
  });

  // Security Sessions
  app.get('/api/admin/security/sessions', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    res.json(securitySessions);
  });

  app.post('/api/admin/security/sessions/:id/terminate', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const sess = securitySessions.find(s => s.id === req.params.id);
    if (sess) {
      sess.status = 'Terminated';

      auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminName: 'Super Admin',
        adminEmail: 'superadmin@smartcity.gov',
        adminRole: 'Super Admin',
        action: 'SECURITY_SESSION_TERMINATED',
        targetEntity: 'Admin Session',
        entityId: req.params.id,
        ipAddress: req.ip || '127.0.0.1',
        status: 'Warning',
        details: `Revoked session for ${sess.userName} (${sess.ipAddress}).`,
      });
      saveDatabase();
    }

    res.json({ success: true });
  });

  // Emergency Broadcast
  app.post('/api/admin/broadcast', authenticateToken, requireRoles('admin', 'super_admin'), (req, res) => {
    const { title, message, severity, targetWards, channels } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

    const newBroadcast: EmergencyBroadcast = {
      id: `bc_${Date.now()}`,
      title,
      message,
      severity: severity || 'Warning',
      targetWards: targetWards || ['All Wards'],
      sentAt: new Date().toISOString(),
      sentBy: 'Super Admin (Central Control Room)',
      reachCount: 125000,
      channels: channels || ['SMS', 'Push', 'Web Banner'],
    };

    emergencyBroadcasts.unshift(newBroadcast);

    // Create system notifications
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: 'user_citizen_1',
      title: `EMERGENCY BROADCAST: ${title}`,
      message,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString(),
    });

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: 'Super Admin',
      adminEmail: 'superadmin@smartcity.gov',
      adminRole: 'Super Admin',
      action: 'EMERGENCY_BROADCAST_SENT',
      targetEntity: 'Broadcasting Engine',
      entityId: newBroadcast.id,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Warning',
      details: `Dispatched emergency alert: "${title}" to ${targetWards?.join(', ') || 'All Wards'}.`,
    });

    saveDatabase();
    res.status(201).json(newBroadcast);
  });

  // Catch-all 404 for unhandled API routes before Vite / static fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Serve public static assets (robots.txt, sitemap.xml, images, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Civic Portal Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
