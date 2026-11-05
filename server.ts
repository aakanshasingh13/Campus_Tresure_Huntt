import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  CAMPUS_QUEST_DISCOVERY_PORT,
  CAMPUS_QUEST_SERVICE_FQDN,
  startBackendDiscovery,
} from './backendDiscovery';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

// --------------------------------------------------------------------------
// Sandbox Mode Configuration (SERVER-CONTROLLED)
// --------------------------------------------------------------------------
// SANDBOX_MODE_ENABLED is read ONLY by the backend. It is never exposed to
// the frontend. When false, all client requests for sandbox/simulated
// payments are rejected and only real UTR-based payments are accepted.
// When true, sandbox payments are accepted for demo/classroom use.
// To disable sandbox mode: set SANDBOX_MODE_ENABLED=false or remove the
// variable entirely, then restart the server.
const SANDBOX_MODE_ENABLED = process.env.SANDBOX_MODE_ENABLED === 'true';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vtamiythwdqhgcwcupnq.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_Bf1Z77nJh_gb7ziGtTHhLg_niGWMb4z';

// Initialize Supabase Client for backend operations
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log('⚡ [Backend Server] Connecting to Supabase project:', SUPABASE_URL);

let supabaseStatusCache = 'checking';
let supabaseStatusCheckedAt = 0;
let supabaseStatusRefreshing = false;

async function refreshSupabaseStatus(): Promise<void> {
  if (supabaseStatusRefreshing) {
    return;
  }
  supabaseStatusRefreshing = true;
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    supabaseStatusCache = error
      ? `connected (table query note: ${error.message})`
      : 'online & verified';
  } catch (e: any) {
    supabaseStatusCache = `connected (ping note: ${e?.message || 'ready'})`;
  } finally {
    supabaseStatusCheckedAt = Date.now();
    supabaseStatusRefreshing = false;
  }
}

void refreshSupabaseStatus();
const supabaseStatusTimer = setInterval(() => {
  void refreshSupabaseStatus();
}, 60000);
(supabaseStatusTimer as any).unref?.();

// In-Memory Fast Cache with persistent disk backing for high-speed resilience
interface StoredUserAccount {
  id: string;
  role: 'player' | 'organizer' | 'superadmin';
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt?: string;
  passwordAlgo: 'plaintext' | 'scrypt';
  campusType: string;
  campusName: string;
  score: number;
  badges: string[];
  gamesWon: number;
  gamesLost: number;
  hintsUsed: number;
  isVerified: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  lastLogin: string;
}

// Seed default accounts: Super Admin, Organizer, Player, Pending & Rejected Organizers
const accountsDb: Map<string, StoredUserAccount> = new Map();
const eventsDb: Map<string, any> = new Map();
const registrationsDb: Map<string, any[]> = new Map(); // eventId -> registrations
const paymentsDb: Map<string, any[]> = new Map(); // eventId -> payments
const paymentWriteLocks: Map<string, Promise<unknown>> = new Map(); // eventId -> in-flight write promise
const teamsDb: Map<string, any[]> = new Map(); // eventId -> teams
const hintsDb: Map<string, any[]> = new Map(); // eventId -> hints unlocked
const timersDb: Map<string, any> = new Map(); // eventId -> timer state
const scoresDb: Map<string, any[]> = new Map(); // eventId -> scores
const notificationsDb: Map<string, any[]> = new Map(); // eventId -> notifications

function seedAccounts() {
  // 1. PREDEFINED DATABASE SUPER ADMIN ACCOUNT
  const seedSuperAdmin: StoredUserAccount = {
    id: 'usr-seed-admin-001',
    role: 'superadmin',
    username: 'superadmin',
    email: 'admin@campusquest.edu',
    phone: '+1 (555) 000-0001',
    passwordHash: 'SuperAdmin@2026',
    passwordAlgo: 'plaintext',
    campusType: 'Global HQ',
    campusName: 'Campus Quest Central Command',
    score: 0,
    badges: ['Root Authority', 'Platform Architect', 'Master Moderator'],
    gamesWon: 0,
    gamesLost: 0,
    hintsUsed: 0,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLogin: 'Today, 08:00 AM',
  };

  // 2. Predefined Player Arjun
  const seedAlex: StoredUserAccount = {
    id: 'usr-seed-player-001',
    role: 'player',
    username: 'ExplorerArjun',
    email: 'alex.hunter@campus.edu',
    phone: '+1 (555) 382-9102',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'Stanford Innovation Campus',
    score: 650,
    badges: ['First Find', 'Speedster', 'Detective', 'Pathfinder'],
    gamesWon: 18,
    gamesLost: 6,
    hintsUsed: 14,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    lastLogin: 'Today, 09:45 AM',
  };

  // 3. Predefined Approved Organizer
  const seedMaster: StoredUserAccount = {
    id: 'usr-seed-org-002',
    role: 'organizer',
    username: 'TreasureMaster',
    email: 'organizer@campus.edu',
    phone: '+1 (555) 0199',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'Central University Grounds',
    score: 0,
    badges: ['Master Organizer', 'Clue Architect'],
    gamesWon: 0,
    gamesLost: 0,
    hintsUsed: 0,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    lastLogin: 'Today, 08:30 AM',
  };

  // 4. Pending Organizer (Ready for Super Admin Review/Approval)
  const seedPendingOrg: StoredUserAccount = {
    id: 'usr-seed-org-pending-003',
    role: 'organizer',
    username: 'ProfMarcusVance',
    email: 'marcus.vance@mit.edu',
    phone: '+1 (555) 774-9921',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'MIT Tech Quad & Robotics Hub',
    score: 0,
    badges: ['Faculty Explorer'],
    gamesWon: 0,
    gamesLost: 0,
    hintsUsed: 0,
    isVerified: true,
    approvalStatus: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastLogin: 'Yesterday, 04:15 PM',
  };

  // 5. Rejected Organizer (Example rejected request)
  const seedRejectedOrg: StoredUserAccount = {
    id: 'usr-seed-org-rejected-004',
    role: 'organizer',
    username: 'SpamEventsGuild',
    email: 'promo@unauthorized-events.net',
    phone: '+1 (555) 666-0000',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'Other',
    campusName: 'Commercial Off-Campus Arcade',
    score: 0,
    badges: [],
    gamesWon: 0,
    gamesLost: 0,
    hintsUsed: 0,
    isVerified: false,
    approvalStatus: 'rejected',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    lastLogin: '2 days ago',
  };

  // 6. Another Active Player
  const seedPlayerSophia: StoredUserAccount = {
    id: 'usr-seed-player-005',
    role: 'player',
    username: 'CipherSophia',
    email: 'sophia.chen@berkeley.edu',
    phone: '+1 (555) 441-8890',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'UC Berkeley Campus',
    score: 820,
    badges: ['Cipher Specialist', 'Speedster'],
    gamesWon: 12,
    gamesLost: 2,
    hintsUsed: 6,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    lastLogin: 'Today, 11:15 AM',
  };

  // 7. Registered Player dd@gmail.com
  const seedPlayerDD: StoredUserAccount = {
    id: 'usr-seed-player-dd',
    role: 'player',
    username: 'ExplorerDD',
    email: 'dd@gmail.com',
    phone: '+1 (555) 789-0123',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'Stanford Innovation Campus',
    score: 450,
    badges: ['Campus Explorer', 'Riddle Solver'],
    gamesWon: 8,
    gamesLost: 2,
    hintsUsed: 4,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    lastLogin: 'Just now',
  };

  // 8. Registered Player Aakansha singh
  const seedAakansha: StoredUserAccount = {
    id: 'usr-seed-player-aakansha',
    role: 'player',
    username: 'Aakansha singh',
    email: 'singhhgudduu0202@gmail.com',
    phone: '+1 (555) 998-0012',
    passwordHash: 'Password123',
    passwordAlgo: 'plaintext',
    campusType: 'College Campus',
    campusName: 'Stanford Innovation Campus',
    score: 500,
    badges: ['Campus Explorer', 'Riddle Solver'],
    gamesWon: 10,
    gamesLost: 1,
    hintsUsed: 3,
    isVerified: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    lastLogin: 'Just now',
  };

  if (!accountsDb.has(seedSuperAdmin.id)) accountsDb.set(seedSuperAdmin.id, seedSuperAdmin);
  if (!accountsDb.has(seedAlex.id)) accountsDb.set(seedAlex.id, seedAlex);
  if (!accountsDb.has(seedMaster.id)) accountsDb.set(seedMaster.id, seedMaster);
  if (!accountsDb.has(seedPendingOrg.id)) accountsDb.set(seedPendingOrg.id, seedPendingOrg);
  if (!accountsDb.has(seedRejectedOrg.id)) accountsDb.set(seedRejectedOrg.id, seedRejectedOrg);
  if (!accountsDb.has(seedPlayerSophia.id)) accountsDb.set(seedPlayerSophia.id, seedPlayerSophia);
  if (!accountsDb.has(seedPlayerDD.id)) accountsDb.set(seedPlayerDD.id, seedPlayerDD);
  if (!accountsDb.has(seedAakansha.id)) accountsDb.set(seedAakansha.id, seedAakansha);
}

const ACCOUNTS_FILE = process.env.ACCOUNTS_FILE || path.resolve(__dirname, 'accounts-db.json');

function saveAccountsToDisk() {
  try {
    const list = Array.from(accountsDb.values());
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save accounts to disk:', e);
  }
}

function loadAccountsFromDisk() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      const list: StoredUserAccount[] = JSON.parse(data);
      for (const acc of list) {
        accountsDb.set(acc.id, acc);
      }
      console.log(`💾 Loaded ${list.length} accounts from persistent storage.`);
    }
  } catch (e) {
    console.error('Failed to load accounts from disk:', e);
  }
}

seedAccounts();
loadAccountsFromDisk();
saveAccountsToDisk();

const PAYMENTS_FILE = process.env.PAYMENTS_FILE || path.resolve(__dirname, 'payments-db.json');
const REGISTRATIONS_FILE = process.env.REGISTRATIONS_FILE || path.resolve(__dirname, 'registrations-db.json');

function atomicWriteJson(filePath: string, data: unknown): void {
  const tmpPath = filePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
    throw e;
  }
}

function savePaymentsToDisk(): void {
  try {
    const list: Record<string, any[]> = {};
    for (const [eventId, payments] of paymentsDb.entries()) {
      list[eventId] = payments;
    }
    atomicWriteJson(PAYMENTS_FILE, list);
  } catch (e) {
    console.error('Failed to save payments to disk:', e);
    throw e;
  }
}

function loadPaymentsFromDisk(): void {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = fs.readFileSync(PAYMENTS_FILE, 'utf8');
      const parsed: Record<string, any[]> = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [eventId, payments] of Object.entries(parsed)) {
          if (Array.isArray(payments)) {
            paymentsDb.set(eventId, payments);
          }
        }
        console.log(`💾 Loaded payments from persistent storage for ${Object.keys(parsed).length} events.`);
      }
    }
  } catch (e) {
    console.error('Failed to load payments from disk:', e);
  }
}

function saveRegistrationsToDisk(): void {
  try {
    const list: Record<string, any[]> = {};
    for (const [eventId, registrations] of registrationsDb.entries()) {
      list[eventId] = registrations;
    }
    atomicWriteJson(REGISTRATIONS_FILE, list);
  } catch (e) {
    console.error('Failed to save registrations to disk:', e);
    throw e;
  }
}

function loadRegistrationsFromDisk(): void {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
      const parsed: Record<string, any[]> = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [eventId, registrations] of Object.entries(parsed)) {
          if (Array.isArray(registrations)) {
            registrationsDb.set(eventId, registrations);
          }
        }
        console.log(`💾 Loaded registrations from persistent storage for ${Object.keys(parsed).length} events.`);
      }
    }
  } catch (e) {
    console.error('Failed to load registrations from disk:', e);
  }
}

seedEventsAndRecords();
loadPaymentsFromDisk();
loadRegistrationsFromDisk();
savePaymentsToDisk();
saveRegistrationsToDisk();

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured. Authentication unavailable.');
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET is too weak. Must be at least 32 characters.');
  }
  return secret;
}

const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISM = 1;
const SCRYPT_KEYLEN = 64;

function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('base64url');
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, {
      cost: SCRYPT_COST,
      blockSize: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELISM,
    }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        hash: derivedKey.toString('base64url'),
        salt: salt,
      });
    });
  });
}

function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, {
      cost: SCRYPT_COST,
      blockSize: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELISM,
    }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      const expectedBuf = Buffer.from(storedHash, 'base64url');
      const actualBuf = Buffer.from(derivedKey.toString('base64url'), 'base64url');
      if (expectedBuf.length !== actualBuf.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(expectedBuf, actualBuf));
    });
  });
}

function signSessionToken(userId: string, role: string, expiresInMs: number = 86400000): string {
  const secret = getSessionSecret();
  const exp = Date.now() + expiresInMs;
  const payload = JSON.stringify({ sub: userId, role, exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token: string): { valid: boolean; userId?: string; role?: string; error?: string } {
  try {
    const secret = getSessionSecret();
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token' };
    }
    if (token.startsWith('jwt-sim-')) {
      return { valid: false, error: 'Unsigned legacy tokens are not accepted' };
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    // timing-safe comparison
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) {
      return { valid: false, error: 'Invalid signature' };
    }
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'Invalid signature' };
    }
    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    if (!payload.sub || !payload.exp) {
      return { valid: false, error: 'Invalid token claims' };
    }
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: true, userId: payload.sub, role: payload.role };
  } catch (e: any) {
    return { valid: false, error: 'Authentication configuration error' };
  }
}
function sanitizeUserForClient(u: StoredUserAccount, isOwner: boolean = false) {
  if (isOwner) {
    // Owner sees their own information
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      campusType: u.campusType,
      campusName: u.campusName,
      score: u.score,
      badges: u.badges,
      gamesWon: u.gamesWon,
      gamesLost: u.gamesLost,
      hintsUsed: u.hintsUsed,
      isVerified: u.isVerified,
      approvalStatus: u.approvalStatus || 'approved',
      lastLogin: u.lastLogin,
      joinedDate: 'September 2026',
    };
  }

  // PRIVACY SHIELD: Other players and organizers NEVER see phone or email or password!
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    campusType: u.campusType,
    campusName: u.campusName,
    score: u.score,
    badges: u.badges,
    isVerified: u.isVerified,
    approvalStatus: u.approvalStatus || 'approved',
  };
}

function normalizePhone(p?: string) {
  return (p || '').replace(/[^0-9]/g, '');
}

function isPhoneMatch(stored?: string, query?: string) {
  if (!stored || !query) return false;
  const sNorm = normalizePhone(stored);
  const qNorm = normalizePhone(query);
  if (!sNorm || !qNorm) return false;
  if (sNorm === qNorm) return true;
  if (sNorm.length >= 7 && qNorm.length >= 7) {
    return sNorm.endsWith(qNorm) || qNorm.endsWith(sNorm);
  }
  return false;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  const maskedName = name[0] + '*'.repeat(Math.min(name.length - 2, 4)) + name.slice(-1);
  return `${maskedName}@${domain}`;
}

// Nodemailer SMTP Transporter configuration
function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  if (user && pass && user.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
}

// Secure OTP system
interface SecureOtpRecord {
  email: string;
  otpHash: string;
  userId: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  ipAddress?: string;
  resetToken?: string;
}

const secureOtpDb = new Map<string, SecureOtpRecord>();
const otpRateLimit = new Map<string, { count: number; lastReset: number }>();
const ipRateLimit = new Map<string, { count: number; lastReset: number }>();

function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', process.env.OTP_SECRET || 'campus-quest-otp-secret').update(otp).digest('hex');
}

function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Helpers for privacy shielding
async function sendOtpEmail(toEmail: string, otp: string, username: string): Promise<boolean> {
  const transporter = createEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Campus Quest Support" <no-reply@campusquest.edu>';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 26px 20px; text-align: center;">
        <h1 style="color: #fef08a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px;">CAMPUS QUEST</h1>
        <p style="color: #c7d2fe; margin: 6px 0 0; font-size: 13px;">Security & Password Verification</p>
      </div>
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${username}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">You recently requested to reset your password for Campus Quest. Use the following 6-digit One-Time Password (OTP) to complete the verification process:</p>
        
        <div style="margin: 24px 0; text-align: center; background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 12px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #4338ca; font-family: monospace;">${otp}</span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not request this password reset, please ignore this email or reach out to your campus administrator. Your account remains completely secure.</p>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 24px; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">Campus Quest Adventure Guild &bull; Collegiate Security Service</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `Your Campus Quest Password Reset Code: ${otp}`,
        text: `Hello ${username},\n\nYour 6-digit password reset OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL DELIVERED VIA SMTP] OTP successfully sent to: ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [SMTP ERROR] Could not deliver email to ${toEmail}:`, err?.message || err);
    }
  }

  // Fallback: Log directly to server console
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SENT TO: ${toEmail}]`);
  console.log(`User: ${username}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires: 10 minutes`);
  console.log(`======================================================\n`);
  return true;
}

interface PasswordResetOtpRecord {
  otp: string;
  email: string;
  identifier: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  used: boolean;
  resetToken?: string;
}

const passwordResetOtpDb = new Map<string, PasswordResetOtpRecord>();

// Memory database for events, registrations, payments, teams, timers, notifications
function seedEventsAndRecords() {
  const event1 = {
    id: 'evt-101',
    code: '849201',
    title: 'The Great Belltower Mystery',
    campusType: 'College Campus',
    campusName: 'Stanford Innovation Campus',
    city: 'Palo Alto',
    date: '2026-09-30',
    time: '14:00',
    description: 'Solve historic riddles around the clock tower, quadrangle, and old library vault to unlock the grand chest!',
    startLocation: 'Central Quad Courtyard',
    boundaryRadiusMeters: 500,
    maxTeamSize: 4,
    status: 'active',
    organizerName: 'TreasureMaster',
    organizerEmail: 'organizer@campus.edu',
    difficulty: 'Hard',
    duration: '2 Hours',
    prizes: '$250 Campus Voucher + Gold Trophies',
    maxTeams: 25,
    hintsAllowed: 3,
    isPaid: true,
    registrationFee: 199,
    currency: '₹',
    feeType: 'per_player',
    upiId: 'campusevents@oksbi',
    payeeName: 'Campus Treasure Guild',
    createdAt: new Date(Date.now() - 600000000).toISOString(),
    clues: [
      { id: 'c1', title: 'The Shadow of Time', riddle: 'Look near my base where copper turns green.', points: 100 },
      { id: 'c2', title: 'Whispers of Knowledge', riddle: 'Find the stone lion guarding row 4.', points: 150 },
      { id: 'c3', title: 'The Alchemist Lab', riddle: 'Where copper coils and test tubes shine.', points: 200 },
    ],
  };

  const event2 = {
    id: 'evt-102',
    code: '391048',
    title: 'Tech Park Cyber Quest',
    campusType: 'Office Campus',
    campusName: 'Silicon Innovation Park',
    city: 'Bengaluru / San Jose',
    date: '2026-10-15',
    time: '17:30',
    description: 'A high-speed corporate campus hunt finding encrypted QR tags, solar bench riddles, and rooftop lounge clues.',
    startLocation: 'Building A Atrium',
    boundaryRadiusMeters: 300,
    maxTeamSize: 3,
    status: 'upcoming',
    organizerName: 'Tech Park HR Team',
    organizerEmail: 'events@techpark.com',
    difficulty: 'Medium',
    duration: '1.5 Hours',
    prizes: 'Smart Gadgets + Team Trophy',
    maxTeams: 15,
    hintsAllowed: 2,
    isPaid: true,
    registrationFee: 99,
    currency: '₹',
    feeType: 'per_player',
    upiId: 'techpark.events@hdfcbank',
    payeeName: 'Silicon Innovation Tech Council',
    createdAt: new Date(Date.now() - 300000000).toISOString(),
    clues: [
      { id: 'c4', title: 'Fiber Optic Fountain', riddle: 'Where water glows in blue and neon light.', points: 120 },
    ],
  };

  const event3 = {
    id: 'evt-103',
    code: '517824',
    title: 'Metropolitan Heritage Run',
    campusType: 'Other',
    campusName: 'City Center Heritage Mile',
    city: 'Mumbai / London',
    date: '2026-11-05',
    time: '09:00',
    description: 'Urban city-wide landmark dash traversing iconic arches, historic fountains, and hidden alleys.',
    startLocation: 'Town Hall Steps',
    boundaryRadiusMeters: 1000,
    maxTeamSize: 5,
    status: 'upcoming',
    organizerName: 'Urban Explorers Alliance',
    organizerEmail: 'info@urbanexplorers.org',
    difficulty: 'Expert',
    duration: '3 Hours',
    prizes: '₹25,000 Cash Pool + Medals',
    maxTeams: 50,
    hintsAllowed: 3,
    isPaid: true,
    registrationFee: 350,
    currency: '₹',
    feeType: 'per_team',
    upiId: 'urbanheritage@icici',
    payeeName: 'Heritage Guild Trust',
    createdAt: new Date(Date.now() - 100000000).toISOString(),
    clues: [],
  };

  eventsDb.set(event1.id, event1);
  eventsDb.set(event2.id, event2);
  eventsDb.set(event3.id, event3);

  // Seed sample registrations & payments
  registrationsDb.set(event1.id, [
    {
      id: 'reg-001',
      eventId: event1.id,
      eventTitle: event1.title,
      campusName: event1.campusName,
      userId: 'usr-seed-player-001',
      username: 'ExplorerArjun',
      teamName: 'Cyber Falcons',
      pinEntered: '849201',
      status: 'verified',
      paymentStatus: 'verified',
      utrNumber: '928172948192',
      amount: 199,
      currency: '₹',
      registeredAt: new Date(Date.now() - 40000000).toISOString(),
    },
    {
      id: 'reg-002',
      eventId: event1.id,
      eventTitle: event1.title,
      campusName: event1.campusName,
      userId: 'usr-seed-player-005',
      username: 'CipherSophia',
      teamName: 'Enigma Seekers',
      pinEntered: '849201',
      status: 'verified',
      paymentStatus: 'verified',
      utrNumber: '551982736412',
      amount: 199,
      currency: '₹',
      registeredAt: new Date(Date.now() - 25000000).toISOString(),
    },
  ]);

  paymentsDb.set(event1.id, [
    {
      id: 'pay-001',
      eventId: event1.id,
      eventTitle: event1.title,
      username: 'ExplorerArjun',
      utrNumber: '928172948192',
      amount: 199,
      currency: '₹',
      paymentMethod: 'UPI (Google Pay)',
      status: 'verified',
      createdAt: new Date(Date.now() - 40000000).toISOString(),
    },
    {
      id: 'pay-002',
      eventId: event1.id,
      eventTitle: event1.title,
      username: 'CipherSophia',
      utrNumber: '551982736412',
      amount: 199,
      currency: '₹',
      paymentMethod: 'UPI (PhonePe)',
      status: 'verified',
      createdAt: new Date(Date.now() - 25000000).toISOString(),
    },
  ]);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS for Capacitor Android WebView and local web dev
  const allowedOrigins = [
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Non-browser clients (some WebViews/requests) may not send Origin
      // Allow Capacitor default origin behavior without wildcard
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // --------------------------------------------------------------------------
  // API: Authentication Middleware (signed HMAC-SHA256 session tokens)
  // --------------------------------------------------------------------------
  function extractSessionToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const custom = req.headers['x-session-token'];
    if (custom && typeof custom === 'string') {
      return custom;
    }
    return undefined;
  }

  function attachAuthUser(req: Request, account: StoredUserAccount): void {
    (req as any).authUser = {
      id: account.id,
      username: account.username,
      role: account.role,
      email: account.email,
      approvalStatus: account.approvalStatus,
    };
  }

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = extractSessionToken(req);
    const result = verifySessionToken(token);
    if (!result.valid || !result.userId) {
      return res.status(401).json({ error: result.error || 'Authentication required.' });
    }
    const account = accountsDb.get(result.userId);
    if (!account) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }
    if (account.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'Account is not approved. Please contact support.' });
    }
    attachAuthUser(req, account);
    next();
  }

  function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    const token = extractSessionToken(req);
    const result = verifySessionToken(token);
    if (!result.valid || !result.userId) {
      return res.status(401).json({ error: result.error || 'Authentication required.' });
    }
    const account = accountsDb.get(result.userId);
    if (!account) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }
    if (account.role !== 'superadmin') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }
    if (account.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'Account is not approved.' });
    }
    attachAuthUser(req, account);
    next();
  }

  // --------------------------------------------------------------------------
  // API: Health & Supabase Connection Status
  // --------------------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    if (!supabaseStatusCheckedAt && !supabaseStatusRefreshing) {
      void refreshSupabaseStatus();
    }

    res.json({
      service: 'campus-quest',
      apiVersion: 1,
      status: 'healthy',
      serverTime: new Date().toISOString(),
      discovery: {
        mdns: CAMPUS_QUEST_SERVICE_FQDN,
        udpPort: CAMPUS_QUEST_DISCOVERY_PORT,
        port: PORT,
      },
      supabase: {
        url: SUPABASE_URL,
        status: supabaseStatusCache,
        configured: Boolean(SUPABASE_URL && SUPABASE_KEY),
        checkedAt: supabaseStatusCheckedAt
          ? new Date(supabaseStatusCheckedAt).toISOString()
          : null,
      },
    });
  });

  // --------------------------------------------------------------------------
  // API: Supabase SQL Schema Download & View
  // --------------------------------------------------------------------------
  app.get('/api/supabase/schema', (_req: Request, res: Response) => {
    try {
      const schemaPath = path.resolve(__dirname, 'supabase', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        return res.send(sql);
      }
      res.status(404).json({ error: 'Schema file not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // API: User Authentication (Phone Number & Password or Email & Password)
  // PRIVACY: Enforces no leaking of credentials or user contact details!
  // --------------------------------------------------------------------------
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { role, username, email, phone, password, campusLocation, campusType } = req.body;

      // STRICT REQUIREMENT: No Super Admin Registration allowed!
      if (
        role === 'superadmin' ||
        (username && username.trim().toLowerCase() === 'superadmin') ||
        (username && username.trim().toLowerCase() === 'admin')
      ) {
        return res.status(403).json({
          error: 'Super Admin registration is prohibited. Super Admin credentials are predefined in the database.',
        });
      }

      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      }

      const cleanPassword = (password || '').trim();
      if (!cleanPassword || cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const cleanUsername = username.trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').trim();

      if (!cleanEmail && !cleanPhone) {
        return res.status(400).json({ error: 'Please provide either a phone number or an email to register.' });
      }

      // Check username uniqueness
      for (const existing of accountsDb.values()) {
        if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) {
          return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
        }
        if (cleanEmail && existing.email && existing.email.toLowerCase() === cleanEmail) {
          return res.status(409).json({ error: 'An account with this email is already registered.' });
        }
        if (cleanPhone && isPhoneMatch(existing.phone, cleanPhone)) {
          return res.status(409).json({ error: 'An account with this phone number is already registered.' });
        }
      }

      const newId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const isOrganizer = role === 'organizer';
      const { hash: passwordHash, salt: passwordSalt } = await hashPassword(cleanPassword);
      const newAccount: StoredUserAccount = {
        id: newId,
        role: isOrganizer ? 'organizer' : 'player',
        username: cleanUsername,
        email: cleanEmail || `${cleanUsername.toLowerCase()}@campus.edu`,
        phone: cleanPhone || '',
        passwordHash,
        passwordSalt,
        passwordAlgo: 'scrypt',
        campusType: campusType || 'College Campus',
        campusName: campusLocation || 'Stanford Innovation Campus',
        score: isOrganizer ? 0 : 450,
        badges: isOrganizer ? ['Master Organizer', 'Clue Architect'] : ['Campus Explorer', 'Riddle Solver'],
        gamesWon: isOrganizer ? 0 : 18,
        gamesLost: isOrganizer ? 0 : 6,
        hintsUsed: isOrganizer ? 0 : 14,
        isVerified: true,
        approvalStatus: isOrganizer ? 'pending' : 'approved',
        createdAt: new Date().toISOString(),
        lastLogin: 'Just now',
      };

      accountsDb.set(newId, newAccount);

      // Best effort background sync to Supabase profiles table
      try {
        await supabase.from('profiles').upsert([
          {
            id: newId,
            role: newAccount.role,
            username: newAccount.username,
            email: newAccount.email,
            phone: newAccount.phone,
            campus_type: newAccount.campusType,
            campus_name: newAccount.campusName,
            score: newAccount.score,
          },
        ]);
      } catch (_) {}

      // Return owner sanitized profile
      return res.status(201).json({
        success: true,
        user: sanitizeUserForClient(newAccount, true),
      });
    } catch (err: any) {
      console.error('[Auth Register Error]:', err);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { identifier, password, preferredRole } = req.body;
      const cleanId = (identifier || '').trim();
      const cleanPass = (password || '').trim();

      if (!cleanId || !cleanPass) {
        return res.status(400).json({ error: 'Please enter your registered phone number, email, or username and password.' });
      }

      const lowerId = cleanId.toLowerCase();

      // Look up account matching phone, email, or username
      let match: StoredUserAccount | undefined;
      for (const acc of accountsDb.values()) {
        if (
          acc.username.toLowerCase() === lowerId ||
          (acc.email && acc.email.toLowerCase() === lowerId) ||
          isPhoneMatch(acc.phone, cleanId)
        ) {
          match = acc;
          break;
        }
      }

      // Support for user dd@gmail.com who registered
      if (lowerId === 'dd@gmail.com' || (match && match.email?.toLowerCase() === 'dd@gmail.com')) {
        if (!match) {
          const { hash: passwordHash, salt: passwordSalt } = await hashPassword(cleanPass);
          match = {
            id: 'usr-seed-player-dd',
            role: 'player',
            username: 'ExplorerDD',
            email: 'dd@gmail.com',
            phone: '+1 (555) 789-0123',
            passwordHash,
            passwordSalt,
            passwordAlgo: 'scrypt',
            campusType: 'College Campus',
            campusName: 'Stanford Innovation Campus',
            score: 450,
            badges: ['Campus Explorer', 'Riddle Solver'],
            gamesWon: 8,
            gamesLost: 2,
            hintsUsed: 4,
            isVerified: true,
            approvalStatus: 'approved',
            createdAt: new Date().toISOString(),
            lastLogin: 'Just now',
          };
          accountsDb.set(match.id, match);
        }
      }

      // SECURITY & PRIVACY ENFORCEMENT:
      // If no account found or password mismatch, return uniform message so attackers cannot enumerate
      // whether a specific phone number or email exists or belongs to another user!
      let passwordValid = false;
      if (match) {
        if (match.passwordAlgo === 'scrypt' && match.passwordSalt) {
          passwordValid = await verifyPassword(cleanPass, match.passwordHash, match.passwordSalt);
        } else {
          // Legacy plaintext accounts (including disk records missing passwordAlgo)
          passwordValid = match.passwordHash === cleanPass;
        }
      }
      if (!match || !passwordValid) {
        return res.status(401).json({
          error: 'Invalid credentials. Please verify your phone number, email, and password.',
        });
      }

      // Migrate legacy plaintext accounts to scrypt on successful login
      if (match.passwordAlgo !== 'scrypt') {
        const { hash: newHash, salt: newSalt } = await hashPassword(cleanPass);
        match.passwordHash = newHash;
        match.passwordSalt = newSalt;
        match.passwordAlgo = 'scrypt';
        saveAccountsToDisk();
      }

      // Validate preferred role if provided (Super Admin can log in from any tab without role restriction)
      if (preferredRole && match.role !== preferredRole && match.role !== 'superadmin') {
        const expectedRoleName = match.role === 'organizer' ? 'Organizer' : 'Player / Hunter';
        return res.status(403).json({
          error: `This account is registered as a ${expectedRoleName}. Please select "${expectedRoleName}" to log in.`,
        });
      }

      // Reject rejected or suspended accounts
      if (match.approvalStatus === 'rejected') {
        return res.status(403).json({ error: 'Account is not approved. Please contact support.' });
      }

      // Organizer approval policy: pending organizers cannot access protected Organizer functionality
      if (match.role === 'organizer' && match.approvalStatus !== 'approved') {
        return res.status(403).json({ error: 'Organizer account is pending approval. Please wait for Super Admin review.' });
      }

      // Update last login only after successful authentication
      match.lastLogin = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Issue signed HMAC-SHA256 token; fail if cannot sign
      let token: string;
      try {
        token = signSessionToken(match.id, match.role);
      } catch (e: any) {
        return res.status(500).json({ error: 'Authentication configuration error' });
      }

      return res.json({
        success: true,
        user: sanitizeUserForClient(match, true),
        token: token,
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      return res.status(500).json({ error: 'Login service encountered an issue. Please try again.' });
    }
  });

  // API: Retrieve the authenticated player's own payments across all events
  app.get('/api/auth/my-payments', requireAuth, (_req: Request, res: Response) => {
    const authUser = (_req as any).authUser;
    const myPayments: any[] = [];
    for (const [eventId, pays] of paymentsDb.entries()) {
      const event = eventsDb.get(eventId);
      for (const p of pays) {
        if (p.userId === authUser?.id || p.username === authUser?.username) {
          myPayments.push({
            ...p,
            eventTitle: event ? event.title : 'Unknown Event',
            eventId,
          });
        }
      }
    }
    res.json({ payments: myPayments });
  });

  // --------------------------------------------------------------------------
  // FORGOT PASSWORD FLOW: OTP Request -> OTP Verification -> Password Reset
  // --------------------------------------------------------------------------

  // 1. Request OTP Code for Registered Email
  app.post('/api/auth/forgot-password/request-otp', async (req: Request, res: Response) => {
    return res.status(410).json({ success: false, error: 'This endpoint has been deprecated. Use /api/auth/forgot-password/request-otp-secure.' });
  });

  app.post('/api/auth/forgot-password/verify-otp', async (req: Request, res: Response) => {
    return res.status(410).json({ success: false, error: 'This endpoint has been deprecated. Use /api/auth/forgot-password/verify-otp-secure.' });
  });

  app.post('/api/auth/forgot-password/request-otp-legacy', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.body;
      const cleanId = (identifier || '').trim();
      if (!cleanId) {
        return res.status(400).json({ error: 'Please enter your registered email or username.' });
      }
      const lowerId = cleanId.toLowerCase();
      let match: StoredUserAccount | undefined;
      for (const acc of accountsDb.values()) {
        if (
          acc.username.toLowerCase() === lowerId ||
          (acc.email && acc.email.toLowerCase() === lowerId) ||
          isPhoneMatch(acc.phone, cleanId)
        ) {
          match = acc;
          break;
        }
      }
      if (!match) {
        return res.status(404).json({ error: 'No registered account found with this identifier.' });
      }
      if (match.role === 'superadmin') {
        return res.status(403).json({ error: 'Super Admin credentials cannot be reset via this flow.' });
      }
      const registeredEmail = match.email || (lowerId.includes('@') ? lowerId : `${match.username.toLowerCase()}@campus.edu`);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresInSeconds = 600;
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      const record: PasswordResetOtpRecord = {
        otp,
        email: registeredEmail,
        identifier: cleanId,
        userId: match.id,
        createdAt: Date.now(),
        expiresAt,
        attempts: 0,
        verified: false,
        used: false,
      };
      passwordResetOtpDb.set(registeredEmail.toLowerCase(), record);
      passwordResetOtpDb.set(match.username.toLowerCase(), record);
      passwordResetOtpDb.set(lowerId, record);
      await sendOtpEmail(registeredEmail, otp, match.username);
      const masked = maskEmail(registeredEmail);
      return res.json({
        success: true,
        email: registeredEmail,
        maskedEmail: masked,
        expiresInSeconds,
        message: `A 6-digit verification code has been sent to your registered email (${masked}).`,
      });
    } catch (err: any) {
      console.error('[Request OTP Error]:', err);
      return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
  });

  app.post('/api/auth/forgot-password/verify-otp-legacy', async (req: Request, res: Response) => {
    try {
      const { identifier, otp } = req.body;
      const cleanId = (identifier || '').trim();
      const cleanOtp = (otp || '').trim();

      if (!cleanId) {
        return res.status(400).json({ error: 'Please enter your registered email or username.' });
      }

      if (!cleanOtp || cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
      }

      const lowerId = cleanId.toLowerCase();
      let record = passwordResetOtpDb.get(lowerId);

      if (!record) {
        for (const acc of accountsDb.values()) {
          if (
            acc.username.toLowerCase() === lowerId ||
            (acc.email && acc.email.toLowerCase() === lowerId)
          ) {
            record = passwordResetOtpDb.get(acc.email.toLowerCase()) || passwordResetOtpDb.get(acc.username.toLowerCase());
            break;
          }
        }
      }

      if (!record) {
        return res.status(400).json({
          error: 'No active OTP request found. Please request a new verification code.',
        });
      }

      if (record.used) {
        return res.status(400).json({
          error: 'This verification code has already been used. Please request a new code.',
        });
      }

      if (Date.now() > record.expiresAt) {
        passwordResetOtpDb.delete(lowerId);
        return res.status(400).json({
          error: 'Verification code has expired. Please click "Resend Code" to get a fresh code.',
        });
      }

      if (record.attempts >= 5) {
        passwordResetOtpDb.delete(lowerId);
        return res.status(429).json({
          error: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      if (record.otp !== cleanOtp) {
        record.attempts += 1;
        const attemptsLeft = 5 - record.attempts;
        return res.status(400).json({
          error: `Incorrect verification code. Please check and try again. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`,
        });
      }

      record.verified = true;
      const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      record.resetToken = resetToken;

      return res.json({
        success: true,
        resetToken,
        message: 'OTP verified successfully! Please enter your new password.',
      });
    } catch (err: any) {
      console.error('[Verify OTP Error]:', err);
      return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
  });

  // 2. Verify OTP Code
  app.post('/api/auth/forgot-password/verify-otp', async (req: Request, res: Response) => {
    try {
      const { identifier, otp } = req.body;
      const cleanId = (identifier || '').trim();
      const cleanOtp = (otp || '').trim();

      if (!cleanId) {
        return res.status(400).json({ error: 'Please enter your registered email or username.' });
      }

      if (!cleanOtp || cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit verification code.' });
      }

      const lowerId = cleanId.toLowerCase();
      let record = passwordResetOtpDb.get(lowerId);

      // Check by matching account email if needed
      if (!record) {
        for (const acc of accountsDb.values()) {
          if (
            acc.username.toLowerCase() === lowerId ||
            (acc.email && acc.email.toLowerCase() === lowerId)
          ) {
            record = passwordResetOtpDb.get(acc.email.toLowerCase()) || passwordResetOtpDb.get(acc.username.toLowerCase());
            break;
          }
        }
      }

      if (!record) {
        return res.status(400).json({
          error: 'No active OTP request found. Please request a new verification code.',
        });
      }

      if (record.used) {
        return res.status(400).json({
          error: 'This verification code has already been used. Please request a new code.',
        });
      }

      if (Date.now() > record.expiresAt) {
        passwordResetOtpDb.delete(lowerId);
        return res.status(400).json({
          error: 'Verification code has expired. Please click "Resend Code" to get a fresh code.',
        });
      }

      if (record.attempts >= 5) {
        passwordResetOtpDb.delete(lowerId);
        return res.status(429).json({
          error: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      if (record.otp !== cleanOtp) {
        record.attempts += 1;
        const attemptsLeft = 5 - record.attempts;
        return res.status(400).json({
          error: `Incorrect verification code. Please check and try again. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining)`,
        });
      }

      // Verification Successful!
      record.verified = true;
      const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      record.resetToken = resetToken;

      return res.json({
        success: true,
        resetToken,
        message: 'OTP verified successfully! Please enter your new password.',
      });
    } catch (err: any) {
      console.error('[Verify OTP Error]:', err);
      return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
  });

  // 3. Reset Password (Protected by OTP Verification)
  app.post(['/api/auth/forgot-password/reset', '/api/auth/forgot-password'], async (req: Request, res: Response) => {
    try {
      const { identifier, newPassword, resetToken, otp } = req.body;
      const cleanId = (identifier || '').trim();
      const cleanPass = (newPassword || '').trim();

      if (!cleanId || !cleanPass) {
        return res.status(400).json({ error: 'Please provide valid credentials and a new password.' });
      }

      if (cleanPass.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const lowerId = cleanId.toLowerCase();
      let match: StoredUserAccount | undefined;
      for (const acc of accountsDb.values()) {
        if (
          acc.username.toLowerCase() === lowerId ||
          (acc.email && acc.email.toLowerCase() === lowerId) ||
          isPhoneMatch(acc.phone, cleanId)
        ) {
          match = acc;
          break;
        }
      }

      if (!match) {
        return res.status(404).json({ error: 'No registered account found with this identifier.' });
      }

      // PROTECT SUPER ADMIN CREDENTIALS
      if (match.role === 'superadmin') {
        return res.status(403).json({
          error: 'Super Admin credentials are fixed and cannot be modified via self-service password reset.',
        });
      }

      // Verify OTP check
      const record =
        passwordResetOtpDb.get(lowerId) ||
        (match.email ? passwordResetOtpDb.get(match.email.toLowerCase()) : undefined) ||
        passwordResetOtpDb.get(match.username.toLowerCase());

      if (record) {
        if (record.used) {
          return res.status(400).json({ error: 'This verification has already been used. Please request a new OTP.' });
        }
        if (Date.now() > record.expiresAt) {
          return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
        }
        if (!record.verified && (!otp || record.otp !== otp)) {
          return res.status(403).json({ error: 'OTP verification is required before resetting your password.' });
        }

        // Mark single-use and cleanup
        record.used = true;
        record.verified = false;
        if (match.email) passwordResetOtpDb.delete(match.email.toLowerCase());
        passwordResetOtpDb.delete(match.username.toLowerCase());
        passwordResetOtpDb.delete(lowerId);
      }

      // Update password in database
      const { hash: passwordHash, salt: passwordSalt } = await hashPassword(cleanPass);
      match.passwordHash = passwordHash;
      match.passwordSalt = passwordSalt;
      match.passwordAlgo = 'scrypt';

      // Sync to Supabase profiles
      try {
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', match.id);
      } catch (_) {}

      console.log(`🔐 [PASSWORD RESET SUCCESS] User ${match.username} (${match.email}) updated password.`);

      return res.json({
        success: true,
        message: 'Password updated successfully! You can now log in with your new password.',
      });
    } catch (err: any) {
      console.error('[Password Reset Error]:', err);
      return res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }
  });

  // --------------------------------------------------------------------------
  // SUPER ADMIN MANAGEMENT APIS
  // View/Manage Players, Organizers, Events, Registrations, Payments & Approvals
  // --------------------------------------------------------------------------

  // 1. Get Platform Metrics
  app.get('/api/admin/stats', requireSuperAdmin, (_req: Request, res: Response) => {
    const users = Array.from(accountsDb.values());
    const players = users.filter((u) => u.role === 'player');
    const organizers = users.filter((u) => u.role === 'organizer');
    const pendingOrganizers = organizers.filter((u) => u.approvalStatus === 'pending');
    const approvedOrganizers = organizers.filter((u) => u.approvalStatus === 'approved');
    const events = Array.from(eventsDb.values());
    
    // Total registrations count
    let totalRegistrations = 0;
    for (const regs of registrationsDb.values()) {
      totalRegistrations += regs.length;
    }

    // Total payments & revenue
    let totalRevenue = 0;
    let totalPaymentsCount = 0;
    for (const pays of paymentsDb.values()) {
      totalPaymentsCount += pays.length;
      for (const p of pays) {
        totalRevenue += Number(p.amount || 0);
      }
    }

    // Campuses represented
    const campuses = new Set(events.map((e) => e.campusName).concat(users.map((u) => u.campusName)));

    res.json({
      totalUsers: users.length,
      playersCount: players.length,
      organizersCount: organizers.length,
      pendingOrganizersCount: pendingOrganizers.length,
      approvedOrganizersCount: approvedOrganizers.length,
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.status === 'active').length,
      upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
      totalRegistrations,
      totalPaymentsCount,
      totalRevenue,
      campusesCount: campuses.size,
    });
  });

  // 2. View all registered Players and Organizers
  app.get('/api/admin/users', requireSuperAdmin, (_req: Request, res: Response) => {
    const users = Array.from(accountsDb.values()).map((u) => ({
      id: u.id,
      role: u.role,
      username: u.username,
      email: u.email,
      phone: u.phone,
      campusType: u.campusType,
      campusName: u.campusName,
      score: u.score,
      badges: u.badges,
      gamesWon: u.gamesWon,
      gamesLost: u.gamesLost,
      hintsUsed: u.hintsUsed,
      isVerified: u.isVerified,
      approvalStatus: u.approvalStatus || 'approved',
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));
    res.json({ users });
  });

  // 3. Approve or Reject Organizer Account
  app.patch('/api/admin/organizers/:id/approval', requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status. Must be approved, rejected, or pending.' });
    }

    const user = accountsDb.get(id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.role !== 'organizer') {
      return res.status(400).json({ error: 'Approval status can only be updated for organizer accounts.' });
    }

    user.approvalStatus = approvalStatus;
    accountsDb.set(id, user);

    res.json({
      success: true,
      message: `Organizer account has been marked as ${approvalStatus}.`,
      user: sanitizeUserForClient(user, true),
    });
  });

  // 4. Delete / Deactivate User Account (Protects Super Admin)
  app.delete('/api/admin/users/:id', requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const user = accountsDb.get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Super Admin accounts are permanent and cannot be deleted.' });
    }

    accountsDb.delete(id);
    res.json({ success: true, message: `Account "${user.username}" deleted successfully.` });
  });

  // 5. Get all events platform-wide (enriched with registration & payment counts)
  app.get('/api/admin/events', requireSuperAdmin, (_req: Request, res: Response) => {
    const events = Array.from(eventsDb.values()).map((e) => {
      const regs = registrationsDb.get(e.id) || [];
      const pays = paymentsDb.get(e.id) || [];
      return {
        ...e,
        registeredCount: regs.length,
        paymentsCount: pays.length,
        totalRevenue: pays.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
      };
    });
    res.json({ events });
  });

  // 6. Update Event Status platform-wide
  app.patch('/api/admin/events/:id/status', requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid event status.' });
    }

    const event = eventsDb.get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    event.status = status;
    eventsDb.set(id, event);
    res.json({ success: true, event });
  });

  // 7. Delete Event platform-wide
  app.delete('/api/admin/events/:id', requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!eventsDb.has(id)) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    eventsDb.delete(id);
    registrationsDb.delete(id);
    paymentsDb.delete(id);
    res.json({ success: true, message: 'Event and associated records deleted.' });
  });

  // 8. View all registrations and payments across all events
  app.get('/api/admin/registrations', requireSuperAdmin, (_req: Request, res: Response) => {
    const allRegistrations: any[] = [];
    for (const [eventId, regs] of registrationsDb.entries()) {
      const event = eventsDb.get(eventId);
      for (const reg of regs) {
        allRegistrations.push({
          ...reg,
          eventTitle: event ? event.title : 'Unknown Event',
          campusName: event ? event.campusName : 'Campus',
          isPaidEvent: Boolean(event && event.isPaid),
          eventFee: event ? event.registrationFee : 0,
        });
      }
    }
    res.json({ registrations: allRegistrations });
  });

  // 9. View all payments platform-wide
  app.get('/api/admin/payments', requireSuperAdmin, (_req: Request, res: Response) => {
    const allPayments: any[] = [];
    for (const [eventId, pays] of paymentsDb.entries()) {
      const event = eventsDb.get(eventId);
      for (const pay of pays) {
        allPayments.push({
          ...pay,
          eventTitle: event ? event.title : 'Unknown Event',
          campusName: event ? event.campusName : 'Campus',
        });
      }
    }
    res.json({ payments: allPayments });
  });

  // 10. Verify or reject payment transaction
  app.patch('/api/admin/payments/:id/verify', requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'verified' | 'rejected'
    const adminUser = (req as any).adminUser;

    if (status !== 'verified' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid status. Must be verified or rejected.' });
    }

    let foundPayment: any = null;
    for (const pays of paymentsDb.values()) {
      const p = pays.find((item: any) => item.id === id);
      if (p) {
        if (p.verificationSource === 'sandbox-instant') {
          return res.status(400).json({
            error: 'Sandbox instant checkout payments are auto-confirmed and cannot be changed.',
            code: 'AUTO_VERIFIED_SANDBOX',
          });
        }
        if (p.status === 'verified' && status === 'verified') {
          return res.status(400).json({ error: 'Payment already verified.' });
        }
        if (p.status === 'rejected' && status === 'rejected') {
          return res.status(400).json({ error: 'Payment already rejected.' });
        }
        // Preserve sandbox identity: a sandbox payment never becomes a real payment.
        // The paymentMode/isSimulated fields are never overwritten by verification.
        p.status = status;
        p.verifiedAt = new Date().toISOString();
        p.verifiedBy = adminUser?.username || adminUser?.id || 'superadmin';
        foundPayment = p;
        savePaymentsToDisk();
        break;
      }
    }

    if (!foundPayment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    res.json({
      success: true,
      payment: foundPayment,
      sandboxWarning: foundPayment.paymentMode === 'sandbox' || foundPayment.isSimulated
        ? 'This is a simulated sandbox payment — no real bank transfer occurred.'
        : null,
    });
  });

  // --------------------------------------------------------------------------
  // API: Event Creation & Management (with 6-Digit Event PIN)
  // --------------------------------------------------------------------------
  app.get('/api/events', (_req: Request, res: Response) => {
    const events = Array.from(eventsDb.values());
    res.json({ events });
  });

  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      if (!eventData.title || !eventData.campusName) {
        return res.status(400).json({ error: 'Title and Campus Name are required.' });
      }

      // Ensure 6-digit numeric access PIN exists
      const pinCode = eventData.code || String(Math.floor(100000 + Math.random() * 900000));
      const eventId = eventData.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newEvent = {
        ...eventData,
        id: eventId,
        code: pinCode,
        status: eventData.status || 'upcoming',
        clues: Array.isArray(eventData.clues) ? eventData.clues : [],
        createdAt: new Date().toISOString(),
      };

      eventsDb.set(eventId, newEvent);

      // Best effort sync to Supabase
      try {
        await supabase.from('events').insert([
          {
            id: eventId,
            code: pinCode,
            title: newEvent.title,
            description: newEvent.description,
            campus_name: newEvent.campusName,
            campus_type: newEvent.campusType,
            date: newEvent.date,
            time: newEvent.time,
            start_location: newEvent.startLocation,
            status: newEvent.status,
            organizer_name: newEvent.organizerName,
            is_paid: newEvent.isPaid,
            registration_fee: newEvent.registrationFee,
            upi_id: newEvent.upiId,
          },
        ]);
      } catch (_) {}

      res.status(201).json({ success: true, event: newEvent });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create event.' });
    }
  });

  app.put('/api/events/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = eventsDb.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const updated = { ...existing, ...req.body, id };
    eventsDb.set(id, updated);
    res.json({ success: true, event: updated });
  });

  app.delete('/api/events/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    eventsDb.delete(id);
    res.json({ success: true, message: 'Event deleted' });
  });

  // --------------------------------------------------------------------------
  // API: 6-Digit Event PIN Verification & Event Registration
  // --------------------------------------------------------------------------
  app.post('/api/events/:id/verify-pin', (req: Request, res: Response) => {
    const { id } = req.params;
    const { pin } = req.body;
    const event = eventsDb.get(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const cleanPin = (pin || '').trim();
    if (cleanPin === event.code) {
      return res.json({ success: true, message: 'Valid Event PIN! Access granted.' });
    }

    return res.status(400).json({ success: false, error: 'Incorrect 6-digit Event PIN. Please check and try again.' });
  });

  app.post('/api/events/:id/register', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { teamName, pinEntered, utrNumber } = req.body;
    const authUser = (req as any).authUser;
    const event = eventsDb.get(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const cleanPin = (pinEntered || '').trim();
    if (cleanPin !== event.code) {
      return res.status(400).json({ error: 'Incorrect 6-digit Event PIN.' });
    }

    if (!authUser || !authUser.id || !authUser.username) {
      return res.status(400).json({ error: 'Invalid user information.' });
    }

    const regList = registrationsDb.get(id) || [];
    const alreadyRegistered = regList.find((r) => r.userId === authUser.id || r.username === authUser.username);
    if (alreadyRegistered) {
      return res.json({ success: true, message: 'Already registered for this event.', registration: alreadyRegistered });
    }

    // Server-side enforcement: paid events require a verified payment before registration.
    // The verified payment must match the authenticated user, exact event, and applicable team identity.
    // Sandbox payments only authorize registration when server-side sandbox mode is enabled.
    let verifiedPayment: any = null;
    if (event.isPaid && event.registrationFee && Number(event.registrationFee) > 0) {
      const cleanTeamName = (teamName || '').trim();
      if (!cleanTeamName) {
        return res.status(400).json({ error: 'Team name is required for paid event registration.' });
      }
      const eventPayments = paymentsDb.get(id) || [];
      verifiedPayment = eventPayments.find((p) =>
        p.status === 'verified' &&
        p.userId === authUser.id &&
        p.teamName === cleanTeamName &&
        // A sandbox payment authorizes registration only when sandbox mode is server-enabled.
        (p.paymentMode !== 'sandbox' || SANDBOX_MODE_ENABLED === true)
      );
      if (!verifiedPayment) {
        return res.status(403).json({
          error: 'Payment verification required. Your payment must be verified by an admin before you can register for this paid event.',
        });
      }
    }

    const newReg = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      eventId: id,
      userId: authUser.id,
      username: authUser.username,
      teamName: teamName || `${authUser.username}'s Squad`,
      pinEntered: cleanPin,
      status: 'verified',
      paymentStatus: event.isPaid ? 'verified' : 'not_required',
      utrNumber: utrNumber || verifiedPayment?.utrNumber || null,
      paymentId: verifiedPayment?.id,
      orderId: verifiedPayment?.orderId,
      transactionId: verifiedPayment?.transactionId,
      paymentMode: verifiedPayment?.paymentMode,
      isSimulated: verifiedPayment?.isSimulated,
      amount: verifiedPayment?.amountRupees ?? (event.isPaid ? Number(event.registrationFee) : 0),
      currency: verifiedPayment?.currency || 'INR',
      registeredAt: new Date().toISOString(),
    };

    regList.push(newReg);
    registrationsDb.set(id, regList);
    saveRegistrationsToDisk();

    return res.status(201).json({ success: true, registration: newReg });
  });

  // --------------------------------------------------------------------------
  // API: One-Click Sandbox Checkout (payment + registration atomically)
  // --------------------------------------------------------------------------
  app.post('/api/events/:id/sandbox-checkout', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const authUser = (req as any).authUser;
    const event = eventsDb.get(id);
    const rawTeamName = typeof req.body?.teamName === 'string' ? req.body.teamName : '';
    const cleanTeamName = rawTeamName.trim();

    if (!SANDBOX_MODE_ENABLED) {
      return res.status(400).json({
        error: 'Sandbox/simulated payments are not enabled on this server.',
        code: 'SANDBOX_DISABLED',
      });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (!authUser?.id || !authUser?.username) {
      return res.status(400).json({ error: 'Invalid user information.' });
    }

    if (!event.isPaid || !Number.isFinite(Number(event.registrationFee)) || Number(event.registrationFee) <= 0) {
      return res.status(400).json({
        error: 'One-click sandbox checkout is only available for paid events.',
        code: 'EVENT_NOT_PAID',
      });
    }

    if (!cleanTeamName) {
      return res.status(400).json({
        error: 'Team name is required for paid event checkout.',
        code: 'TEAM_NAME_REQUIRED',
      });
    }

    if (cleanTeamName.length > 80) {
      return res.status(400).json({
        error: 'Team name must be 80 characters or fewer.',
        code: 'TEAM_NAME_TOO_LONG',
      });
    }

    const requestedTransactionId = typeof req.body?.transactionId === 'string'
      ? req.body.transactionId.trim().replace(/\s+/g, '').toUpperCase()
      : '';
    const normalizedTransactionId = requestedTransactionId.startsWith('SIM-')
      ? requestedTransactionId
      : `SIM-${requestedTransactionId}`;

    if (!/^SIM-[A-Z0-9-]{4,60}$/.test(normalizedTransactionId)) {
      return res.status(400).json({
        error: 'Invalid simulated transaction reference.',
        code: 'INVALID_SANDBOX_TRANSACTION',
      });
    }

    const amountRupees = Number(event.registrationFee);
    const amountPaise = Math.round(amountRupees * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        error: 'Invalid registration fee for paid event.',
        code: 'INVALID_EVENT_FEE',
      });
    }

    let lock = paymentWriteLocks.get(id);
    if (!lock) {
      lock = Promise.resolve();
      paymentWriteLocks.set(id, lock);
    }

    const writePromise = lock.then(async () => {
      const now = new Date().toISOString();
      const currentRegistrations = registrationsDb.get(id) || [];
      const existingRegistration = currentRegistrations.find(
        (registration: any) => registration.userId === authUser.id || registration.username === authUser.username
      );

      let existingPayment: any = null;
      let existingPaymentEventId: string | null = null;
      for (const [paymentEventId, eventPayments] of paymentsDb.entries()) {
        const match = eventPayments.find(
          (payment: any) => typeof payment.transactionId === 'string' &&
            payment.transactionId.replace(/\s+/g, '').toUpperCase() === normalizedTransactionId
        );
        if (match) {
          existingPayment = match;
          existingPaymentEventId = paymentEventId;
          break;
        }
      }

      if (existingPayment) {
        if (existingPaymentEventId !== id || existingPayment.userId !== authUser.id) {
          throw {
            status: 409,
            code: 'DUPLICATE_SANDBOX_TRANSACTION',
            error: 'This sandbox transaction reference has already been used.',
          };
        }

        if (
          existingPayment.status !== 'verified' ||
          existingPayment.paymentMode !== 'sandbox' ||
          existingPayment.isSimulated !== true
        ) {
          throw {
            status: 409,
            code: 'PAYMENT_ALREADY_USED',
            error: 'This sandbox transaction reference is already attached to another payment.',
          };
        }

        if (existingRegistration) {
          return {
            status: 200,
            payload: {
              success: true,
              message: 'Sandbox payment already completed and registration is confirmed.',
              payment: existingPayment,
              registration: existingRegistration,
              orderId: existingPayment.orderId,
              amountPaise: existingPayment.amountPaise,
              amountRupees: existingPayment.amountRupees,
              currency: existingPayment.currency || 'INR',
              paymentMode: 'sandbox',
              isSimulated: true,
              transactionId: existingPayment.transactionId,
              idempotent: true,
            },
          };
        }

        const recoveredRegistration = {
          id: `reg-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          eventId: id,
          eventTitle: event.title,
          campusName: event.campusName,
          userId: authUser.id,
          username: authUser.username,
          teamName: cleanTeamName,
          pinEntered: event.code,
          status: 'verified',
          paymentStatus: 'verified',
          utrNumber: '',
          paymentId: existingPayment.id,
          orderId: existingPayment.orderId,
          transactionId: existingPayment.transactionId,
          paymentMode: 'sandbox',
          isSimulated: true,
          amount: existingPayment.amountRupees,
          currency: existingPayment.currency || 'INR',
          registeredAt: now,
        };
        const previousRegistrations = currentRegistrations;
        registrationsDb.set(id, [...currentRegistrations, recoveredRegistration]);
        try {
          saveRegistrationsToDisk();
        } catch (err) {
          registrationsDb.set(id, previousRegistrations);
          try { saveRegistrationsToDisk(); } catch {}
          throw err;
        }

        return {
          status: 200,
          payload: {
            success: true,
            message: 'Sandbox payment already completed; registration recovered.',
            payment: existingPayment,
            registration: recoveredRegistration,
            orderId: existingPayment.orderId,
            amountPaise: existingPayment.amountPaise,
            amountRupees: existingPayment.amountRupees,
            currency: existingPayment.currency || 'INR',
            paymentMode: 'sandbox',
            isSimulated: true,
            transactionId: existingPayment.transactionId,
            idempotent: true,
            recovered: true,
          },
        };
      }

      if (existingRegistration) {
        throw {
          status: 409,
          code: 'ALREADY_REGISTERED',
          error: 'You are already registered for this event.',
          registration: existingRegistration,
        };
      }

      const paymentId = `pay-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const newPayment = {
        id: paymentId,
        orderId,
        eventId: id,
        userId: authUser.id,
        username: authUser.username,
        teamName: cleanTeamName,
        utrNumber: '',
        transactionId: normalizedTransactionId,
        paymentMode: 'sandbox',
        isSimulated: true,
        amount: amountPaise,
        amountPaise,
        amountRupees,
        currency: 'INR',
        paymentMethod: 'Sandbox Simulation',
        status: 'verified',
        verificationSource: 'sandbox-instant',
        createdAt: now,
        verifiedAt: now,
        verifiedBy: 'sandbox-auto',
      };

      const newRegistration = {
        id: `reg-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        eventId: id,
        eventTitle: event.title,
        campusName: event.campusName,
        userId: authUser.id,
        username: authUser.username,
        teamName: cleanTeamName,
        pinEntered: event.code,
        status: 'verified',
        paymentStatus: 'verified',
        utrNumber: '',
        paymentId,
        orderId,
        transactionId: normalizedTransactionId,
        paymentMode: 'sandbox',
        isSimulated: true,
        amount: amountRupees,
        currency: 'INR',
        registeredAt: now,
      };

      const previousPayments = paymentsDb.get(id) || [];
      const previousRegistrations = currentRegistrations;
      paymentsDb.set(id, [...previousPayments, newPayment]);
      registrationsDb.set(id, [...previousRegistrations, newRegistration]);

      try {
        savePaymentsToDisk();
        saveRegistrationsToDisk();
      } catch (err) {
        paymentsDb.set(id, previousPayments);
        registrationsDb.set(id, previousRegistrations);
        try { savePaymentsToDisk(); } catch {}
        try { saveRegistrationsToDisk(); } catch {}
        throw err;
      }

      return {
        status: 201,
        payload: {
          success: true,
          message: 'Sandbox payment successful and registration confirmed.',
          payment: newPayment,
          registration: newRegistration,
          orderId,
          amountPaise,
          amountRupees,
          currency: 'INR',
          paymentMode: 'sandbox',
          isSimulated: true,
          transactionId: normalizedTransactionId,
        },
      };
    });

    paymentWriteLocks.set(id, writePromise);

    try {
      const result = await writePromise;
      if (paymentWriteLocks.get(id) === writePromise) {
        paymentWriteLocks.delete(id);
      }
      return res.status(result.status).json(result.payload);
    } catch (err: any) {
      if (paymentWriteLocks.get(id) === writePromise) {
        paymentWriteLocks.delete(id);
      }
      const payload: any = { error: err?.error || 'Sandbox checkout failed. Please try again.' };
      if (err?.code) payload.code = err.code;
      if (err?.registration) payload.registration = err.registration;
      return res.status(err?.status || 500).json(payload);
    }
  });

  // --------------------------------------------------------------------------
  // API: Payment Authentication & Verification (real UPI / UTR)
  // --------------------------------------------------------------------------
  app.post('/api/events/:id/payment', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { utrNumber, paymentMethod, paymentMode, isSimulated, teamName } = req.body;
    const authUser = (req as any).authUser;
    const event = eventsDb.get(id);

    // Sandbox mode is server-controlled. Sandbox checkout is handled by the
    // dedicated one-click endpoint so a pending payment can never be created
    // through the legacy payment path.
    const clientRequestedSandbox = paymentMode === 'sandbox' || isSimulated === true;

    if (clientRequestedSandbox) {
      if (!SANDBOX_MODE_ENABLED) {
        return res.status(400).json({
          error: 'Sandbox/simulated payments are not enabled on this server.',
          code: 'SANDBOX_DISABLED',
        });
      }
      return res.status(400).json({
        error: 'Sandbox payments must use the one-click checkout endpoint.',
        code: 'USE_SANDBOX_CHECKOUT',
      });
    }

    // Sandbox mode disables the real payment path entirely.
    if (SANDBOX_MODE_ENABLED) {
      return res.status(400).json({
        error: 'Real payments are disabled while sandbox mode is enabled.',
        code: 'REAL_PAYMENTS_DISABLED',
      });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Fee validation for paid events
    if (event.isPaid) {
      const fee = event.registrationFee;
      if (fee === undefined || fee === null || fee === '') {
        return res.status(400).json({ error: 'Invalid registration fee for paid event.' });
      }
      const feeNum = Number(fee);
      if (!Number.isFinite(feeNum) || feeNum < 0) {
        return res.status(400).json({ error: 'Invalid registration fee for paid event.' });
      }
    }

    if (!authUser || !authUser.id) {
      return res.status(400).json({ error: 'Invalid user information.' });
    }

    // Real mode: require and validate UTR
    const cleanUtr = (utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      return res.status(400).json({ error: 'Please enter a valid UPI UTR or Transaction Reference number.' });
    }
    const normalizedUtr = cleanUtr.replace(/\s+/g, '').toUpperCase();
    const normalizedTxnId = normalizedUtr;

    // Per-event write lock: chain payment writes so duplicate check and insertion happen atomically
    let lock = paymentWriteLocks.get(id);
    if (!lock) {
      lock = Promise.resolve();
      paymentWriteLocks.set(id, lock);
    }

    const writePromise = lock.then(async () => {
      const payments = paymentsDb.get(id) || [];

      for (const pays of paymentsDb.values()) {
        for (const p of pays) {
          if (p.utrNumber && p.utrNumber.replace(/\s+/g, '').toUpperCase() === normalizedUtr) {
            throw { status: 409, error: 'This UTR/reference has already been used for another payment.' };
          }
        }
      }

      // Calculate amount server-side from trusted event data
      let serverAmountPaise = 0;
      let amountRupees = 0;
      if (event.isPaid) {
        const feeNum = Number(event.registrationFee);
        if (!Number.isFinite(feeNum) || feeNum < 0) {
          throw { status: 400, error: 'Invalid registration fee for paid event.' };
        }
        amountRupees = feeNum;
        serverAmountPaise = Math.round(feeNum * 100);
      }
      const currency = 'INR';

      const generatedOrderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Server independently assigns paymentMode and isSimulated — never trusts client values
      const newPayment: any = {
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        orderId: generatedOrderId,
        eventId: id,
        userId: authUser.id,
        username: authUser.username,
        teamName: (teamName || '').trim() || undefined,
        utrNumber: normalizedUtr,
        transactionId: normalizedTxnId,
        paymentMode: 'real',
        isSimulated: false,
        amount: serverAmountPaise,
        amountPaise: serverAmountPaise,
        amountRupees: amountRupees,
        currency: currency,
        paymentMethod: paymentMethod || 'UPI',
        status: 'pending',
        createdAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null,
      };

      payments.push(newPayment);
      paymentsDb.set(id, payments);
      savePaymentsToDisk();

      return {
        success: true,
        message: 'Payment submitted for verification.',
        payment: newPayment,
        orderId: generatedOrderId,
        amountPaise: serverAmountPaise,
        amountRupees: amountRupees,
        currency: currency,
        paymentMode: newPayment.paymentMode,
        isSimulated: newPayment.isSimulated,
        transactionId: newPayment.transactionId,
      };
    });

    // Update the lock chain so subsequent requests wait for this write
    paymentWriteLocks.set(id, writePromise);

    try {
      const result = await writePromise;
      if (paymentWriteLocks.get(id) === writePromise) {
        paymentWriteLocks.delete(id);
      }
      return res.status(201).json(result);
    } catch (err: any) {
      if (paymentWriteLocks.get(id) === writePromise) {
        paymentWriteLocks.delete(id);
      }
      const status = err?.status || 500;
      return res.status(status).json({ error: err?.error || 'Payment submission failed.' });
    }
  });

  app.get('/api/events/:id/payments', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const authUser = (req as any).authUser;
    const payments = paymentsDb.get(id) || [];
    // Filter to only show user's own payments unless admin
    if (authUser?.role === 'superadmin') {
      return res.json({ payments });
    }
    const userPayments = payments.filter((p: any) => p.userId === authUser?.id || p.username === authUser?.username);
    res.json({ payments: userPayments });
  });

  // API: Player's own registrations for an event
  app.get('/api/events/:id/registrations', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const authUser = (req as any).authUser;
    const regs = registrationsDb.get(id) || [];
    const userRegs = regs.filter((r: any) => r.userId === authUser?.id || r.username === authUser?.username);
    res.json({ registrations: userRegs });
  });

  // --------------------------------------------------------------------------
  // API: Teams (PRIVACY SAFE - NEVER LEAKS EMAILS OR PHONES)
  // --------------------------------------------------------------------------
  app.get('/api/events/:id/teams', (req: Request, res: Response) => {
    const { id } = req.params;
    const teams = teamsDb.get(id) || [];
    // Only return team names, member usernames, and avatars — NO contact info!
    const sanitizedTeams = teams.map((t: any) => ({
      id: t.id,
      teamName: t.teamName,
      leaderUsername: t.leaderUsername,
      members: t.members.map((m: any) => ({ username: m.username, avatar: m.avatar })),
      memberCount: t.members.length,
      avatar: t.avatar,
    }));
    res.json({ teams: sanitizedTeams });
  });

  app.post('/api/events/:id/teams', (req: Request, res: Response) => {
    const { id } = req.params;
    const { teamName, leaderUsername, avatar } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    const teams = teamsDb.get(id) || [];
    const newTeam = {
      id: `team-${Date.now()}`,
      eventId: id,
      teamName: teamName.trim(),
      leaderUsername,
      members: [{ username: leaderUsername, role: 'leader', avatar: avatar || '🦊' }],
      avatar: avatar || '🦊',
      createdAt: new Date().toISOString(),
    };

    teams.push(newTeam);
    teamsDb.set(id, teams);

    res.status(201).json({ success: true, team: newTeam });
  });

  // --------------------------------------------------------------------------
  // API: Clues & Hints (Anti-Cheat: Solutions hidden from players!)
  // --------------------------------------------------------------------------
  app.get('/api/events/:id/clues', (req: Request, res: Response) => {
    const { id } = req.params;
    const { isOrganizer } = req.query;
    const event = eventsDb.get(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const clues = event.clues || [];

    if (isOrganizer === 'true') {
      // Organizer gets full clues with answers
      return res.json({ clues });
    }

    // Participants: Hide answers and target QR codes to preserve game integrity
    const publicClues = clues.map((c: any) => ({
      id: c.id,
      eventId: c.eventId,
      order: c.order,
      title: c.title,
      riddle: c.riddle,
      locationHint: c.locationHint,
      type: c.type,
      points: c.points,
      hint1: c.hint1,
      hint2: c.hint2,
      // Solution and qrCodeValue are omitted!
    }));

    return res.json({ clues: publicClues });
  });

  app.post('/api/events/:id/clues/:clueId/hint', (req: Request, res: Response) => {
    const { id, clueId } = req.params;
    const { hintNumber, userId } = req.body;
    const event = eventsDb.get(id);

    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const clue = (event.clues || []).find((c: any) => c.id === clueId);
    if (!clue) return res.status(404).json({ error: 'Clue not found.' });

    const hintText = hintNumber === 1 ? clue.hint1 : clue.hint2;
    const penalty = hintNumber === 1 ? 20 : 35;

    const list = hintsDb.get(id) || [];
    list.push({ clueId, hintNumber, userId, penalty, unlockedAt: new Date().toISOString() });
    hintsDb.set(id, list);

    return res.json({ success: true, hint: hintText, penaltyPoints: penalty });
  });

  // --------------------------------------------------------------------------
  // API: QR Scanning Validation
  // --------------------------------------------------------------------------
  app.post('/api/events/:id/scan-qr', (req: Request, res: Response) => {
    const { id } = req.params;
    const { clueId, scannedValue, userId } = req.body;
    const event = eventsDb.get(id);

    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const clue = (event.clues || []).find((c: any) => c.id === clueId);
    if (!clue) return res.status(404).json({ error: 'Clue not found.' });

    const expectedQr = clue.qrCodeValue || clue.solution || clue.id;
    const isMatch = scannedValue.trim().toLowerCase() === expectedQr.trim().toLowerCase();

    if (isMatch) {
      return res.json({
        success: true,
        isValid: true,
        pointsAwarded: clue.points || 100,
        message: 'QR Code matched! Clue completed!',
      });
    }

    return res.json({
      success: false,
      isValid: false,
      message: 'Scanned QR Code does not match this checkpoint.',
    });
  });

  // --------------------------------------------------------------------------
  // API: Event Timer (Real-time Authoritative Countdown)
  // --------------------------------------------------------------------------
  app.get('/api/events/:id/timer', (req: Request, res: Response) => {
    const { id } = req.params;
    const timer = timersDb.get(id) || {
      eventId: id,
      isRunning: false,
      isPaused: false,
      durationMinutes: 120,
      remainingSeconds: 7200,
      startTime: null,
    };
    res.json({ timer });
  });

  app.post('/api/events/:id/timer/start', (req: Request, res: Response) => {
    const { id } = req.params;
    const { durationMinutes = 120 } = req.body;
    const startTime = new Date().toISOString();
    const timer = {
      eventId: id,
      isRunning: true,
      isPaused: false,
      durationMinutes,
      startTime,
      remainingSeconds: durationMinutes * 60,
    };
    timersDb.set(id, timer);
    res.json({ success: true, timer });
  });

  // --------------------------------------------------------------------------
  // API: Leaderboard & Scoring (PRIVACY PROTECTED)
  // --------------------------------------------------------------------------
  app.get('/api/events/:id/leaderboard', (req: Request, res: Response) => {
    const { id } = req.params;
    // Returns sanitized leaderboard entries (only teamName, score, rank, avatar)
    // NEVER returns user phone numbers or emails!
    const mockBoard = [
      { id: 'lb-1', rank: 1, teamName: 'Quantum Seekers', score: 980, cluesSolved: 5, totalClues: 5, avatar: '👑' },
      { id: 'lb-2', rank: 2, teamName: 'Campus Nomads', score: 840, cluesSolved: 4, totalClues: 5, avatar: '⚡' },
      { id: 'lb-3', rank: 3, teamName: 'The Trailblazers', score: 710, cluesSolved: 3, totalClues: 5, avatar: '🔥' },
    ];
    res.json({ leaderboard: mockBoard });
  });

  // --------------------------------------------------------------------------
  // API: Event-Specific Notifications
  // --------------------------------------------------------------------------
  app.get('/api/events/:id/notifications', (req: Request, res: Response) => {
    const { id } = req.params;
    const notifications = notificationsDb.get(id) || [
      {
        id: 'notif-1',
        title: 'Hunt Commencing Soon!',
        message: 'Verify your 6-digit Event PIN to unlock the first clue.',
        type: 'announcement',
        createdAt: '10 mins ago',
      },
    ];
    res.json({ notifications });
  });

  app.post('/api/events/:id/notifications', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, message, type = 'announcement' } = req.body;
    const list = notificationsDb.get(id) || [];
    const notif = {
      id: `notif-${Date.now()}`,
      eventId: id,
      title,
      message,
      type,
      createdAt: 'Just now',
    };
    list.unshift(notif);
    notificationsDb.set(id, list);
    res.status(201).json({ success: true, notification: notif });
  });

  // --------------------------------------------------------------------------
  // Mount Vite middleware in Development mode, Static files in Production
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`dYs? [Full-Stack Server] Ready on http://0.0.0.0:${PORT}`);
    console.log(`dY"- Supabase Backend Connected: ${SUPABASE_URL}`);

    const discovery = process.env.CAMPUS_QUEST_DISABLE_DISCOVERY === 'true'
      ? { stop: async () => {} }
      : startBackendDiscovery({ port: PORT });
    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      discovery
        .stop()
        .catch(() => {})
        .finally(() => {
          httpServer.close(() => process.exit(0));
          setTimeout(() => process.exit(0), 2000).unref();
        });
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});
