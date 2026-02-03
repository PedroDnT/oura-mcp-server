export function getIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Oura Tools</title>
    <style>
      :root {
        --bg: #0b1020;
        --panel: #121a33;
        --panel2: #0f1730;
        --text: #e9ecf6;
        --muted: #9aa6c5;
        --brand: #6d7dff;
        --danger: #ff5c7a;
        --ok: #22c55e;
        --border: rgba(255, 255, 255, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text);
        background: radial-gradient(1200px 800px at 10% 10%, rgba(109,125,255,0.18), transparent 60%),
                    radial-gradient(900px 600px at 90% 30%, rgba(34,197,94,0.10), transparent 55%),
                    var(--bg);
      }
      header {
        padding: 28px 20px 18px;
        border-bottom: 1px solid var(--border);
        background: linear-gradient(to bottom, rgba(18,26,51,0.8), rgba(18,26,51,0.3));
        position: sticky;
        top: 0;
        backdrop-filter: blur(12px);
        z-index: 5;
      }
      .wrap { max-width: 1100px; margin: 0 auto; }
      h1 { margin: 0; font-size: 20px; letter-spacing: 0.2px; }
      .sub { margin-top: 6px; color: var(--muted); font-size: 13px; }
      main { padding: 22px 20px 40px; }
      .grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
      @media (min-width: 980px) { .grid { grid-template-columns: 1fr 1fr; } }
      .card {
        background: linear-gradient(180deg, rgba(18,26,51,0.92), rgba(15,23,48,0.92));
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      }
      .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; }
      input[type="password"], input[type="text"], select, textarea {
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.03);
        color: var(--text);
        padding: 10px 12px;
        outline: none;
      }
      textarea { min-height: 140px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
      button {
        border: 1px solid var(--border);
        background: rgba(109,125,255,0.14);
        color: var(--text);
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
      }
      button.primary { background: rgba(109,125,255,0.28); border-color: rgba(109,125,255,0.38); }
      button.danger { background: rgba(255,92,122,0.18); border-color: rgba(255,92,122,0.35); }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      .pill { font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); }
      .pill.ok { color: #a7f3d0; border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.10); }
      .pill.bad { color: #fecdd3; border-color: rgba(255,92,122,0.35); background: rgba(255,92,122,0.10); }
      .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
      .tab { padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: rgba(255,255,255,0.03); font-size: 12px; cursor: pointer; }
      .tab.active { background: rgba(109,125,255,0.18); border-color: rgba(109,125,255,0.32); }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: rgba(0,0,0,0.18);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
        max-height: 440px;
        overflow: auto;
        font-size: 12px;
        line-height: 1.45;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
      th, td { border-bottom: 1px solid var(--border); padding: 8px 8px; text-align: left; vertical-align: top; }
      th { color: var(--muted); font-weight: 600; }
      .muted { color: var(--muted); font-size: 12px; }
      .svg-wrap { overflow-x: auto; padding: 8px 0; }
      .note { margin-top: 10px; color: var(--muted); font-size: 12px; }
      .err { color: #fecdd3; }
      .ok { color: #a7f3d0; }
      .dash-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
      @media (min-width: 980px) { .dash-grid { grid-template-columns: 1fr 1fr; } }
      .dash-card { border: 1px solid var(--border); border-radius: 12px; padding: 12px; background: rgba(255,255,255,0.02); }
      .dash-card h3 { margin: 0 0 6px; font-size: 14px; }
      .dash-meta { color: var(--muted); font-size: 12px; margin-bottom: 8px; }
      .heatmap td { text-align: center; cursor: pointer; font-size: 11px; }
      .heatmap th { font-size: 11px; }
      .dash-detail { margin-top: 12px; padding: 12px; border: 1px dashed var(--border); border-radius: 12px; }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap">
        <h1>Oura MCP Web</h1>
        <div class="sub">Paste your Oura token, run tools, view tables/charts, and download JSON.</div>
      </div>
    </header>
    <main class="wrap">
      <div class="grid">
	        <section class="card">
	          <h2 style="margin:0 0 10px;font-size:15px;">1) Token</h2>
	          <div class="row" style="align-items:flex-end;">
	            <div style="flex:1; min-width: 240px;">
	              <label for="token">Oura access token</label>
	              <input id="token" type="password" placeholder="Paste token (stored in encrypted HttpOnly cookie)" />
	            </div>
	            <div class="row">
	              <button id="saveToken" class="primary">Save token</button>
	              <button id="clearToken" class="danger">Clear</button>
	            </div>
	          </div>
	          <div class="row" style="margin-top: 10px; justify-content: space-between;">
	            <div class="row">
	              <a id="oauthLink" href="/oauth/start" style="text-decoration:none;">
	                <button id="oauthBtn" type="button">Connect with Oura</button>
	              </a>
	              <a href="/oauth/logout" style="text-decoration:none;">
	                <button type="button" class="danger">Disconnect</button>
	              </a>
	            </div>
	            <div class="muted" id="oauthHint"></div>
	          </div>
	          <div style="margin-top: 10px" class="row">
	            <span id="tokenStatus" class="pill">Checking…</span>
	            <span id="oauthStatus" class="pill">OAuth: ?</span>
	            <span class="pill">Cookie session</span>
	            <span class="pill">Authorization header supported</span>
	          </div>
	          <div class="note">Tip: for programmatic calls use <code>Authorization: Bearer &lt;token&gt;</code> on <code>/mcp</code> or <code>/api/tools/call</code>.</div>
	        </section>

        <section class="card">
          <h2 style="margin:0 0 10px;font-size:15px;">2) Run a tool</h2>
          <div class="row">
            <div style="flex:1; min-width: 260px;">
              <label for="tool">Tool</label>
              <select id="tool"></select>
            </div>
            <div style="min-width: 220px;">
              <label for="format">Response format</label>
              <select id="format">
                <option value="markdown">markdown</option>
                <option value="json">json</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 12px;">
            <label for="guided">Guided (recommended for trends)</label>
            <div class="row">
              <div style="flex:1; min-width: 160px;">
                <input id="startDate" type="text" placeholder="start_date (YYYY-MM-DD)" />
              </div>
              <div style="flex:1; min-width: 160px;">
                <input id="endDate" type="text" placeholder="end_date (YYYY-MM-DD)" />
              </div>
              <div class="row" style="min-width: 220px;">
                <button id="fillAnalysis" type="button">Fill analyze defaults</button>
              </div>
            </div>
          </div>

          <div style="margin-top: 12px;">
            <label for="args">Advanced JSON arguments</label>
            <textarea id="args" spellcheck="false">{}</textarea>
          </div>
          <div class="row" style="margin-top: 12px; justify-content: space-between;">
            <div class="row">
              <button id="run" class="primary">Run</button>
              <button id="download" disabled>Download JSON</button>
            </div>
            <div class="muted" id="runMeta"></div>
          </div>
        </section>
      </div>

      <section class="card" style="margin-top: 14px;">
        <h2 style="margin:0 0 10px;font-size:15px;">3) Results</h2>
        <div class="tabs">
          <div class="tab active" data-tab="summary">Summary</div>
          <div class="tab" data-tab="tables">Tables</div>
          <div class="tab" data-tab="charts">Charts</div>
          <div class="tab" data-tab="dashboards">Dashboards</div>
          <div class="tab" data-tab="json">Raw JSON</div>
        </div>
        <div id="panelSummary" style="margin-top: 12px;">
          <pre id="summaryPre">Run a tool to see output.</pre>
        </div>
        <div id="panelTables" style="display:none; margin-top: 12px;"></div>
        <div id="panelCharts" style="display:none; margin-top: 12px;">
          <div class="muted">Charts appear when the result includes <code>series</code> data (especially from <code>oura_analyze_health_trends</code>).</div>
          <div id="chartsArea" class="svg-wrap"></div>
        </div>
        <div id="panelDashboards" style="display:none; margin-top: 12px;">
          <div class="note">Correlation ≠ causation. Use dashboards to spot patterns, not diagnose conditions.</div>
          <div id="dashboardsArea" class="dash-grid" style="margin-top: 10px;"></div>
          <div id="dashDetail" class="dash-detail muted">Click a heatmap cell or lag bar to inspect a scatter plot.</div>
        </div>
        <div id="panelJson" style="display:none; margin-top: 12px;">
          <pre id="jsonPre">{}</pre>
        </div>
      </section>

      <p class="note">Server endpoints: <code>GET /api/tools</code>, <code>POST /api/tools/call</code>, <code>POST /mcp</code>, <code>GET /health</code>.</p>
    </main>

    <script>
      const el = (id) => document.getElementById(id);
      const tokenStatus = el("tokenStatus");
      const oauthStatus = el("oauthStatus");
      const oauthHint = el("oauthHint");
      const oauthBtn = el("oauthBtn");
      const oauthLink = el("oauthLink");
      const toolSelect = el("tool");
      const argsArea = el("args");
      const formatSelect = el("format");
      const summaryPre = el("summaryPre");
      const jsonPre = el("jsonPre");
      const panelTables = el("panelTables");
      const chartsArea = el("chartsArea");
      const panelDashboards = el("panelDashboards");
      const dashboardsArea = el("dashboardsArea");
      const dashDetail = el("dashDetail");
      const runMeta = el("runMeta");
      const downloadBtn = el("download");

      let lastStructured = null;

      function setStatus(ok, text) {
        tokenStatus.textContent = text;
        tokenStatus.className = "pill " + (ok ? "ok" : "bad");
      }

      async function refreshTools() {
        const res = await fetch("/api/tools", { credentials: "include" });
        const data = await res.json();
        toolSelect.innerHTML = "";
        (data.tools || []).forEach((t) => {
          const opt = document.createElement("option");
          opt.value = t.name;
          opt.textContent = t.name;
          toolSelect.appendChild(opt);
        });
        toolSelect.value = "oura_analyze_health_trends";
      }

      async function checkToken() {
        const [healthRes, sessionRes] = await Promise.all([
          fetch("/health", { credentials: "include" }),
          fetch("/api/session", { credentials: "include" }),
        ]);
        const health = await healthRes.json().catch(() => ({}));
        const sess = await sessionRes.json().catch(() => ({}));

        const sessionSecretOk = !!health.session_secret_configured;
        const hasToken = !!sess.has_token;
        const source = sess.source || "none";
        const oauthConfigured = !!sess.oauth_configured;

        if (!sessionSecretOk) {
          setStatus(false, "Missing SESSION_SECRET");
        } else if (hasToken) {
          setStatus(true, "Connected (" + source + ")");
        } else {
          setStatus(true, "Session ready (no token)");
        }

        oauthStatus.textContent = oauthConfigured ? "OAuth: configured" : "OAuth: not configured";
        oauthStatus.className = "pill " + (oauthConfigured ? "ok" : "bad");
        oauthHint.textContent = oauthConfigured ? "" : "Set OURA_OAUTH_* env vars to enable login.";

        if (!oauthConfigured) {
          oauthBtn.disabled = true;
          oauthLink.setAttribute("aria-disabled", "true");
          oauthLink.style.pointerEvents = "none";
          oauthLink.style.opacity = "0.6";
        } else {
          oauthBtn.disabled = false;
          oauthLink.style.pointerEvents = "";
          oauthLink.style.opacity = "";
        }
      }

      function activeTab(name) {
        document.querySelectorAll(".tab").forEach((t) => {
          t.classList.toggle("active", t.dataset.tab === name);
        });
        el("panelSummary").style.display = name === "summary" ? "" : "none";
        panelTables.style.display = name === "tables" ? "" : "none";
        el("panelCharts").style.display = name === "charts" ? "" : "none";
        panelDashboards.style.display = name === "dashboards" ? "" : "none";
        el("panelJson").style.display = name === "json" ? "" : "none";
      }

      document.querySelectorAll(".tab").forEach((t) => {
        t.addEventListener("click", () => activeTab(t.dataset.tab));
      });

      el("fillAnalysis").addEventListener("click", () => {
        const start = el("startDate").value.trim();
        const end = el("endDate").value.trim();
        const args = {
          start_date: start || "2026-01-01",
          end_date: end || "2026-01-31",
          include_recommendations: true,
        };
        argsArea.value = JSON.stringify(args, null, 2);
        toolSelect.value = "oura_analyze_health_trends";
      });

      el("saveToken").addEventListener("click", async () => {
        const token = el("token").value;
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus(false, data.error || "Failed to save token");
          return;
        }
        el("token").value = "";
        await checkToken();
      });

      el("clearToken").addEventListener("click", async () => {
        await fetch("/api/session", { method: "DELETE", credentials: "include" });
        await checkToken();
      });

      function clearOutputs() {
        summaryPre.textContent = "";
        jsonPre.textContent = "{}";
        panelTables.innerHTML = "";
        chartsArea.innerHTML = "";
        dashboardsArea.innerHTML = "";
        dashDetail.textContent = "Click a heatmap cell or lag bar to inspect a scatter plot.";
        downloadBtn.disabled = true;
        lastStructured = null;
      }

      function renderTableFromValue(value, title) {
        const container = document.createElement("div");
        container.style.marginBottom = "14px";
        if (title) {
          const h = document.createElement("div");
          h.textContent = title;
          h.style.fontWeight = "600";
          h.style.margin = "4px 0 8px";
          container.appendChild(h);
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            const p = document.createElement("div");
            p.className = "muted";
            p.textContent = "Empty array.";
            container.appendChild(p);
            return container;
          }
          const cols = new Set();
          value.slice(0, 200).forEach((row) => {
            if (row && typeof row === "object" && !Array.isArray(row)) {
              Object.keys(row).forEach((k) => cols.add(k));
            }
          });
          const columns = Array.from(cols);
          const table = document.createElement("table");
          const thead = document.createElement("thead");
          const trh = document.createElement("tr");
          columns.forEach((c) => {
            const th = document.createElement("th");
            th.textContent = c;
            trh.appendChild(th);
          });
          thead.appendChild(trh);
          table.appendChild(thead);
          const tbody = document.createElement("tbody");
          value.slice(0, 200).forEach((row) => {
            const tr = document.createElement("tr");
            columns.forEach((c) => {
              const td = document.createElement("td");
              const v = row && typeof row === "object" ? row[c] : undefined;
              td.textContent = v === null || v === undefined ? "" : String(v);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          container.appendChild(table);
          if (value.length > 200) {
            const p = document.createElement("div");
            p.className = "muted";
            p.textContent = "Showing first 200 rows.";
            container.appendChild(p);
          }
          return container;
        }

        if (value && typeof value === "object") {
          const rows = Object.entries(value);
          const table = document.createElement("table");
          const tbody = document.createElement("tbody");
          rows.slice(0, 200).forEach(([k, v]) => {
            const tr = document.createElement("tr");
            const td1 = document.createElement("td");
            td1.style.color = "var(--muted)";
            td1.textContent = k;
            const td2 = document.createElement("td");
            td2.textContent =
              v === null || v === undefined
                ? ""
                : typeof v === "object"
                ? JSON.stringify(v)
                : String(v);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          container.appendChild(table);
          return container;
        }

        const p = document.createElement("div");
        p.textContent = String(value);
        container.appendChild(p);
        return container;
      }

      function renderTables(structured) {
        panelTables.innerHTML = "";
        if (!structured) return;

        // Prefer well-known slots.
        if (structured.raw && typeof structured.raw === "object") {
          panelTables.appendChild(renderTableFromValue(structured.raw.sleep, "raw.sleep"));
          panelTables.appendChild(renderTableFromValue(structured.raw.activity, "raw.activity"));
          panelTables.appendChild(renderTableFromValue(structured.raw.readiness, "raw.readiness"));
          panelTables.appendChild(renderTableFromValue(structured.raw.stress, "raw.stress"));
          panelTables.appendChild(renderTableFromValue(structured.raw.workouts, "raw.workouts"));
        } else {
          panelTables.appendChild(renderTableFromValue(structured, "structured"));
        }
      }

      function svgLineChart(series, width = 980, height = 260) {
        const pad = 34;
        const innerW = width - pad * 2;
        const innerH = height - pad * 2;
        const points = series.flatMap((s) => (s.points || []).map((p) => p)).filter((p) => p && typeof p.y === "number");
        if (points.length === 0) return null;

        const ys = points.map((p) => p.y);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);
        const ySpan = yMax - yMin || 1;

        const maxLen = Math.max(...series.map((s) => (s.points || []).length));
        const xForIndex = (i) => pad + (i / Math.max(1, maxLen - 1)) * innerW;
        const yForValue = (y) => pad + innerH - ((y - yMin) / ySpan) * innerH;
        const colors = ["#6d7dff", "#22c55e", "#f59e0b", "#ff5c7a", "#a78bfa", "#38bdf8"];

        const lines = [];
        // axes
        lines.push(\`<line x1="\${pad}" y1="\${pad}" x2="\${pad}" y2="\${pad + innerH}" stroke="rgba(255,255,255,0.25)" />\`);
        lines.push(\`<line x1="\${pad}" y1="\${pad + innerH}" x2="\${pad + innerW}" y2="\${pad + innerH}" stroke="rgba(255,255,255,0.25)" />\`);
        lines.push(\`<text x="\${pad}" y="\${pad - 10}" fill="rgba(255,255,255,0.65)" font-size="11">\${yMax.toFixed(0)}</text>\`);
        lines.push(\`<text x="\${pad}" y="\${pad + innerH + 18}" fill="rgba(255,255,255,0.65)" font-size="11">\${yMin.toFixed(0)}</text>\`);

        series.forEach((s, idx) => {
          const pts = (s.points || []).map((p, i) => ({ x: xForIndex(i), y: typeof p.y === "number" ? yForValue(p.y) : null })).filter((p) => p.y !== null);
          if (pts.length === 0) return;
          const d = pts.map((p, i) => (i === 0 ? \`M \${p.x} \${p.y}\` : \`L \${p.x} \${p.y}\`)).join(" ");
          const color = colors[idx % colors.length];
          lines.push(\`<path d="\${d}" fill="none" stroke="\${color}" stroke-width="2.2" />\`);
          lines.push(\`<text x="\${pad + innerW - 6}" y="\${pad + 14 + idx * 14}" text-anchor="end" fill="\${color}" font-size="11">\${escapeHtml(s.name || "series")}</text>\`);
        });

        return \`<svg width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}" role="img" aria-label="Chart">\${lines.join("")}</svg>\`;
      }

      function escapeHtml(s) {
        return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      }

      function renderCharts(structured) {
        chartsArea.innerHTML = "";
        const series = structured && structured.series;
        if (!Array.isArray(series) || series.length === 0) {
          chartsArea.innerHTML = '<div class="muted">No series data found.</div>';
          return;
        }
        const svg = svgLineChart(series);
        if (!svg) {
          chartsArea.innerHTML = '<div class="muted">No numeric points to chart.</div>';
          return;
        }
        chartsArea.innerHTML = svg;
      }

      function isNumber(v) {
        return typeof v === "number" && Number.isFinite(v);
      }

      function addDays(day, delta) {
        const d = new Date(day + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + delta);
        return d.toISOString().slice(0, 10);
      }

      function buildScatterPoints(rows, xKey, yKey, lag = 0) {
        const byDay = new Map(rows.map((r) => [r.day, r]));
        const points = [];
        rows.forEach((r) => {
          const target = byDay.get(addDays(r.day, lag));
          const x = r[xKey];
          const y = target ? target[yKey] : undefined;
          if (isNumber(x) && isNumber(y)) {
            points.push({ x, y, day: r.day });
          }
        });
        return points;
      }

      function renderScatterSvg(points, xLabel, yLabel) {
        if (!points.length) return '<div class="muted">No scatter points.</div>';
        const width = 420;
        const height = 260;
        const pad = 36;
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);
        const xSpan = xMax - xMin || 1;
        const ySpan = yMax - yMin || 1;
        const xFor = (x) => pad + ((x - xMin) / xSpan) * (width - pad * 2);
        const yFor = (y) => height - pad - ((y - yMin) / ySpan) * (height - pad * 2);
        const dots = points
          .map(
            (p) =>
              \`<circle cx="\${xFor(p.x).toFixed(1)}" cy="\${yFor(p.y).toFixed(1)}" r="3.3" fill="#6d7dff" opacity="0.85" />\`
          )
          .join("");
        return \`
          <svg width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}">
            <line x1="\${pad}" y1="\${height - pad}" x2="\${width - pad}" y2="\${height - pad}" stroke="rgba(255,255,255,0.25)" />
            <line x1="\${pad}" y1="\${pad}" x2="\${pad}" y2="\${height - pad}" stroke="rgba(255,255,255,0.25)" />
            <text x="\${pad}" y="\${height - 6}" fill="rgba(255,255,255,0.6)" font-size="11">\${xLabel || "x"}</text>
            <text x="\${pad}" y="\${pad - 8}" fill="rgba(255,255,255,0.6)" font-size="11">\${yLabel || "y"}</text>
            \${dots}
          </svg>
        \`;
      }

      function renderHistogram(bins) {
        if (!bins || bins.length === 0) return '<div class="muted">No histogram data.</div>';
        const width = 420;
        const height = 200;
        const pad = 28;
        const maxCount = Math.max(...bins.map((b) => b.count)) || 1;
        const barW = (width - pad * 2) / bins.length;
        const bars = bins
          .map((b, i) => {
            const h = (b.count / maxCount) * (height - pad * 2);
            const x = pad + i * barW;
            const y = height - pad - h;
            return \`<rect x="\${x.toFixed(1)}" y="\${y.toFixed(1)}" width="\${(barW - 2).toFixed(
              1
            )}" height="\${h.toFixed(1)}" fill="rgba(34,197,94,0.6)" />\`;
          })
          .join("");
        return \`
          <svg width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}">
            <line x1="\${pad}" y1="\${height - pad}" x2="\${width - pad}" y2="\${height - pad}" stroke="rgba(255,255,255,0.25)" />
            <line x1="\${pad}" y1="\${pad}" x2="\${pad}" y2="\${height - pad}" stroke="rgba(255,255,255,0.25)" />
            \${bars}
          </svg>
        \`;
      }

      function renderLagBars(lags, onClick) {
        if (!lags || !lags.length) return '<div class="muted">No lag data.</div>';
        const width = 420;
        const height = 200;
        const pad = 28;
        const maxAbs = Math.max(...lags.map((l) => Math.abs(l.r ?? 0))) || 1;
        const barW = (width - pad * 2) / lags.length;
        const bars = lags
          .map((l, i) => {
            const r = l.r ?? 0;
            const h = (Math.abs(r) / maxAbs) * (height - pad * 2);
            const x = pad + i * barW;
            const y = height / 2 - h / 2;
            const color = r >= 0 ? "rgba(109,125,255,0.7)" : "rgba(255,92,122,0.7)";
            return \`<rect data-lag="\${l.lag}" x="\${x.toFixed(1)}" y="\${y.toFixed(1)}" width="\${(barW - 2).toFixed(
              1
            )}" height="\${h.toFixed(1)}" fill="\${color}" />\`;
          })
          .join("");
        const svg = \`
          <svg class="lag-bars" width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}">
            <line x1="\${pad}" y1="\${height / 2}" x2="\${width - pad}" y2="\${height / 2}" stroke="rgba(255,255,255,0.25)" />
            \${bars}
          </svg>
        \`;
        setTimeout(() => {
          document.querySelectorAll(".lag-bars rect").forEach((rect) => {
            rect.addEventListener("click", () => onClick(parseInt(rect.dataset.lag, 10)));
          });
        }, 0);
        return svg;
      }

      function renderHeatmap(matrix, labels, onCellClick) {
        if (!matrix || !labels) return '<div class="muted">No correlation data.</div>';
        const table = document.createElement("table");
        table.className = "heatmap";
        const thead = document.createElement("thead");
        const trh = document.createElement("tr");
        trh.appendChild(document.createElement("th"));
        labels.forEach((lab) => {
          const th = document.createElement("th");
          th.textContent = lab;
          trh.appendChild(th);
        });
        thead.appendChild(trh);
        table.appendChild(thead);
        const tbody = document.createElement("tbody");
        matrix.forEach((row, i) => {
          const tr = document.createElement("tr");
          const th = document.createElement("th");
          th.textContent = labels[i];
          tr.appendChild(th);
          row.forEach((val, j) => {
            const td = document.createElement("td");
            const r = val ?? 0;
            const alpha = Math.min(Math.abs(r), 1);
            const color = r >= 0 ? \`rgba(34,197,94,\${alpha * 0.7})\` : \`rgba(255,92,122,\${alpha * 0.7})\`;
            td.style.background = color;
            td.textContent = val === null ? "" : r.toFixed(2);
            td.addEventListener("click", () => onCellClick(labels[j], labels[i]));
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
      }

      function renderDashboards(structured) {
        dashboardsArea.innerHTML = "";
        const data = structured && structured.cards ? structured : structured && structured.dashboard ? structured.dashboard : null;
        if (!data || !Array.isArray(data.cards)) {
          dashboardsArea.innerHTML = '<div class="muted">No dashboard data found.</div>';
          return;
        }

        const dailyRows = Array.isArray(data.daily_rows) ? data.daily_rows : [];

        function showScatter(xKey, yKey, lag = 0) {
          const points = buildScatterPoints(dailyRows, xKey, yKey, lag);
          const title = \`Scatter: \${xKey} vs \${yKey}\` + (lag ? \` (lag \${lag}d)\` : "");
          dashDetail.innerHTML = \`
            <div style="font-weight:600; margin-bottom:6px;">\${title}</div>
            \${renderScatterSvg(points, xKey, yKey)}
          \`;
        }

        if (data.correlation && data.correlation.labels) {
          const heatmap = renderHeatmap(
            data.correlation.matrix,
            data.correlation.labels,
            (x, y) => showScatter(x, y, 0)
          );
          const card = document.createElement("div");
          card.className = "dash-card";
          card.innerHTML = \`<h3>Correlation Heatmap</h3><div class="dash-meta">Click a cell to view a scatter plot.</div>\`;
          if (typeof heatmap === "string") {
            card.innerHTML += heatmap;
          } else {
            card.appendChild(heatmap);
          }
          dashboardsArea.appendChild(card);
        }

        data.cards.forEach((cardData) => {
          const card = document.createElement("div");
          card.className = "dash-card";
          card.innerHTML = \`<h3>\${cardData.title}</h3><div class="dash-meta">\${cardData.why_it_matters}</div>\`;
          const charts = Array.isArray(cardData.charts) ? cardData.charts : [];
          charts.forEach((chart) => {
            const wrap = document.createElement("div");
            wrap.style.marginTop = "10px";
            const title = document.createElement("div");
            title.style.fontSize = "12px";
            title.style.color = "var(--muted)";
            title.textContent = chart.title || chart.type;
            wrap.appendChild(title);

            if (chart.type === "scatter") {
              const points = buildScatterPoints(dailyRows, chart.data.xKey, chart.data.yKey, chart.data.lag || 0);
              wrap.innerHTML += renderScatterSvg(points, chart.data.xKey, chart.data.yKey);
            } else if (chart.type === "histogram") {
              wrap.innerHTML += renderHistogram(chart.data.bins);
            } else if (chart.type === "bar") {
              wrap.innerHTML += renderLagBars(chart.data.lags, (lag) => showScatter(chart.data.xKey, chart.data.yKey, lag));
            } else if (chart.type === "heatmap") {
              const heatmap = renderHeatmap(chart.data.matrix, chart.data.labels, (x, y) => showScatter(x, y, 0));
              if (typeof heatmap === "string") wrap.innerHTML += heatmap;
              else wrap.appendChild(heatmap);
            }
            card.appendChild(wrap);
          });
          dashboardsArea.appendChild(card);
        });
      }

      el("run").addEventListener("click", async () => {
        clearOutputs();
        runMeta.textContent = "Running…";

        let args = {};
        try { args = JSON.parse(argsArea.value || "{}"); } catch (e) {
          summaryPre.textContent = "Invalid JSON arguments.";
          runMeta.textContent = "";
          return;
        }

        // Merge guided date inputs if present.
        const sd = el("startDate").value.trim();
        const ed = el("endDate").value.trim();
        if (sd) args.start_date = sd;
        if (ed) args.end_date = ed;

        const body = {
          name: toolSelect.value,
          arguments: args,
          response_format: formatSelect.value,
        };

        const t0 = performance.now();
        const res = await fetch("/api/tools/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const t1 = performance.now();
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          summaryPre.textContent = (data && data.error) ? data.error : "Request failed";
          summaryPre.classList.add("err");
          runMeta.textContent = "";
          return;
        }

        summaryPre.classList.remove("err");
        summaryPre.textContent = data.text || "";
        jsonPre.textContent = JSON.stringify(data.structured ?? null, null, 2);
        lastStructured = data.structured ?? null;
        downloadBtn.disabled = !lastStructured;
        renderTables(lastStructured);
        renderCharts(lastStructured);
        renderDashboards(lastStructured);
        runMeta.textContent = \`\${Math.round(t1 - t0)}ms\`;
      });

      downloadBtn.addEventListener("click", () => {
        if (!lastStructured) return;
        const blob = new Blob([JSON.stringify(lastStructured, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = \`oura-result-\${Date.now()}.json\`;
        a.click();
        URL.revokeObjectURL(url);
      });

      (async function init() {
        await refreshTools().catch(() => {});
        await checkToken().catch(() => setStatus(false, "Server not reachable"));
        argsArea.value = JSON.stringify({ start_date: "2026-01-01", end_date: "2026-01-31", include_recommendations: true }, null, 2);
      })();
    </script>
  </body>
</html>`;
}
