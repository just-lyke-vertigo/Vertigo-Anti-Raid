/* ================= VERTIGO · Vanilla JS SPA =================
   CHANGE THIS to your PythonAnywhere URL after deploy:
   Example: https://vertigolyfe.pythonanywhere.com
============================================================ */
const API_BASE = "https://vertigolyfe.pythonanywhere.com";
const API = API_BASE + "/api";

const CURRENCY_SYMBOL = "£";
const VERSION = "2.2.0";

/* ================= CHANGELOG =================
   Add new entries at the TOP (newest first).
   Each change is tagged:
     - added   (green)
     - removed (red)
     - changed (amber)
     - fixed   (cyan)
*/
const CHANGELOG = [
  {
    version: "2.2.0",
    date: "2026-05-03",
    title: "Three tiers, leaderboard & mobile polish",
    changes: [
      ["added", "Vertigo Plus tier (£2.99/mo) between Free and Pro"],
      ["added", "Real-time leaderboard of the top 100 most-defended servers"],
      ["added", "Public changelog on the landing page"],
      ["added", "Full mobile & iPad responsive layout with slide-out sidebar"],
      ["changed", "Rebranded 'anti-raid' → 'anti-nuke' (raids bundled into Anti-Nuke Engine)"],
      ["changed", "Landing stats now reflect real bot activity (nukes blocked, members defended)"],
      ["changed", "'Defending X servers' now pulls live guild count from Discord"],
      ["fixed", "Invite-bot buttons now work on mobile (pre-fetched URLs)"],
      ["fixed", "Dashboard no longer shows zero stats before the bot joins the server"],
      ["removed", "Decorative '// ' prefixes from section labels for a cleaner look"],
    ],
  },
  {
    version: "2.1.0",
    date: "2026-05-02",
    title: "Discord-linked profile & UX refinements",
    changes: [
      ["added", "Profile picture shows a `?` until Discord is linked (then real avatar)"],
      ["added", "Scroll reveals are now bidirectional — animations replay infinitely"],
      [
        "changed",
        "Features grid is a uniform 3×3 (added Trusted Whitelist, Account-Age Filter, Instant Response)",
      ],
      ["changed", "99.97% uptime → 99.99% accuracy"],
      ["fixed", "Friendly error messages on duplicate signup ('account already exists')"],
      [
        "fixed",
        "Clicking the Vertigo logo while logged in keeps you signed in and swaps nav to 'Dashboard'",
      ],
    ],
  },
  {
    version: "2.0.0",
    date: "2026-05-02",
    title: "Real Discord integration & GBP pricing",
    changes: [
      [
        "added",
        "Real Discord OAuth — log in with Discord and pick servers from your manageable list",
      ],
      ["added", "Live realtime polling for member counts, online counts, and notification feed"],
      [
        "added",
        "Discord bot companion (`bot/vertigo_bot.py`) for real raid blocking when deployed",
      ],
      ["changed", "Currency USD → GBP (PayPal billing + displayed prices)"],
      ["changed", "Rebranded Aegis → Vertigo"],
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-01",
    title: "Initial release",
    changes: [
      [
        "added",
        "Landing page, auth, full dashboard, protection settings, backups, notifications, commands, pricing",
      ],
      ["added", "PythonAnywhere-ready Flask backend with SQLite"],
    ],
  },
];

/* -------- Utilities -------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === "") continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
};
const token = {
  get: () => localStorage.getItem("vertigo_token"),
  set: (t) => localStorage.setItem("vertigo_token", t),
  clear: () => localStorage.removeItem("vertigo_token"),
};

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const t = token.get();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  let res;
  try {
    res = await fetch(API + path, {
      ...opts,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (netErr) {
    throw new Error(
      `Can't reach backend at ${API_BASE}. Check your internet, or that the PythonAnywhere web app is reloaded with the latest code.`
    );
  }
  if (res.status === 401 && !["/auth/login", "/auth/signup"].includes(path)) {
    token.clear();
    if (!location.hash.startsWith("#/login") && location.hash !== "#/" && location.hash !== "") {
      location.hash = "#/login";
    }
  }
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  return data;
}

function toast(msg, kind = "info") {
  let wrap = $(".toast-wrap");
  if (!wrap) {
    wrap = h("div", { class: "toast-wrap" });
    document.body.appendChild(wrap);
  }
  const t = h("div", { class: `toast ${kind}` }, msg);
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* -------- Scroll reveal observer (bidirectional - resets when out of view) -------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in");
      else e.target.classList.remove("in");
    });
  },
  { threshold: 0.12 }
);

function setupReveals(root = document) {
  $$(".reveal", root).forEach((el) => revealObserver.observe(el));
}

/* -------- Icons (shared) -------- */
const ICON = {
  shield:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2L4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6l-8-4z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>',
  term: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  logout:
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  crown:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 20h20l-2-12-5 4-3-7-3 7-5-4z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  rotate:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  mail: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 5l6 4 6-4"/></svg>',
  user: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>',
  lockSm:
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="12" height="7" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>',
};

/* -------- App State -------- */
const state = {
  user: null,
  servers: [],
  activeServerId: null,
  polling: null,
  config: null, // { discord_client_id, discord_configured }
};

async function loadConfig() {
  if (state.config) return state.config;
  try {
    state.config = await (await fetch(API + "/public/config")).json();
  } catch {
    state.config = { discord_client_id: "", discord_configured: false };
  }
  return state.config;
}

/** Build the Discord invite URL synchronously (works around mobile popup blockers). */
function buildInviteUrl(guildId) {
  const cid = state.config?.discord_client_id || "PLACEHOLDER";
  const perms = "1099511627775";
  let url = `https://discord.com/api/oauth2/authorize?client_id=${cid}&permissions=${perms}&scope=bot%20applications.commands`;
  if (guildId) url += `&guild_id=${guildId}&disable_guild_select=true`;
  return url;
}

async function loadUser() {
  if (!token.get()) {
    state.user = null;
    return;
  }
  try {
    state.user = await api("/auth/me");
  } catch {
    token.clear();
    state.user = null;
  }
}

async function loadServers() {
  if (!state.user) return;
  try {
    state.servers = await api("/servers");
    if (state.servers.length && !state.servers.find((s) => s.id === state.activeServerId)) {
      state.activeServerId = state.servers[0].id;
    }
    if (!state.servers.length) state.activeServerId = null;
  } catch {}
}

function activeServer() {
  return state.servers.find((s) => s.id === state.activeServerId) || null;
}

function stopPolling() {
  if (state.polling) {
    clearInterval(state.polling);
    state.polling = null;
  }
}

/* -------- Router -------- */
const routes = {
  "/": renderLanding,
  "/login": () => renderAuth("login"),
  "/signup": () => renderAuth("signup"),
  "/pricing": renderPricing,
  "/dashboard": () => renderDashboard("overview"),
  "/protection": () => renderDashboard("protection"),
  "/backups": () => renderDashboard("backups"),
  "/notifications": () => renderDashboard("notifications"),
  "/commands": () => renderDashboard("commands"),
  "/settings": () => renderDashboard("settings"),
  "/add-server": () => renderDashboard("add-server"),
};

async function router() {
  stopPolling();
  const app = $("#app");
  app.innerHTML = "";
  const hash = location.hash.replace(/^#/, "") || "/";
  const handler = routes[hash] || renderLanding;
  const needsAuth = [
    "/dashboard",
    "/protection",
    "/backups",
    "/notifications",
    "/commands",
    "/settings",
    "/add-server",
  ].includes(hash);
  if (needsAuth && !state.user) {
    location.hash = "#/login";
    return;
  }
  if (needsAuth) await loadServers();
  await handler();
  setupReveals();
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

/* -------- LANDING -------- */
async function renderLanding() {
  const tpl = $("#tpl-landing").content.cloneNode(true);
  $("#app").appendChild(tpl);

  // Set version in footer
  const versionEl = $('[data-slot="version"]');
  if (versionEl) versionEl.textContent = VERSION;

  // If user is logged in, swap nav CTAs + hero button to "Dashboard"
  if (state.user) {
    const navCta = $(".nav-cta");
    if (navCta) {
      navCta.innerHTML = "";
      navCta.appendChild(
        h(
          "a",
          {
            href: "#/dashboard",
            class: "btn-primary btn-sm",
          },
          "Dashboard"
        )
      );
    }
    const heroBtn = $('[data-testid="hero-get-started"]');
    if (heroBtn) {
      heroBtn.setAttribute("href", "#/dashboard");
      heroBtn.innerHTML =
        'Open dashboard <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>';
    }
    const ctaButtons = $$(".cta .btn-primary, .cta .btn-ghost");
    if (ctaButtons[0]) {
      ctaButtons[0].setAttribute("href", "#/dashboard");
      ctaButtons[0].textContent = "Open dashboard";
    }
  }

  // Load public stats (real bot data)
  await refreshLandingStats();

  // Load leaderboard + changelog
  renderChangelog();
  await renderLeaderboardSection();

  // Poll stats + leaderboard every 15s for "live" feel
  state.polling = setInterval(() => {
    refreshLandingStats();
    renderLeaderboardSection();
  }, 15000);
}

async function refreshLandingStats() {
  try {
    const s = await (await fetch(API + "/public/stats")).json();
    const fmt = (n) => (n == null ? "—" : n > 999 ? (n / 1000).toFixed(1) + "k" : String(n));
    const setSlot = (slot, val) => {
      const el = $(`[data-slot="${slot}"]`);
      if (el && el.textContent !== fmt(val)) {
        el.textContent = fmt(val);
        el.classList.remove("num-tick");
        void el.offsetWidth;
        el.classList.add("num-tick");
      }
    };
    setSlot("servers-count", s.servers_defended);
    setSlot("servers-protected", s.servers_protected);
    setSlot("nukes-blocked", s.nukes_blocked);
    setSlot("members-defended", s.members_defended);
  } catch {}
}

async function renderLeaderboardSection() {
  const container = $('[data-slot="leaderboard"]');
  if (!container) return;
  try {
    const rows = await (await fetch(API + "/public/leaderboard")).json();
    container.innerHTML = "";
    if (!rows.length) {
      container.appendChild(
        h(
          "p",
          {
            class: "muted",
            style: "padding:24px 0;text-align:center",
          },
          "No nukes blocked yet — be the first server to test our defenses."
        )
      );
      return;
    }
    rows.slice(0, 10).forEach((r, i) => {
      const rank = i + 1;
      const iconEl = r.icon
        ? h("img", { class: "lb-icon", src: r.icon, alt: "" })
        : h("span", { class: "lb-icon" }, r.name.slice(0, 2).toUpperCase());
      container.appendChild(
        h(
          "div",
          {
            class: `lb-row ${rank <= 3 ? "top-3" : ""} ${rank === 1 ? "rank-1" : ""}`,
          },
          h("div", { class: "lb-rank" }, `#${rank}`),
          h("div", { class: "lb-name" }, iconEl, h("span", { class: "lb-name-text" }, r.name)),
          h("span", { class: "lb-members" }, `${r.member_count} members`),
          h("span", { class: "lb-nukes" }, `${r.nukes_blocked} blocked`)
        )
      );
    });
  } catch {
    container.innerHTML = '<p class="muted" style="padding:24px 0">Leaderboard unavailable.</p>';
  }
}

function renderChangelog() {
  const container = $('[data-slot="changelog"]');
  if (!container) return;
  container.innerHTML = "";
  CHANGELOG.forEach((entry, idx) => {
    const item = h(
      "div",
      { class: "changelog-item" },
      h(
        "div",
        { class: "changelog-meta" },
        h(
          "span",
          {
            class: `changelog-version ${idx === 0 ? "latest" : ""}`,
          },
          `v${entry.version}`
        ),
        h("span", { class: "changelog-date" }, entry.date),
        h("span", { class: "changelog-title" }, entry.title)
      ),
      h(
        "ul",
        { class: "changelog-changes" },
        ...entry.changes.map(([kind, text]) =>
          h(
            "li",
            { class: kind },
            h(
              "span",
              {
                style:
                  "font-family:JetBrains Mono;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-right:4px",
              },
              kind
            ),
            text
          )
        )
      )
    );
    container.appendChild(item);
  });
}

/* -------- AUTH -------- */
function renderAuth(mode) {
  const tpl = $("#tpl-auth").content.cloneNode(true);
  const root = tpl.querySelector(".auth-card");
  const isLogin = mode === "login";
  root.querySelector('[data-slot="eyebrow"]').textContent = isLogin
    ? "authenticate"
    : "new operator";
  root.querySelector('[data-slot="title"]').textContent = isLogin
    ? "Welcome back."
    : "Arm your server.";
  root.querySelector('[data-slot="subtitle"]').textContent = isLogin
    ? "Sign in to manage your protected servers."
    : "Free forever. No credit card. 30 second setup.";
  root.querySelector('[data-slot="submit"]').textContent = isLogin ? "Sign in" : "Create account";
  root.querySelector('[data-slot="switch"]').innerHTML = isLogin
    ? `New here? <a href="#/signup">Create an account</a>`
    : `Already have an account? <a href="#/login">Sign in</a>`;

  const fields = root.querySelector('[data-slot="fields"]');
  fields.className = "form";
  if (!isLogin)
    fields.appendChild(
      h(
        "div",
        { class: "field" },
        h("span", { html: ICON.user }),
        h("input", {
          class: "input has-icon",
          name: "username",
          placeholder: "Username",
          required: true,
          minlength: 3,
        })
      )
    );
  fields.appendChild(
    h(
      "div",
      { class: "field" },
      h("span", { html: ICON.mail }),
      h("input", {
        class: "input has-icon",
        type: "email",
        name: "email",
        placeholder: "Email",
        required: true,
      })
    )
  );
  fields.appendChild(
    h(
      "div",
      { class: "field" },
      h("span", { html: ICON.lockSm }),
      h("input", {
        class: "input has-icon",
        type: "password",
        name: "password",
        placeholder: isLogin ? "Password" : "Password (min 6 chars)",
        required: true,
        minlength: 6,
      })
    )
  );

  const form = root.querySelector('[data-slot="form"]');
  const submitBtn = root.querySelector('[data-slot="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = isLogin ? "Signing in..." : "Creating...";
    const payload = Object.fromEntries(new FormData(form));
    try {
      const r = await api(isLogin ? "/auth/login" : "/auth/signup", {
        method: "POST",
        body: payload,
      });
      token.set(r.access_token);
      state.user = r.user;
      toast(isLogin ? "Welcome back!" : "Welcome to Vertigo!", "success");
      location.hash = "#/dashboard";
    } catch (err) {
      toast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? "Sign in" : "Create account";
    }
  });

  root.querySelector('[data-action="discord"]').addEventListener("click", async () => {
    try {
      const r = await api("/auth/discord/url?mode=login");
      location.href = r.url;
    } catch (err) {
      toast(err.message, "error");
    }
  });

  $("#app").appendChild(tpl);
}

/* -------- DASHBOARD SHELL -------- */
async function renderDashboard(page) {
  const tpl = $("#tpl-dashboard-layout").content.cloneNode(true);
  const shell = tpl.querySelector(".app-shell");
  renderServerSelector(shell.querySelector('[data-slot="server-selector"]'));

  const nav = shell.querySelector('[data-slot="nav"]');
  const items = [
    ["overview", "/dashboard", "Overview", ICON.grid],
    ["protection", "/protection", "Protection", ICON.lock],
    ["backups", "/backups", "Backups", ICON.save],
    ["notifications", "/notifications", "Alerts", ICON.bell],
    ["commands", "/commands", "Commands", ICON.term],
    ["settings", "/settings", "Settings", ICON.gear],
  ];
  items.forEach(([key, path, label, ico]) => {
    nav.appendChild(
      h(
        "a",
        { href: `#${path}`, class: `nav-item ${page === key ? "active" : ""}` },
        h("span", { html: ico }),
        label
      )
    );
  });

  const foot = shell.querySelector('[data-slot="foot"]');
  if (!state.user?.premium_tier) {
    foot.appendChild(
      h(
        "a",
        { href: "#/pricing", class: "upgrade-card" },
        h("div", { class: "upgrade-title" }, h("span", { html: ICON.crown }), " Upgrade to Pro"),
        h("div", { class: "upgrade-desc" }, "Unlimited backups, priority defense.")
      )
    );
  }
  const av =
    state.user?.discord_linked && state.user?.avatar
      ? h("span", { class: "user-av" }, h("img", { src: state.user.avatar, alt: "" }))
      : h("span", { class: "user-av" }, "?");
  foot.appendChild(
    h(
      "div",
      { class: "user-row" },
      av,
      h(
        "div",
        { class: "user-meta" },
        h(
          "div",
          { class: "user-name" },
          state.user?.username || "",
          state.user?.premium_tier ? h("span", { html: ICON.crown, style: "color:#F59E0B" }) : ""
        ),
        h("div", { class: "user-email" }, state.user?.email || state.user?.auth_method || "")
      ),
      h(
        "button",
        {
          class: "icon-btn",
          title: "Sign out",
          onclick: () => {
            token.clear();
            state.user = null;
            state.servers = [];
            state.activeServerId = null;
            location.hash = "#/";
          },
        },
        h("span", { html: ICON.logout })
      )
    )
  );

  const srv = activeServer();
  shell.querySelector('[data-slot="crumb"]').textContent =
    srv?.name || (state.servers.length ? "Loading..." : "No server selected");

  // Invite-bot button in header: use a real <a> so it works on mobile
  const inviteBtn = shell.querySelector('[data-action="invite"]');
  if (inviteBtn) {
    const a = h(
      "a",
      {
        href: buildInviteUrl(srv?.discord_guild_id),
        target: "_blank",
        rel: "noopener",
        class: "btn-ghost btn-sm",
        "data-testid": "header-invite-btn",
      },
      "Invite bot"
    );
    inviteBtn.replaceWith(a);
  }

  // Mobile hamburger toggle
  const hamburger = shell.querySelector('[data-slot="hamburger"]');
  const overlay = shell.querySelector('[data-slot="sidebar-overlay"]');
  const sidebar = shell.querySelector(".sidebar");
  const toggleSidebar = () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  };
  if (hamburger) hamburger.addEventListener("click", toggleSidebar);
  if (overlay) overlay.addEventListener("click", toggleSidebar);

  const pageEl = shell.querySelector('[data-slot="page"]');
  pageEl.classList.add("fade-up");

  if (page === "add-server") {
    await renderAddServer(pageEl);
    $("#app").appendChild(tpl);
    return;
  }

  // If user has no servers, nudge them to add one
  if (!state.servers.length && page !== "settings") {
    pageEl.appendChild(renderNoServers());
    $("#app").appendChild(tpl);
    return;
  }

  if (page === "overview") await renderOverview(pageEl);
  else if (page === "protection") await renderProtection(pageEl);
  else if (page === "backups") await renderBackups(pageEl);
  else if (page === "notifications") await renderNotificationsPage(pageEl);
  else if (page === "commands") await renderCommands(pageEl);
  else if (page === "settings") renderSettings(pageEl);

  $("#app").appendChild(tpl);
}

function renderNoServers() {
  return h(
    "div",
    { class: "section-card fade-up", style: "text-align:center;padding:56px 24px" },
    h("div", { style: "font-size:42px;margin-bottom:8px" }, "🛡️"),
    h("h2", { class: "page-title", style: "margin:0" }, "No server protected yet"),
    h(
      "p",
      { class: "page-sub", style: "margin:12px auto 24px;max-width:420px" },
      "Connect your Discord account and add a server to activate Vertigo's defense."
    ),
    h("a", { href: "#/add-server", class: "btn-primary" }, "+ Add a Discord server")
  );
}

function renderServerSelector(el) {
  el.innerHTML = "";
  const srv = activeServer();
  const btn = h(
    "button",
    { class: "server-btn" },
    h(
      "div",
      { style: "display:flex;align-items:center;min-width:0;flex:1" },
      srv?.icon
        ? h("img", { src: srv.icon, class: "server-av", style: "object-fit:cover" })
        : h("div", { class: "server-av" }, (srv?.name || "+").slice(0, 2).toUpperCase()),
      h(
        "div",
        { class: "server-info" },
        h("div", { class: "server-name" }, srv?.name || "Add a server"),
        h(
          "div",
          { class: "server-sub" },
          srv
            ? `${srv.member_count} members${srv.bot_joined ? " · bot online" : " · bot offline"}`
            : "Click to connect"
        )
      )
    ),
    h("span", { html: ICON.chev })
  );
  el.appendChild(btn);
  let open = false;
  btn.addEventListener("click", () => {
    open = !open;
    const existing = el.querySelector(".server-menu");
    if (existing) existing.remove();
    if (!open) return;
    const menu = h("div", { class: "server-menu" });
    state.servers.forEach((s) => {
      menu.appendChild(
        h(
          "button",
          {
            class: "server-opt",
            onclick: () => {
              state.activeServerId = s.id;
              router();
            },
          },
          s.icon
            ? h("img", {
                src: s.icon,
                class: "server-av",
                style: "width:28px;height:28px;object-fit:cover",
              })
            : h(
                "div",
                { class: "server-av", style: "width:28px;height:28px" },
                s.name.slice(0, 2).toUpperCase()
              ),
          h("span", {}, s.name),
          s.bot_joined
            ? h("span", { class: "pulse-dot-bg pulse-dot", style: "margin-left:auto" })
            : ""
        )
      );
    });
    menu.appendChild(
      h(
        "a",
        { href: "#/add-server", class: "server-opt invite", onclick: () => (open = false) },
        h("span", { html: ICON.plus }),
        "Add Discord server"
      )
    );
    el.appendChild(menu);
  });
}

async function inviteBot(guildId) {
  // Synchronous — works on mobile popup blockers because URL is pre-computed
  if (!state.config) await loadConfig();
  const url = buildInviteUrl(guildId);
  window.open(url, "_blank");
  if (!state.config.discord_configured) {
    toast("Demo invite — set DISCORD_CLIENT_ID in backend.", "info");
  }
}

/* -------- ADD SERVER -------- */
async function renderAddServer(root) {
  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "new server"),
        h("h1", { class: "page-title" }, "Add a Discord server"),
        h(
          "p",
          { class: "page-sub" },
          "Pick a server you manage. We'll invite Vertigo and start protecting."
        )
      )
    )
  );

  if (!state.user?.discord_linked) {
    root.appendChild(
      h(
        "div",
        { class: "section-card", style: "text-align:center;padding:48px 24px" },
        h("div", { style: "font-size:42px" }, "🔗"),
        h(
          "h3",
          { style: "margin:8px 0 8px;font-family:Outfit;font-size:22px" },
          "Connect your Discord"
        ),
        h(
          "p",
          { class: "muted", style: "max-width:420px;margin:0 auto 24px" },
          "We'll list every server you can manage so you can pick which ones Vertigo protects."
        ),
        h(
          "button",
          {
            class: "btn-primary",
            onclick: async () => {
              try {
                const r = await api("/auth/discord/url?mode=link");
                location.href = r.url;
              } catch (err) {
                toast(err.message, "error");
              }
            },
          },
          "Continue with Discord"
        )
      )
    );
    return;
  }

  const listCard = h(
    "div",
    { class: "section-card" },
    h(
      "div",
      { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:16px" },
      h(
        "h3",
        { style: "font-family:Outfit;font-size:18px;font-weight:500" },
        "Your Discord servers"
      ),
      h("button", { class: "btn-ghost btn-sm", onclick: () => router() }, "↻ Refresh")
    )
  );
  root.appendChild(listCard);

  try {
    const guilds = await api("/discord/guilds");
    if (!guilds.length) {
      listCard.appendChild(
        h(
          "p",
          { class: "muted" },
          "No manageable servers found. You need Manage Server permission."
        )
      );
      return;
    }
    guilds.forEach((g) => {
      const row = h(
        "div",
        { class: "srow reveal" },
        h(
          "div",
          { style: "display:flex;align-items:center;gap:12px;min-width:0" },
          g.icon
            ? h("img", {
                src: g.icon,
                style: "width:40px;height:40px;border-radius:10px;object-fit:cover",
              })
            : h(
                "div",
                { class: "server-av", style: "width:40px;height:40px" },
                g.name.slice(0, 2).toUpperCase()
              ),
          h(
            "div",
            {},
            h(
              "div",
              { class: "srow-title" },
              g.name,
              g.owner
                ? h("span", { class: "badge-pro", style: "margin-left:8px;font-size:9px" }, "OWNER")
                : ""
            ),
            h(
              "div",
              { class: "srow-desc" },
              g.approximate_member_count ? `${g.approximate_member_count} members` : ""
            )
          )
        ),
        g.already_added
          ? h("span", { class: "muted small" }, "✓ Already added")
          : h(
              "button",
              {
                class: "btn-primary btn-sm",
                onclick: async (e) => {
                  e.target.disabled = true;
                  e.target.textContent = "Adding…";
                  try {
                    const added = await api("/servers", {
                      method: "POST",
                      body: {
                        discord_guild_id: g.id,
                        name: g.name,
                        icon: g.icon,
                        member_count: g.approximate_member_count || 0,
                      },
                    });
                    toast(`${g.name} added!`, "success");
                    await loadServers();
                    state.activeServerId = added.id;
                    try {
                      const inv = await api(`/bot/invite-url?guild_id=${g.id}`);
                      window.open(inv.url, "_blank");
                    } catch {}
                    location.hash = "#/dashboard";
                  } catch (err) {
                    toast(err.message, "error");
                    e.target.disabled = false;
                    e.target.textContent = "Add";
                  }
                },
              },
              "+ Add"
            )
      );
      listCard.appendChild(row);
    });
    setupReveals(listCard);
  } catch (err) {
    listCard.appendChild(
      h("p", { class: "muted" }, "Failed to load Discord servers: ", err.message)
    );
  }
}

/* -------- PAGE: OVERVIEW (with realtime polling) -------- */
async function renderOverview(root) {
  const srv = activeServer();
  if (!srv) return;

  let stats = null,
    feed = [];
  try {
    stats = await api(`/servers/${srv.id}/stats`);
  } catch {}

  // If bot isn't in the server, show waiting state (not zeros)
  if (!stats?.bot_joined) {
    root.appendChild(
      h(
        "div",
        { class: "page-head" },
        h(
          "div",
          {},
          h("div", { class: "label-eyebrow" }, "waiting"),
          h("h1", { class: "page-title" }, srv.name),
          h(
            "p",
            { class: "page-sub" },
            "Vertigo is waiting for the bot to join your Discord server."
          )
        )
      )
    );
    root.appendChild(
      h(
        "div",
        { class: "section-card fade-up", style: "text-align:center;padding:64px 24px" },
        h(
          "div",
          {
            style:
              "font-size:48px;margin-bottom:12px;animation:shieldPulse 2.6s ease-in-out infinite;width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#5865F2,#3a45c8);display:flex;align-items:center;justify-content:center;margin:0 auto 24px",
          },
          h("span", {
            html: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="white" stroke-width="1.5"><path d="M12 2L4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6l-8-4z"/></svg>',
          })
        ),
        h(
          "h2",
          { class: "page-title", style: "margin:0" },
          "Invite the bot to start live monitoring"
        ),
        h(
          "p",
          { class: "page-sub", style: "margin:12px auto 24px;max-width:480px" },
          "Stats, member counts, raid detection, and commands all activate the moment Vertigo joins your server."
        ),
        h(
          "div",
          { class: "row gap-sm", style: "justify-content:center" },
          h(
            "button",
            { class: "btn-primary", onclick: () => inviteBot(srv.discord_guild_id) },
            "Invite Vertigo to ",
            srv.name
          ),
          h(
            "button",
            {
              class: "btn-ghost",
              onclick: async () => {
                try {
                  await api(`/servers/${srv.id}/sync`, { method: "POST" });
                  router();
                } catch (e) {
                  toast(e.message, "error");
                }
              },
            },
            "I've invited it · Refresh"
          )
        )
      )
    );
    // Poll for bot presence every 5s
    state.polling = setInterval(async () => {
      try {
        await api(`/servers/${srv.id}/sync`, { method: "POST" });
        const ns = await api(`/servers/${srv.id}/stats`);
        if (ns.bot_joined) {
          stopPolling();
          router();
        }
      } catch {}
    }, 5000);
    return;
  }

  // Bot IS joined — full live dashboard
  try {
    feed = (await api(`/notifications?server_id=${srv.id}`)).slice(0, 8);
  } catch {}

  const header = h(
    "div",
    { class: "page-head" },
    h(
      "div",
      {},
      h("div", { class: "label-eyebrow" }, "overview"),
      h("h1", { class: "page-title" }, srv.name),
      h("p", { class: "page-sub" }, "Live defense active · real-time monitoring")
    ),
    h(
      "div",
      { class: "badge" },
      h("span", { class: "pulse-dot-bg pulse-dot pulse-dot-lg" }),
      " SHIELDS UP"
    )
  );
  root.appendChild(header);

  const statCfg = [
    ["Nukes blocked", stats?.raids_blocked ?? 0, "All time", "#5865F2", ICON.shield, "raids"],
    ["Backups", stats?.backups_count ?? 0, "Restorable snapshots", "#22D3EE", ICON.save, "backups"],
    ["Commands", stats?.commands_run ?? 0, "Executed total", "#F59E0B", ICON.term, "commands"],
    [
      "Uptime",
      `${stats?.uptime_pct ?? 0}%`,
      "Bot online",
      "#10B981",
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      "uptime",
    ],
  ];
  const grid = h("div", { class: "grid-stats" });
  statCfg.forEach(([label, val, sub, color, ico, key]) => {
    grid.appendChild(
      h(
        "div",
        { class: "stat-card hover-lift reveal", "data-stat": key },
        h(
          "div",
          { class: "top" },
          h(
            "div",
            { class: "stat-ico", style: `background:${color}1A;color:${color}` },
            h("span", { html: ico })
          )
        ),
        h("div", { class: "stat-val" }, String(val)),
        h("div", { class: "label-eyebrow", style: "margin-top:4px" }, label),
        h("div", { class: "stat-sub" }, sub)
      )
    );
  });
  root.appendChild(grid);

  // Chart + pulse
  const grid21 = h("div", { class: "grid-2-1" });
  grid21.appendChild(
    h(
      "div",
      { class: "chart-card reveal" },
      h(
        "div",
        { class: "chart-head" },
        h("div", { class: "label-eyebrow" }, "7-day defense"),
        h("h3", {}, "Threat activity")
      ),
      h("div", { class: "chart-wrap", id: "chartWrap" })
    )
  );

  const pulseCard = h(
    "div",
    { class: "pulse-card reveal" },
    h("div", { class: "label-eyebrow" }, "members · live"),
    h(
      "h3",
      {
        style:
          "font-family:Outfit;font-size:18px;font-weight:500;margin:4px 0 16px;display:flex;align-items:center;gap:8px",
      },
      "Server pulse",
      h("span", { class: "pulse-dot-bg pulse-dot" })
    ),
    h(
      "div",
      { class: "pulse-item" },
      h("span", {
        html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22D3EE" stroke-width="1.7"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>',
      }),
      h(
        "div",
        {},
        h("div", { class: "stat-val", "data-slot": "members" }, String(stats?.members ?? 0)),
        h("div", { class: "label-eyebrow" }, "Total members")
      )
    ),
    h(
      "div",
      { class: "pulse-item" },
      h("span", { class: "pulse-dot-bg pulse-dot pulse-dot-lg" }),
      h(
        "div",
        {},
        h("div", { class: "stat-val", "data-slot": "online" }, String(stats?.online ?? 0)),
        h("div", { class: "label-eyebrow" }, "Online now")
      )
    ),
    h("hr", { style: "border:0;border-top:1px solid var(--border);margin:20px 0" }),
    h(
      "div",
      { class: "setting-row" },
      h("span", { class: "muted" }, "Verification:"),
      h("span", { class: "val" }, "MEDIUM")
    ),
    h(
      "div",
      { class: "setting-row" },
      h("span", { class: "muted" }, "Last sync:"),
      h(
        "span",
        { class: "val", "data-slot": "last-sync" },
        stats?.last_synced_at ? new Date(stats.last_synced_at).toLocaleTimeString() : "—"
      )
    )
  );
  grid21.appendChild(pulseCard);
  root.appendChild(grid21);

  const feedBody = h("div", { class: "feed-list", "data-slot": "feed" });
  renderFeed(feedBody, feed);
  root.appendChild(
    h(
      "div",
      { class: "feed-card reveal" },
      h(
        "div",
        {
          style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:16px",
        },
        h(
          "div",
          {},
          h("div", { class: "label-eyebrow" }, "live feed"),
          h(
            "h3",
            {
              style:
                "font-family:Outfit;font-size:18px;font-weight:500;margin:4px 0 0;display:flex;align-items:center;gap:8px",
            },
            "Recent events",
            h("span", { class: "pulse-dot-bg pulse-dot", style: "width:6px;height:6px" })
          )
        ),
        h("a", { href: "#/notifications", style: "font-size:12px;color:var(--cyan)" }, "View all →")
      ),
      feedBody
    )
  );

  setTimeout(() => drawChart(stats?.activity || []), 50);

  // === Realtime polling every 5s ===
  let lastSeen = feed[0]?.created_at || null;
  state.polling = setInterval(async () => {
    try {
      // Actively sync member counts from Discord
      await api(`/servers/${srv.id}/sync`, { method: "POST" });
      const ns = await api(`/servers/${srv.id}/stats`);
      if (!ns.bot_joined) {
        stopPolling();
        router();
        return;
      }
      const applyTick = (slot, val) => {
        const el = $(`[data-stat="${slot}"] .stat-val`) || $(`[data-slot="${slot}"]`);
        if (el && el.textContent !== String(val)) {
          el.textContent = String(val);
          el.classList.remove("num-tick");
          void el.offsetWidth;
          el.classList.add("num-tick");
        }
      };
      applyTick("raids", ns.raids_blocked);
      applyTick("backups", ns.backups_count);
      applyTick("commands", ns.commands_run);
      applyTick("uptime", `${ns.uptime_pct}%`);
      applyTick("members", ns.members);
      applyTick("online", ns.online);
      const ls = $('[data-slot="last-sync"]');
      if (ls && ns.last_synced_at)
        ls.textContent = new Date(ns.last_synced_at).toLocaleTimeString();
      if (lastSeen) {
        const fresh = await api(
          `/notifications?server_id=${srv.id}&since=${encodeURIComponent(lastSeen)}`
        );
        if (fresh.length) {
          lastSeen = fresh[0].created_at;
          const all = [...fresh, ...feed].slice(0, 8);
          feed = all;
          renderFeed(
            feedBody,
            feed,
            fresh.map((n) => n.id)
          );
        }
      }
    } catch {}
  }, 5000);
}

function renderFeed(container, feed, newIds = []) {
  container.innerHTML = "";
  if (!feed.length) {
    container.appendChild(h("p", { class: "muted" }, "No events yet."));
    return;
  }
  feed.forEach((n) => {
    const sevColor =
      n.severity === "critical"
        ? "#EF4444"
        : n.severity === "warning"
          ? "#F59E0B"
          : n.severity === "success"
            ? "#10B981"
            : "#A1A1AA";
    const t = new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    container.appendChild(
      h(
        "div",
        { class: `feed-item ${newIds.includes(n.id) ? "new" : ""}` },
        h("span", { class: "t" }, `[${t}]`),
        h("span", { class: "sev", style: `color:${sevColor}` }, `[${n.severity.toUpperCase()}]`),
        h("span", { class: "msg" }, `${n.title} — ${n.message}`)
      )
    );
  });
}

function drawChart(data) {
  const wrap = document.getElementById("chartWrap");
  if (!wrap || !data.length) return;
  const w = wrap.clientWidth || 600,
    hgt = 240;
  const padL = 36,
    padR = 12,
    padT = 16,
    padB = 28;
  const max = Math.max(...data.map((d) => d.threats_blocked), 5);
  const stepX = (w - padL - padR) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => [
    padL + i * stepX,
    hgt - padB - (d.threats_blocked / max) * (hgt - padT - padB),
  ]);
  const path = points
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const areaPath =
    path + ` L${points[points.length - 1][0]},${hgt - padB} L${padL},${hgt - padB} Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((v) => padT + v * (hgt - padT - padB));
  wrap.innerHTML = `<svg viewBox="0 0 ${w} ${hgt}" width="100%" height="${hgt}" preserveAspectRatio="none">
    <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5865F2" stop-opacity=".5"/><stop offset="100%" stop-color="#5865F2" stop-opacity="0"/></linearGradient></defs>
    ${gridY.map((y) => `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#27272A" stroke-width="1"/>`).join("")}
    <path d="${areaPath}" fill="url(#ga)"/>
    <path d="${path}" fill="none" stroke="#5865F2" stroke-width="2"/>
    ${data.map((d, i) => `<text x="${padL + i * stepX}" y="${hgt - padB + 16}" fill="#71717A" font-size="11" text-anchor="middle" font-family="JetBrains Mono">${d.date.slice(5)}</text>`).join("")}
  </svg>`;
}

/* -------- PAGE: PROTECTION -------- */
async function renderProtection(root) {
  const srv = activeServer();
  if (!srv) return;
  let s;
  try {
    s = await api(`/servers/${srv.id}/settings`);
  } catch {
    toast("Failed to load", "error");
    return;
  }
  const toggle = (key) => {
    const btn = h("button", { class: `toggle ${s[key] ? "on" : ""}` });
    btn.addEventListener("click", () => {
      s[key] = !s[key];
      btn.classList.toggle("on");
    });
    return btn;
  };
  const row = (title, desc, ctrl) =>
    h(
      "div",
      { class: "srow" },
      h(
        "div",
        { class: "srow-label" },
        h("div", { class: "srow-title" }, title),
        desc && h("div", { class: "srow-desc" }, desc)
      ),
      h("div", {}, ctrl)
    );
  const sec = (ico, title, ...rows) =>
    h(
      "div",
      { class: "section-card reveal" },
      h(
        "div",
        { class: "section-head" },
        h("div", { class: "section-ico" }, h("span", { html: ico })),
        h("h3", {}, title)
      ),
      ...rows
    );

  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "defense matrix"),
        h("h1", { class: "page-title" }, "Server Protection"),
        h("p", { class: "page-sub" }, `Configure how Vertigo defends ${srv.name}.`)
      ),
      h(
        "button",
        {
          class: "btn-primary",
          onclick: async (e) => {
            e.target.disabled = true;
            e.target.textContent = "Saving…";
            try {
              const { id, server_id, updated_at, ...payload } = s;
              await api(`/servers/${srv.id}/settings`, { method: "PUT", body: payload });
              toast("Settings saved", "success");
            } catch (err) {
              toast(err.message, "error");
            } finally {
              e.target.disabled = false;
              e.target.textContent = "Save changes";
            }
          },
        },
        "Save changes"
      )
    )
  );
  root.appendChild(
    sec(
      ICON.shield,
      "Anti-Nuke Engine",
      row("Anti-Nuke", "Block mass destructive actions.", toggle("anti_nuke")),
      row("Anti Mass-Ban", "Quarantine mass-ban attempts.", toggle("anti_mass_ban")),
      row("Anti Mass-Kick", "Stop kick floods.", toggle("anti_mass_kick")),
      row("Anti Channel-Delete", "Prevent channel deletions.", toggle("anti_channel_delete")),
      row("Anti Role-Delete", "Block role deletions.", toggle("anti_role_delete")),
      row("Anti Webhook-Spam", "Stop webhook abuse.", toggle("anti_webhook_spam"))
    )
  );
  const sel = h("select", { class: "select" });
  ["low", "medium", "high", "paranoid"].forEach((v) => {
    const o = h("option", { value: v }, v[0].toUpperCase() + v.slice(1));
    if (v === s.verification_level) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener("change", (e) => (s.verification_level = e.target.value));
  const sensRange = h("input", {
    type: "range",
    min: "0",
    max: "100",
    value: s.raid_sensitivity,
    class: "range",
  });
  const sensRow = row(
    `Raid sensitivity (${s.raid_sensitivity})`,
    "Higher = more aggressive auto-actions.",
    sensRange
  );
  sensRange.addEventListener("input", (e) => {
    s.raid_sensitivity = parseInt(e.target.value);
    sensRow.querySelector(".srow-title").textContent = `Raid sensitivity (${s.raid_sensitivity})`;
  });
  const maxJoins = h("input", {
    type: "number",
    min: "1",
    max: "500",
    value: s.max_joins_per_minute,
    class: "number-input",
  });
  maxJoins.addEventListener(
    "input",
    (e) => (s.max_joins_per_minute = parseInt(e.target.value || "1"))
  );
  root.appendChild(
    sec(
      ICON.lock,
      "Raid & Verification",
      row("Anti-Raid", "Catch join floods.", toggle("anti_raid")),
      row("Auto-lockdown", "Lock during threats.", toggle("auto_lockdown")),
      row("Verification level", null, sel),
      sensRow,
      row("Max joins / minute", null, maxJoins),
      row(
        "Auto-ban new accounts",
        `Ban accounts <${s.new_account_threshold_days} days.`,
        toggle("auto_ban_new_accounts")
      )
    )
  );
  root.appendChild(
    sec(
      ICON.bell,
      "Notifications",
      row("Alert on raid", "Push critical alerts.", toggle("notify_on_raid"))
    )
  );
}

/* -------- PAGE: BACKUPS -------- */
async function renderBackups(root) {
  const srv = activeServer();
  if (!srv) return;
  const list = await api(`/servers/${srv.id}/backups`).catch(() => []);
  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "snapshots"),
        h("h1", { class: "page-title" }, "Backups"),
        h("p", { class: "page-sub" }, "Save complete server states. Restore when disaster strikes.")
      )
    )
  );
  const nameI = h("input", { class: "input", placeholder: "Snapshot name" });
  const descI = h("input", { class: "input", placeholder: "Description (optional)" });
  const makeBtn = h("button", { class: "btn-primary" }, "Create snapshot");
  makeBtn.addEventListener("click", async () => {
    if (!nameI.value.trim()) return toast("Name required", "error");
    makeBtn.disabled = true;
    try {
      await api(`/servers/${srv.id}/backups`, {
        method: "POST",
        body: { name: nameI.value, server_id: srv.id, description: descI.value || null },
      });
      toast("Saved", "success");
      router();
    } catch (err) {
      toast(err.message, "error");
      makeBtn.disabled = false;
    }
  });
  root.appendChild(
    h(
      "div",
      { class: "section-card reveal" },
      h(
        "h3",
        { style: "font-family:Outfit;font-size:18px;font-weight:500;margin-bottom:12px" },
        "+ Create snapshot"
      ),
      h("div", { class: "create-row" }, nameI, descI, makeBtn)
    )
  );
  const card = h("div", { class: "table-card reveal" });
  card.appendChild(
    h(
      "div",
      { class: "table-head" },
      h("h3", {}, "All snapshots"),
      h("span", { class: "count" }, `${list.length} total`)
    )
  );
  if (!list.length) card.appendChild(h("div", { class: "empty" }, "No backups yet."));
  else {
    const tbl = h("table", { class: "ttable" });
    tbl.appendChild(
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("th", {}, "Name"),
          h("th", {}, "Channels"),
          h("th", {}, "Roles"),
          h("th", {}, "Created"),
          h("th", { style: "text-align:right" }, "Actions")
        )
      )
    );
    const tbody = h("tbody", {});
    list.forEach((b) =>
      tbody.appendChild(
        h(
          "tr",
          {},
          h(
            "td",
            {},
            h("div", { style: "font-weight:500" }, b.name),
            b.description
              ? h("div", { style: "font-size:11px;color:var(--muted)" }, b.description)
              : ""
          ),
          h("td", { class: "muted" }, String(b.channels_count)),
          h("td", { class: "muted" }, String(b.roles_count)),
          h(
            "td",
            { class: "muted", style: "font-size:12px" },
            new Date(b.created_at).toLocaleString()
          ),
          h(
            "td",
            { style: "text-align:right" },
            h(
              "div",
              { class: "row-actions" },
              h(
                "button",
                {
                  class: "action-btn cyan",
                  onclick: async () => {
                    try {
                      await api(`/servers/${srv.id}/backups/${b.id}/restore`, { method: "POST" });
                      toast("Restore queued", "success");
                    } catch (e) {
                      toast(e.message, "error");
                    }
                  },
                },
                h("span", { html: ICON.rotate })
              ),
              h(
                "button",
                {
                  class: "action-btn red",
                  onclick: async () => {
                    try {
                      await api(`/servers/${srv.id}/backups/${b.id}`, { method: "DELETE" });
                      router();
                    } catch (e) {
                      toast(e.message, "error");
                    }
                  },
                },
                h("span", { html: ICON.trash })
              )
            )
          )
        )
      )
    );
    tbl.appendChild(tbody);
    card.appendChild(tbl);
  }
  root.appendChild(card);
}

/* -------- PAGE: NOTIFICATIONS -------- */
async function renderNotificationsPage(root) {
  let filter = "all";
  const srv = activeServer();
  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "alerts log"),
        h("h1", { class: "page-title" }, "Notifications"),
        h("p", { class: "page-sub" }, "Every defensive action, in one place.")
      ),
      h(
        "button",
        {
          class: "btn-ghost",
          onclick: async () => {
            try {
              await api("/notifications/mark-all-read", { method: "POST" });
              toast("All marked", "success");
              redraw();
            } catch (e) {
              toast(e.message, "error");
            }
          },
        },
        h("span", { html: ICON.check }),
        " Mark all read"
      )
    )
  );
  const filtersWrap = h("div", { class: "filters" });
  const listCard = h("div", { class: "table-card reveal" });
  const redraw = async () => {
    filtersWrap.innerHTML = "";
    ["all", "critical", "warning", "info", "success"].forEach((f) =>
      filtersWrap.appendChild(
        h(
          "button",
          {
            class: `filter-chip ${filter === f ? "active" : ""}`,
            onclick: () => {
              filter = f;
              redraw();
            },
          },
          f
        )
      )
    );
    const q = filter === "all" ? "" : `?severity=${filter}`;
    const items = await api(`/notifications${q}`).catch(() => []);
    listCard.innerHTML = "";
    if (!items.length) {
      listCard.appendChild(h("div", { class: "empty" }, "All quiet."));
      return;
    }
    const sevMap = { critical: "#EF4444", warning: "#F59E0B", info: "#A1A1AA", success: "#10B981" };
    items.forEach((n) => {
      const color = sevMap[n.severity] || "#A1A1AA";
      listCard.appendChild(
        h(
          "div",
          { class: `notif-item ${!n.read ? "unread" : ""}` },
          h(
            "div",
            {
              class: "notif-ico",
              style: `background:${color}1A;border-color:${color}40;color:${color}`,
            },
            h("span", {
              html: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>',
            })
          ),
          h(
            "div",
            { class: "notif-body" },
            h(
              "div",
              { class: "notif-meta" },
              h("span", { class: "notif-sev", style: `color:${color}` }, n.severity),
              !n.read ? h("span", { class: "notif-dot" }) : "",
              h("span", { class: "notif-title" }, n.title)
            ),
            h("p", { class: "notif-msg" }, n.message),
            h("div", { class: "notif-time" }, new Date(n.created_at).toLocaleString())
          ),
          !n.read
            ? h(
                "button",
                {
                  class: "mark-read",
                  onclick: async () => {
                    try {
                      await api(`/notifications/${n.id}`, { method: "PUT", body: { read: true } });
                      redraw();
                    } catch {}
                  },
                },
                "Mark read"
              )
            : ""
        )
      );
    });
  };
  root.appendChild(filtersWrap);
  root.appendChild(listCard);
  redraw();
}

/* -------- PAGE: COMMANDS -------- */
async function renderCommands(root) {
  const srv = activeServer();
  if (!srv) return;
  const COMMANDS = [
    ["ban", "Ban", "Ban permanently", true],
    ["kick", "Kick", "Kick from server", true],
    ["mute", "Mute", "Mute a member", true],
    ["unmute", "Unmute", "Lift mute", true],
    ["warn", "Warn", "Formal warning", true],
    ["purge", "Purge", "Delete recent messages", false],
    ["lockdown", "Lockdown", "Lock server", false],
    ["unlock", "Unlock", "Lift lockdown", false],
    ["raid_mode_on", "Raid ON", "Max protection", false],
    ["raid_mode_off", "Raid OFF", "Normal", false],
  ];
  let selected = COMMANDS[0];
  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "terminal"),
        h("h1", { class: "page-title" }, "Commands"),
        h(
          "p",
          { class: "page-sub" },
          srv.bot_joined
            ? "Commands execute on your Discord server in real-time."
            : "Bot offline — commands will simulate. Invite Vertigo to execute them for real."
        )
      )
    )
  );
  const layout = h("div", {
    style: `display:grid;grid-template-columns:${window.innerWidth > 1024 ? "2fr 1fr" : "1fr"};gap:20px`,
  });
  const runnerCard = h("div", { class: "section-card reveal" });
  const cmdGrid = h("div", { class: "cmd-grid" });
  const descLine = h("p", { class: "cmd-desc" });
  const targetI = h("input", { class: "input", placeholder: "Target user (ID or @mention)" });
  const reasonI = h("input", { class: "input", placeholder: "Reason (optional)" });
  const targetWrap = h("div", {}, targetI);
  const runBtn = h("button", { class: "btn-primary" }, h("span", { html: ICON.send }), " Execute");
  const drawButtons = () => {
    cmdGrid.innerHTML = "";
    COMMANDS.forEach((c) =>
      cmdGrid.appendChild(
        h(
          "button",
          {
            class: `cmd-btn ${selected[0] === c[0] ? "active" : ""}`,
            onclick: () => {
              selected = c;
              drawButtons();
            },
          },
          c[1]
        )
      )
    );
    descLine.textContent = `/${selected[0]} — ${selected[2]}`;
    targetWrap.style.display = selected[3] ? "" : "none";
  };
  drawButtons();
  runBtn.addEventListener("click", async () => {
    if (selected[3] && !targetI.value.trim()) return toast("Target required", "error");
    runBtn.disabled = true;
    try {
      await api("/commands/run", {
        method: "POST",
        body: {
          server_id: srv.id,
          command: selected[0],
          target: targetI.value || null,
          reason: reasonI.value || null,
        },
      });
      toast(`${selected[1]} sent`, "success");
      targetI.value = "";
      reasonI.value = "";
      drawHistory();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      runBtn.disabled = false;
    }
  });
  runnerCard.appendChild(cmdGrid);
  runnerCard.appendChild(descLine);
  runnerCard.appendChild(
    h(
      "div",
      { style: "display:flex;flex-direction:column;gap:12px" },
      targetWrap,
      reasonI,
      h("div", {}, runBtn)
    )
  );
  const histCard = h(
    "div",
    { class: "section-card reveal" },
    h(
      "div",
      { class: "section-head" },
      h("div", { class: "section-ico" }, h("span", { html: ICON.rotate })),
      h("h3", {}, "History")
    )
  );
  const histBody = h("div", { class: "cmd-history" });
  histCard.appendChild(histBody);
  const drawHistory = async () => {
    histBody.innerHTML = "";
    try {
      const items = await api(`/commands/history?server_id=${srv.id}`);
      if (!items.length)
        return histBody.appendChild(h("p", { class: "muted" }, "No commands yet."));
      items.forEach((it) =>
        histBody.appendChild(
          h(
            "div",
            { class: "cmd-log" },
            h(
              "div",
              {},
              h("span", { class: "cmd" }, `/${it.command}`),
              it.target ? h("span", { class: "tgt" }, ` @${it.target}`) : "",
              h(
                "span",
                {
                  style: `float:right;font-size:10px;color:${it.status === "executed" ? "#10B981" : it.status === "pending" ? "#F59E0B" : "#71717A"}`,
                },
                it.status
              )
            ),
            it.reason ? h("div", { class: "reason" }, `— ${it.reason}`) : "",
            h("div", { class: "ts" }, new Date(it.executed_at).toLocaleString())
          )
        )
      );
    } catch {}
  };
  drawHistory();
  layout.appendChild(runnerCard);
  layout.appendChild(histCard);
  root.appendChild(layout);
}

/* -------- PAGE: SETTINGS -------- */
function renderSettings(root) {
  const u = state.user;
  root.appendChild(
    h(
      "div",
      { class: "page-head" },
      h(
        "div",
        {},
        h("div", { class: "label-eyebrow" }, "account"),
        h("h1", { class: "page-title" }, "Settings"),
        h("p", { class: "page-sub" }, "Manage your profile and subscription.")
      )
    )
  );
  // Profile avatar: Discord avatar if linked, else "?"
  const av =
    u?.discord_linked && u?.avatar
      ? h(
          "div",
          { class: "user-av", style: "width:64px;height:64px;font-size:24px" },
          h("img", { src: u.avatar })
        )
      : h(
          "div",
          { class: "user-av", style: "width:64px;height:64px;font-size:28px;font-weight:500" },
          "?"
        );
  root.appendChild(
    h(
      "div",
      { class: "section-card reveal" },
      h(
        "h3",
        { style: "font-family:Outfit;font-size:18px;font-weight:500;margin-bottom:20px" },
        "Profile"
      ),
      h(
        "div",
        { style: "display:flex;align-items:center;gap:20px;margin-bottom:24px" },
        av,
        h(
          "div",
          {},
          h(
            "div",
            {
              style:
                "font-family:Outfit;font-size:24px;font-weight:500;display:flex;align-items:center;gap:8px",
            },
            u?.username || "—",
            u?.premium_tier ? h("span", { class: "badge-pro", style: "font-size:10px" }, "PRO") : ""
          ),
          h(
            "div",
            { class: "muted", style: "font-size:12px;font-family:JetBrains Mono;margin-top:4px" },
            `member since ${u?.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}`
          )
        )
      ),
      h(
        "div",
        { class: "setting-row" },
        h("span", { class: "muted" }, "Email"),
        h("span", { class: "val" }, u?.email || "—")
      ),
      h(
        "div",
        { class: "setting-row" },
        h("span", { class: "muted" }, "Username"),
        h("span", { class: "val" }, u?.username || "—")
      ),
      h(
        "div",
        { class: "setting-row" },
        h("span", { class: "muted" }, "Account ID"),
        h("span", { class: "val", style: "font-size:11px" }, u?.id || "—")
      ),
      h(
        "div",
        { class: "setting-row" },
        h("span", { class: "muted" }, "Discord linked"),
        u?.discord_linked
          ? h("span", { class: "val", style: "color:#10B981" }, "✓ Connected")
          : h("span", { class: "val", style: "color:#F59E0B" }, "— Not linked")
      ),
      u?.discord_id
        ? h(
            "div",
            { class: "setting-row" },
            h("span", { class: "muted" }, "Discord ID"),
            h("span", { class: "val" }, u.discord_id)
          )
        : "",
      !u?.discord_linked
        ? h(
            "button",
            {
              class: "btn-primary btn-sm",
              style: "margin-top:16px",
              onclick: async () => {
                try {
                  const r = await api("/auth/discord/url?mode=link");
                  location.href = r.url;
                } catch (e) {
                  toast(e.message, "error");
                }
              },
            },
            "Link Discord account"
          )
        : ""
    )
  );
  root.appendChild(
    h(
      "div",
      { class: "section-card reveal" },
      h(
        "div",
        {
          style:
            "display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px",
        },
        h(
          "div",
          {},
          h(
            "h3",
            {
              style:
                "font-family:Outfit;font-size:18px;font-weight:500;display:flex;align-items:center;gap:8px",
            },
            h("span", { html: ICON.crown, style: "color:#F59E0B" }),
            " Subscription"
          ),
          h(
            "p",
            { class: "muted", style: "font-size:14px;margin-top:4px" },
            u?.premium_tier ? "You're on Vertigo Pro." : "Free plan."
          )
        ),
        h(
          "a",
          { href: "#/pricing", class: "btn-primary btn-sm" },
          u?.premium_tier ? "Manage" : "Upgrade"
        )
      )
    )
  );
}

/* -------- PRICING (3 tiers: Free / Plus / Pro in GBP) -------- */
async function renderPricing() {
  await loadUser();

  const wrap = h("div", { class: "pricing-page" });

  // Header with brand + back link
  wrap.appendChild(
    h(
      "header",
      { class: "glass-bar sticky" },
      h(
        "div",
        { class: "container nav" },
        h(
          "a",
          { href: "#/", class: "brand" },
          h("span", { class: "logo-box", html: ICON.shield }),
          "Vertigo"
        ),
        h(
          "a",
          {
            href: state.user ? "#/dashboard" : "#/",
            class: "text-link",
          },
          "← Back"
        )
      )
    )
  );

  // Tier feature lists
  const TIERS = [
    {
      key: "free",
      name: "Vertigo Free",
      price: "0",
      suffix: "/forever",
      eyebrow: "free",
      description: "Everything you need to get started.",
      checkColor: "var(--success)",
      features: [
        "Anti-nuke core (mass ban, kick, channel/role delete)",
        "Raid detection bundled in",
        "3 backups per server",
        "Real-time alerts",
        "Basic dashboard",
        "Community support",
      ],
      cta: { label: "Use Free", href: state.user ? "#/dashboard" : "#/signup", ghost: true },
    },
    {
      key: "plus",
      name: "Vertigo Plus",
      price: "2.99",
      suffix: "/month",
      eyebrow: "plus",
      description: "More snapshots, more control, personal alerts.",
      checkColor: "#a8b0ff",
      features: [
        "Everything in Free",
        "25 backups per server",
        "DM + email alerts",
        "Custom verification rules",
        "Up to 10 servers",
        "Priority support queue",
      ],
      cta: { label: "Upgrade to Plus", plan: "plus" },
    },
    {
      key: "pro",
      name: "Vertigo Pro",
      price: "9.99",
      suffix: "/month",
      eyebrow: "pro",
      description: "Maximum protection for serious communities.",
      checkColor: "var(--cyan)",
      features: [
        "Everything in Plus",
        "Unlimited backups",
        "Advanced raid heuristics",
        "Priority defense queue",
        "Webhook alerts",
        "Up to 50 servers",
        "Priority 24/7 support",
      ],
      cta: { label: "Upgrade to Pro", plan: "pro" },
      tracing: true,
    },
  ];

  const body = h("section", { class: "section" });
  const inner = h("div", { class: "container center" });

  inner.appendChild(
    h(
      "div",
      { class: "max-w center reveal" },
      h("div", { class: "label-eyebrow" }, "pricing"),
      h(
        "h1",
        { class: "display-xl", style: "margin-top:12px" },
        "Three tiers.",
        h("br"),
        "One mission."
      ),
      h(
        "p",
        { class: "lead", style: "margin:20px auto 0" },
        "Billed in GBP. Cancel anytime. No card needed to start."
      )
    )
  );

  const grid = h("div", { class: "pricing-grid pricing-grid-3" });
  inner.appendChild(grid);
  body.appendChild(inner);
  wrap.appendChild(body);

  const buildUpgradeBtn = (plan) => {
    const label =
      state.user?.plan === plan
        ? `You're on ${PLAN_DISPLAY[plan]}`
        : `Upgrade to ${PLAN_DISPLAY[plan]}`;
    const btn = h(
      "button",
      {
        class: "btn-primary full",
        disabled: state.user?.plan === plan,
      },
      label
    );
    btn.addEventListener("click", async () => {
      if (!state.user) {
        location.hash = "#/login";
        return;
      }
      btn.disabled = true;
      btn.textContent = "Processing…";
      try {
        const order = await api("/payments/paypal/create-order", {
          method: "POST",
          body: { plan },
        });
        if (order.demo) {
          await api(`/payments/paypal/capture/${order.id}`, { method: "POST" });
          toast(`${PLAN_DISPLAY[plan]} activated (demo)`, "success");
          await loadUser();
          location.hash = "#/dashboard";
          return;
        }
        const link = order.links?.find?.((l) => l.rel === "approve")?.href;
        if (link) location.href = link;
        else toast("No approval link returned", "error");
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = label;
      }
    });
    return btn;
  };

  TIERS.forEach((tier) => {
    const card = h(
      "div",
      { class: "plan-card reveal" },
      h("div", { class: "label-eyebrow" }, tier.eyebrow),
      h(
        "div",
        { class: "plan-name" },
        tier.name,
        tier.key === "pro" ? h("span", { html: ICON.crown, style: "color:#F59E0B" }) : ""
      ),
      h(
        "div",
        { class: "plan-price" },
        h("span", { class: "amt" }, `${CURRENCY_SYMBOL}${tier.price}`),
        h("span", { class: "per" }, tier.suffix)
      ),
      h("p", { class: "muted", style: "font-size:14px" }, tier.description),
      h(
        "ul",
        { class: "plan-features" },
        ...tier.features.map((f) =>
          h("li", {}, h("span", { html: ICON.check, style: `color:${tier.checkColor}` }), f)
        )
      ),
      tier.cta.href
        ? h(
            "a",
            {
              href: tier.cta.href,
              class: tier.cta.ghost ? "btn-ghost" : "btn-primary full",
              style: "text-align:center;justify-content:center",
            },
            tier.cta.label
          )
        : buildUpgradeBtn(tier.cta.plan),
      tier.cta.plan
        ? h(
            "p",
            {
              class: "muted",
              style: "font-size:10px;text-align:center;margin-top:12px",
            },
            "Cancel anytime · Secure PayPal · Billed in GBP"
          )
        : ""
    );

    if (tier.tracing) {
      grid.appendChild(
        h(
          "div",
          { class: "tracing-border reveal" },
          h("div", { class: "tracing-inner" }, ...card.children)
        )
      );
    } else {
      grid.appendChild(card);
    }
  });

  $("#app").appendChild(wrap);
  setupReveals(wrap);
}

const PLAN_DISPLAY = { plus: "Plus", pro: "Pro" };

/* -------- Discord OAuth callback -------- */
async function handleDiscordCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (!code) return false;
  try {
    const r = await api("/auth/discord/callback", { method: "POST", body: { code } });
    token.set(r.access_token);
    state.user = r.user;
    toast(r.linked ? "Discord linked!" : "Signed in with Discord", "success");
    history.replaceState({}, "", location.pathname);
    location.hash =
      state.user.discord_linked && !state.servers.length ? "#/add-server" : "#/dashboard";
  } catch (err) {
    toast(err.message || "Discord login failed", "error");
    history.replaceState({}, "", location.pathname);
    location.hash = "#/login";
  }
  return true;
}

/* -------- Init -------- */
(async function init() {
  // Load Discord client_id so invite buttons work on mobile
  await loadConfig();
  await loadUser();
  if (state.user) await loadServers();
  const wasCb = await handleDiscordCallback();
  if (!wasCb) await router();
  window.addEventListener("hashchange", router);
})();
