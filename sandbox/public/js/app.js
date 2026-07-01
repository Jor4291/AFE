const STAGES = {
  bu_review: { label: 'BU review', cls: 'bg-amber-100 text-amber-700' },
  reviewer_review: { label: 'Needs your review', cls: 'bg-brandaccent/15 text-brandaccent' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  ordered: { label: 'Ordered', cls: 'bg-sky-100 text-sky-700' },
  shipped: { label: 'Shipped', cls: 'bg-sky-100 text-sky-700' },
  received: { label: 'Received', cls: 'bg-slate-200 text-slate-600' },
  denied: { label: 'Denied', cls: 'bg-red-100 text-red-700' },
};

let requests = [];
let total = 0;
let liveMode = false;
let liveError = null;
let currentId = null;

function badge(stage) {
  const s = STAGES[stage] || { label: stage, cls: 'bg-slate-100' };
  return `<span class="text-xs ${s.cls} px-2 py-0.5 rounded font-medium">${s.label}</span>`;
}

function typeBadge(t) {
  return t === 'new_equipment'
    ? '<span class="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">New equipment</span>'
    : '<span class="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Replacement</span>';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function updateBanner(msg) {
  const el = document.getElementById('modeBanner');
  el.classList.remove('hidden');
  if (liveMode) {
    el.className = 'bg-emerald-100 text-emerald-900 text-center text-xs py-1.5';
    el.textContent = `Live data — showing ${requests.length} of ${total} requests (read-only preview)`;
    document.getElementById('footer').textContent = 'AFE Portal — preview connected to SiteGround (read-only)';
  } else if (liveError) {
    el.className = 'bg-red-100 text-red-900 text-center text-xs py-1.5';
    el.innerHTML = `Could not load data: ${esc(liveError)} <button onclick="loadLive()" class="underline font-medium ml-2">Retry</button>`;
    document.getElementById('footer').textContent = 'AFE Portal — database connection failed';
  } else if (msg) {
    el.className = 'bg-sky-100 text-sky-900 text-center text-xs py-1.5';
    el.textContent = msg;
  }
}

function counts() {
  const c = { total: requests.length, bu_review: 0, reviewer_review: 0, approved: 0, fulfilment: 0, denied: 0 };
  requests.forEach((r) => {
    if (r.stage === 'bu_review') c.bu_review++;
    else if (r.stage === 'reviewer_review') c.reviewer_review++;
    else if (r.stage === 'approved') c.approved++;
    else if (r.stage === 'ordered' || r.stage === 'shipped' || r.stage === 'received') c.fulfilment++;
    else if (r.stage === 'denied') c.denied++;
  });
  return c;
}

function renderPipeline() {
  const c = counts();
  const card = (n, l, extra = '') =>
    `<div class="bg-white rounded-lg p-4 shadow-sm ${extra}"><div class="text-2xl font-bold text-slate-700">${n}</div><div class="text-xs text-slate-500">${l}</div></div>`;
  document.getElementById('pipelineCards').innerHTML =
    card(c.total, 'Loaded') +
    card(c.bu_review, 'BU review') +
    card(c.reviewer_review, 'Needs your review', 'ring-2 ring-brandaccent') +
    card(c.approved, 'Approved') +
    card(c.fulfilment, 'Ordered/Shipped') +
    card(c.denied, 'Denied');
}

function filteredRequests() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const type = document.getElementById('typeFilter').value;
  const stage = document.getElementById('stageFilter').value;
  return requests.filter((r) => {
    if (type && r.type !== type) return false;
    if (stage && r.stage !== stage) return false;
    if (q) {
      const hay = `${r.number} ${r.first} ${r.last} ${r.office} ${r.businessUnit} ${r.equipment}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderTable() {
  const rows = filteredRequests();
  if (!rows.length) {
    document.getElementById('requestRows').innerHTML =
      `<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">${liveMode ? 'No matching requests.' : 'No data loaded.'}</td></tr>`;
    return;
  }
  document.getElementById('requestRows').innerHTML = rows
    .map((r) => {
      const cta =
        r.stage === 'reviewer_review'
          ? '<span class="text-navy text-xs font-medium">Review →</span>'
          : r.stage === 'bu_review'
            ? '<span class="text-slate-400 text-xs">Waiting</span>'
            : '<span class="text-navy text-xs font-medium">View →</span>';
      return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="openDetail(${r.id})">
      <td class="px-4 py-3 font-medium text-navy">#${r.number}</td>
      <td class="px-4 py-3">${esc(r.first)} ${esc(r.last)}</td>
      <td class="px-4 py-3">${typeBadge(r.type)}</td>
      <td class="px-4 py-3">${esc(r.equipment)}</td>
      <td class="px-4 py-3">${esc(r.businessUnit) || '—'}</td>
      <td class="px-4 py-3">${esc(r.office)}</td>
      <td class="px-4 py-3">${badge(r.stage)}</td>
      <td class="px-4 py-3 text-right">${cta}</td></tr>`;
    })
    .join('');
}

function renderDetail(r) {
  const timeline = (r.audit || [])
    .map((e, i) => {
      const last = i === r.audit.length - 1;
      const dot =
        last && ['reviewer_review', 'bu_review'].includes(r.stage)
          ? 'bg-brandaccent animate-pulse'
          : 'bg-emerald-500';
      return `<li class="pl-4 relative"><span class="absolute -left-1.5 w-3 h-3 rounded-full ${dot}"></span><p class="font-medium">${esc(e.action)}</p><p class="text-slate-500 text-xs">${esc(e.actor)} · ${esc(e.at)}</p></li>`;
    })
    .join('');
  document.getElementById('detailContent').innerHTML = `
    <div class="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div><h1 class="text-xl font-semibold text-navy">AFE #${r.number} — ${esc(r.first)} ${esc(r.last)}</h1>
        <p class="text-sm text-slate-500">Submitted ${esc(r.submittedAt) || '—'} · ${esc(r.office)}</p></div>
        ${badge(r.stage)}
      </div>
      <dl class="grid grid-cols-2 gap-y-3 text-sm">
        <div><dt class="text-slate-400">Request type</dt><dd class="font-medium">${r.type === 'new_equipment' ? 'New equipment' : 'Replacement (repurposed)'}</dd></div>
        <div><dt class="text-slate-400">Equipment</dt><dd class="font-medium">${esc(r.equipment) || '—'}</dd></div>
        <div><dt class="text-slate-400">Business unit</dt><dd class="font-medium">${esc(r.businessUnit) || '—'}</dd></div>
        <div><dt class="text-slate-400">Cost center</dt><dd class="font-medium">${esc(r.costCenter) || '—'}</dd></div>
        <div><dt class="text-slate-400">Email</dt><dd class="font-medium">${esc(r.email) || '—'}</dd></div>
        <div><dt class="text-slate-400">Submitted to</dt><dd class="font-medium">${esc(r.submitTo) || '—'}</dd></div>
        <div class="col-span-2"><dt class="text-slate-400">Reason / notes</dt><dd class="font-medium">${esc(r.reason) || '—'}</dd></div>
      </dl>
      <p class="mt-6 text-sm text-slate-400 border-t pt-4">Read-only preview — write actions ship in apps/portal (Laravel).</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="font-medium text-slate-700 mb-4">Audit timeline</h2>
      <ol class="relative border-l border-slate-200 ml-2 space-y-5 text-sm">${timeline || '<li class="pl-4 text-slate-400">No audit entries</li>'}</ol>
    </div>`;
}

async function openDetail(id) {
  currentId = id;
  let r = requests.find((x) => x.id === id);
  if (!r && liveMode) {
    try {
      const res = await AFEAuth.apiFetch('/api/requests?id=' + id);
      const data = await res.json();
      if (res.ok && data.request) {
        r = data.request;
        requests.unshift(r);
      }
    } catch (e) {
      console.warn(e);
    }
  }
  if (r) {
    renderDetail(r);
    show('detail');
  }
}

async function loadLive() {
  updateBanner('Loading requests…');
  try {
    const res = await AFEAuth.apiFetch('/api/requests?limit=200');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.live || !Array.isArray(data.requests)) {
      if (res.status === 401) {
        AFEAuth.signOut();
        return false;
      }
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    liveMode = true;
    liveError = null;
    requests = data.requests;
    total = data.total || requests.length;
    renderPipeline();
    renderTable();
    updateBanner();
    return true;
  } catch (e) {
    liveMode = false;
    liveError = e.message || String(e);
    requests = [];
    total = 0;
    renderPipeline();
    renderTable();
    updateBanner();
    return false;
  }
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'dashboard') renderTable();
  window.scrollTo(0, 0);
}

document.querySelectorAll('.navbtn').forEach((b) => b.addEventListener('click', () => show(b.dataset.screen)));
document.getElementById('signOutBtn').addEventListener('click', () => AFEAuth.signOut());

const hints = {
  reviewer: 'Reviewing the queue as Megan McDaniel',
  bu: 'Approving requests submitted to you',
  it: 'Fulfilling approved requests',
  admin: 'Full access · users, roles, audit log',
};
document.getElementById('roleSel').addEventListener('change', (e) => {
  document.getElementById('roleHint').textContent = hints[e.target.value];
});

['searchInput', 'typeFilter', 'stageFilter'].forEach((id) =>
  document.getElementById(id).addEventListener('input', renderTable),
);
document.getElementById('sampleBtn').addEventListener('click', () => {
  const r = requests.find((x) => x.stage === 'reviewer_review') || requests[0];
  if (r) openDetail(r.id);
  else alert('No requests loaded yet.');
});

let step = 1;
document.getElementById('nextBtn').addEventListener('click', () => {
  alert('New requests will be handled by the production Laravel app in apps/portal.');
});
document.getElementById('prevBtn').addEventListener('click', () => show('dashboard'));
