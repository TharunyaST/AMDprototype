/* ============================================================
   AI — DMS | Shared App Logic
   ============================================================ */

// ─── NAV ACTIVE STATE ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === currentPage) {
      item.classList.add('active');
    }
  });

  // Animate stat numbers
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = el.dataset.prefix
        ? el.dataset.prefix + current.toLocaleString()
        : current.toLocaleString() + (el.dataset.suffix || '');
      if (current >= target) clearInterval(interval);
    }, 16);
  });

  // Toggle switches
  document.querySelectorAll('.toggle-switch').forEach(sw => {
    sw.addEventListener('click', () => sw.classList.toggle('on'));
  });

  // Drag-and-drop
  const zone = document.querySelector('.upload-zone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.doc,.docx,.png,.jpg,.tiff';
      input.onchange = () => handleFiles(input.files);
      input.click();
    });
  }

  // Fade-in cards
  document.querySelectorAll('.card, .stat-card').forEach((el, i) => {
    el.style.animationDelay = `${i * 0.05}s`;
    el.classList.add('fade-in');
  });
});

// ─── MODAL HELPERS ───────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}
// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ─── FILE UPLOAD SIMULATION ──────────────────────────────────
function handleFiles(files) {
  if (!files || files.length === 0) return;
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

  const iv = setInterval(() => {
    pct = Math.min(pct + Math.random() * 15, 100);
    if (bar) bar.style.width = pct + '%';
    if (pct < 40 && status) status.textContent = 'Uploading…';
    else if (pct < 70 && status) status.textContent = '✦ AI classifying document…';
    else if (pct < 90 && status) status.textContent = '🔍 Running OCR…';
    else if (pct >= 100) {
      clearInterval(iv);
      if (status) status.textContent = '✅ Processed & indexed';
      if (bar) bar.style.background = 'var(--success)';
      showToast(`${file.name} processed successfully`);
    }
  }, 200);
}

// ─── TOAST NOTIFICATION ──────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:var(--surface);
    border:1px solid ${type === 'success' ? 'var(--metro-teal)' : 'var(--danger)'};
    color:var(--text-primary);
    padding:14px 20px;
    border-radius:10px;
    font-size:13px;
    box-shadow:var(--shadow-hover);
    display:flex; align-items:center; gap:10px;
    animation: fadeInUp 0.3s ease;
    max-width: 320px;
  `;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── NLP SEARCH ──────────────────────────────────────────────
const MOCK_DOCS = [
  { title: 'Annual Safety Inspection Report 2024', dept: 'Safety', type: 'PDF', tags: ['safety', 'inspection', 'annual'], relevance: 97, date: '2024-12-15', author: 'Rajesh Kumar' },
  { title: 'Procurement Tender for Rolling Stock', dept: 'Procurement', type: 'DOCX', tags: ['tender', 'rolling stock', 'procurement'], relevance: 91, date: '2025-01-08', author: 'Priya Menon' },
  { title: 'Station Maintenance SOP Q3 2024', dept: 'Operations', type: 'PDF', tags: ['maintenance', 'SOP', 'station'], relevance: 88, date: '2024-09-20', author: 'Arun Das' },
  { title: 'Employee Leave Policy — HR Circular 2025', dept: 'HR', type: 'PDF', tags: ['HR', 'leave', 'policy'], relevance: 85, date: '2025-02-01', author: 'Divya Nair' },
  { title: 'Revenue Collection Audit Report Jan 2025', dept: 'Finance', type: 'XLSX', tags: ['audit', 'revenue', 'finance'], relevance: 82, date: '2025-01-31', author: 'Suresh Pillai' },
  { title: 'Signalling System Upgrade Proposal', dept: 'Engineering', type: 'PDF', tags: ['signalling', 'engineering', 'upgrade'], relevance: 78, date: '2025-01-22', author: 'Meera Krishnan' },
  { title: 'Public Grievance Redressal Q4 Report', dept: 'Customer Service', type: 'PDF', tags: ['grievance', 'customer', 'Q4'], relevance: 74, date: '2025-01-10', author: 'Thomas George' },
];

function performSearch(query) {
  if (!query.trim()) return MOCK_DOCS;
  const q = query.toLowerCase();
  return MOCK_DOCS.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.dept.toLowerCase().includes(q) ||
    d.tags.some(t => t.includes(q))
  ).sort((a, b) => b.relevance - a.relevance);
}

function renderSearchResults(results, container) {
  if (!container) return;
  container.innerHTML = '';
  if (!results.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">No documents found for this query.</div>`;
    return;
  }
  results.forEach((doc, i) => {
    const el = document.createElement('div');
    el.className = 'search-result-item fade-in';
    el.style.animationDelay = `${i * 0.05}s`;
    el.innerHTML = `
      <div class="flex items-center justify-between mb-16" style="margin-bottom:6px">
        <div class="result-title">${doc.title}</div>
        <div class="result-score">⚡ ${doc.relevance}% match</div>
      </div>
      <div class="result-snippet">Department: <strong>${doc.dept}</strong> · Author: ${doc.author} · Indexed: ${doc.date}</div>
      <div class="result-meta">
        <span class="badge badge-teal">${doc.type}</span>
        ${doc.tags.map(t => `<span class="chip">${t}</span>`).join('')}
      </div>`;
    container.appendChild(el);
  });
}

// ─── CHART ANIMATION ─────────────────────────────────────────
function animateBars() {
  document.querySelectorAll('.bar[data-height]').forEach(bar => {
    setTimeout(() => {
      bar.style.height = bar.dataset.height + 'px';
    }, 300);
  });
}
window.addEventListener('load', animateBars);
