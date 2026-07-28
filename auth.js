/* ============================================================
   Auth: login, session, role checks, security logging
   ============================================================ */

const Auth = (() => {
  const SESSION_KEY = "emc_session";
  const TIMEOUT_MIN = 30; // auto-logout after inactivity

  function currentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.last_activity > TIMEOUT_MIN * 60 * 1000) {
        logout("Session expired");
        return null;
      }
      return s.user;
    } catch (e) { return null; }
  }

  function touch() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    s.last_activity = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  function login(username, password) {
    const users = DB.all("users");
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      DB.log("login_failed", `Unknown username: ${username}`, "anonymous");
      return { ok: false, message: "Invalid username or password." };
    }
    if (user.status === "disabled") {
      DB.log("login_blocked", `Disabled account attempted login: ${username}`, user.id);
      return { ok: false, message: "This account has been disabled. Contact the administrator." };
    }
    if (user.password !== password) {
      DB.log("login_failed", `Wrong password for: ${username}`, user.id);
      return { ok: false, message: "Invalid username or password." };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, last_activity: Date.now() }));
    DB.update("users", user.id, { last_login: new Date().toISOString() });
    DB.log("login_success", `${user.full_name} logged in`, user.id);
    return { ok: true, user, mustChange: !!user.must_change_password };
  }

  function logout(reason = "User logged out") {
    const u = currentUser();
    if (u) DB.log("logout", reason, u.id);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function requireLogin(redirectTo = "index.html") {
    const u = currentUser();
    if (!u) { window.location.href = redirectTo; return null; }
    touch();
    return u;
  }

  function hasPermission(user, perm) {
    if (!user) return false;
    const role = DB.all("roles").find(r => r.name === user.role);
    if (!role) return false;
    return role.permissions.includes("*") || role.permissions.includes(perm);
  }

  function isAdmin(user) {
    return user && user.role === "Administrator";
  }

  function resetPassword(username, newPassword) {
    const user = DB.all("users").find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return { ok: false, message: "No account found with that username." };
    DB.update("users", user.id, { password: newPassword, must_change_password: false });
    DB.log("password_reset", `Password reset for ${user.username}`, user.id);
    DB.notify({
      title: "Password reset",
      message: `The password for ${user.full_name} (${user.username}) was reset.`,
      target_role: "Administrator", type: "security"
    });
    return { ok: true };
  }

  return { currentUser, login, logout, requireLogin, hasPermission, isAdmin, resetPassword, touch };
})();
