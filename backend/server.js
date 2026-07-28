const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { OFFICES, SERVICES, getQueueState, generateAnalytics } = require('./src/config/demoData');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'smartgov_demo_secret_2024';

// =============================================
// DATABASE MODE CHECK
// =============================================
let dbAvailable = false;
let dbPool = null;

const tryConnectDB = async () => {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('password@localhost')) {
      console.log('ℹ️  No valid DATABASE_URL – running in DEMO MODE (no real DB needed)');
      return false;
    }
    const { Pool } = require('pg');
    dbPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 3000 });
    await dbPool.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL database');
    return true;
  } catch (err) {
    console.log('ℹ️  Database not reachable – running in DEMO MODE');
    return false;
  }
};

// =============================================
// MIDDLEWARE
// =============================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL || ''].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// =============================================
// AUTH HELPERS
// =============================================
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch { return res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
};

// DEMO users
const DEMO_EMPLOYEES = [
  { id: 'emp-001', employee_id: 'EMP001', username: 'meeseva_emp1', password: 'Employee@123', full_name: 'Ramesh Kumar', role: 'employee', office_id: 'a1-meeseva', office_name: 'MeeSeva', designation: 'Counter Operator', is_active: true },
  { id: 'emp-002', employee_id: 'EMP002', username: 'rto_emp1', password: 'Employee@123', full_name: 'Suresh Babu', role: 'employee', office_id: 'a2-rto', office_name: 'RTO Office', designation: 'Vehicle Inspector', is_active: true },
  { id: 'emp-003', employee_id: 'EMP003', username: 'sbi_emp1', password: 'Employee@123', full_name: 'Lakshmi Devi', role: 'employee', office_id: 'b1-sbi', office_name: 'SBI', designation: 'Bank Officer', is_active: true },
  { id: 'emp-004', employee_id: 'EMP004', username: 'passport_emp1', password: 'Employee@123', full_name: 'Venkata Rao', role: 'manager', office_id: 'a7-passport', office_name: 'Passport Office', designation: 'PSK Manager', is_active: true },
];

const DEMO_ADMIN = { id: 'admin-001', username: 'superadmin', password: 'Admin@123', full_name: 'Super Administrator', email: 'admin@smartgov-kakinada.gov.in', is_super_admin: true };

// In-memory audit logs and announcements for demo
const AUDIT_LOGS = [];
const ANNOUNCEMENTS = {};
const addAuditLog = (data) => { AUDIT_LOGS.unshift({ id: Date.now().toString(), created_at: new Date().toISOString(), ...data }); };

// =============================================
// HEALTH CHECK
// =============================================
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'SmartGov AI – Kakinada', mode: dbAvailable ? 'database' : 'demo', version: '1.0.0', timestamp: new Date().toISOString() }));

// =============================================
// AUTH ROUTES
// =============================================
app.post('/api/auth/employee/login', async (req, res) => {
  const { username, password } = req.body;
  const emp = DEMO_EMPLOYEES.find(e => e.username === username && e.is_active);
  if (!emp || emp.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const token = jwt.sign({ id: emp.id, employeeId: emp.employee_id, username: emp.username, role: emp.role, officeId: emp.office_id, type: 'employee' }, JWT_SECRET, { expiresIn: '12h' });
  addAuditLog({ actor_type: 'employee', actor_id: emp.id, actor_name: emp.full_name, actor_employee_id: emp.employee_id, office_id: emp.office_id, office_name: emp.office_name, action: 'LOGIN', action_category: 'auth', ip_address: req.ip });
  res.json({ success: true, message: 'Login successful', data: { token, employee: { id: emp.id, employeeId: emp.employee_id, username: emp.username, fullName: emp.full_name, role: emp.role, officeId: emp.office_id, officeName: emp.office_name, designation: emp.designation } } });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== DEMO_ADMIN.username || password !== DEMO_ADMIN.password) return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  const token = jwt.sign({ id: DEMO_ADMIN.id, username: DEMO_ADMIN.username, role: 'super_admin', type: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  addAuditLog({ actor_type: 'admin', actor_id: DEMO_ADMIN.id, actor_name: DEMO_ADMIN.full_name, action: 'ADMIN_LOGIN', action_category: 'auth', ip_address: req.ip });
  res.json({ success: true, data: { token, admin: { id: DEMO_ADMIN.id, username: DEMO_ADMIN.username, fullName: DEMO_ADMIN.full_name, isSuperAdmin: true } } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const u = req.user;
  if (u.type === 'admin') return res.json({ success: true, data: { ...DEMO_ADMIN, role: 'super_admin', type: 'admin' } });
  const emp = DEMO_EMPLOYEES.find(e => e.id === u.id);
  res.json({ success: true, data: { ...emp, type: 'employee' } });
});

// =============================================
// OFFICES ROUTES
// =============================================
app.get('/api/offices', (req, res) => {
  const { type } = req.query;
  const data = type ? OFFICES.filter(o => o.type === type) : OFFICES;
  res.json({ success: true, data });
});

app.get('/api/offices/:id', (req, res) => {
  const office = OFFICES.find(o => o.id === req.params.id);
  if (!office) return res.status(404).json({ success: false, message: 'Office not found' });
  res.json({ success: true, data: { ...office, service_count: (SERVICES[req.params.id] || []).length } });
});

app.get('/api/offices/:id/services', (req, res) => {
  const services = SERVICES[req.params.id] || [];
  res.json({ success: true, data: services });
});

app.get('/api/services/:id', (req, res) => {
  for (const [officeId, svcs] of Object.entries(SERVICES)) {
    const svc = svcs.find(s => s.id === req.params.id);
    if (svc) {
      const office = OFFICES.find(o => o.id === officeId);
      return res.json({ success: true, data: { ...svc, office_name: office?.name, office_address: office?.address, office_phone: office?.phone, working_hours: office?.working_hours, google_map_url: office?.google_map_url } });
    }
  }
  res.status(404).json({ success: false, message: 'Service not found' });
});

// Admin: Create office (demo just returns success)
app.post('/api/offices', authenticate, (req, res) => {
  const newOffice = { id: `new-${Date.now()}`, ...req.body, is_active: true };
  OFFICES.push(newOffice);
  res.status(201).json({ success: true, data: newOffice, message: 'Office created' });
});

// =============================================
// QUEUE ROUTES
// =============================================
app.get('/api/queue/:officeId/status', (req, res) => {
  const { officeId } = req.params;
  const office = OFFICES.find(o => o.id === officeId);
  if (!office) return res.status(404).json({ success: false, message: 'Office not found' });
  const q = getQueueState(officeId);
  const waitingCount = Math.max(0, q.total_tokens_issued - q.current_token);
  const crowd = waitingCount <= 5 ? { level: 'low', label: 'Low', color: '#10b981', emoji: '🟢' } :
    waitingCount <= 15 ? { level: 'medium', label: 'Moderate', color: '#f59e0b', emoji: '🟡' } :
    waitingCount <= 30 ? { level: 'high', label: 'High', color: '#ef4444', emoji: '🔴' } :
    { level: 'very_high', label: 'Very High', color: '#7c3aed', emoji: '🔴' };
  const officeAnnouncements = ANNOUNCEMENTS[officeId] || [];
  res.json({ success: true, data: { queue: { id: `q-${officeId}`, date: q.date, currentToken: q.current_token, totalTokensIssued: q.total_tokens_issued, isPaused: q.is_paused, status: q.status, pauseReason: q.pause_reason }, waitingCount, crowd, avgServiceMinutes: 8, office: { name: office.name, workingHours: office.working_hours, lunchBreak: office.lunch_break, phone: office.phone }, announcements: officeAnnouncements.slice(0, 3), lastUpdated: new Date().toISOString() } });
});

app.get('/api/queue/:officeId/predict', (req, res) => {
  const { officeId } = req.params;
  const token = parseInt(req.query.token) || 0;
  const q = getQueueState(officeId);
  const position = Math.max(0, token - q.current_token);
  const avgService = 8;
  const estimatedWait = position * avgService;
  const expectedCallTime = new Date(Date.now() + estimatedWait * 60 * 1000);
  const waitingCount = Math.max(0, q.total_tokens_issued - q.current_token);
  const hour = new Date().getHours();
  let bestTime = 'Right now! 🟢 Low crowd.';
  if (hour >= 10 && hour <= 12) bestTime = 'After 2:00 PM – post-lunch shorter queues';
  else if (hour >= 14 && hour <= 16) bestTime = 'Tomorrow 9:00–10:00 AM for shortest wait';
  else if (hour >= 13 && hour < 14) bestTime = 'After 2:30 PM – queue resumes post-lunch';
  const crowd = waitingCount <= 5 ? { level: 'low', label: 'Low', color: '#10b981', emoji: '🟢' } :
    waitingCount <= 15 ? { level: 'medium', label: 'Moderate', color: '#f59e0b', emoji: '🟡' } :
    { level: 'high', label: 'High', color: '#ef4444', emoji: '🔴' };
  res.json({ success: true, data: { tokenNumber: token, currentToken: q.current_token, position, estimatedWaitMinutes: estimatedWait, expectedCallTime: expectedCallTime.toISOString(), crowdLevel: crowd, bestTimeToVisit: bestTime, aiPowered: false, confidence: 78 } });
});

app.post('/api/queue/:officeId/join', (req, res) => {
  const { officeId } = req.params;
  const q = getQueueState(officeId);
  if (q.is_paused) return res.status(400).json({ success: false, message: 'Queue is currently paused. Please try again later.' });
  q.total_tokens_issued++;
  const position = q.total_tokens_issued - q.current_token;
  res.status(201).json({ success: true, message: 'Successfully joined queue', data: { tokenNumber: q.total_tokens_issued, position, queueId: `q-${officeId}` } });
});

app.put('/api/queue/:officeId/update-token', authenticate, (req, res) => {
  const { officeId } = req.params;
  const { token } = req.body;
  const q = getQueueState(officeId);
  const oldToken = q.current_token;
  if (parseInt(token) <= oldToken) return res.status(400).json({ success: false, message: 'New token must be greater than current token' });
  q.current_token = parseInt(token);
  q.status = 'active';
  addAuditLog({ actor_type: 'employee', actor_id: req.user.id, actor_name: req.user.username, actor_employee_id: req.user.employeeId, office_id: officeId, action: 'UPDATE_TOKEN', action_category: 'queue_management', old_value: String(oldToken), new_value: String(token), ip_address: req.ip });
  res.json({ success: true, message: `Token updated to ${token}`, data: { oldToken, newToken: token } });
});

app.put('/api/queue/:officeId/pause', authenticate, (req, res) => {
  const { officeId } = req.params;
  const { reason } = req.body;
  const q = getQueueState(officeId);
  q.is_paused = true; q.status = 'paused'; q.pause_reason = reason || 'Paused by staff';
  addAuditLog({ actor_type: 'employee', actor_id: req.user.id, actor_name: req.user.username, actor_employee_id: req.user.employeeId, office_id: officeId, action: 'PAUSE_QUEUE', action_category: 'queue_management', new_value: reason, ip_address: req.ip });
  res.json({ success: true, message: 'Queue paused', data: { reason } });
});

app.put('/api/queue/:officeId/resume', authenticate, (req, res) => {
  const { officeId } = req.params;
  const q = getQueueState(officeId);
  q.is_paused = false; q.status = 'active'; q.pause_reason = null;
  addAuditLog({ actor_type: 'employee', actor_id: req.user.id, actor_name: req.user.username, actor_employee_id: req.user.employeeId, office_id: officeId, action: 'RESUME_QUEUE', action_category: 'queue_management', ip_address: req.ip });
  res.json({ success: true, message: 'Queue resumed' });
});

app.get('/api/queue/:officeId/history', (req, res) => res.json({ success: true, data: [] }));

// =============================================
// ANALYTICS ROUTES
// =============================================
app.get('/api/analytics/office/:officeId', (req, res) => {
  res.json({ success: true, data: generateAnalytics(req.params.officeId) });
});

app.get('/api/analytics/admin/all', authenticate, (req, res) => {
  const data = OFFICES.map(o => ({ id: o.id, name: o.name, type: o.type, total_visitors_30d: 800 + Math.floor(Math.random() * 1200), avg_wait_30d: 12 + Math.floor(Math.random() * 20), employee_count: DEMO_EMPLOYEES.filter(e => e.office_id === o.id).length }));
  res.json({ success: true, data });
});

app.get('/api/analytics/admin/logs', authenticate, (req, res) => {
  res.json({ success: true, data: AUDIT_LOGS });
});

// =============================================
// EMPLOYEE ROUTES
// =============================================
app.get('/api/employee/my-queue', authenticate, (req, res) => {
  const officeId = req.user.officeId;
  const q = getQueueState(officeId);
  const waiting = Math.max(0, q.total_tokens_issued - q.current_token);
  const entries = Array.from({ length: Math.min(10, q.total_tokens_issued) }, (_, i) => ({
    id: `entry-${i}`, token_number: q.current_token - 5 + i + 1,
    citizen_name: ['Ravi Kumar','Priya Reddy','Suresh Rao','Anitha Devi','Kiran Babu','Madhavi','Srinivas','Lakshmi'][i % 8],
    status: i < 3 ? 'completed' : i === 3 ? 'called' : 'waiting',
    joined_at: new Date(Date.now() - (10 - i) * 8 * 60 * 1000).toISOString(),
    service_name: null,
  })).filter(e => e.token_number > 0);
  res.json({ success: true, data: { queue: { ...q, id: `q-${officeId}` }, entries, stats: { waiting, completed: Math.max(0, q.current_token - 2), called: 1, skipped: 0, avg_wait: 16 } } });
});

app.get('/api/employee/announcements', authenticate, (req, res) => {
  const officeId = req.user.officeId;
  res.json({ success: true, data: ANNOUNCEMENTS[officeId] || [] });
});

app.post('/api/employee/announcements', authenticate, (req, res) => {
  const { title, message, type } = req.body;
  const officeId = req.user.officeId;
  const ann = { id: Date.now().toString(), office_id: officeId, title, message, type: type || 'info', created_at: new Date().toISOString(), is_active: true };
  if (!ANNOUNCEMENTS[officeId]) ANNOUNCEMENTS[officeId] = [];
  ANNOUNCEMENTS[officeId].unshift(ann);
  addAuditLog({ actor_type: 'employee', actor_id: req.user.id, actor_name: req.user.username, actor_employee_id: req.user.employeeId, office_id: officeId, action: 'CREATE_ANNOUNCEMENT', action_category: 'announcements', new_value: title, ip_address: req.ip });
  res.status(201).json({ success: true, data: ann, message: 'Announcement posted' });
});

app.delete('/api/employee/announcements/:id', authenticate, (req, res) => {
  const officeId = req.user.officeId;
  const annId = req.params.id;
  if (ANNOUNCEMENTS[officeId]) {
    ANNOUNCEMENTS[officeId] = ANNOUNCEMENTS[officeId].filter(a => a.id !== annId);
  }
  addAuditLog({ actor_type: 'employee', actor_id: req.user.id, actor_name: req.user.username, actor_employee_id: req.user.employeeId, office_id: officeId, action: 'DELETE_ANNOUNCEMENT', action_category: 'announcements', old_value: annId, ip_address: req.ip });
  res.json({ success: true, message: 'Announcement deleted' });
});

app.get('/api/employee/activity', authenticate, (req, res) => {
  const logs = AUDIT_LOGS.filter(l => l.actor_id === req.user.id);
  res.json({ success: true, data: logs });
});

// =============================================
// ADMIN ROUTES
// =============================================
app.get('/api/admin/dashboard', authenticate, (req, res) => {
  const q = getQueueState('a1-meeseva');
  res.json({ success: true, data: { offices: { total: OFFICES.length, active: OFFICES.length }, employees: { total: DEMO_EMPLOYEES.length, active: DEMO_EMPLOYEES.filter(e => e.is_active).length }, todayTokens: q.total_tokens_issued, todayServed: q.current_token, recentActivity: AUDIT_LOGS.slice(0, 10) } });
});

app.get('/api/admin/employees', authenticate, (req, res) => {
  res.json({ success: true, data: DEMO_EMPLOYEES.map(e => ({ ...e, last_login: new Date(Date.now() - Math.random() * 86400000).toISOString(), created_at: new Date().toISOString() })) });
});

app.post('/api/admin/employees', authenticate, (req, res) => {
  const { employeeId, username, password, fullName, email, officeId, role, designation } = req.body;
  const newEmp = { id: `emp-${Date.now()}`, employee_id: employeeId, username, password: password || 'Employee@123', full_name: fullName, email, office_id: officeId, role: role || 'employee', designation, is_active: true, office_name: OFFICES.find(o => o.id === officeId)?.name };
  DEMO_EMPLOYEES.push(newEmp);
  addAuditLog({ actor_type: 'admin', actor_id: req.user.id, actor_name: req.user.username, action: 'CREATE_EMPLOYEE', action_category: 'administration', new_value: `${username} (${employeeId})`, ip_address: req.ip });
  res.status(201).json({ success: true, data: newEmp, message: 'Employee created' });
});

app.put('/api/admin/employees/:id/reset-password', authenticate, (req, res) => {
  addAuditLog({ actor_type: 'admin', actor_id: req.user.id, actor_name: req.user.username, action: 'RESET_PASSWORD', action_category: 'administration', ip_address: req.ip });
  res.json({ success: true, message: 'Password reset successfully' });
});

app.delete('/api/admin/employees/:id', authenticate, (req, res) => {
  const emp = DEMO_EMPLOYEES.find(e => e.id === req.params.id);
  if (emp) emp.is_active = false;
  addAuditLog({ actor_type: 'admin', actor_id: req.user.id, actor_name: req.user.username, action: 'DEACTIVATE_EMPLOYEE', action_category: 'administration', ip_address: req.ip });
  res.json({ success: true, message: 'Employee deactivated' });
});

app.get('/api/admin/live-queues', authenticate, (req, res) => {
  const data = OFFICES.map(o => { const q = getQueueState(o.id); return { id: `q-${o.id}`, office_name: o.name, office_type: o.type, current_token: q.current_token, total_tokens_issued: q.total_tokens_issued, is_paused: q.is_paused, status: q.status, waiting_count: Math.max(0, q.total_tokens_issued - q.current_token), completed_count: q.current_token }; });
  res.json({ success: true, data });
});

app.post('/api/admin/announcements', authenticate, (req, res) => {
  const { officeId, title, message, type } = req.body;
  const ann = { id: Date.now().toString(), office_id: officeId, title, message, type: type || 'info', created_at: new Date().toISOString(), is_active: true };
  if (!ANNOUNCEMENTS[officeId]) ANNOUNCEMENTS[officeId] = [];
  ANNOUNCEMENTS[officeId].unshift(ann);
  res.status(201).json({ success: true, data: ann, message: 'Announcement created' });
});

// =============================================
// PRINTABLE FORM DOWNLOAD ROUTE
// =============================================
const FORM_METADATA = {
  'aadhaar-form': { title: 'UIDAI AADHAAR ENROLMENT & UPDATE / CORRECTION FORM', dept: 'MEESEVA & UIDAI AADHAAR SEVA KENDRA, KAKINADA', fee: 'Free (New Enrolment) / ₹50 (Demographic/Mobile Update)', docs: 'Proof of Identity (POI: PAN/Voter ID), Proof of Address (POA: Electricity Bill/Passbook), DOB Proof' },
  'income-cert-form': { title: 'APPLICATION FORM FOR INCOME CERTIFICATE', dept: 'MEESEVA & REVENUE DEPARTMENT, KAKINADA', fee: '₹30', docs: 'Aadhaar Card, Ration Card, Salary Slip/Income Proof, Passport Photo' },
  'caste-cert-form': { title: 'APPLICATION FORM FOR CASTE & COMMUNITY CERTIFICATE', dept: 'MEESEVA & REVENUE DEPARTMENT, KAKINADA', fee: '₹30', docs: 'Aadhaar Card, Ration Card, Parent Caste Cert/School TC, Photo' },
  'residence-cert-form': { title: 'APPLICATION FORM FOR RESIDENCE & NATIVITY CERTIFICATE', dept: 'REVENUE DEPARTMENT - MANDAL REVENUE OFFICE, KAKINADA', fee: '₹30', docs: 'Aadhaar Card, Ration Card, Electricity/Water Bill or Rent Agreement' },
  'birth-death-form': { title: 'APPLICATION FORM FOR BIRTH / DEATH REGISTRATION & CERTIFICATE', dept: 'KAKINADA MUNICIPAL CORPORATION', fee: '₹50', docs: 'Hospital Discharge Summary / Medical Cert, Parents/Deceased Aadhaar' },
  'rto-dl-form': { title: 'RTO FORM 29 & 30 / DRIVING LICENCE APPLICATION', dept: 'REGIONAL TRANSPORT AUTHORITY (RTO), KAKINADA', fee: '₹400', docs: 'Aadhaar Card, DOB Proof (SSC Memo), Form 1A Medical Cert, 6 Photos' },
  'ec-form': { title: 'APPLICATION FOR SEARCH & ISSUE OF ENCUMBRANCE CERTIFICATE (EC)', dept: 'REGISTRATION & STAMPS DEPARTMENT, KAKINADA', fee: '₹200', docs: 'Property Survey Number, Sale Deed Copy, Applicant Aadhaar' },
  'family-member-form': { title: 'APPLICATION FORM FOR FAMILY MEMBER CERTIFICATE', dept: 'TAHSILDAR OFFICE - REVENUE DEPT, KAKINADA', fee: '₹30', docs: 'Death Certificate, Aadhaar Cards of all members, Notarized Affidavit' },
  'passport-form': { title: 'PASSPORT SEVA KENDRA SUPPLEMENTARY APPLICATION FORM', dept: 'PASSPORT SEVA KENDRA (PSK), KAKINADA', fee: '₹1,500', docs: 'Aadhaar Card, DOB Proof, Present Address Proof, 2 Photos' },
  'bank-kyc-form': { title: 'BANK SAVINGS ACCOUNT OPENING & RE-KYC APPLICATION FORM', dept: 'BANKING SERVICES - KAKINADA BRANCH', fee: 'Free', docs: 'Aadhaar Card, PAN Card, 2 Passport Size Photos, Initial Deposit' },
  'spandana-form': { title: 'DISTRICT COLLECTORATE PUBLIC GRIEVANCE PETITION (SPANDANA)', dept: 'EAST GODAVARI DISTRICT COLLECTORATE, KAKINADA', fee: 'Free', docs: 'Aadhaar Card, Grievance Letter, Supporting Proof Papers' },
};

app.get('/api/forms/download/:formId', (req, res) => {
  const { formId } = req.params;
  const meta = FORM_METADATA[formId] || { title: 'OFFICIAL GOVERNMENT APPLICATION FORM', dept: 'SMARTGOV SERVICES - KAKINADA', fee: 'As Applicable', docs: 'Aadhaar Card, Address Proof, Photos' };
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${meta.title} - SmartGov Kakinada</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Arial', sans-serif; color: #111; line-height: 1.4; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; color: #0f172a; }
    .header h3 { margin: 4px 0; font-size: 14px; color: #1e3a8a; text-transform: uppercase; }
    .header p { margin: 2px 0; font-size: 11px; color: #475569; }
    .instructions { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; margin-bottom: 15px; border-radius: 4px; }
    .form-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .form-table td, .form-table th { border: 1px solid #000; padding: 7px 10px; font-size: 12px; vertical-align: top; }
    .form-table th { background: #f1f5f9; text-align: left; width: 35%; font-weight: bold; }
    .field-blank { min-height: 22px; display: block; border-bottom: 1px dotted #666; margin-top: 4px; }
    .section-title { background: #1e293b; color: #fff; font-size: 11px; font-weight: bold; padding: 5px 10px; text-transform: uppercase; margin-top: 12px; margin-bottom: 6px; }
    .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; }
    .coupon { margin-top: 25px; border-top: 2px dashed #000; padding-top: 12px; font-size: 11px; }
    .no-print { text-align: center; margin-bottom: 20px; background: #eff6ff; border: 1px solid #93c5fd; padding: 12px; border-radius: 8px; }
    .btn-print { background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print">
    <p style="margin:0 0 8px 0; color:#1e40af; font-size:14px; font-weight:bold;">🖨️ Form ready for home printing! Click below to print.</p>
    <button class="btn-print" onclick="window.print()">🖨️ Print Form / Save PDF</button>
  </div>

  <div class="header">
    <h2>GOVERNMENT OF ANDHRA PRADESH</h2>
    <h3>${meta.dept}</h3>
    <p><strong>${meta.title}</strong></p>
    <p>Kakinada District • Official Application Format • Fee: ${meta.fee}</p>
  </div>

  <div class="instructions">
    <strong>📌 INSTRUCTIONS FOR APPLICANT:</strong>
    <ol style="margin: 4px 0 0 16px; padding: 0;">
      <li>Fill this application form in <strong>CAPITAL LETTERS</strong> using Black or Blue ballpoint pen.</li>
      <li>Attach self-attested copies of required documents: <em>${meta.docs}</em>.</li>
      <li>Submit at the respective office counter or MeeSeva center in Kakinada.</li>
    </ol>
  </div>

  <div class="section-title">SECTION A: APPLICANT PERSONAL DETAILS</div>
  <table class="form-table">
    <tr><th>1. Full Name of Applicant (as in Aadhaar)</th><td><span class="field-blank"></span></td></tr>
    <tr><th>2. Father's / Husband's / Guardian Name</th><td><span class="field-blank"></span></td></tr>
    <tr><th>3. Gender & Date of Birth (DD/MM/YYYY)</th><td>Gender: [ &nbsp; ] Male &nbsp; [ &nbsp; ] Female &nbsp; [ &nbsp; ] Other &nbsp;&nbsp;&nbsp;&nbsp; DOB: _____/_____/_________</td></tr>
    <tr><th>4. Aadhaar Card Number</th><td>[ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ] - [ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ] - [ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ]</td></tr>
    <tr><th>5. Ration Card / Rice Card No</th><td><span class="field-blank"></span></td></tr>
    <tr><th>6. Mobile Number & Email ID</th><td>Mobile: ________________________ &nbsp;&nbsp; Email: ___________________________</td></tr>
  </table>

  <div class="section-title">SECTION B: RESIDENTIAL ADDRESS (KAKINADA DISTRICT)</div>
  <table class="form-table">
    <tr><th>Door / House No. & Street Name</th><td><span class="field-blank"></span></td></tr>
    <tr><th>Village / Ward / Area Name</th><td><span class="field-blank"></span></td></tr>
    <tr><th>Mandal & Pin Code</th><td>Mandal: Kakinada &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Pin Code: [ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ][ &nbsp; ]</td></tr>
  </table>

  <div class="section-title">SECTION C: SERVICE SPECIFIC INPUTS</div>
  <table class="form-table">
    <tr><th>Purpose of Application</th><td>[ &nbsp; ] Education & Scholarship &nbsp;&nbsp; [ &nbsp; ] Fee Reimbursement &nbsp;&nbsp; [ &nbsp; ] Govt Scheme &nbsp;&nbsp; [ &nbsp; ] Bank/Legal</td></tr>
    <tr><th>Details / Occupation / Income</th><td><div style="height:35px; border-bottom:1px dotted #999;"></div></td></tr>
  </table>

  <div class="section-title">SECTION D: ENCLOSED DOCUMENTS CHECKLIST</div>
  <div class="checkbox-grid">
    <div>[ &nbsp; ] Copy of Aadhaar Card</div>
    <div>[ &nbsp; ] Copy of Ration Card / Rice Card</div>
    <div>[ &nbsp; ] Address Proof (Power Bill/Voter ID)</div>
    <div>[ &nbsp; ] Passport Size Photographs (2 Nos)</div>
    <div>[ &nbsp; ] Previous Certificate / Property Paper</div>
    <div>[ &nbsp; ] Self-Declaration Affidavit</div>
  </div>

  <div style="margin-top: 25px; font-size: 11px;">
    <p><strong>DECLARATION:</strong> I hereby declare that all the information provided above is true and correct to the best of my knowledge. If any information is found false, I am liable for legal action under AP Government rules.</p>
  </div>

  <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px;">
    <div>
      Date: ____ / ____ / 2026<br>
      Place: Kakinada
    </div>
    <div style="text-align: center; border-top: 1px solid #000; padding-top: 4px; width: 220px;">
      Signature / Thumb Impression of Applicant
    </div>
  </div>

  <div class="coupon">
    <div style="text-align:center; font-weight:bold; margin-bottom:4px;">--- ACKNOWLEDGEMENT RECEIPT (OFFICE COUNTER STAMP) ---</div>
    <table style="width:100%; font-size:11px;">
      <tr>
        <td>Application No: ______________________</td>
        <td>Date Received: ____/____/2026</td>
        <td>Token No: ___________</td>
      </tr>
      <tr>
        <td colspan="2">Received application from Sri/Smt: _____________________________________________</td>
        <td>Officer Sign & Stamp: _________</td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="SmartGov_${formId}.html"`);
  res.send(html);
});

// =============================================
// ENHANCED CHATBOT ROUTE
// =============================================
app.post('/api/chatbot', (req, res) => {
  const { message = '', language = 'english' } = req.body;
  const rawMsg = message.trim();
  const msg = rawMsg.toLowerCase();

  // Detect if message is written in Telugu script or if language mode is Telugu
  const isTeluguScript = /[\u0C00-\u0C7F]/.test(rawMsg);
  const te = language === 'telugu' || isTeluguScript;

  let response = '';
  let formUrl = null;
  let formTitle = null;

  // 1. Aadhaar Form & Update Guide
  if (msg.includes('aadhaar') || msg.includes('aadhar') || msg.includes('uidai') || msg.includes('ఆధార్') || msg.includes('అధార్')) {
    response = te
      ? `🆔 **UIDAI ఆధార్ ఎన్‌రోల్‌మెంట్ & అప్‌డేట్ / సవరణ ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా & ఫోన్:**\n` +
        `• MeeSeva & Aadhaar Seva Kendra, Main Road, Kakinada, AP 533001\n` +
        `• 📞 ఫోన్: 0884-2301234 | 🗺️ [Google Maps లో చూడండి](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **పనివేళలు & రుసుము:**\n` +
        `• పనివేళలు: ఉదయం 09:00 - సాయంత్రం 05:00 (సోమ-శని). భోజన విరామం: 1:00-2:00 PM.\n` +
        `• రుసుము: కొత్త ఆధార్: ఉచితం | చిరునామా/ఫోన్ సవరణ: ₹50 | బయోమెట్రిక్: ₹100.\n\n` +
        `✍️ **ఫారం నింపే విధానం (Step-by-Step):**\n` +
        `1. **రకం ఎంచుకోండి:** క్రొత్త ఆధార్ ఐతే [ ] New Enrolment, సవరణ ఐతే [ ] Update టిక్ చేసి 12-అంకెల ఆధార్ నంబరు రాయండి.\n` +
        `2. **పేరు (Full Name):** Identity Proof (PAN/Voter ID) లో ఉన్నట్లు CAPITAL LETTERS లో రాయండి.\n` +
        `3. **లింగం & పుట్టిన తేదీ:** Gender [ ] Male [ ] Female, DOB (DD/MM/YYYY) రాయండి.\n` +
        `4. **చిరునామా & ఫోన్:** C/o తండ్రి/భర్త పేరు, డోర్ నంబర్, పిన్ కోడ్ & 10-అంకెల ఫోన్ నంబరు నింపండి.\n` +
        `5. **మార్చవలసిన వివరాలు:** పేరు, చిరునామా, ఫోన్, ఫోటో/బయోమెట్రిక్స్ టిక్ చేయండి.\n` +
        `6. **పత్రాలు & సంతకం:** POI + POA పత్రాలు జతచేసి కింద సంతకం చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Aadhaar Form Download చేయండి!**`
      : `🆔 **UIDAI Aadhaar Enrolment & Update / Correction Form Guide**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: MeeSeva Center & UIDAI Aadhaar Seva Kendra, Main Road, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2301234 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **Office Timings & Fees:**\n` +
        `• Working Hours: 09:00 AM – 05:00 PM (Mon–Sat). Lunch: 1:00 PM – 2:00 PM.\n` +
        `• Fee: New Aadhaar Enrolment: FREE | Name/Address/Mobile Update: ₹50 | Biometric Update: ₹100.\n\n` +
        `✍️ **How to Fill the Aadhaar Application Form:**\n` +
        `1. **Application Type:** Check [ ] New Enrolment OR [ ] Update. If updating, write your 12-digit Aadhaar number.\n` +
        `2. **Field 1 (Full Name):** Write your full name in CAPITAL LETTERS matching your Proof of Identity (POI).\n` +
        `3. **Field 2 (Gender & DOB):** Select Gender [ ] Male [ ] Female, DOB (DD/MM/YYYY) and check [ ] Verified.\n` +
        `4. **Field 3 (Address & Mobile):** Fill C/o Father/Husband Name, Door No, Village/Ward, Mandal, Pin Code & 10-digit Mobile Number.\n` +
        `5. **Field 4 (Fields to Update):** Tick checkboxes for fields you want to update (Name, Address, Mobile, Email, DOB, Biometrics).\n` +
        `6. **Field 5 (Sign & Enclose):** Attach POI (PAN/Voter ID/Passport) + POA (Power Bill/Bank Passbook) and sign.\n\n` +
        `👇 **Click below to download & print the official Aadhaar form at home!**`;
    formUrl = '/api/forms/download/aadhaar-form';
    formTitle = te ? '🖨️ UIDAI ఆధార్ ఫారమ్ ని Download & Print చేయండి' : 'Download UIDAI Aadhaar Enrolment & Update Form (Printable A4)';

  // 2. Income Certificate & Form
  } else if (msg.includes('income') || msg.includes('ఆదాయ') || msg.includes('ఇంకం') || msg.includes('aadaya')) {
    response = te
      ? `📄 **ఆదాయ ధృవీకరణ పత్రం (Income Certificate) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా & ఫోన్:**\n` +
        `• MeeSeva Center, Main Road, Kakinada, AP 533001 | 📞 0884-2301234\n` +
        `• 🗺️ [Google Maps లో చూడండి](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **పనివేళలు & రుసుము:**\n` +
        `• పనివేళలు: ఉదయం 09:00 - సాయంత్రం 05:00 (సోమ-శుక్ర), 09:00-01:00 PM (శని).\n` +
        `• రుసుము: ₹30 | ప్రాసెసింగ్ సమయం: 3-7 రోజులు.\n\n` +
        `✍️ **ఫారం నింపే విధానం:**\n` +
        `1. **దరఖాస్తుదారు పేరు:** Aadhaar Card ప్రకారం CAPITAL letters లో రాయండి.\n` +
        `2. **తండ్రి/భర్త పేరు:** కుటుంబ పెద్ద పేరు నింపండి.\n` +
        `3. **ఆధార్ & రేషన్ కార్డ్:** 12-అంకెల ఆధార్ మరియు Rice Card నంబరు రాయండి.\n` +
        `4. **వార్షిక ఆదాయం:** మీ కుటుంబ మొత్తం వార్షిక ఆదాయం (ఉదా: ₹60,000 / ₹1,20,000) రాయండి.\n` +
        `5. **ఉద్దేశ్యం:** చదువు (Fee Reimbursement) లేదా Govt Scheme బాక్స్ టిక్ చేయండి.\n` +
        `6. **పత్రాలు & సంతకం:** ఆధార్, రేషన్ కార్డ్, VRO ఆదాయ ధృవీకరణ జత చేసి కింద సంతకం చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `📄 **Income Certificate Service & Application Form Guide (MeeSeva)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: MeeSeva Center, Main Road, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2301234 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **Office Timings & Fees:**\n` +
        `• Working Hours: 09:00 AM – 05:00 PM (Mon–Fri), 09:00 AM – 01:00 PM (Sat). Lunch: 1:00 PM – 2:00 PM.\n` +
        `• Fee: ₹30 service charge | Processing Time: 3-7 working days.\n\n` +
        `✍️ **How to Fill the Application Form:**\n` +
        `1. **Field 1 (Applicant Name):** Write your full name in CAPITAL LETTERS matching your Aadhaar card.\n` +
        `2. **Field 2 (Father/Husband Name):** Write head of household name.\n` +
        `3. **Field 3 (Aadhaar & Ration Card No):** Fill 12-digit Aadhaar & Ration/Rice Card number.\n` +
        `4. **Field 4 (Annual Income):** Mention total annual family income from all sources (e.g. ₹60,000 or ₹1,20,000).\n` +
        `5. **Field 5 (Purpose):** Check box for Education, Fee Reimbursement, Govt Scheme, or Bank Loan.\n` +
        `6. **Field 6 (Sign & Enclose):** Sign at the bottom and attach Aadhaar copy, Ration card copy & VRO income report.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/income-cert-form';
    formTitle = te ? '🖨️ ఆదాయ ధృవీకరణ ఫారమ్ ని Download & Print చేయండి' : 'Download Income Certificate Form (Printable A4)';

  // 3. Caste Certificate & Form
  } else if (msg.includes('caste') || msg.includes('community') || msg.includes('కుల') || msg.includes('kula')) {
    response = te
      ? `📄 **కుల ధృవీకరణ పత్రం (Caste & Community Certificate) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా & ఫోన్:**\n` +
        `• MeeSeva Center, Main Road, Kakinada / Tahsildar Office, Bommuru Road, Kakinada\n` +
        `• 📞 ఫోన్: 0884-2301234 | 🗺️ [Google Maps](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **పనివేళలు & రుసుము:** 10:00 AM – 05:00 PM | రుసుము: ₹30 | 7-15 రోజులు.\n\n` +
        `✍️ **ఫారం నింపే విధానం:**\n` +
        `1. **పేరు & పుట్టిన తేదీ:** School TC & Aadhaar ప్రకారంగా పూర్తి పేరు, పుట్టిన తేదీ నింపండి.\n` +
        `2. **కుల విభాగం:** SC / ST / BC-A/B/C/D/E మరియు మీ Sub-Caste స్పష్టంగా రాయండి.\n` +
        `3. **తండ్రి కుల ధృవీకరణ:** తండ్రి లేదా సోదరుని కుల ధృవీకరణ పత్రం CND సంఖ్య ఉంటే రాయండి.\n` +
        `4. **జతచేయవలసినవి:** School TC, Parent Caste Cert, Aadhaar card జత చేసి సంతకం చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `📄 **Caste & Community Certificate Guide & Form (MeeSeva)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: MeeSeva Center, Main Road, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2301234 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=MeeSeva+Kakinada)\n\n` +
        `🏛️ **Office Timings & Fees:**\n` +
        `• Working Hours: 10:00 AM – 05:00 PM (Mon–Fri), 10:00 AM – 01:00 PM (Sat). Lunch: 1:00–2:00 PM.\n` +
        `• Fee: ₹30 | Processing Time: 7-15 working days.\n\n` +
        `✍️ **How to Fill the Form:**\n` +
        `1. **Personal Details:** Fill Applicant Name, DOB, and Gender matching school records.\n` +
        `2. **Caste Category:** Specify exact Caste/Sub-Caste (SC / ST / BC-A/B/C/D/E).\n` +
        `3. **Parent Caste Cert:** Mention CND Number of Father's or Brother's Caste Cert if available.\n` +
        `4. **Address:** Kakinada Mandal & Door Number details.\n` +
        `5. **Sign & Attach:** School Transfer Cert copy + Parent Caste Cert + Aadhaar.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/caste-cert-form';
    formTitle = te ? '🖨️ కుల ధృవీకరణ ఫారమ్ ని Download & Print చేయండి' : 'Download Caste Certificate Form (Printable A4)';

  // 4. Residence Certificate & Form
  } else if (msg.includes('residence') || msg.includes('nativity') || msg.includes('నివాస') || msg.includes('nivasa')) {
    response = te
      ? `📄 **నివాస ధృవీకరణ పత్రం (Residence Certificate) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** Tahsildar Office, Bommuru Road, Kakinada | 📞 0884-2306789\n` +
        `🏛️ **పనివేళలు & రుసుము:** 10:00 AM – 05:00 PM | రుసుము: ₹30 | 3-5 రోజులు.\n\n` +
        `✍️ **ఫారం నింపే విధానం:** దరఖాస్తుదారు పేరు, ఆధార్ నంబర్, కాకినాడ మండలంలో నివసిస్తున్న సంవత్సరాలు (కనీసం 7 సంవత్సరాలు), కరెంట్ బిల్లు/ఇంటి అద్దె ఒప్పందం జత చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `📄 **Residence Certificate Guide & Form (MeeSeva)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Mandal Revenue Office (Tahsildar Office), Bommuru Road, Kakinada, AP 533002\n` +
        `• 📞 Phone: 0884-2306789 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Tahsildar+Office+Kakinada)\n\n` +
        `🏛️ **Timings & Fees:** 10:00 AM – 05:00 PM | Fee: ₹30 | 3-5 days.\n\n` +
        `✍️ **How to Fill:** Enter applicant name, Aadhaar no, years of continuous residence in Kakinada mandal (minimum 7 years for study certificate), attach electricity/water bill or rental agreement.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/residence-cert-form';
    formTitle = te ? '🖨️ నివాస ధృవీకరణ ఫారమ్ ని Download & Print చేయండి' : 'Download Residence Certificate Form (Printable A4)';

  // 5. Driving Licence & RTO Form 29/30
  } else if (msg.includes('driving') || msg.includes('licence') || msg.includes('license') || msg.includes('dl') || msg.includes('rto') || msg.includes('form 29') || msg.includes('form 30') || msg.includes('rc transfer') || msg.includes('డ్రైవింగ్') || msg.includes('లైసెన్స్') || msg.includes('వాహన')) {
    response = te
      ? `🚗 **RTO డ్రైవింగ్ లైసెన్స్ & వాహన బదిలీ ఫారమ్ గైడ్ (RTO Kakinada)**\n\n` +
        `📍 **ఆఫీస్ చిరునామా & ఫోన్:**\n` +
        `• Regional Transport Office (RTO), Auto Nagar, Kakinada, AP 533003\n` +
        `• 📞 ఫోన్: 0884-2302345 | 🗺️ [Google Maps లో చూడండి](https://maps.google.com/?q=RTO+Kakinada)\n\n` +
        `🏛️ **పనివేళలు & ఫీజు:**\n` +
        `• ఉదయం 10:00 - సాయంత్రం 05:00 (సోమ-శుక్ర). భోజన విరామం: 1:00-2:00 PM.\n` +
        `• ఫీజు: కొత్త DL: ₹400 | RC బదిలీ: ₹500 | LL: ₹200.\n\n` +
        `✍️ **RTO ఫారాలు నింపే విధానం:**\n` +
        `1. **Form 1 (Medical Fitness):** శారీరక ఆరోగ్యం, కంటి చూపు స్వయం ప్రకటన సంతకం చేయండి.\n` +
        `2. **Form 29 (Notice of Transfer):** అమ్మకందారు వాహన నంబర్, కొనుగోలుదారు చిరునామా రాసి సంతకం చేయాలి.\n` +
        `3. **Form 30 (Application for Transfer):** కొనుగోలుదారు వాహన వివరాలు, ఇన్సూరెన్స్ పాలసీ రాసి సంతకం చేయాలి.\n` +
        `4. ఆధార్ కార్డ్, PUC కాలుష్య ధృవీకరణ, ఇన్సూరెన్స్ కాపీ & 6 ఫోటోలు జతచేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి RTO Forms Download చేయండి!**`
      : `🚗 **RTO Driving Licence & Vehicle Transfer Form Guide (RTO Kakinada)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Regional Transport Office (RTO), Auto Nagar, Kakinada, AP 533003\n` +
        `• 📞 Phone: 0884-2302345 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=RTO+Kakinada)\n\n` +
        `🏛️ **Office Timings:**\n` +
        `• Working Hours: 10:00 AM – 05:00 PM (Mon–Fri), 10:00 AM – 01:00 PM (Sat). Lunch: 1:00 PM – 2:00 PM.\n` +
        `• Fees: Fresh DL ₹400 | RC Transfer ₹500 | LL ₹200.\n\n` +
        `✍️ **How to Fill RTO Forms:**\n` +
        `1. **Form 1 (Medical Fitness):** Complete self-declaration of physical fitness, vision, and medical history.\n` +
        `2. **Form 29 (Notice of Transfer):** Vehicle seller fills vehicle reg no, buyer's full address & signs.\n` +
        `3. **Form 30 (Application for Transfer):** Vehicle buyer fills registration details, valid insurance policy no & signs.\n` +
        `4. Attach Aadhaar card copy, valid PUC certificate, insurance policy & 6 passport photos.\n\n` +
        `👇 **Click below to download & print RTO Forms at home!**`;
    formUrl = '/api/forms/download/rto-dl-form';
    formTitle = te ? '🖨️ RTO Form 29/30 & DL ఫారమ్ ని Download చేయండి' : 'Download RTO Form 29/30 & DL Application (Printable A4)';

  // 6. Birth & Death Registration Form
  } else if (msg.includes('birth') || msg.includes('death') || msg.includes('జనన') || msg.includes('మరణ')) {
    response = te
      ? `📄 **జనన / మరణ నమోదు ధృవీకరణ ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** Kakinada Municipal Corporation Office, Softy Center, Kakinada | 📞 0884-2304567\n` +
        `🏛️ **పనివేళలు & రుసుము:** 10:00 AM – 05:00 PM | రుసుము: ₹50 (21 రోజులలోపు ఉచితం).\n\n` +
        `✍️ **ఫారం నింపే విధానం:** శిశువు/మృతుని పూర్తి పేరు, జనన/మరణ తేదీ & స్థలం (ఆసుపత్రి/ఇల్లు), తల్లిదండ్రుల ఆధార్ నంబరు నింపి ఆసుపత్రి డిశ్చార్జ్ రిపోర్టు జతచేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `📄 **Birth / Death Registration & Certificate Guide**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Kakinada Municipal Corporation Office, Softy Center, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2304567 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Municipal+Corporation+Kakinada)\n\n` +
        `🏛️ **Office & Timings:** 10:00 AM – 05:00 PM | Fee: ₹50 per copy (Free within 21 days).\n\n` +
        `✍️ **How to Fill:** Fill Child/Deceased Full Name, Date & Exact Place of Birth/Death (Hospital/Home), Parents/Informant Aadhaar & attach hospital discharge summary or doctor certificate.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/birth-death-form';
    formTitle = te ? '🖨️ జనన / మరణ నమోదు ఫారమ్ ని Download చేయండి' : 'Download Birth/Death Application Form (Printable A4)';

  // 7. Encumbrance Certificate (EC)
  } else if (msg.includes('encumbrance') || msg.includes('ec') || msg.includes('ఈసీ') || msg.includes('ఈసి')) {
    response = te
      ? `📜 **ఎన్‌కంబ్రెన్స్ సర్టిఫికేట్ (EC / ఈసీ శోధన) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** Sub-Registrar Office, Court Road, Kakinada | 📞 0884-2305678\n` +
        `🏛️ **పనివేళలు & ఫీజు:** 10:00 AM – 04:00 PM | ఫీజు: ₹200 (30 సంవత్సరాల శోధన).\n\n` +
        `✍️ **ఫారం నింపే విధానం:** ఆస్తి సర్వే నంబర్, గ్రామం/మండలం, సేల్ డీడ్ లింక్ డాక్యుమెంట్ నంబర్లు, శోధన కాలం (ఉదా: 1996-2026) నింపి దరఖాస్తుదారు ఆధార్ జతచేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి EC Form Download చేయండి!**`
      : `📜 **Encumbrance Certificate (EC) Guide & Form**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Sub-Registrar Office, Court Road, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2305678 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Registration+Office+Kakinada)\n\n` +
        `🏛️ **Office & Timings:** 10:00 AM – 04:00 PM | Fee: ₹200 for 30 yrs search.\n\n` +
        `✍️ **How to Fill:** Enter Property Survey Number, Mandal/Village, Sale Deed link document numbers, search period (e.g. 1996–2026), and applicant Aadhaar.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/ec-form';
    formTitle = te ? '🖨️ EC ఫారమ్ ని Download & Print చేయండి' : 'Download Encumbrance Certificate Form (Printable A4)';

  // 8. Family Member Certificate
  } else if (msg.includes('family member') || msg.includes('legal heir') || msg.includes('కుటుంబ')) {
    response = te
      ? `📜 **కుటుంబ సభ్యుల సర్టిఫికేట్ (Family Member Certificate) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** Tahsildar Office, Bommuru Road, Kakinada | 📞 0884-2306789\n` +
        `🏛️ **పనివేళలు & ఫీజు:** 10:00 AM – 05:00 PM | ఫీజు: ₹30.\n\n` +
        `✍️ **ఫారం నింపే విధానం:** మరణించిన వ్యక్తి పేరు, మరణ తేది, జీవించి ఉన్న చట్టబద్ధమైన వారసులందరి పట్టిక (పేరు, వయస్సు, సంబంధం) రాసి నోటరీ అఫిడవిట్ జత చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `📜 **Family Member Certificate Guide (Tahsildar Office)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Tahsildar Office, Bommuru Road, Kakinada, AP 533002\n` +
        `• 📞 Phone: 0884-2306789 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Tahsildar+Office+Kakinada)\n\n` +
        `🏛️ **Office & Timings:** 10:00 AM – 05:00 PM | Fee: ₹30.\n\n` +
        `✍️ **How to Fill:** List Name of Deceased, Date of Death, table of all surviving legal heirs (Name, Age, Relationship, Marital Status), attach notarized affidavit & death cert copy.\n\n` +
        `👇 **Click below to download & print the form at home!**`;
    formUrl = '/api/forms/download/family-member-form';
    formTitle = te ? '🖨️ కుటుంబ సభ్యుల ఫారమ్ ని Download చేయండి' : 'Download Family Member Cert Form (Printable A4)';

  // 9. Passport Application Form
  } else if (msg.includes('passport') || msg.includes('psk') || msg.includes('పాస్‌పోర్ట్') || msg.includes('పాస్పోర్ట్')) {
    response = te
      ? `✈️ **పాస్‌పోర్ట్ దరఖాస్తు & అనుబంధ ఫారమ్ గైడ్ (PSK Kakinada)**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** Passport Seva Kendra, Collectorate పక్కన, Kakinada | 📞 0884-2307890\n` +
        `🏛️ **పనివేళలు & ఫీజు:** 09:00 AM – 05:00 PM (సోమ-శుక్ర). సాధారణ ఫీజు: ₹1,500 | తత్కాల్: ₹3,500.\n\n` +
        `✍️ **ఫారం నింపే విధానం:** SSC మెమో ప్రకారం పూర్తి పేరు, పుట్టిన తేది, స్థలం, ప్రస్తుత చిరునామా, విద్యా అర్హత & అత్యవసర కాంటాక్ట్ వివరాలు నింపండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Form Download చేయండి!**`
      : `✈️ **Passport Application & Form Guide (PSK Kakinada)**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: Passport Seva Kendra, Beside District Collectorate, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2307890 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Passport+Office+Kakinada)\n\n` +
        `🏛️ **Office & Timings:** 09:00 AM – 05:00 PM (Mon–Fri).\n` +
        `• Fees: Normal ₹1,500 | Tatkaal ₹3,500.\n\n` +
        `✍️ **How to Fill:** Fill Full Name matching SSC Memo/Birth Cert, DOB, Place of Birth, Present Address, Educational Qualification, and Emergency Contact details.\n\n` +
        `👇 **Click below to download & print the supplementary form at home!**`;
    formUrl = '/api/forms/download/passport-form';
    formTitle = te ? '🖨️ పాస్‌పోర్ట్ ఫారమ్ ని Download చేయండి' : 'Download Passport Supplementary Form (Printable A4)';

  // 10. Bank Account Opening & Re-KYC Forms
  } else if (msg.includes('bank') || msg.includes('account') || msg.includes('kyc') || msg.includes('sbi') || msg.includes('union') || msg.includes('canara') || msg.includes('hdfc') || msg.includes('icici') || msg.includes('axis') || msg.includes('బ్యాంక్') || msg.includes('ఖాతా')) {
    response = te
      ? `🏦 **బ్యాంక్ ఖాతా ప్రారంభం & రీ-కేవైసీ (Re-KYC) ఫారమ్ గైడ్**\n\n` +
        `📍 **కాకినాడ ప్రధాన బ్యాంకులు:**\n` +
        `• SBI Main Branch: Bander Road | 📞 0884-2320001\n` +
        `• Union Bank: Jagannaickpur | 📞 0884-2320002\n` +
        `• Canara Bank: Main Road | 📞 0884-2320003\n\n` +
        `🏛️ **బ్యాంక్ పనివేళలు:** 10:00 AM – 04:00 PM (సోమ-శుక్ర). 1st, 3rd, 5th శనివారాలు: 10:00 AM – 01:00 PM. భోజన విరామం: 1:00-2:00 PM.\n\n` +
        `✍️ **ఫారం నింపే విధానం:**\n` +
        `1. **విభాగం A:** Savings/Current ఖాతా రకం ఎంచుకుని పేరు, పుట్టిన తేదీ, తండ్రి పేరు రాయండి.\n` +
        `2. **విభాగం B:** ఆధార్ నంబరు, PAN కార్డ్, వృత్తి, వార్షిక ఆదాయం నింపండి.\n` +
        `3. **విభాగం C:** నామినీ పేరు, సంబంధం నింపండి.\n` +
        `4. **సంతకాలు:** 3 నమూనా సంతకాల బాక్సులలో సంతకం చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి Bank Form Download చేయండి!**`
      : `🏦 **Bank Account Opening & Re-KYC Form Guide (All Kakinada Banks)**\n\n` +
        `📍 **Major Bank Addresses in Kakinada:**\n` +
        `• **SBI Main Branch:** Bander Road, Kakinada, AP 533001 | 📞 0884-2320001 | 🗺️ [Maps](https://maps.google.com/?q=SBI+Kakinada+Main+Branch)\n` +
        `• **Union Bank:** Jagannaickpur, Kakinada, AP 533005 | 📞 0884-2320002 | 🗺️ [Maps](https://maps.google.com/?q=Union+Bank+Kakinada)\n` +
        `• **Canara Bank:** Main Road, Kakinada, AP 533001 | 📞 0884-2320003 | 🗺️ [Maps](https://maps.google.com/?q=Canara+Bank+Kakinada)\n` +
        `• **HDFC / ICICI / Axis:** Main Road / Bander Road, Kakinada, AP 533001\n\n` +
        `🏛️ **Bank Working Hours:**\n` +
        `• Working Days: 10:00 AM – 04:00 PM (Mon–Fri), 1st/3rd/5th Sat: 10:00 AM – 01:00 PM.\n` +
        `• Closed: 2nd & 4th Saturdays, Sundays & National Holidays. Lunch: 1:00 PM – 2:00 PM.\n\n` +
        `✍️ **How to Fill Bank Account & Re-KYC Form:**\n` +
        `1. **Section A:** Select Account Type (Savings/Current), enter Full Name, DOB, Father's Name.\n` +
        `2. **Section B:** Enter Aadhaar Number, PAN Card Number, Occupation, Annual Income.\n` +
        `3. **Section C (Nomination):** Fill Nominee Name, Relationship, and Age.\n` +
        `4. **Section D (Signatures):** Sign inside the 3 specimen signature boxes cleanly.\n\n` +
        `👇 **Click below to download & print the Bank Account & KYC Form at home!**`;
    formUrl = '/api/forms/download/bank-kyc-form';
    formTitle = te ? '🖨️ బ్యాంక్ ఖాతా & కేవైసీ ఫారమ్ ని Download చేయండి' : 'Download Bank Account & KYC Form (Printable A4)';

  // 11. Spandana Public Grievance Form
  } else if (msg.includes('spandana') || msg.includes('grievance') || msg.includes('petition') || msg.includes('collectorate') || msg.includes('స్పందన') || msg.includes('ఫర్యాదు')) {
    response = te
      ? `🏛️ **జిల్లా కలెక్టరేట్ స్పందన వినతి పత్రం (Spandana Grievance) ఫారమ్ గైడ్**\n\n` +
        `📍 **ఆఫీస్ చిరునామా:** District Collectorate, Collectorate Road, Kakinada | 📞 0884-2303456\n` +
        `🏛️ **పనివేళలు:** 10:30 AM – 05:00 PM (సోమ-శుక్ర). ఉచిత సేవ.\n\n` +
        `✍️ **ఫారం నింపే విధానం:** సమస్య విభాగం (రెవెన్యూ/భూమి/పింఛను/గృహనిర్మాణం) రాసి సమస్య వివరణ, ఆధార్ నంబర్, ఆధారాల కాపీలు జతచేసి సంతకం చేయండి.\n\n` +
        `👇 **ఇంట్లోనే ప్రింట్ తీసుకోవడానికి క్రింది బటన్ క్లిక్ చేసి స్పందన ఫారమ్ Download చేయండి!**`
      : `🏛️ **District Collectorate Spandana Grievance Form Guide**\n\n` +
        `📍 **Office Address & Phone:**\n` +
        `• Location: District Collectorate, Collectorate Road, Kakinada, AP 533001\n` +
        `• 📞 Phone: 0884-2303456 | 🗺️ [Open Google Maps Location](https://maps.google.com/?q=Collectorate+Kakinada)\n\n` +
        `🏛️ **Office & Timings:** 10:30 AM – 05:00 PM (Mon–Fri). Free service.\n\n` +
        `✍️ **How to Fill:** Write Subject Category (Revenue/Land/Pension/Housing/Civic), detail your grievance description, mention prior application numbers, attach proof copies & sign.\n\n` +
        `👇 **Click below to download & print the Spandana Petition Form at home!**`;
    formUrl = '/api/forms/download/spandana-form';
      `• **Tahsildar Office:** 10:00 AM – 05:00 PM (Mon–Fri), 10:00 AM – 01:00 PM (Sat)\n` +
      `• **Passport Seva Kendra:** 09:00 AM – 05:00 PM (Mon–Fri). Closed Sat & Sun.\n` +
      `• **Banks (SBI, Union, Canara, etc.):** 10:00 AM – 04:00 PM (Mon–Fri), 10:00 AM – 01:00 PM (1st, 3rd, 5th Sat). 2nd/4th Sat closed.\n\n` +
      `⏱ *Lunch Break for all offices & banks is 01:00 PM – 02:00 PM.*`;

  // 12. Documents Required Queries
  } else if (msg.includes('document') || msg.includes('paper') || msg.includes('proof')) {
    response = `📋 **Standard Documents Required for Most Kakinada Services:**\n\n` +
      `1. **Identity & Age Proof:** Aadhaar Card, Voter ID, PAN Card, SSC Marks Memo.\n` +
      `2. **Address Proof:** Aadhaar Card, Electricity Bill, Ration Card / Rice Card, Water Bill.\n` +
      `3. **Income Proof:** Salary Slip, Form 16, VRO Income Inquiry Report.\n` +
      `4. **Property/Land Proof:** Survey Number, Sale Deed Copy, Pattadar Passbook, EC.\n` +
      `5. **Photos:** 2 to 6 passport size recent photographs with white background.\n\n` +
      `💡 *Ask me about specific forms (e.g. "Income Form", "RTO Form") to download printable forms to fill at home!*`;

  // 13. Greeting
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('నమస్కారం') || msg.includes('hey')) {
    response = te
      ? `నమస్కారం! నేను SmartGov AI Assistant 🏛️\n\n` +
        `నేను మీకు:\n` +
        `1. ప్రభుత్వ ఆఫీసులు & బ్యాంకుల Timings చెప్పగలను.\n` +
        `2. ఏ ఏ Documents కావాలో వివరించగలనూ.\n` +
        `3. Form ని ఇంట్లోనే ఎలా Fill చేయాలో Step-by-Step చెప్పగలనూ.\n` +
        `4. ఇంట్లోనే ప్రింట్ తీసుకొని Fill చేయడానికి Printable Forms Download ఇవ్వగలనూ!\n\n` +
        `దయచేసి మీ ప్రశ్నను అడగండి (ఉదా: "Income form", "Office timings", "RTO Form 29")`
      : `Hello! I'm your SmartGov AI Assistant 🏛️\n\n` +
        `I can help you with:\n` +
        `1. **Office & Bank Timings** across Kakinada.\n` +
        `2. **Document Requirements** & fees for all services.\n` +
        `3. **Step-by-Step Guides on How to Fill Forms**.\n` +
        `4. **Direct Downloadable Printable Forms (A4)** to fill & print at home!\n\n` +
        `Ask me anything! (e.g., *"How to fill income form"*, *"RTO timings"*, *"Download Caste form"*).`;

  // 14. Default / Fallback
  } else {
    response = te
      ? `నేను Kakinada ప్రభుత్వ సేవలు, Timings, Documents మరియు Application Forms నింపే విధానంపై సహాయం చేయగలను.\n\n` +
        `మీరు పత్రాలను ఇంట్లోనే ప్రింట్ చేయడానికి Form Download కూడా పొందవచ్చు! దయచేసి స్పష్టమైన ప్రశ్న అడగండి (ఉదా: "Income Form", "Bank Timings", "RTO Form 29").`
      : `I can help you with all Kakinada government services, office timings, document requirements, and step-by-step instructions on filling application forms.\n\n` +
        `You can also download printable A4 forms directly here to fill and print at home! Please ask a specific question (e.g., *"Income Form"*, *"Office Timings"*, *"Bank Account Form"*).`;
  }

  res.json({ success: true, response, formUrl, formTitle, language });
});


// =============================================
// SERVE FRONTEND (SINGLE LOCALHOST URL)
// =============================================
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}


// =============================================
// 404 & ERROR HANDLER
// =============================================
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, message: 'Internal server error' }); });

// =============================================
// START SERVER
// =============================================
tryConnectDB().then(available => {
  dbAvailable = available;
  app.listen(PORT, () => {
    console.log(`\n🚀 SmartGov AI – Kakinada Full-Stack App`);
    console.log(`✅ Single Localhost URL: http://localhost:${PORT}`);
    console.log(`📡 Backend Mode: ${available ? '🗄️  PostgreSQL Database' : '🎭 DEMO MODE (in-memory data)'}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
    if (!available) {
      console.log(`💡 Demo Credentials:`);
      console.log(`   Admin:    superadmin / Admin@123`);
      console.log(`   Employee: meeseva_emp1 / Employee@123\n`);
    }
  });
});

module.exports = app;
