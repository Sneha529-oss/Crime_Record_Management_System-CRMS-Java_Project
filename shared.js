// shared.js — CRMS Shared Utilities

const BASE = '/api';

function renderSidebar(activePage) {
  const pages = [
    { id:'dashboard', icon:'⬛', label:'Dashboard',        href:'index.html',    section:'OVERVIEW' },
    { id:'crimes',    icon:'🔴', label:'Crimes',            href:'crimes.html',   section:'RECORDS' },
    { id:'fir',       icon:'📄', label:'FIR Management',    href:'fir.html',      section:null },
    { id:'criminals', icon:'👤', label:'Criminals',         href:'criminals.html',section:null },
    { id:'evidence',  icon:'🧪', label:'Evidence',          href:'evidence.html', section:null },
    { id:'officers',  icon:'👮', label:'Officer Heatmap',   href:'officers.html', section:'ANALYSIS' },
    { id:'predict',   icon:'📡', label:'Crime Predictor',   href:'predict.html',  section:null },
  ];

  let html = `<aside class="sidebar">
    <div class="logo">
      <div class="logo-badge">DBMS PROJECT</div>
      <h1>CRIME<br/><span>RECORD</span><br/>MGMT SYS</h1>
    </div><nav>`;

  let lastSection = null;
  pages.forEach(p => {
    if (p.section && p.section !== lastSection) {
      html += `<div class="nav-section">${p.section}</div>`;
      lastSection = p.section;
    }
    html += `<a href="${p.href}" class="nav-item ${activePage===p.id?'active':''}">
      <span class="nav-icon">${p.icon}</span> ${p.label}</a>`;
  });

  html += `</nav>
    <div class="sidebar-footer">
      <div><span class="dot"></span>MySQL Connected</div>
      <div style="margin-top:4px;color:var(--muted);font-size:9px">crms_db · localhost:3306</div>
      <div style="margin-top:6px;color:var(--accent);font-size:9px;letter-spacing:1px">DBMS MINI PROJECT</div>
    </div></aside>`;

  document.getElementById('sidebar-container').innerHTML = html;
}

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function animateCounter(el, target) {
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.ceil(Number(target) / 40));
  const timer = setInterval(() => {
    cur = Math.min(cur + step, Number(target));
    el.textContent = cur;
    if (cur >= Number(target)) clearInterval(timer);
  }, 28);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
}

function badge(status) {
  return `<span class="badge badge-${status}">${status.replace('_',' ')}</span>`;
}

// Log an action to the audit log
async function logAction(action, details) {
  try {
    await fetch(`${BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details })
    });
  } catch {}
}

// Audit terminal — used on dashboard
function startAuditTerminal(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  async function refresh() {
    try {
      const logs = await fetch(`${BASE}/logs`).then(r => r.json());
      el.innerHTML = logs.slice(0, 20).map(l => {
        const t = new Date(l.created_at).toLocaleTimeString('en-IN', { hour12:false });
        const colors = {
          CRIME_ADDED:'#3a8ef5', CRIME_UPDATED:'#f5a623', CRIME_DELETED:'#e8303a',
          FIR_REGISTERED:'#2dce6e', FIR_DELETED:'#e8303a',
          CRIMINAL_ADDED:'#9b59b6', CRIMINAL_DELETED:'#e8303a',
          EVIDENCE_ADDED:'#3a8ef5', EVIDENCE_DELETED:'#e8303a',
          WARRANT_ISSUED:'#f5a623', WARRANT_REVOKED:'#e8303a',
          SYSTEM_START:'#2dce6e', default:'#4a5568'
        };
        const c = colors[l.action] || colors.default;
        return `<div class="log-line">
          <span class="log-time">[${t}]</span>
          <span class="log-action" style="color:${c}">${l.action}</span>
          <span class="log-detail">· ${l.details}</span>
        </div>`;
      }).join('');
      el.scrollTop = 0;
    } catch {}
  }

  refresh();
  return setInterval(refresh, 5000);
}