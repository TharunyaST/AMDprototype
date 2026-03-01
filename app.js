/* ============================================================
   AI — DMS | Shared App Logic + Backend API Integration
   Backend: http://localhost:3001
   ============================================================ */

const API_BASE = 'http://localhost:3001';

// ─── API CLIENT ──────────────────────────────────────────────
const api = {
  async get(path) {
    try {
      const r = await fetch(API_BASE + path);
      return await r.json();
    } catch { return null; }
  },
  async post(path, body) {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await r.json();
    } catch { return null; }
  },
  async postForm(path, formData) {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'POST',
        body: formData // Content-Type omitted so browser sets boundary automatically
      });
      return await r.json();
    } catch { return null; }
  },
  async patch(path, body) {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await r.json();
    } catch { return null; }
  },
  async del(path) {
    try {
      const r = await fetch(API_BASE + path, { method: 'DELETE' });
      return await r.json();
    } catch { return null; }
  }
};

// ─── AUTH GUARD ──────────────────────────────────────────────
function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem('aidms-user')); } catch { return null; }
}
function requireAuth() {
  const page = location.pathname.split('/').pop().toLowerCase();
  // Public pages — never redirect these
  const publicPages = ['index.html', 'landing.html', ''];
  const isPublic = publicPages.some(p => page === p) || page === '' || page.endsWith('/');
  if (!isPublic && !getLoggedInUser()) {
    window.location.href = 'index.html';
  }
}
requireAuth();


// ─── SIDEBAR USER INFO ───────────────────────────────────────
function populateSidebarUser() {
  const user = getLoggedInUser();
  if (!user) return;
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');
  if (nameEl) nameEl.textContent = user.name || 'User';
  if (roleEl) roleEl.textContent = (user.role || '') + (user.department ? ' · ' + user.department : '');
  if (avatarEl) avatarEl.textContent = user.avatar || (user.name || 'U').substring(0, 2).toUpperCase();
}

// ─── BACKEND STATUS INDICATOR ────────────────────────────────
async function checkBackendStatus() {
  const result = await api.get('/api/health');
  const isOnline = result && result.success;
  // Show status dot in topbar if element exists
  const dot = document.getElementById('backend-status');
  if (dot) {
    dot.title = isOnline ? 'Backend: Online ✅' : 'Backend: Offline ⚠️ (demo mode)';
    dot.style.background = isOnline ? 'var(--success)' : 'var(--warning)';
  }
  return isOnline;
}

// ─── LIVE DASHBOARD STATS ────────────────────────────────────
async function loadDashboardStats() {
  const result = await api.get('/api/stats');
  if (!result || !result.success) return; // keep static values
  const { stats } = result;
  const map = {
    'stat-total-docs': stats.totalDocuments,
    'stat-pending': stats.pendingApprovals,
    'stat-ocr': stats.ocrProcessed,
    'stat-ai': stats.aiClassified,
    'stat-users': stats.activeUsers,
    'stat-storage': stats.storageUsedGB
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) animateCount(el, val);
  });
}

// ─── LIVE WORKFLOW DATA ──────────────────────────────────────
let _wfItems = [];

async function loadWorkflowItems() {
  const container = document.getElementById('workflow-api-list');
  if (!container) return;
  const result = await api.get('/api/workflow');

  // Use backend data or rich mock data
  const mockItems = [
    { id: 'wf1', documentName: 'Annual Safety Inspection Report 2024', department: 'Safety', requestedBy: 'Rajesh Kumar', daysWaiting: 3, status: 'pending', priority: 'high', type: 'PDF', size: '2.4 MB', desc: 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.' },
    { id: 'wf2', documentName: 'Procurement Tender for Rolling Stock', department: 'Procurement', requestedBy: 'Priya Menon', daysWaiting: 7, status: 'overdue', priority: 'critical', type: 'DOCX', size: '3.2 MB', desc: 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.' },
    { id: 'wf3', documentName: 'Employee Leave Policy — HR Circular 2025', department: 'HR', requestedBy: 'Divya Nair', daysWaiting: 1, status: 'pending', priority: 'medium', type: 'PDF', size: '640 KB', desc: 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.' },
    { id: 'wf4', documentName: 'Revenue Collection Audit Report Jan 2025', department: 'Finance', requestedBy: 'Suresh Pillai', daysWaiting: 5, status: 'overdue', priority: 'high', type: 'XLSX', size: '5.1 MB', desc: 'Monthly revenue audit for January 2025. Total collection: ₹18.6 Cr. 99.8% accuracy.' },
    { id: 'wf5', documentName: 'Cloud Migration Plan — Phase II', department: 'IT', requestedBy: 'Ananya Raj', daysWaiting: 2, status: 'pending', priority: 'medium', type: 'DOCX', size: '3.4 MB', desc: 'Plan to migrate 60% of workloads to AWS. Timeline: 8 months. Cost estimate: ₹1.2 Cr.' },
  ];

  const items = (result && result.success && result.items.length) ? result.items : mockItems;
  _wfItems = items;

  const pending = items.filter(i => i.status === 'pending' || i.status === 'overdue');
  if (!pending.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No pending items.</p>'; return; }
  container.innerHTML = pending.map((item, idx) => `
    <div class="wf-card ${item.status}" id="wf-${item.id}" style="margin-bottom:10px">
      <div class="wf-header">
        <div>
          <div class="wf-title">📄 ${item.documentName}</div>
          <div class="wf-sub">${item.department} · ${item.requestedBy} · ${item.daysWaiting}d waiting</div>
        </div>
        <span class="badge ${item.status === 'overdue' ? 'badge-red' : 'badge-gold'}">
          ${item.status === 'overdue' ? '⚠ OVERDUE' : '⏳ PENDING'}
        </span>
      </div>
      <div class="wf-actions" style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="apiApprove('${item.id}','${item.documentName}')">✅ Approve</button>
        <button class="btn btn-secondary btn-sm" onclick="apiReject('${item.id}')">↩ Return</button>
        <button class="btn btn-secondary btn-sm" onclick="previewWorkflowItem(${idx})" style="background:rgba(59,91,219,0.08);border-color:#3b5bdb;color:#3b5bdb">👁 Preview</button>
        <span class="badge badge-${item.priority === 'critical' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}" style="margin-left:auto">
          ${item.priority?.toUpperCase()}
        </span>
      </div>
    </div>`).join('');
}

function previewWorkflowItem(idx) {
  const item = _wfItems[idx];
  if (!item) return;
  const old = document.getElementById('wf-preview-modal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'wf-preview-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px';
  const statusColor = { pending: '#e67700', overdue: '#c92a2a', approved: '#2f9e44', returned: '#868e96' };
  const priorityColor = { critical: '#c92a2a', high: '#e67700', medium: '#1971c2', low: '#868e96' };
  overlay.innerHTML = `
    <div style="background:var(--sidebar-bg);border-radius:16px;width:100%;max-width:580px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--glass-border)">
        <div>
          <div style="font-size:16px;font-weight:700">📄 ${item.documentName}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">📁 ${item.department} &nbsp;·&nbsp; 👤 ${item.requestedBy}</div>
        </div>
        <button onclick="document.getElementById('wf-preview-modal').remove()" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--glass-border);background:var(--surface);cursor:pointer;font-size:16px">✕</button>
      </div>
      <div style="padding:24px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          <span style="background:${statusColor[item.status] || '#868e96'}18;color:${statusColor[item.status] || '#868e96'};border:1px solid ${statusColor[item.status] || '#868e96'}40;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${item.status?.toUpperCase()}</span>
          <span style="background:${priorityColor[item.priority] || '#868e96'}18;color:${priorityColor[item.priority] || '#868e96'};border:1px solid ${priorityColor[item.priority] || '#868e96'}40;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${item.priority?.toUpperCase()} PRIORITY</span>
          ${item.type ? `<span style="background:#1971c218;color:#1971c2;border:1px solid #1971c240;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700">${item.type}</span>` : ''}
        </div>
        <div style="background:var(--surface);border-radius:10px;padding:16px;margin-bottom:16px;font-size:13px;line-height:1.7;color:var(--text-secondary)">
          <strong style="color:var(--text-primary);display:block;margin-bottom:8px">📝 Document Summary</strong>
          ${item.desc || 'No description available for this document.'}
        </div>
        <div style="background:var(--surface);border:1px solid var(--glass-border);border-radius:10px;padding:16px;margin-bottom:20px;font-size:12px;line-height:2;color:var(--text-secondary)">
          <div style="color:var(--text-primary);font-weight:700;margin-bottom:6px">📋 Workflow Details</div>
          <div>Document: ${item.documentName}</div>
          <div>Department: ${item.department}</div>
          <div>Submitted By: ${item.requestedBy}</div>
          <div>Awaiting Approval: ${item.daysWaiting} day(s)</div>
          <div>Priority: ${item.priority?.toUpperCase()}</div>
          <div>Status: ${item.status?.toUpperCase()}</div>
          ${item.size ? `<div>File Size: ${item.size}</div>` : ''}
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button onclick="document.getElementById('wf-preview-modal').remove()" style="padding:9px 20px;border:1px solid var(--glass-border);border-radius:8px;background:var(--surface);cursor:pointer;font-size:13px;font-weight:600;color:var(--text-secondary)">Close</button>
          <button onclick="apiReject('${item.id}');document.getElementById('wf-preview-modal').remove()" style="padding:9px 20px;border:1px solid #e67700;border-radius:8px;background:rgba(230,119,0,0.08);color:#e67700;cursor:pointer;font-size:13px;font-weight:600">↩ Return</button>
          <button onclick="apiApprove('${item.id}','${item.documentName}');document.getElementById('wf-preview-modal').remove()" style="padding:9px 20px;border:none;border-radius:8px;background:#2f9e44;color:#fff;cursor:pointer;font-size:13px;font-weight:600">✅ Approve</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function apiApprove(id, name) {
  await api.patch('/api/workflow/' + id, { status: 'approved' });
  const card = document.getElementById('wf-' + id);
  if (card) {
    card.classList.remove('pending', 'overdue');
    card.classList.add('approved');
    card.style.opacity = '0.6';
    card.querySelector('.wf-actions').innerHTML = '<span style="font-size:12px;color:var(--success)">✅ Approved — stakeholders notified</span>';
  }
  showToast(`${name} approved!`);
}

async function apiReject(id) {
  await api.patch('/api/workflow/' + id, { status: 'returned' });
  const card = document.getElementById('wf-' + id);
  if (card) { card.style.opacity = '0.5'; card.querySelector('.wf-actions').innerHTML = '<span style="font-size:12px;color:var(--warning)">↩ Returned to submitter</span>'; }
  showToast('Document returned to submitter');
}


// ─── LIVE DOCUMENT SEARCH ───────────────────────────────────
async function performSearchAPI(query) {
  if (!query.trim()) return MOCK_DOCS;
  const result = await api.get(`/api/documents?q=${encodeURIComponent(query)}`);
  if (result && result.success && result.documents.length) {
    return result.documents.map(d => ({
      title: d.name, dept: d.department, type: d.name.split('.').pop().toUpperCase(),
      tags: d.tags || [], relevance: d.confidence || 80, date: (d.uploadedAt || '').substring(0, 10),
      author: d.uploadedBy || '', fileUrl: d.fileUrl
    }));
  }
  return performSearch(query); // fallback
}

// ─── NAV ACTIVE STATE ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === currentPage) item.classList.add('active');
  });

  // Populate sidebar user
  populateSidebarUser();

  // Check backend status
  const online = await checkBackendStatus();

  // Animate stat numbers
  document.querySelectorAll('[data-count]').forEach(el => {
    animateCount(el, parseInt(el.dataset.count));
  });

  // Toggle switches
  document.querySelectorAll('.toggle-switch').forEach(sw => {
    sw.addEventListener('click', () => sw.classList.toggle('on'));
  });

  // Drag-and-drop upload
  const zone = document.querySelector('.upload-zone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.multiple = true;
      input.accept = '.pdf,.doc,.docx,.png,.jpg,.tiff,.xlsx';
      input.onchange = () => handleFiles(input.files);
      input.click();
    });
  }

  // Fade-in cards
  document.querySelectorAll('.card, .stat-card').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.05}s`;
    el.classList.add('fade-in');
  });

  // Page-specific init
  if (currentPage === 'dashboard.html') {
    await loadDashboardStats();
  }
  if (currentPage === 'workflow.html') {
    await loadWorkflowItems();
  }
});

// ─── COUNT ANIMATION ─────────────────────────────────────────
function animateCount(el, target) {
  let current = 0;
  const step = Math.ceil(target / 60);
  const iv = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = el.dataset.prefix
      ? el.dataset.prefix + current.toLocaleString()
      : current.toLocaleString() + (el.dataset.suffix || '');
    if (current >= target) clearInterval(iv);
  }, 16);
}

// ─── MODAL HELPERS ───────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── FILE UPLOAD (with optional API post) ───────────────────
function handleFiles(files) {
  if (!files || !files.length) return;
  const progressSection = document.getElementById('upload-progress');
  if (!progressSection) return;
  progressSection.style.display = 'block';
  Array.from(files).forEach((file, i) => {
    const item = createUploadItem(file, i);
    progressSection.querySelector('.upload-items').appendChild(item);
    simulateUpload(item, file);
  });
}

function createUploadItem(file, idx) {
  const div = document.createElement('div');
  div.className = 'notif-item fade-in';
  div.id = `upload-item-${idx}`;
  const ext = file.name.split('.').pop().toUpperCase();
  div.innerHTML = `
    <div class="notif-icon" style="background:rgba(0,191,165,0.15)">📄</div>
    <div class="notif-body">
      <h4>${file.name}</h4>
      <p>${(file.size / 1024).toFixed(1)} KB · <span class="badge badge-blue">${ext}</span></p>
      <div class="progress-bar mt-8" style="margin-top:8px">
        <div class="progress-fill" id="prog-${idx}" style="width:0%"></div>
      </div>
      <p class="mt-8" id="status-${idx}" style="margin-top:6px;font-size:11px;color:var(--text-muted)">Uploading…</p>
    </div>`;
  return div;
}

function simulateUpload(item, file) {
  const idx = item.id.split('-').pop();
  const bar = document.getElementById(`prog-${idx}`);
  const status = document.getElementById(`status-${idx}`);
  let pct = 0;
  const iv = setInterval(async () => {
    pct = Math.min(pct + Math.random() * 15, 100);
    if (bar) bar.style.width = pct + '%';
    if (pct < 40 && status) status.textContent = 'Uploading…';
    else if (pct < 70 && status) status.textContent = '✦ AI classifying document…';
    else if (pct < 90 && status) status.textContent = '🔍 Running OCR…';
    else if (pct >= 100) {
      clearInterval(iv);
      if (status) status.textContent = '✅ Processed & indexed';
      if (bar) bar.style.background = 'var(--success)';
      // POST to backend
      const user = getLoggedInUser();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', user?.department || 'General');
      formData.append('uploadedBy', user?.name || 'Unknown');
      formData.append('category', 'Uncategorized');
      formData.append('confidence', Math.floor(Math.random() * 10 + 88));
      formData.append('tags', JSON.stringify([]));

      await api.postForm('/api/documents', formData);
      showToast(`${file.name} uploaded & indexed`);
    }
  }, 200);
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:var(--surface);
    border:1px solid ${type === 'success' ? 'var(--metro-teal)' : 'var(--danger)'};
    color:var(--text-primary);padding:14px 20px;border-radius:10px;
    font-size:13px;box-shadow:var(--shadow-hover);
    display:flex;align-items:center;gap:10px;
    animation:fadeInUp 0.3s ease;max-width:320px;`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── NLP SEARCH (mock fallback) ──────────────────────────────
const MOCK_DOCS = [
  // Safety
  { title: 'Annual Safety Inspection Report 2024', dept: 'Safety', type: 'PDF', tags: ['safety', 'inspection', 'annual', 'report'], relevance: 97, date: '2024-12-15', author: 'Rajesh Kumar', status: 'Approved', size: '2.4 MB', desc: 'Comprehensive safety audit covering all 25 stations. Fire systems, CCTV, emergency exits all evaluated.' },
  { title: 'Fire Safety Compliance Checklist Q4', dept: 'Safety', type: 'PDF', tags: ['fire', 'safety', 'compliance', 'checklist'], relevance: 94, date: '2025-01-10', author: 'Rajesh Kumar', status: 'Approved', size: '840 KB', desc: 'Quarterly fire safety check for all platform areas. 2 units flagged for replacement.' },
  { title: 'Emergency Evacuation Drill Report', dept: 'Safety', type: 'DOCX', tags: ['emergency', 'evacuation', 'drill', 'safety'], relevance: 88, date: '2025-01-28', author: 'Sanjay Nair', status: 'Pending', size: '1.1 MB', desc: 'Post-drill analysis for Aluva and Edapally stations. Response time improved by 18%.' },

  // Procurement
  { title: 'Procurement Tender for Rolling Stock', dept: 'Procurement', type: 'DOCX', tags: ['tender', 'rolling stock', 'procurement', 'bid'], relevance: 91, date: '2025-01-08', author: 'Priya Menon', status: 'Pending', size: '3.2 MB', desc: 'Open tender for 15 new metro coaches. Bids from 4 vendors received. Evaluation in progress.' },
  { title: 'Vendor Empanelment Register 2025', dept: 'Procurement', type: 'XLSX', tags: ['vendor', 'empanelment', 'procurement', 'register'], relevance: 83, date: '2025-02-03', author: 'Priya Menon', status: 'Approved', size: '560 KB', desc: 'List of 48 approved vendors across civil, electrical, and IT categories.' },
  { title: 'Supply Chain Disruption Risk Report', dept: 'Procurement', type: 'PDF', tags: ['supply chain', 'risk', 'procurement', 'disruption'], relevance: 79, date: '2025-01-20', author: 'Deepak Pillai', status: 'Draft', size: '1.8 MB', desc: 'Assessment of supply risks for spare parts and electronics. Mitigation plan included.' },

  // Operations
  { title: 'Station Maintenance SOP Q3 2024', dept: 'Operations', type: 'PDF', tags: ['maintenance', 'SOP', 'station', 'operations'], relevance: 88, date: '2024-09-20', author: 'Arun Das', status: 'Approved', size: '4.1 MB', desc: 'Standard Operating Procedure for daily maintenance tasks across all 25 stations.' },
  { title: 'Train Schedule Revision — Feb 2025', dept: 'Operations', type: 'PDF', tags: ['train', 'schedule', 'timetable', 'operations'], relevance: 86, date: '2025-02-01', author: 'Arun Das', status: 'Approved', size: '920 KB', desc: 'Updated train frequency and timing for peak hours. 12 new trips added on weekdays.' },
  { title: 'Passenger Flow Analysis Report', dept: 'Operations', type: 'XLSX', tags: ['passenger', 'flow', 'analysis', 'footfall'], relevance: 80, date: '2025-01-25', author: 'Kiran Mohan', status: 'Approved', size: '2.3 MB', desc: 'Station-wise passenger count data for Jan 2025. MG Road highest at 38,000/day.' },
  { title: 'Platform Crowd Management Plan', dept: 'Operations', type: 'DOCX', tags: ['crowd', 'platform', 'management', 'safety'], relevance: 75, date: '2025-01-12', author: 'Kiran Mohan', status: 'Pending', size: '1.5 MB', desc: 'Action plan for managing peak-hour crowding. Zoning and queue management protocols defined.' },

  // HR
  { title: 'Employee Leave Policy — HR Circular 2025', dept: 'HR', type: 'PDF', tags: ['HR', 'leave', 'policy', 'circular', 'employee'], relevance: 85, date: '2025-02-01', author: 'Divya Nair', status: 'Approved', size: '640 KB', desc: 'Updated leave policy covering casual, sick, and earned leaves. New WFH provisions included.' },
  { title: 'Staff Recruitment Drive Q1 2025', dept: 'HR', type: 'DOCX', tags: ['recruitment', 'hiring', 'HR', 'staff'], relevance: 78, date: '2025-01-15', author: 'Divya Nair', status: 'Approved', size: '1.2 MB', desc: 'Recruitment plan for 120 new positions across engineering, operations, and admin.' },
  { title: 'Performance Appraisal Review 2024', dept: 'HR', type: 'XLSX', tags: ['appraisal', 'performance', 'HR', 'review', 'annual'], relevance: 82, date: '2025-01-05', author: 'Meena Varghese', status: 'Approved', size: '3.8 MB', desc: '2024 annual appraisal scores for all 1,240 employees. Ratings on a 5-point scale.' },
  { title: 'Training Calendar 2025', dept: 'HR', type: 'PDF', tags: ['training', 'calendar', 'HR', 'development'], relevance: 72, date: '2025-01-20', author: 'Meena Varghese', status: 'Approved', size: '780 KB', desc: 'Schedule of 32 training programs planned for 2025. Safety and technical modules prioritized.' },

  // Finance
  { title: 'Revenue Collection Audit Report Jan 2025', dept: 'Finance', type: 'XLSX', tags: ['audit', 'revenue', 'finance', 'collection'], relevance: 82, date: '2025-01-31', author: 'Suresh Pillai', status: 'Approved', size: '5.1 MB', desc: 'Monthly revenue audit for January 2025. Total collection: ₹18.6 Cr. 99.8% accuracy.' },
  { title: 'Annual Budget Proposal FY 2025-26', dept: 'Finance', type: 'PPTX', tags: ['budget', 'finance', 'annual', 'proposal', 'FY2026'], relevance: 89, date: '2025-02-10', author: 'Suresh Pillai', status: 'Pending', size: '6.7 MB', desc: 'Budget request of ₹420 Cr for FY 2025-26 covering maintenance, tech, and expansion.' },
  { title: 'Fare Revision Impact Study', dept: 'Finance', type: 'PDF', tags: ['fare', 'revision', 'impact', 'finance', 'ridership'], relevance: 77, date: '2025-01-18', author: 'Lakshmi Iyer', status: 'Draft', size: '2.2 MB', desc: 'Study on projected ridership changes with 8% fare revision. Demand elasticity modeled.' },

  // Engineering
  { title: 'Signalling System Upgrade Proposal', dept: 'Engineering', type: 'PDF', tags: ['signalling', 'engineering', 'upgrade', 'CBTC'], relevance: 78, date: '2025-01-22', author: 'Meera Krishnan', status: 'Pending', size: '8.4 MB', desc: 'Proposal to upgrade from fixed-block to CBTC signalling. Estimated cost: ₹85 Cr.' },
  { title: 'Structural Health Monitoring Report', dept: 'Engineering', type: 'PDF', tags: ['structural', 'health', 'viaduct', 'engineering', 'monitoring'], relevance: 84, date: '2024-12-20', author: 'Ravi Shankar', status: 'Approved', size: '11.2 MB', desc: 'Sensor data analysis for 40 km of viaduct. All structures rated Grade A.' },
  { title: 'Depot Expansion — Civil Works Drawings', dept: 'Engineering', type: 'ZIP', tags: ['depot', 'civil', 'drawings', 'engineering', 'expansion'], relevance: 70, date: '2025-01-30', author: 'Ravi Shankar', status: 'Draft', size: '24.6 MB', desc: 'AutoCAD drawings for Muttom depot expansion. Phase 2 covers 3 additional stabling lines.' },

  // IT
  { title: 'IT Security Policy 2025', dept: 'IT', type: 'PDF', tags: ['IT', 'security', 'policy', 'cybersecurity'], relevance: 80, date: '2025-01-05', author: 'Ananya Raj', status: 'Approved', size: '1.6 MB', desc: 'Updated cybersecurity policy for all IT systems. Zero-trust architecture mandated.' },
  { title: 'Cloud Migration Plan — Phase II', dept: 'IT', type: 'DOCX', tags: ['cloud', 'migration', 'AWS', 'IT', 'infrastructure'], relevance: 87, date: '2025-02-05', author: 'Ananya Raj', status: 'Pending', size: '3.4 MB', desc: 'Plan to migrate 60% of workloads to AWS. Timeline: 8 months. Cost estimate: ₹1.2 Cr.' },
  { title: 'CCTV Network Upgrade Specification', dept: 'IT', type: 'PDF', tags: ['CCTV', 'IT', 'network', 'surveillance', 'upgrade'], relevance: 75, date: '2025-01-14', author: 'Vinod Kumar', status: 'Approved', size: '4.8 MB', desc: '4K upgrade for 840 cameras across 25 stations. Facial recognition module proposed.' },

  // Customer Service
  { title: 'Public Grievance Redressal Q4 Report', dept: 'Customer Service', type: 'PDF', tags: ['grievance', 'customer', 'Q4', 'complaints', 'service'], relevance: 74, date: '2025-01-10', author: 'Thomas George', status: 'Approved', size: '1.3 MB', desc: '1,842 complaints logged in Q4 2024. Resolution rate: 94.2%. Top issue: AC maintenance.' },
  { title: 'Customer Satisfaction Survey 2024', dept: 'Customer Service', type: 'XLSX', tags: ['satisfaction', 'survey', 'customer', 'feedback', 'NPS'], relevance: 76, date: '2024-12-28', author: 'Thomas George', status: 'Approved', size: '2.1 MB', desc: 'NPS score: 72. Cleanliness and punctuality scored highest. App usability flagged for improvement.' },

  // Legal & Compliance
  { title: 'Land Acquisition Status — Phase 3', dept: 'Legal', type: 'PDF', tags: ['land', 'acquisition', 'legal', 'phase 3', 'compliance'], relevance: 68, date: '2025-01-08', author: 'Pradeep Varma', status: 'Pending', size: '7.3 MB', desc: 'Status of 34 plots needed for Phase 3 extension. 18 acquired, 16 under negotiation.' },
  { title: 'Regulatory Compliance Checklist 2025', dept: 'Legal', type: 'DOCX', tags: ['compliance', 'regulatory', 'legal', 'checklist', 'audit'], relevance: 71, date: '2025-02-01', author: 'Pradeep Varma', status: 'Approved', size: '990 KB', desc: 'Annual mandatory compliance check for KMRL. All 42 regulatory items verified.' },

  // Environment
  { title: 'Green Energy Usage Report Q4 2024', dept: 'Environment', type: 'PDF', tags: ['green', 'energy', 'solar', 'environment', 'sustainability'], relevance: 73, date: '2025-01-04', author: 'Nisha Pillai', status: 'Approved', size: '1.8 MB', desc: 'Solar panels generated 18.4 lakh kWh in Q4 2024 — covering 22% of traction energy.' },
  { title: 'Carbon Footprint Assessment 2024', dept: 'Environment', type: 'PDF', tags: ['carbon', 'footprint', 'environment', 'sustainability', 'emission'], relevance: 69, date: '2024-12-10', author: 'Nisha Pillai', status: 'Approved', size: '3.1 MB', desc: 'Annual carbon assessment. Emissions down 31% vs baseline year due to modal shift.' },
];

function performSearch(query) {
  if (!query.trim()) return MOCK_DOCS;
  const q = query.toLowerCase();
  return MOCK_DOCS.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.dept.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q)) ||
    (d.desc && d.desc.toLowerCase().includes(q)) ||
    (d.author && d.author.toLowerCase().includes(q))
  ).sort((a, b) => b.relevance - a.relevance);
}

function renderSearchResults(results, container) {
  if (!container) return;
  container.innerHTML = '';
  if (!results.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:40px;margin-bottom:12px">🔍</div>
      <div style="font-size:15px;font-weight:600">No documents found</div>
      <div style="font-size:13px;margin-top:4px">Try different keywords or browse by department</div>
    </div>`;
    return;
  }
  const statusColor = { 'Approved': '#2f9e44', 'Pending': '#e67700', 'Draft': '#868e96' };
  const typeColor = { 'PDF': '#c92a2a', 'DOCX': '#1971c2', 'XLSX': '#2f9e44', 'PPTX': '#d6481b', 'ZIP': '#6741d9' };
  results.forEach((doc, i) => {
    const el = document.createElement('div');
    el.className = 'search-result-item fade-in';
    el.style.animationDelay = `${i * 0.04}s`;
    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px">
        <div class="result-title" style="flex:1">${doc.title}</div>
        <span style="background:${statusColor[doc.status] || '#868e96'}18;color:${statusColor[doc.status] || '#868e96'};border:1px solid ${statusColor[doc.status] || '#868e96'}40;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap">${doc.status || 'Active'}</span>
      </div>
      <div class="result-snippet" style="margin-bottom:8px">${doc.desc || ''}</div>
      <div class="result-snippet" style="margin-bottom:8px">
        📁 <strong>${doc.dept}</strong> &nbsp;·&nbsp; 👤 ${doc.author} &nbsp;·&nbsp; 📅 ${doc.date} &nbsp;·&nbsp; 💾 ${doc.size || ''}
      </div>
      <div class="result-meta" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
        <div>
          <span style="background:${typeColor[doc.type] || '#868e96'}18;color:${typeColor[doc.type] || '#868e96'};border:1px solid ${typeColor[doc.type] || '#868e96'}40;padding:2px 9px;border-radius:4px;font-size:11px;font-weight:700;margin-right:6px">${doc.type}</span>
          ${doc.tags.slice(0, 4).map(t => `<span class="chip">${t}</span>`).join('')}
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="event.stopPropagation();previewDoc(${i})" style="padding:4px 12px;border:1px solid var(--glass-border);border-radius:6px;background:var(--surface);color:var(--text-secondary);font-size:11px;cursor:pointer;font-weight:600">👁 Preview</button>
          <button onclick="event.stopPropagation();downloadDoc(${i})" style="padding:4px 12px;border:1px solid #3b5bdb;border-radius:6px;background:rgba(59,91,219,0.08);color:#3b5bdb;font-size:11px;cursor:pointer;font-weight:600">⬇ Download</button>
        </div>
      </div>
      <div style="margin-top:8px;height:3px;border-radius:2px;background:var(--glass-border);overflow:hidden">
        <div style="height:100%;width:${doc.relevance}%;background:linear-gradient(90deg,#3b5bdb,#2f9e44);border-radius:2px"></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);text-align:right;margin-top:2px">AI Relevance: ${doc.relevance}%</div>`;
    container.appendChild(el);
  });
}

// ─── PREVIEW & DOWNLOAD ──────────────────────────────────────
let _lastResults = [];
const _origRender = renderSearchResults;
renderSearchResults = function (results, container) {
  _lastResults = results;
  _origRender(results, container);
};

function previewDoc(idx) {
  const doc = _lastResults[idx];
  if (!doc) return;
  const old = document.getElementById('doc-preview-modal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'doc-preview-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px';
  const statusColor = { 'Approved': '#2f9e44', 'Pending': '#e67700', 'Draft': '#868e96' };
  const typeColor = { 'PDF': '#c92a2a', 'DOCX': '#1971c2', 'XLSX': '#2f9e44', 'PPTX': '#d6481b', 'ZIP': '#6741d9' };
  overlay.innerHTML = `
    <div style="background:var(--sidebar-bg);border-radius:16px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--glass-border)">
        <div>
          <div style="font-size:16px;font-weight:700">${doc.title}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">📁 ${doc.dept} &nbsp;·&nbsp; 👤 ${doc.author}</div>
        </div>
        <button onclick="document.getElementById('doc-preview-modal').remove()" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--glass-border);background:var(--surface);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      <div style="padding:24px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          <span style="background:${typeColor[doc.type] || '#868e96'}18;color:${typeColor[doc.type] || '#868e96'};border:1px solid ${typeColor[doc.type] || '#868e96'}40;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700">${doc.type}</span>
          <span style="background:${statusColor[doc.status] || '#868e96'}18;color:${statusColor[doc.status] || '#868e96'};border:1px solid ${statusColor[doc.status] || '#868e96'}40;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${doc.status}</span>
          <span style="font-size:11px;color:var(--text-muted);padding:3px 0">📅 ${doc.date} &nbsp;·&nbsp; 💾 ${doc.size || ''}</span>
        </div>
        <div style="background:var(--surface);border-radius:10px;padding:18px;margin-bottom:20px;font-size:13px;line-height:1.7;color:var(--text-secondary)">
          <strong style="color:var(--text-primary);display:block;margin-bottom:8px">📄 Document Summary</strong>
          ${doc.desc || 'No description available.'}
        </div>
        <div style="background:var(--surface);border:1px solid var(--glass-border);border-radius:10px;padding:18px;margin-bottom:20px;font-family:monospace;font-size:12px;color:var(--text-secondary);line-height:2">
          <div style="color:var(--text-primary);font-weight:700;margin-bottom:8px;font-family:inherit">📋 Document Details</div>
          <div>Title: ${doc.title}</div>
          <div>Department: ${doc.dept}</div>
          <div>Author: ${doc.author}</div>
          <div>Date: ${doc.date}</div>
          <div>File Type: ${doc.type} &nbsp;|&nbsp; Size: ${doc.size || 'N/A'}</div>
          <div>Status: ${doc.status}</div>
          <div>Tags: ${doc.tags.join(', ')}</div>
          <div>AI Relevance Score: ${doc.relevance}%</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button onclick="document.getElementById('doc-preview-modal').remove()" style="padding:9px 20px;border:1px solid var(--glass-border);border-radius:8px;background:var(--surface);cursor:pointer;font-size:13px;font-weight:600;color:var(--text-secondary)">Close</button>
          <button onclick="downloadDoc(${idx})" style="padding:9px 20px;border:none;border-radius:8px;background:#3b5bdb;color:#fff;cursor:pointer;font-size:13px;font-weight:600">⬇ Download</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function downloadDoc(idx) {
  const doc = _lastResults[idx];
  if (!doc) return;

  // Real file download if available
  if (doc.fileUrl) {
    const a = document.createElement('a');
    a.href = API_BASE + doc.fileUrl; // http://localhost:3001/uploads/...
    // Try to force download instead of opening in tab
    a.setAttribute('download', doc.title);
    a.click();
    showToast(`Downloading: ${doc.title}`);
    return;
  }

  // Fallback to text file generation for mock docs
  const content = [
    '='.repeat(60),
    `AI-DMS DOCUMENT`,
    '='.repeat(60),
    '',
    `Title       : ${doc.title}`,
    `Department  : ${doc.dept}`,
    `Author      : ${doc.author}`,
    `Date        : ${doc.date}`,
    `File Type   : ${doc.type}`,
    `Size        : ${doc.size || 'N/A'}`,
    `Status      : ${doc.status}`,
    `Tags        : ${doc.tags.join(', ')}`,
    `AI Relevance: ${doc.relevance}%`,
    '',
    '-'.repeat(60),
    'SUMMARY',
    '-'.repeat(60),
    '',
    doc.desc || 'No description available.',
    '',
    '='.repeat(60),
    `Downloaded from AI-DMS on ${new Date().toLocaleDateString('en-IN')}`,
    '='.repeat(60),
  ].join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.title.replace(/[^a-z0-9]/gi, '_') + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded: ${doc.title}`);
}

// ─── CHART ANIMATION ─────────────────────────────────────────
function animateBars() {
  document.querySelectorAll('.bar[data-height]').forEach(bar => {
    setTimeout(() => { bar.style.height = bar.dataset.height + 'px'; }, 300);
  });
}
window.addEventListener('load', animateBars);

// ─── LOGOUT ──────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('aidms-user');
  window.location.href = 'index.html';
}
