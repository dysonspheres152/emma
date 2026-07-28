/* ============================================================
   Shared shell: sidebar navigation + topbar + notification panel
   Included on every internal page after auth.js / db.js / notifications.js
   ============================================================ */

const NAV_ITEMS = [
  { href: "dashboard.html", icon: "&#9679;", label: "Dashboard", page: "dashboard" },
  { href: "patients.html", icon: "&#128100;", label: "Patients & Appointments", page: "patients" },
  { href: "clinical.html", icon: "&#127973;", label: "Doctor Consultation", page: "clinical" },
  { href: "pharmacy.html", icon: "&#128138;", label: "Pharmacy POS & Inventory", page: "pharmacy" },
  { href: "laboratory.html", icon: "&#129514;", label: "Laboratory", page: "laboratory" },
  { href: "billing.html", icon: "&#128179;", label: "Billing & Finance", page: "billing" },
  { href: "admin.html", icon: "&#9881;", label: "Reports, Users & Settings", page: "admin" },
  { href: "about.html", icon: "&#8505;", label: "About", page: "about" },
];

function renderShell({ activePage, title, subtitle }) {
  const user = Auth.requireLogin();
  if (!user) {
    // Auth.requireLogin() has already redirected to the login page.
    // Return a harmless placeholder so calling pages don't crash on
    // destructuring while the redirect completes.
    return { user: null, contentEl: document.createElement("div") };
  }

  const settings = DB.all("settings")[0] || {};

  const navHtml = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${item.page === activePage ? "active" : ""}">
      <span class="nav-icon">${item.icon}</span>${item.label}
    </a>`).join("");

  const shell = document.createElement("div");
  shell.className = "app-shell";
  shell.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">EM</div>
        <div class="brand-text">
          <b>${settings.hospital_name || "Emmanuel Medical Center"}</b>
          <span>${settings.hospital_location || "Entebbe, Uganda"}</span>
        </div>
      </div>
      <nav class="nav">${navHtml}</nav>
      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="avatar">${initials(user.full_name)}</div>
          <div>
            <b>${user.full_name}</b>
            <span>${user.role}</span>
          </div>
        </div>
        <button class="logout-btn" id="logoutBtn">&#8630; Sign out</button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div>
          <h1>${title}</h1>
          <div class="sub">${subtitle || ""}</div>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" id="notifBtn" title="Notifications">
            &#128276;<span class="notif-badge">0</span>
          </button>
          <div class="notif-dropdown" id="notifDropdown"></div>
        </div>
      </header>
      <main class="content" id="pageContent"></main>
    </div>
  `;
  document.body.prepend(shell);

  document.getElementById("logoutBtn").onclick = () => {
    if (confirm("Sign out of Emmanuel Medical Center system?")) {
      Auth.logout();
      window.location.href = "index.html";
    }
  };

  Notify.initBell(user);
  setupNotifDropdown(user);

  // keep session alive on interaction
  ["click", "keydown", "mousemove"].forEach(ev => document.addEventListener(ev, () => Auth.touch()));

  return { user, contentEl: document.getElementById("pageContent") };
}

function setupNotifDropdown(user) {
  const btn = document.getElementById("notifBtn");
  const dd = document.getElementById("notifDropdown");
  function refresh() {
    const list = Notify.forUser(user).slice(0, 25);
    if (list.length === 0) {
      dd.innerHTML = `<div class="empty-state" style="padding:24px;"><div class="glyph">&#128276;</div>No notifications yet.</div>`;
      return;
    }
    dd.innerHTML = `
      <div class="flex-between" style="padding:8px 8px 10px;">
        <b class="small">Notifications</b>
        <button class="btn btn-ghost btn-sm" id="markAllReadBtn">Mark all read</button>
      </div>
      ${list.map(n => `
        <div class="notif-item">
          <div class="flex-between"><b>${n.title}</b><small>${timeAgo(n.created_at)}</small></div>
          <p>${n.message}</p>
        </div>`).join("")}
    `;
    const markBtn = document.getElementById("markAllReadBtn");
    if (markBtn) markBtn.onclick = () => { Notify.markAllRead(user); refresh(); Notify.renderBadge(user); };
  }
  btn.onclick = (e) => {
    e.stopPropagation();
    dd.classList.toggle("show");
    if (dd.classList.contains("show")) refresh();
  };
  document.addEventListener("click", (e) => { if (!dd.contains(e.target) && e.target !== btn) dd.classList.remove("show"); });
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function fmtMoney(n, currency) {
  const settings = DB.all("settings")[0] || {};
  const cur = currency || settings.currency || "UGX";
  return `${cur} ${Number(n || 0).toLocaleString()}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function openModal(id) { document.getElementById(id).classList.add("show"); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
