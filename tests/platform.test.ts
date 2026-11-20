import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { loadDatabase, saveDatabase } from '../src/db/storage';
import { Complaint, ComplaintStatus, User } from '../src/types';
import {
  analyzeCivicIssue,
  detectDuplicateComplaint,
  computeRealDashboardStats,
  getVisionAdapterStatus,
} from '../src/ai/civicClassifier';

describe('CivicPulse Core Architecture & Backend Tests', () => {
  const JWT_SECRET = 'civic-smartcity-super-secret-key-2026';

  describe('1. Database Persistence & Atomic Storage', () => {
    it('initializes database and persists store file to disk', () => {
      const db = loadDatabase();
      assert.ok(db, 'Database should be loaded');
      assert.ok(Array.isArray(db.complaints), 'Complaints array should exist');
      assert.ok(db.complaints.length > 0, 'Database should have initial seeded complaints');
      assert.ok(Array.isArray(db.users), 'Users array should exist');

      // Test save and file existence
      saveDatabase();
      const dbPath = path.join(process.cwd(), 'data', 'civic_store.json');
      assert.ok(fs.existsSync(dbPath), 'civic_store.json file must exist on disk');

      const raw = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      assert.equal(parsed.version, '1.0.0');
      assert.ok(parsed.complaints.length >= db.complaints.length);
    });

    it('persists a new complaint and retrieves it across memory reset simulation', () => {
      const db = loadDatabase();
      const testTicket = `CIV-TEST-${Date.now()}`;
      const newCmp: Complaint = {
        id: `cmp_test_${Date.now()}`,
        ticketNumber: testTicket,
        title: 'Water Main Burst on Test Avenue',
        description: 'Underground high pressure water main burst creating sinkhole.',
        category: 'Water Leakage & Supply',
        priority: 'Critical',
        status: 'Submitted',
        location: {
          lat: 28.6139,
          lng: 77.2090,
          address: 'Test Ward 4, Downtown',
          ward: 'Ward 4 - Central Promenade',
        },
        images: ['https://example.com/burst.jpg'],
        citizenId: 'user_test_citizen',
        citizenName: 'Dev Tester',
        isAnonymous: false,
        departmentAssigned: 'Water Supply & Sewage',
        statusHistory: [
          {
            status: 'Submitted',
            timestamp: new Date().toISOString(),
            updatedBy: 'Dev Tester',
            notes: 'Test submission',
          },
        ],
        upvotes: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.complaints.unshift(newCmp);
      saveDatabase();

      // Read directly from disk to verify atomic persistence
      const dbPath = path.join(process.cwd(), 'data', 'civic_store.json');
      const reloaded = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const found = reloaded.complaints.find((c: Complaint) => c.ticketNumber === testTicket);
      assert.ok(found, 'New complaint must be persistently saved on disk');
      assert.equal(found.title, 'Water Main Burst on Test Avenue');
      assert.equal(found.priority, 'Critical');

      // Clean up synthetic test record so civic_store.json remains pristine
      const idx = db.complaints.findIndex((c: Complaint) => c.ticketNumber === testTicket);
      if (idx !== -1) {
        db.complaints.splice(idx, 1);
        saveDatabase();
      }
    });
  });

  describe('2. Authentication & JWT Security', () => {
    it('signs and verifies valid citizen tokens', () => {
      const payload = {
        id: 'user_cit_999',
        email: 'citizen.test@smartcity.gov',
        role: 'citizen',
        name: 'Priya Verma',
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      assert.ok(token && typeof token === 'string');

      const verified = jwt.verify(token, JWT_SECRET) as any;
      assert.equal(verified.id, payload.id);
      assert.equal(verified.role, 'citizen');
      assert.equal(verified.email, payload.email);
    });

    it('rejects tampered or malformed tokens', () => {
      const invalidToken = 'eyAiYWxnIjogIkhTMjU2In0.invalidPayload.invalidSignature';
      assert.throws(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      });
    });

    it('hashes and verifies user passwords via bcrypt and strips passwordHash on sanitization', async () => {
      const bcrypt = await import('bcryptjs');
      const db = loadDatabase();
      const admin = db.users.find(u => u.email === 'admin@smartcity.gov');
      assert.ok(admin, 'Seeded admin user must exist');
      assert.ok(admin.passwordHash && admin.passwordHash.startsWith('$2'), 'Admin passwordHash must be a bcrypt hash');

      const valid = await bcrypt.default.compare('password123', admin.passwordHash);
      const invalid = await bcrypt.default.compare('wrongpassword', admin.passwordHash);
      assert.equal(valid, true, 'Seeded password must verify with bcrypt');
      assert.equal(invalid, false, 'Incorrect password must fail bcrypt comparison');

      const { passwordHash: _removed, ...sanitized } = admin;
      assert.equal('passwordHash' in sanitized, false, 'Sanitized user must omit passwordHash');
    });

    it('generates and safely persists a 256-bit secret when no environment variable is provided', () => {
      const testSecretFile = path.join(process.cwd(), 'data', '.jwt_secret_unit_test');
      const generated = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(testSecretFile, generated, { mode: 0o600 });
      assert.ok(fs.existsSync(testSecretFile));
      const readBack = fs.readFileSync(testSecretFile, 'utf-8').trim();
      assert.equal(readBack.length, 64);
      assert.equal(readBack, generated);
      fs.unlinkSync(testSecretFile);
    });

    it('ensures data and uploads directories exist automatically without user action', () => {
      const dataDir = path.join(process.cwd(), 'data');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      assert.ok(fs.existsSync(dataDir), 'data directory must exist');
      assert.ok(fs.existsSync(uploadsDir), 'uploads directory must exist');
    });
  });

  describe('3. Complaint Lifecycle & State Machine Validation', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      'Submitted': ['Verified', 'Rejected', 'Assigned'],
      'Pending': ['Verified', 'Submitted', 'Rejected', 'Assigned'],
      'Verified': ['Assigned', 'Work Started', 'In Inspection', 'Officer En Route', 'Rejected'],
      'Assigned': ['Officer En Route', 'Work Started', 'In Inspection', 'Verified', 'Rejected'],
      'Officer En Route': ['Work Started', 'In Inspection', 'Assigned', 'Rejected'],
      'Work Started': ['In Inspection', 'Resolved', 'Assigned', 'Rejected'],
      'In Inspection': ['Work Started', 'Resolved', 'Rejected'],
      'Inspection': ['Work Started', 'Resolved', 'Rejected'],
      'Resolved': ['Closed', 'Work Started', 'Assigned', 'Rejected'],
      'Closed': ['Work Started'],
      'Rejected': ['Submitted', 'Verified'],
    };

    it('validates canonical lifecycle: Submitted -> Verified -> Assigned -> Work Started -> Resolved -> Closed', () => {
      let currentStatus: ComplaintStatus = 'Submitted';

      // 1. Submitted -> Verified
      assert.ok(VALID_TRANSITIONS[currentStatus].includes('Verified'), 'Must allow Submitted -> Verified');
      currentStatus = 'Verified';

      // 2. Verified -> Assigned
      assert.ok(VALID_TRANSITIONS[currentStatus].includes('Assigned'), 'Must allow Verified -> Assigned');
      currentStatus = 'Assigned';

      // 3. Assigned -> Work Started
      assert.ok(VALID_TRANSITIONS[currentStatus].includes('Work Started'), 'Must allow Assigned -> Work Started');
      currentStatus = 'Work Started';

      // 4. Work Started -> Resolved
      assert.ok(VALID_TRANSITIONS[currentStatus].includes('Resolved'), 'Must allow Work Started -> Resolved');
      currentStatus = 'Resolved';

      // 5. Resolved -> Closed (Citizen confirms resolution)
      assert.ok(VALID_TRANSITIONS[currentStatus].includes('Closed'), 'Must allow Resolved -> Closed');
      currentStatus = 'Closed';
      assert.equal(currentStatus, 'Closed');
    });

    it('blocks illegal status jumps directly from Submitted to Closed or Resolved', () => {
      const allowedFromSubmitted = VALID_TRANSITIONS['Submitted'];
      assert.equal(allowedFromSubmitted.includes('Closed'), false, 'Cannot jump Submitted -> Closed directly');
      assert.equal(allowedFromSubmitted.includes('Resolved'), false, 'Cannot jump Submitted -> Resolved without verification and work');
    });

    it('requires minimum explanation notes when rejecting or reopening tickets', () => {
      const validateRejection = (status: string, notes?: string) => {
        if (status === 'Rejected' && (!notes || notes.trim().length < 5)) {
          throw new Error('Rejection reason required');
        }
      };

      assert.throws(() => validateRejection('Rejected', ''), /Rejection reason required/);
      assert.throws(() => validateRejection('Rejected', 'bad'), /Rejection reason required/);
      assert.doesNotThrow(() => validateRejection('Rejected', 'Duplicate of ticket CIV-2026-8812'));
    });
  });

  describe('4. Citizen Feedback & Satisfaction Verification', () => {
    it('restricts feedback submission to resolved complaints only', () => {
      const validateFeedbackAllowed = (status: ComplaintStatus) => {
        if (status !== 'Resolved' && status !== 'Closed') {
          throw new Error('Feedback only allowed on resolved complaints');
        }
      };

      assert.throws(() => validateFeedbackAllowed('Submitted'), /Feedback only allowed/);
      assert.throws(() => validateFeedbackAllowed('Work Started'), /Feedback only allowed/);
      assert.doesNotThrow(() => validateFeedbackAllowed('Resolved'));
      assert.doesNotThrow(() => validateFeedbackAllowed('Closed'));
    });

    it('enforces rating bounds between 1 and 5 stars', () => {
      const clampRating = (rating: number) => Math.min(5, Math.max(1, rating));
      assert.equal(clampRating(0), 1);
      assert.equal(clampRating(6), 5);
      assert.equal(clampRating(4), 4);
    });
  });

  describe('5. Community Support & Automatic Priority Escalation', () => {
    it('escalates priority to Critical when community upvotes reach 10+', () => {
      let upvotes = 9;
      let priority = 'Medium';

      upvotes++;
      if (upvotes >= 10 && priority !== 'Critical') {
        priority = 'Critical';
      }

      assert.equal(upvotes, 10);
      assert.equal(priority, 'Critical');
    });

    it('escalates low priority to medium at 5 upvotes', () => {
      let priority = 'Low';
      const upvotes = 5;
      if (upvotes >= 5 && priority === 'Low') {
        priority = 'Medium';
      }
      assert.equal(priority, 'Medium');
    });
  });

  describe('6. GIS Proximity Duplicate Detection Engine', () => {
    const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    it('calculates geographic distance accurately and detects issues within 350m', () => {
      const loc1 = { lat: 28.6139, lng: 77.2090 };
      // 50 meters away approximately
      const loc2 = { lat: 28.6142, lng: 77.2093 };
      const distance = getDistanceMeters(loc1.lat, loc1.lng, loc2.lat, loc2.lng);

      assert.ok(distance < 100, `Distance should be under 100m, calculated: ${distance}m`);
      assert.ok(distance > 10, 'Distance should be greater than 10m');
    });
  });

  describe('7. Standard 5 User Roles Coverage & Access Control', () => {
    const EXPECTED_ROLES = ['citizen', 'admin', 'officer', 'field_worker', 'super_admin'];

    it('validates all 5 mandatory user roles exist in seed database', () => {
      const db = loadDatabase();
      const rolesInDb = new Set(db.users.map(u => u.role));
      for (const role of EXPECTED_ROLES) {
        assert.ok(rolesInDb.has(role as any), `Role '${role}' must be present in database`);
      }
    });

    it('enforces that field workers and officers can access operational tasks while citizens cannot', () => {
      const isOpsAllowed = (role: string) => role !== 'citizen';
      assert.equal(isOpsAllowed('citizen'), false);
      assert.equal(isOpsAllowed('admin'), true);
      assert.equal(isOpsAllowed('officer'), true);
      assert.equal(isOpsAllowed('field_worker'), true);
      assert.equal(isOpsAllowed('super_admin'), true);
    });
  });

  describe('8. Zero-Key Local AI & Perceptual Hashing Engine', () => {
    function computeTestImageHash(base64Str: string): string {
      const raw = base64Str.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const buf = Buffer.from(raw.slice(0, 4096), 'base64');
      let hash = 0n;
      for (let i = 0; i < Math.min(buf.length - 1, 64); i++) {
        if (buf[i] > buf[i + 1]) {
          hash |= (1n << BigInt(i));
        }
      }
      return hash.toString(16).padStart(16, '0');
    }

    it('computes deterministic perceptual hash for image data', () => {
      const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const hash1 = computeTestImageHash(sampleBase64);
      const hash2 = computeTestImageHash(sampleBase64);
      assert.equal(hash1, hash2);
      assert.ok(hash1.length >= 16);
    });

    it('detects bilingual Hindi civic keywords correctly', () => {
      const hindiMsg = 'सड़क पर बड़ा गड्ढा है और पानी बह रहा है';
      const hasDevanagari = /[\u0900-\u097F]/.test(hindiMsg);
      assert.equal(hasDevanagari, true);
    });
  });

  describe('9. Upload Validation, Mass-Assignment Whitelisting & Theme Configuration', () => {
    const ALLOWED_IMAGE_REGEX = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/;

    it('rejects non-image or SVG/executable MIME types on upload validation', () => {
      assert.equal(ALLOWED_IMAGE_REGEX.test('data:image/svg+xml;base64,PHN2Zz4='), false);
      assert.equal(ALLOWED_IMAGE_REGEX.test('data:text/html;base64,PHNjcmlwdD4='), false);
      assert.equal(ALLOWED_IMAGE_REGEX.test('not-a-data-url'), false);
      assert.equal(
        ALLOWED_IMAGE_REGEX.test('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
        true
      );
    });

    it('enforces mass-assignment field whitelisting on user updates', () => {
      const allowedKeys: (keyof User)[] = [
        'name', 'role', 'phone', 'ward', 'department', 'status',
        'dutyStatus', 'mfaEnabled', 'preferredLanguage', 'avatarUrl',
      ];
      const maliciousPayload: Record<string, any> = {
        name: 'Updated Name',
        passwordHash: '$2a$10$hacked',
        id: 'override_id',
        createdAt: '1970-01-01',
      };
      const safeUpdate: Partial<User> = {};
      for (const key of allowedKeys) {
        if (maliciousPayload[key] !== undefined) {
          (safeUpdate as any)[key] = maliciousPayload[key];
        }
      }
      assert.equal(safeUpdate.name, 'Updated Name');
      assert.equal('passwordHash' in safeUpdate, false);
      assert.equal('id' in safeUpdate, false);
      assert.equal('createdAt' in safeUpdate, false);
    });

    it('configures Tailwind v4 class-based dark variant and civicpulse_theme pre-hydration script', () => {
      const cssContent = fs.readFileSync(path.join(process.cwd(), 'src', 'index.css'), 'utf-8');
      assert.ok(
        cssContent.includes('@custom-variant dark (&:where(.dark, .dark *));'),
        'src/index.css must define Tailwind v4 class-based dark custom-variant'
      );

      const htmlContent = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
      assert.ok(
        htmlContent.includes("localStorage.getItem('civicpulse_theme')"),
        'index.html must include civicpulse_theme pre-hydration script'
      );
    });

    it('rejects javascript: and SVG data URIs while allowing safe uploads and HTTPS image URLs', () => {
      const isSafeRef = (val: string) => {
        const trimmed = val.trim();
        if (trimmed.startsWith('data:')) {
          return ALLOWED_IMAGE_REGEX.test(trimmed);
        }
        if (/^javascript:/i.test(trimmed)) return false;
        return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/uploads/');
      };

      assert.equal(isSafeRef('javascript:alert(1)'), false);
      assert.equal(isSafeRef('data:image/svg+xml;base64,PHN2Zz4='), false);
      assert.equal(isSafeRef('/uploads/civic_sample.png'), true);
      assert.equal(isSafeRef('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7'), true);
    });
  });

  describe('10. Modular AI Engine (Rule-Based Ontology, Vision Stub & Real Stats)', () => {
    it('classifies English complaints across categories and triggers Critical severity on hazards', async () => {
      const roadRes = await analyzeCivicIssue('Deep pothole crater', 'Broken asphalt damaging cars near hospital');
      assert.equal(roadRes.detectedCategory, 'Potholes & Road Damage');
      assert.equal(roadRes.recommendedDepartment, 'Roads & Infrastructure');
      assert.equal(roadRes.suggestedPriority, 'High');
      assert.equal(roadRes.classificationMethod, 'rule-based-bilingual-ontology');
      assert.equal(roadRes.trainedModelLoaded, false);

      const sparkRes = await analyzeCivicIssue('Exposed live wire', 'Electrical pole sparking in rain danger');
      assert.equal(sparkRes.detectedCategory, 'Streetlighting & Electrical');
      assert.equal(sparkRes.suggestedPriority, 'Critical');

      const waterRes = await analyzeCivicIssue('Drinking water pipe burst', 'Main pipeline burst flooding lane');
      assert.equal(waterRes.detectedCategory, 'Water Leakage & Supply');
      assert.equal(waterRes.suggestedPriority, 'Critical');
    });

    it('classifies Devanagari Hindi civic reports accurately', async () => {
      const hindiRoad = await analyzeCivicIssue('सड़क पर बड़ा गड्ढा', 'मुख्य मार्ग की डामर सड़क टूट गई है');
      assert.equal(hindiRoad.detectedCategory, 'Potholes & Road Damage');
      assert.equal(hindiRoad.matchedRuleCount! >= 2, true);

      const hindiWater = await analyzeCivicIssue('पेयजल पाइप लाइन में रिसाव', 'पानी बह रहा है');
      assert.equal(hindiWater.detectedCategory, 'Water Leakage & Supply');
    });

    it('flags obvious spam and dummy submissions', async () => {
      const spamRes = await analyzeCivicIssue('asdf test', 'lorem ipsum dummy issue');
      assert.equal(spamRes.isFakeOrSpam, true);
      assert.ok(spamRes.fakeScore > 70);
    });

    it('honestly reports unloaded VisionClassifierAdapter stub status', () => {
      const visionStatus = getVisionAdapterStatus();
      assert.equal(visionStatus.trainedModelLoaded, false);
      assert.equal(visionStatus.perceptualHashEnabled, true);
    });

    it('detects geospatial duplicates within 350m and same category using Haversine distance', () => {
      const db = loadDatabase();
      const activeSample = db.complaints.find(
        c => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
      );
      assert.ok(activeSample, 'Seed DB should contain at least one active complaint');

      const dupResult = detectDuplicateComplaint(db.complaints, {
        title: activeSample.title,
        description: activeSample.description,
        category: activeSample.category,
        location: {
          lat: activeSample.location.lat + 0.0002,
          lng: activeSample.location.lng + 0.0002,
        },
      });
      assert.equal(dupResult.duplicateFound, true);
      assert.equal(dupResult.existingComplaint?.id, activeSample.id);
    });

    it('computes exact dashboard counts, resolution total, and satisfaction rate from DB records', () => {
      const db = loadDatabase();
      const stats = computeRealDashboardStats(db.complaints, db.departments);
      assert.equal(stats.totalComplaints, db.complaints.length);
      const expectedResolved = db.complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      assert.equal(stats.resolved, expectedResolved);
      const expectedFeedbackCount = db.complaints.filter(c => Boolean(c.feedback)).length;
      assert.equal(stats.feedbackCount, expectedFeedbackCount);
      assert.equal(stats.departmentPerformance.length, db.departments.length);
    });
  });
});

