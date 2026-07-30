

const Notify = (() => {
  let channel = null;
  try { channel = new BroadcastChannel("emc_notifications"); } catch (e) { channel = null; }

  function send({ title, message, target_role = "all", target_user = null, type = "info" }) {
    const n = DB.notify({ title, message, target_role, target_user, type, origin: "broadcast" });
    if (channel) channel.postMessage({ type: "new_notification", notification: n });
    return n;
  }

  function forUser(user) {
    if (!user) return [];
    return DB.all("notifications")
      .filter(n => n.target_role === "all" || n.target_role === user.role || n.target_user === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function unreadCount(user) {
    if (!user) return 0;
    return forUser(user).filter(n => !n.read_by.includes(user.id)).length;
  }

  function markRead(id, userId) {
    const n = DB.find("notifications", id);
    if (!n) return;
    if (!n.read_by.includes(userId)) {
      n.read_by.push(userId);
      DB.update("notifications", id, { read_by: n.read_by });
    }
  }

  function markAllRead(user) {
    forUser(user).forEach(n => markRead(n.id, user.id));
  }

  function renderBadge(user) {
    const badge = document.querySelectorAll(".notif-badge");
    const count = unreadCount(user);
    badge.forEach(b => {
      b.textContent = count > 9 ? "9+" : String(count);
      b.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  function initBell(user) {
    renderBadge(user);
    if (channel) {
      channel.onmessage = (ev) => {
        if (ev.data && ev.data.type === "new_notification") {
          renderBadge(user);
          toast(ev.data.notification.title, ev.data.notification.message, ev.data.notification.type);
        }
      };
    }
    window.addEventListener("storage", (e) => {
      if (e.key === DB.key("notifications")) renderBadge(user);
    });
  }

  function toast(title, message, type = "info") {
    let wrap = document.getElementById("toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 6000);
  }

  // --- PUBLIC BOOKING & APPOINTMENT SYNC EXTENSIONS --- //

  // Helper to fetch live pending appointments for display on public feeds or widgets
  function getPublicRequests() {
    return DB.all("appointments")
      .filter(a => a.status === "pending")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Listen for broadcast events and update public appointment widgets across tabs
  function initPublicFeed(containerId) {
    const render = () => {
      const el = document.getElementById(containerId);
      if (!el) return;
      const requests = getPublicRequests();
      if (requests.length === 0) {
        el.innerHTML = `<p class="text-dim small">No recent public requests.</p>`;
        return;
      }
      el.innerHTML = requests.slice(0, 5).map(r => `
        <div class="card mt-8" style="padding:10px; border-left:3px solid var(--primary);">
          <strong style="font-size:13px;">${r.patient_name} — ${r.request_type}</strong>
          <div class="text-mid small">${r.department_name || 'General'} | ${r.appointment_date}</div>
          <span class="badge badge-warning mt-4">${r.status}</span>
        </div>
      `).join("");
    };

    render();

    if (channel) {
      const originalHandler = channel.onmessage;
      channel.onmessage = (ev) => {
        if (typeof originalHandler === "function") originalHandler(ev);
        if (ev.data && ev.data.type === "new_notification") {
          render();
        }
      };
    }

    window.addEventListener("storage", (e) => {
      if (e.key === DB.key("appointments") || e.key === DB.key("notifications")) {
        render();
      }
    });
  }

  return { 
    send, 
    forUser, 
    unreadCount, 
    markRead, 
    markAllRead, 
    renderBadge, 
    initBell, 
    toast,
    getPublicRequests,
    initPublicFeed
  };
})();
