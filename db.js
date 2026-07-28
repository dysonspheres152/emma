/* ============================================================
   EMMANUEL MEDICAL CENTER — ENTEBBE
   Local database layer (localStorage-backed)
   No demo/sample records are seeded — only the structural data
   required for the system to function on first run.
   ============================================================ */

const DB = (() => {
  const TABLES = [
    "users", "roles", "permissions", "patients", "doctors", "staff",
    "departments", "appointments", "medical_records", "prescriptions",
    "medicines", "inventory", "sales", "sale_items", "payments",
    "invoices", "laboratory_tests", "laboratory_results",
    "notifications", "audit_logs", "settings"
  ];

  function key(table) { return `emc_${table}`; }

  function all(table) {
    try {
      const raw = localStorage.getItem(key(table));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("DB read error", table, e);
      return [];
    }
  }

  function save(table, rows) {
    localStorage.setItem(key(table), JSON.stringify(rows));
    // let other tabs / pages on this device know data changed
    localStorage.setItem("emc_last_write", JSON.stringify({ table, t: Date.now() }));
  }

  function nextId(table, prefix) {
    const rows = all(table);
    const n = rows.length + 1;
    return `${prefix}-${String(n).padStart(5, "0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  function insert(table, record) {
    const rows = all(table);
    rows.push(record);
    save(table, rows);
    return record;
  }

  function update(table, id, patch) {
    const rows = all(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updated_at: new Date().toISOString() };
    save(table, rows);
    return rows[idx];
  }

  function remove(table, id) {
    const rows = all(table).filter(r => r.id !== id);
    save(table, rows);
  }

  function find(table, id) {
    return all(table).find(r => r.id === id) || null;
  }

  function query(table, predicate) {
    return all(table).filter(predicate);
  }

  function log(action, details, userId) {
    insert("audit_logs", {
      id: nextId("audit_logs", "LOG"),
      user_id: userId || (Auth.currentUser() ? Auth.currentUser().id : "system"),
      action,
      details,
      created_at: new Date().toISOString()
    });
  }

  function notify({ title, message, target_role = "all", target_user = null, type = "info", origin = "local" }) {
    const n = {
      id: nextId("notifications", "NTF"),
      title, message, target_role, target_user, type, origin,
      read_by: [],
      created_at: new Date().toISOString()
    };
    insert("notifications", n);
    return n;
  }

  function seed() {
    TABLES.forEach(t => { if (localStorage.getItem(key(t)) === null) save(t, []); });

    if (all("roles").length === 0) {
      const roleNames = ["Administrator", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Accountant", "Laboratory"];
      roleNames.forEach(name => insert("roles", {
        id: nextId("roles", "ROL"),
        name,
        permissions: name === "Administrator" ? ["*"] : [],
        created_at: new Date().toISOString()
      }));
    }

    if (all("departments").length === 0) {
      ["Out-Patient", "In-Patient", "Pharmacy", "Laboratory", "Maternity", "Administration"].forEach(name =>
        insert("departments", { id: nextId("departments", "DEP"), name, created_at: new Date().toISOString() })
      );
    }

    if (all("settings").length === 0) {
      insert("settings", {
        id: "SETTINGS-1",
        hospital_name: "Emmanuel Medical Center",
        hospital_location: "Entebbe, Uganda",
        hospital_phone: "+256 700 000 000",
        hospital_email: "info@emmanuelmedicalcenter.ug",
        currency: "UGX",
        receipt_footer: "Thank you for choosing Emmanuel Medical Center.",
        logo: "",
        created_at: new Date().toISOString()
      });
    }

    if (all("users").length === 0) {
      const adminRole = all("roles").find(r => r.name === "Administrator");
      insert("users", {
        id: nextId("users", "USR"),
        username: "admin",
        password: "admin123", // must be changed on first login
        full_name: "System Administrator",
        role_id: adminRole.id,
        role: "Administrator",
        must_change_password: true,
        status: "active",
        created_at: new Date().toISOString()
      });
    }
  }

  return {
    TABLES, all, save, insert, update, remove, find, query,
    nextId, log, notify, seed, key
  };
})();

DB.seed();
