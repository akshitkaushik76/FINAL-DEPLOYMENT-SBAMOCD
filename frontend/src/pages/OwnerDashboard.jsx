import { useState, useEffect, useCallback,useRef } from "react";

/* ─────────────────────────── STYLES ─────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#0d0d0d;--surface:#161616;--surface2:#1f1f1f;--surface3:#252525;
  --border:#2a2a2a;--border2:#383838;
  --text:#f0ede8;--muted:#888784;--faint:#555350;
  --accent:#e8c97a;--accent-dim:rgba(232,201,122,0.1);--accent-dim2:rgba(232,201,122,0.05);
  --danger:#e05a4a;--danger-dim:rgba(224,90,74,0.1);
  --success:#5cb87a;--success-dim:rgba(92,184,122,0.1);
  --warning:#e8a83a;--warning-dim:rgba(232,168,58,0.1);
  --info:#4a90d9;--info-dim:rgba(74,144,217,0.1);
  --font-head:'Syne',sans-serif;
  --font-body:'DM Sans',sans-serif;
  --font-mono:'DM Mono',monospace;
}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}

/* LAYOUT */
.shell{display:flex;min-height:100vh;}
.sidebar{
  width:220px;flex-shrink:0;background:var(--surface);
  border-right:1px solid var(--border);display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;overflow-y:auto;
}
.main{flex:1;overflow:auto;background:var(--bg);}

/* SIDEBAR */
.sb-logo{
  padding:1.25rem 1rem 1rem;
  display:flex;align-items:center;gap:9px;
  font-family:var(--font-head);font-size:1rem;font-weight:700;
  border-bottom:1px solid var(--border);
}
.sb-mark{
  width:28px;height:28px;background:var(--accent);border-radius:5px;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;color:#0d0d0d;font-weight:800;flex-shrink:0;
}
.sb-section{
  padding:0.6rem 0.75rem 0.2rem;
  font-family:var(--font-mono);font-size:9px;color:var(--faint);
  letter-spacing:0.1em;text-transform:uppercase;
}
.sb-item{
  display:flex;align-items:center;gap:10px;
  padding:0.55rem 1rem;margin:1px 6px;border-radius:6px;
  cursor:pointer;font-size:0.83rem;color:var(--muted);
  border:none;background:transparent;width:calc(100% - 12px);text-align:left;
  transition:all 0.15s;font-family:var(--font-body);
}
.sb-item:hover{background:var(--surface2);color:var(--text);}
.sb-item.active{background:var(--accent-dim);color:var(--accent);border-left:2px solid var(--accent);padding-left:calc(1rem - 2px);}
.sb-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
.sb-bottom{margin-top:auto;padding:1rem;border-top:1px solid var(--border);}
.sb-user{
  display:flex;align-items:center;gap:9px;
  font-size:0.78rem;color:var(--muted);
}
.sb-avatar{
  width:30px;height:30px;border-radius:50%;background:var(--accent-dim);
  border:1px solid rgba(232,201,122,0.3);display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--accent);font-weight:600;flex-shrink:0;
}
.sb-logout{
  margin-top:8px;width:100%;padding:7px;background:transparent;
  border:1px solid var(--border);border-radius:6px;
  color:var(--muted);font-family:var(--font-body);font-size:0.78rem;cursor:pointer;
  transition:all 0.15s;
}
.sb-logout:hover{border-color:var(--danger);color:var(--danger);}

/* TOPBAR */
.topbar{
  padding:1rem 1.5rem;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  background:var(--surface);position:sticky;top:0;z-index:10;
}
.topbar-title{font-family:var(--font-head);font-size:1.1rem;font-weight:700;}
.topbar-sub{font-size:0.75rem;color:var(--muted);margin-top:2px;font-family:var(--font-mono);}
.badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--font-mono);font-size:10px;padding:3px 9px;border-radius:4px;
  letter-spacing:0.05em;
}
.badge-success{background:var(--success-dim);color:var(--success);border:1px solid rgba(92,184,122,0.2);}
.badge-danger{background:var(--danger-dim);color:var(--danger);border:1px solid rgba(224,90,74,0.2);}
.badge-warning{background:var(--warning-dim);color:var(--warning);border:1px solid rgba(232,168,58,0.2);}
.badge-info{background:var(--info-dim);color:var(--info);border:1px solid rgba(74,144,217,0.2);}
.badge-accent{background:var(--accent-dim);color:var(--accent);border:1px solid rgba(232,201,122,0.2);}

/* CONTENT */
.content{padding:1.5rem;}
.section-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;
}
.section-title{font-family:var(--font-head);font-size:1rem;font-weight:700;}

/* CARDS */
.card{
  background:var(--surface);border:1px solid var(--border);border-radius:10px;
  padding:1.25rem;margin-bottom:1rem;
}
.card-sm{
  background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem;
}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:1.25rem;}
.stat-card{
  background:var(--surface2);border:1px solid var(--border);border-radius:8px;
  padding:1rem;display:flex;flex-direction:column;gap:4px;
}
.stat-label{font-size:0.7rem;color:var(--muted);font-family:var(--font-mono);letter-spacing:0.05em;text-transform:uppercase;}
.stat-value{font-family:var(--font-head);font-size:1.5rem;font-weight:700;color:var(--text);}
.stat-sub{font-size:0.72rem;color:var(--faint);}

/* FORM ELEMENTS */
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:1rem;}
.field{display:flex;flex-direction:column;gap:5px;}
.field label{font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;}
.field input,.field select,.field textarea{
  padding:9px 12px;background:var(--surface2);border:1px solid var(--border);
  border-radius:6px;color:var(--text);font-family:var(--font-body);font-size:0.85rem;
  outline:none;transition:border-color 0.15s;width:100%;
}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent);}
.field input::placeholder,.field textarea::placeholder{color:var(--faint);}
.field select option{background:var(--surface2);}
.field textarea{resize:vertical;min-height:70px;}

/* BUTTONS */
.btn{
  padding:8px 16px;border-radius:6px;font-family:var(--font-body);font-size:0.83rem;
  font-weight:500;cursor:pointer;transition:all 0.15s;border:none;display:inline-flex;
  align-items:center;gap:6px;
}
.btn-primary{background:var(--accent);color:#0d0d0d;font-weight:700;}
.btn-primary:hover{opacity:0.88;}
.btn-primary:disabled{opacity:0.4;cursor:not-allowed;}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);}
.btn-ghost:hover{border-color:var(--border2);color:var(--text);}
.btn-danger{background:var(--danger-dim);color:var(--danger);border:1px solid rgba(224,90,74,0.25);}
.btn-danger:hover{background:rgba(224,90,74,0.18);}
.btn-sm{padding:5px 11px;font-size:0.78rem;}

/* TABLE */
.tbl-wrap{overflow-x:auto;border-radius:8px;border:1px solid var(--border);}
table{width:100%;border-collapse:collapse;font-size:0.82rem;}
thead{background:var(--surface2);}
th{padding:10px 14px;text-align:left;font-family:var(--font-mono);font-size:0.7rem;
  color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;font-weight:500;
  border-bottom:1px solid var(--border);}
td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:var(--surface2);}
.mono{font-family:var(--font-mono);font-size:0.78rem;}

/* ALERTS */
.alert{
  padding:10px 14px;border-radius:7px;font-size:0.82rem;margin-bottom:1rem;
  display:flex;align-items:flex-start;gap:8px;line-height:1.5;
}
.alert-success{background:var(--success-dim);border:1px solid rgba(92,184,122,0.25);color:var(--success);}
.alert-error{background:var(--danger-dim);border:1px solid rgba(224,90,74,0.25);color:var(--danger);}
.alert-info{background:var(--info-dim);border:1px solid rgba(74,144,217,0.2);color:var(--info);}
.alert-warning{background:var(--warning-dim);border:1px solid rgba(232,168,58,0.25);color:var(--warning);}

/* SPINNER */
.spinner{
  display:inline-block;width:13px;height:13px;
  border:2px solid rgba(255,255,255,0.15);border-top-color:currentColor;
  border-radius:50%;animation:spin 0.7s linear infinite;
}
.spinner-dark{border-color:rgba(0,0,0,0.15);border-top-color:#0d0d0d;}
@keyframes spin{to{transform:rotate(360deg);}}

/* ML SPECIFIC */
.ml-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;}
.ml-model-card{
  background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1.25rem;
}
.ml-model-title{font-family:var(--font-head);font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;}
.ml-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;}
.risk-bar{height:6px;border-radius:3px;background:var(--surface3);overflow:hidden;margin-top:3px;}
.risk-fill{height:100%;border-radius:3px;transition:width 0.4s;}

/* DIVIDER */
.divider{height:1px;background:var(--border);margin:1.25rem 0;}

/* EMPTY STATE */
.empty{
  text-align:center;padding:3rem 1rem;color:var(--muted);
  font-size:0.85rem;
}
.empty-icon{font-size:2rem;margin-bottom:0.75rem;opacity:0.4;}

/* PILL TABS */
.pill-tabs{display:flex;gap:6px;margin-bottom:1.25rem;flex-wrap:wrap;}
.pill{
  padding:5px 14px;border-radius:20px;font-size:0.78rem;cursor:pointer;
  border:1px solid var(--border);background:transparent;color:var(--muted);
  font-family:var(--font-body);transition:all 0.15s;
}
.pill.active{background:var(--accent-dim);color:var(--accent);border-color:rgba(232,201,122,0.3);}
.pill:hover:not(.active){border-color:var(--border2);color:var(--text);}

@media(max-width:768px){
  .shell{flex-direction:column;}
  .sidebar{width:100%;height:auto;position:relative;}
  .ml-grid{grid-template-columns:1fr;}
}
  
`;

/* ─────────────────────────── CONFIG ─────────────────────────── */
const API = import.meta.env.VITE_API_BASE
const   ml = import.meta.env.VITE_ML_API

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

/* ─────────────────────────── HELPERS ─────────────────────────── */
function useAlert() {
  const [alert, setAlert] = useState(null);
  const show = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };
  return [alert, show];
}

function Alert({ alert }) {
  if (!alert) return null;
  const cls = { success:"alert-success", error:"alert-error", info:"alert-info", warning:"alert-warning" };
  const icon = { success:"✓", error:"✕", info:"ℹ", warning:"⚠" };
  return <div className={`alert ${cls[alert.type]}`}>{icon[alert.type]} {alert.msg}</div>;
}

function Spinner({ dark }) {
  return <span className={`spinner${dark?" spinner-dark":""}`} />;
}

/* ══════════════════════════ SECTIONS ═══════════════════════════ */

/* 1. OVERVIEW - FIXED */
function Overview({ owner }) {
  return (
    <div>
      <div className="stat-grid">
        {[
           { label: "Owner", value: owner?.name || "—" },
{ label: "Business Code", value: owner?.business_code || "—" },
{ label: "Email", value: owner?.email || "—" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span 
              className="stat-value" 
              style={{ fontSize: "1rem", wordBreak: "break-all" }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: "0.75rem" }}>
          Quick Actions
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span className="badge badge-accent">◆ Owner Portal</span>
          <span className="badge badge-success">● API Connected</span>
          <span className="badge badge-info">ML Ready</span>
        </div>
      </div>
    </div>
  );
}

/* 2. BRANCHES */
function Branches({ owner, selectedBranch }) {
  const [alert, show] = useAlert();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profits-branch");
  const [branchName, setBranchName] = useState("");
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null);

  const fetchData = async (endpoint, type) => {
    setLoading(true);
    setResult(null);
    setResultType(type);
    try {
      const r = await fetch(endpoint, { headers: authHeader() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setResult(d);
    } catch (e) {
      show("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!owner?.business_code) { show("error", "Owner data not loaded yet"); return; }
    if (!branchName.trim()) { show("error", "Branch name is required"); return; }
    setLoading(true);
    setResult(null);
    setResultType("create");
    try {
      const r = await fetch(`${API}/create-branch`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ branch_name: branchName, business_code: owner.business_code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", "Branch created successfully!");
      setResult(d);
    } catch (e) {
      show("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "create",          label: "Create Branch" },
    { key: "profits-branch",  label: "Branch Profits" },
    { key: "profits-biz",     label: "Business Profits" },
    { key: "investment",      label: "Investment" },
    { key: "customers",       label: "Active Customers" },
  ];

  /* ── context strip ── */
  const ContextStrip = () => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"1rem", flexWrap:"wrap" }}>
      {owner?.business_code && (
        <span className="badge badge-info">🏢 {owner.business_code}</span>
      )}
      {selectedBranch && (
        <span className="badge badge-accent">
          ◆ {selectedBranch.branch_name} · {selectedBranch.branch_code}
        </span>
      )}
    </div>
  );

  /* ── result renderers ── */
  // const renderProfits = (d) => {
  //   const items = d?.profit_data || d?.profits || (Array.isArray(d) ? d : null);
  //   const summary = d?.total_profit ?? d?.summary?.total_profit ?? null;
  //   return (
  //     <div>
  //       {summary !== null && (
  //         <div className="stat-grid" style={{ marginBottom:"1rem" }}>
  //           <div className="stat-card">
  //             <span className="stat-label">Total Profit</span>
  //             <span className="stat-value">₹{Number(summary).toLocaleString("en-IN")}</span>
  //           </div>
  //         </div>
  //       )}
  //       {items?.length > 0 ? (
  //         <div className="tbl-wrap">
  //           <table>
  //             <thead>
  //               <tr>
  //                 {Object.keys(items[0]).map(k => <th key={k}>{k.replace(/_/g," ")}</th>)}
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {items.map((row, i) => (
  //                 <tr key={i}>
  //                   {Object.values(row).map((v, j) => (
  //                     <td key={j} className={typeof v === "number" ? "mono" : ""}>
  //                       {typeof v === "number" ? `₹${Number(v).toLocaleString("en-IN")}` : String(v ?? "—")}
  //                     </td>
  //                   ))}
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </table>
  //         </div>
  //       ) : (
  //         <div className="empty"><div className="empty-icon">📊</div>No profit records found.</div>
  //       )}
  //     </div>
  //   );
  // };

  const renderProfits = (d) => {
    const raw = d?.data;

    // Business profits — array response
    if (Array.isArray(raw) && raw.length > 0 && raw[0]?.branches) {
        const biz = raw[0];
        return (
            <div>
                <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                    <div className="stat-card">
                        <span className="stat-label">Business Code</span>
                        <span className="stat-value mono" style={{ fontSize:"1rem" }}>
                            {biz.business_code}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Total Profit</span>
                        <span className="stat-value" style={{ color:"var(--success)" }}>
                            ₹{Number(biz.business_total_profit || 0).toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Branches</span>
                        <span className="stat-value">{biz.branches?.length || 0}</span>
                    </div>
                </div>
                <div className="tbl-wrap">
                    <table>
                        <thead><tr>
                            <th>Branch Code</th>
                            <th>Total Profit</th>
                            <th>Total Sales</th>
                        </tr></thead>
                        <tbody>
                            {biz.branches.map((b, i) => (
                                <tr key={i}>
                                    <td className="mono">{b.branch_code}</td>
                                    <td className="mono" style={{ color:"var(--success)" }}>
                                        ₹{Number(b.total_profit || 0).toLocaleString("en-IN")}
                                    </td>
                                    <td className="mono">{b.total_sales}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Branch profits — single object response
    if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.branch_code) {
        return (
            <div className="stat-grid">
                {[
                    { label: "Branch Code",  value: raw.branch_code,  mono: true  },
                    { label: "Total Profit", value: `₹${Number(raw.total_profit || 0).toLocaleString("en-IN")}` },
                    { label: "Total Sales",  value: raw.total_sales ?? "—" },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <span className="stat-label">{s.label}</span>
                        <span className={`stat-value${s.mono ? " mono" : ""}`}
                              style={{ fontSize: s.mono ? "0.9rem" : "1.4rem",
                                       color: s.label === "Total Profit" ? "var(--success)" : "var(--text)" }}>
                            {String(s.value ?? "—")}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // Empty — no data
    return (
        <div className="empty">
            <div className="empty-icon">📊</div>
            No profit records found for this branch yet.
            <div style={{ fontSize:"0.75rem", marginTop:"8px", color:"var(--faint)" }}>
                Sales data appears after transactions are recorded.
            </div>
        </div>
    );
};

  const renderInvestment = (d) => {
    const items = d?.investment_data || d?.products || (Array.isArray(d) ? d : null);
    const total = d?.total_investment ?? null;
    return (
      <div>
        {total !== null && (
          <div className="stat-grid" style={{ marginBottom:"1rem" }}>
            <div className="stat-card">
              <span className="stat-label">Total Investment</span>
              <span className="stat-value">₹{Number(total).toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
        {items?.length > 0 ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(items[0]).map(k => <th key={k}>{k.replace(/_/g," ")}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className={typeof v === "number" ? "mono" : ""}>
                        {typeof v === "number" ? `₹${Number(v).toLocaleString("en-IN")}` : String(v ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><div className="empty-icon">📦</div>No investment data found.</div>
        )}
      </div>
    );
  };

  // const renderCustomers = (d) => {
  //   const customers = d?.customers || d?.active_customers || (Array.isArray(d) ? d : null);
  //   const count = d?.count ?? customers?.length ?? null;
  //   return (
  //     <div>
  //       {count !== null && (
  //         <div className="stat-grid" style={{ marginBottom:"1rem" }}>
  //           <div className="stat-card">
  //             <span className="stat-label">Active Customers</span>
  //             <span className="stat-value">{count}</span>
  //           </div>
  //         </div>
  //       )}
  //       {customers?.length > 0 ? (
  //         <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
  //           {customers.map((c, i) => (
  //             <div key={i} className="card-sm" style={{ display:"flex", alignItems:"center", gap:"12px" }}>
  //               <div style={{
  //                 width:"36px", height:"36px", borderRadius:"50%",
  //                 background:"var(--accent-dim)", border:"1px solid rgba(232,201,122,0.3)",
  //                 display:"flex", alignItems:"center", justifyContent:"center",
  //                 fontFamily:"var(--font-head)", fontSize:"12px", color:"var(--accent)", flexShrink:0
  //               }}>
  //                 {(c.name || c.customer_name || "C").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
  //               </div>
  //               <div style={{ flex:1 }}>
  //                 <div style={{ fontWeight:500, fontSize:"0.85rem" }}>{c.name || c.customer_name || "—"}</div>
  //                 {c.email && <div className="stat-sub" style={{ marginTop:"2px" }}>{c.email}</div>}
  //               </div>
  //               {(c.total_purchase || c.balance) && (
  //                 <div className="mono" style={{ color:"var(--accent)", fontSize:"0.82rem" }}>
  //                   ₹{Number(c.total_purchase || c.balance).toLocaleString("en-IN")}
  //                 </div>
  //               )}
  //             </div>
  //           ))}
  //         </div>
  //       ) : (
  //         <div className="empty"><div className="empty-icon">👥</div>No active customers found.</div>
  //       )}
  //     </div>
  //   );
  // };

  const renderCustomers = (d) => {
    const customers = d?.customers || (Array.isArray(d) ? d : null);
    const count = d?.count ?? customers?.length ?? 0;
    return (
        <div>
            <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                <div className="stat-card">
                    <span className="stat-label">Active Customers</span>
                    <span className="stat-value">{count}</span>
                </div>
            </div>
            {customers?.length > 0 ? (
                <div className="tbl-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Code</th>
                                <th>Email</th>
                                <th>Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c, i) => {
                                // nested object is in c.customer_name
                                const info = c?.customer_name || c;
                                const name  = info?.customer_name || "—";
                                const email = info?.customer_email || "—";
                                const code  = info?.customer_code  || "—";
                                const phone = info?.customer_phonenumber || "—";
                                const initials = name.split(" ")
                                    .map(w => w[0]).join("").slice(0,2).toUpperCase();
                                return (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                                                <div style={{
                                                    width:"32px", height:"32px", borderRadius:"50%",
                                                    background:"var(--accent-dim)",
                                                    border:"1px solid rgba(232,201,122,0.3)",
                                                    display:"flex", alignItems:"center",
                                                    justifyContent:"center",
                                                    fontSize:"11px", color:"var(--accent)",
                                                    fontWeight:600, flexShrink:0
                                                }}>
                                                    {initials}
                                                </div>
                                                <span style={{ fontWeight:500 }}>{name}</span>
                                            </div>
                                        </td>
                                        <td className="mono" style={{ color:"var(--muted)" }}>
                                            {code}
                                        </td>
                                        <td style={{ color:"var(--muted)", fontSize:"0.8rem" }}>
                                            {email}
                                        </td>
                                        <td className="mono" style={{ color:"var(--muted)" }}>
                                            {phone}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty">
                    <div className="empty-icon">👥</div>
                    No active customers found.
                </div>
            )}
        </div>
    );
};

  const renderCreate = (d) => (
    <div className="card-sm" style={{ display:"flex", alignItems:"center", gap:"14px" }}>
      <div style={{
        width:"40px", height:"40px", borderRadius:"8px",
        background:"var(--success-dim)", border:"1px solid rgba(92,184,122,0.3)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0
      }}>🏢</div>
      <div>
        <div style={{ fontWeight:600, fontSize:"0.9rem", color:"var(--success)" }}>Branch Created</div>
        {d?.branch_name && <div style={{ fontSize:"0.82rem", marginTop:"3px" }}>{d.branch_name}</div>}
        {d?.branch_code && <div className="mono" style={{ fontSize:"0.78rem", color:"var(--muted)", marginTop:"2px" }}>Code: {d.branch_code}</div>}
      </div>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;
    return (
      <div className="card" style={{ marginTop:"1rem" }}>
        <div className="stat-label" style={{ marginBottom:"0.75rem" }}>
          {resultType === "profits-branch" && "Branch Profit Report"}
          {resultType === "profits-biz"   && "Business Profit Report"}
          {resultType === "investment"    && "Product Investment"}
          {resultType === "customers"     && "Active Customers"}
          {resultType === "create"        && "New Branch"}
        </div>
        {resultType === "create"         && renderCreate(result)}
        {(resultType === "profits-branch" || resultType === "profits-biz") && renderProfits(result)}
        {resultType === "investment"     && renderInvestment(result)}
        {resultType === "customers"      && renderCustomers(result)}
      </div>
    );
  };

  return (
    <div>
      <Alert alert={alert} />
      <div className="pill-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`pill${activeTab === t.key ? " active" : ""}`}
            onClick={() => { setActiveTab(t.key); setResult(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "create" && (
        <div className="card">
          <ContextStrip />
          <div className="form-grid" style={{ marginBottom:"1rem" }}>
            <div className="field">
              <label>Branch Name</label>
              <input
                placeholder="e.g. Main Branch"
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Business Code</label>
              <input value={owner?.business_code || "—"} disabled />
            </div>
          </div>
          <button className="btn btn-primary" onClick={createBranch} disabled={loading || !branchName.trim()}>
            {loading ? <Spinner dark /> : "+"} Create Branch
          </button>
        </div>
      )}

      {activeTab === "profits-branch" && (
        <div className="card">
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected. Choose one from the top bar.</div>
          ) : (
            <button className="btn btn-primary" disabled={loading}
              onClick={() => fetchData(`${API}/get-profit-branch/${selectedBranch.branch_code}`, "profits-branch")}>
              {loading ? <Spinner dark /> : "→"} Fetch Branch Profits
            </button>
          )}
        </div>
      )}

      {activeTab === "profits-biz" && (
        <div className="card">
          <ContextStrip />
          <button className="btn btn-primary" disabled={loading}
            onClick={() => fetchData(`${API}/get-profit-business/${owner?.business_code}`, "profits-biz")}>
            {loading ? <Spinner dark /> : "→"} Fetch Business Profits
          </button>
        </div>
      )}

      {activeTab === "investment" && (
        <div className="card">
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected. Choose one from the top bar.</div>
          ) : (
            <button className="btn btn-primary" disabled={loading}
              onClick={() => fetchData(`${API}/get-product-investment/${selectedBranch._id}`, "investment")}>
              {loading ? <Spinner dark /> : "→"} Fetch Investment
            </button>
          )}
        </div>
      )}

      {activeTab === "customers" && (
        <div className="card">
          <ContextStrip />
          <button className="btn btn-primary" disabled={loading}
            onClick={() => fetchData(`${API}/get-active-customer/${owner?.business_code}`, "customers")}>
            {loading ? <Spinner dark /> : "→"} Fetch Active Customers
          </button>
        </div>
      )}

      {renderResult()}
    </div>
  );
}


/* 3. PRODUCTS, 4. SALES, 5. CREDITS, 6. ML remain unchanged for brevity */
/* (They are already correct in your original code) */

function Products({ selectedBranch }) {
  const [alert, show] = useAlert();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("view");
  const [products, setProducts] = useState([]);
  const [result, setResult] = useState(null);

  const [addForm, setAddForm] = useState({
    product_name: "", cost_price: "", selling_price: "", quantity: ""
  });
  const [updateForm, setUpdateForm] = useState({
    product_code: "", quantity: "", selling_price: "", cost_price: ""
  });

  const upd = (form, setForm) => (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updAdd = upd(addForm, setAddForm);
  const updUpd = upd(updateForm, setUpdateForm);

  // Fetch all products for selected branch
  const fetchProducts = async () => {
    if (!selectedBranch?._id) { show("error", "No branch selected"); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/get-products/${selectedBranch._id}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setProducts(d?.products || d?.data || []);
    } catch (e) {
      // If no get-products endpoint, show empty
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "view" && selectedBranch?._id) fetchProducts();
  }, [activeTab, selectedBranch]);

  const addProduct = async () => {
    if (!selectedBranch?._id) { show("error", "No branch selected"); return; }
    const { product_name, cost_price, selling_price, quantity } = addForm;
    if (!product_name || !cost_price || !selling_price || !quantity) {
      show("error", "All fields are required"); return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/add-product/${selectedBranch._id}`,
        {
          method: "POST",
          headers: authHeader(),
          body: JSON.stringify({
            product_name,
            cost_price: Number(cost_price),
            selling_price: Number(selling_price),
            quantity: Number(quantity),
          }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", `Product "${product_name}" added successfully!`);
      setResult(d?.product_data || d);
      setAddForm({ product_name: "", cost_price: "", selling_price: "", quantity: "" });
      fetchProducts();
    } catch (e) {
      show("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!selectedBranch?._id) { show("error", "No branch selected"); return; }
    if (!updateForm.product_code) { show("error", "Product code is required"); return; }
    setLoading(true);
    try {
      const body = {};
      if (updateForm.quantity)     body.quantity      = Number(updateForm.quantity);
      if (updateForm.selling_price) body.selling_price = Number(updateForm.selling_price);
      if (updateForm.cost_price)   body.cost_price    = Number(updateForm.cost_price);

      const r = await fetch(
        `${API}/update-product/${selectedBranch._id}/${updateForm.product_code}`,
        { method: "PATCH", headers: authHeader(), body: JSON.stringify(body) }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", "Product updated successfully!");
      setResult(d?.updated_data || d);
      fetchProducts();
    } catch (e) {
      show("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "view",   label: "All Products" },
    { key: "add",    label: "Add Product"  },
    { key: "update", label: "Update Stock" },
  ];

  // Context strip
  const ContextStrip = () => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"1rem", flexWrap:"wrap" }}>
      {selectedBranch && (
        <span className="badge badge-accent">
          ◆ {selectedBranch.branch_name} · {selectedBranch.branch_code}
        </span>
      )}
    </div>
  );

  // Profit margin helper
  const margin = (cost, sell) => {
    if (!cost || !sell || sell === 0) return "—";
    return `${(((sell - cost) / sell) * 100).toFixed(1)}%`;
  };

  // Stock level badge
  const stockBadge = (qty) => {
    if (qty <= 0)  return <span className="badge badge-danger">Out of stock</span>;
    if (qty <= 10) return <span className="badge badge-warning">Low</span>;
    return <span className="badge badge-success">In stock</span>;
  };

  return (
    <div>
      <Alert alert={alert} />
      <div className="pill-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`pill${activeTab === t.key ? " active" : ""}`}
            onClick={() => { setActiveTab(t.key); setResult(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VIEW ALL PRODUCTS ── */}
      {activeTab === "view" && (
        <div>
          <ContextStrip />
          <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginBottom:"1rem" }}>
            <div className="stat-label">
              {products.length} product{products.length !== 1 ? "s" : ""} in branch
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchProducts} disabled={loading}>
              {loading ? <Spinner /> : "↻"} Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty"><Spinner /> Loading products...</div>
          ) : products.length > 0 ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Cost Price</th>
                    <th>Selling Price</th>
                    <th>Margin</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{p.product_name}</td>
                      <td className="mono" style={{ color:"var(--muted)" }}>
                        {p.product_code}
                      </td>
                      <td className="mono">₹{Number(p.cost_price).toLocaleString("en-IN")}</td>
                      <td className="mono" style={{ color:"var(--accent)" }}>
                        ₹{Number(p.selling_price).toLocaleString("en-IN")}
                      </td>
                      <td className="mono" style={{ color:"var(--success)" }}>
                        {margin(p.cost_price, p.selling_price)}
                      </td>
                      <td className="mono">{p.quantity}</td>
                      <td>{stockBadge(p.quantity)}</td>
                      <td style={{ color:"var(--muted)", fontSize:"0.78rem" }}>
                        {p.inclusion_date || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <div className="empty-icon">📦</div>
              No products found for this branch.
              <div style={{ fontSize:"0.75rem", marginTop:"8px", color:"var(--faint)" }}>
                Add your first product using the "Add Product" tab.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD PRODUCT ── */}
      {activeTab === "add" && (
        <div className="card">
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              <div className="form-grid">
                <div className="field">
                  <label>Product Name</label>
                  <input
                    placeholder="e.g. Maggi Noodles"
                    value={addForm.product_name}
                    onChange={e => updAdd("product_name", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Quantity</label>
                  <input
                    type="number" min="1" placeholder="100"
                    value={addForm.quantity}
                    onChange={e => updAdd("quantity", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number" min="0" placeholder="8.00"
                    value={addForm.cost_price}
                    onChange={e => updAdd("cost_price", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Selling Price (₹)</label>
                  <input
                    type="number" min="0" placeholder="12.00"
                    value={addForm.selling_price}
                    onChange={e => updAdd("selling_price", e.target.value)}
                  />
                </div>
              </div>

              {/* Live margin preview */}
              {addForm.cost_price && addForm.selling_price && (
                <div className="card-sm" style={{ marginBottom:"1rem",
                     display:"flex", gap:"16px", alignItems:"center" }}>
                  <div>
                    <div className="stat-label">Profit per unit</div>
                    <div style={{ fontFamily:"var(--font-head)", fontSize:"1rem",
                                  color:"var(--success)", marginTop:"2px" }}>
                      ₹{(Number(addForm.selling_price) - Number(addForm.cost_price)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Margin</div>
                    <div style={{ fontFamily:"var(--font-head)", fontSize:"1rem",
                                  color:"var(--accent)", marginTop:"2px" }}>
                      {margin(Number(addForm.cost_price), Number(addForm.selling_price))}
                    </div>
                  </div>
                  {addForm.quantity && (
                    <div>
                      <div className="stat-label">Total investment</div>
                      <div style={{ fontFamily:"var(--font-head)", fontSize:"1rem",
                                    color:"var(--text)", marginTop:"2px" }}>
                        ₹{(Number(addForm.cost_price) * Number(addForm.quantity)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={addProduct}
                disabled={loading || !addForm.product_name || !addForm.cost_price
                          || !addForm.selling_price || !addForm.quantity}
              >
                {loading ? <Spinner dark /> : "+"} Add Product
              </button>

              {/* Result */}
              {result && (
                <div className="card-sm" style={{ marginTop:"1rem",
                     display:"flex", alignItems:"center", gap:"14px" }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"8px",
                    background:"var(--success-dim)",
                    border:"1px solid rgba(92,184,122,0.3)",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:"18px"
                  }}>📦</div>
                  <div>
                    <div style={{ fontWeight:600, color:"var(--success)", fontSize:"0.9rem" }}>
                      Product Added
                    </div>
                    <div className="mono" style={{ fontSize:"0.78rem",
                         color:"var(--muted)", marginTop:"3px" }}>
                      Code: {result.product_code}
                    </div>
                    <div style={{ fontSize:"0.78rem", color:"var(--faint)", marginTop:"2px" }}>
                      {result.product_name} · Qty: {result.quantity}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── UPDATE STOCK ── */}
      {activeTab === "update" && (
        <div className="card">
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              <div className="alert alert-info" style={{ marginBottom:"1rem" }}>
                ℹ Quantity field adds to existing stock. Leave blank to keep current.
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Product Code</label>
                  <input
                    placeholder="e.g. maggi10"
                    value={updateForm.product_code}
                    onChange={e => updUpd("product_code", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Add Quantity</label>
                  <input
                    type="number" min="0"
                    placeholder="Leave blank to skip"
                    value={updateForm.quantity}
                    onChange={e => updUpd("quantity", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>New Cost Price (₹)</label>
                  <input
                    type="number" min="0"
                    placeholder="Leave blank to skip"
                    value={updateForm.cost_price}
                    onChange={e => updUpd("cost_price", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>New Selling Price (₹)</label>
                  <input
                    type="number" min="0"
                    placeholder="Leave blank to skip"
                    value={updateForm.selling_price}
                    onChange={e => updUpd("selling_price", e.target.value)}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={updateProduct}
                disabled={loading || !updateForm.product_code}
              >
                {loading ? <Spinner dark /> : "↑"} Update Product
              </button>

              {/* Quick-pick from loaded products */}
              {products.length > 0 && (
                <div style={{ marginTop:"1.25rem" }}>
                  <div className="stat-label" style={{ marginBottom:"0.5rem" }}>
                    Quick pick from branch
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                    {products.map((p, i) => (
                      <button
                        key={i}
                        className={`pill${updateForm.product_code === p.product_code ? " active" : ""}`}
                        onClick={() => updUpd("product_code", p.product_code)}
                      >
                        {p.product_name}
                        <span className="mono" style={{ marginLeft:"4px",
                              fontSize:"0.7rem", opacity:0.7 }}>
                          ({p.quantity})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="card-sm" style={{ marginTop:"1rem",
                     display:"flex", alignItems:"center", gap:"14px" }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"8px",
                    background:"var(--accent-dim)",
                    border:"1px solid rgba(232,201,122,0.3)",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:"18px"
                  }}>✓</div>
                  <div>
                    <div style={{ fontWeight:600, color:"var(--accent)", fontSize:"0.9rem" }}>
                      Product Updated
                    </div>
                    <div className="mono" style={{ fontSize:"0.78rem",
                         color:"var(--muted)", marginTop:"3px" }}>
                      {result.product_code}
                    </div>
                    <div style={{ fontSize:"0.78rem", color:"var(--faint)", marginTop:"2px" }}>
                      New stock: {result.quantity} units
                      · ₹{result.selling_price} selling price
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Sales({ selectedBranch }) {
  const [alert, show]   = useAlert();
  const [activeTab, setActiveTab] = useState("record");
  const [loading, setLoading]     = useState(false);
  const [salesLog, setSalesLog]   = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // Cart state
  const [cart, setCart]           = useState([]);
  const [idempotencyKey, setIKey] = useState(() => crypto.randomUUID());

  // Search state
  const [searchQuery, setSearchQuery]     = useState("");
  const [suggestions, setSuggestions]     = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedQty, setSelectedQty]     = useState(1);
  const searchRef = useRef(null);

  // Fetch sales log
  const fetchSales = async () => {
    if (!selectedBranch?.branch_code) return;
    setLogLoading(true);
    try {
      const r = await fetch(
        `${API}/get-sales/${selectedBranch.branch_code}?limit=30`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSalesLog(d?.data || []);
    } catch (e) {
      show("error", e.message);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchSales();
  }, [activeTab, selectedBranch]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced product search
  useEffect(() => {
    if (!searchQuery.trim() || !selectedBranch?._id) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await fetch(
          `${API}/search-products/${selectedBranch._id}?q=${encodeURIComponent(searchQuery)}`,
          { headers: authHeader() }
        );
        const d = await r.json();
        setSuggestions(d?.products || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280); // debounce 280ms — fast but not spammy
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBranch]);

  // Add product to cart
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product_code === product.product_code);
      if (exists) {
        return prev.map(i =>
          i.product_code === product.product_code
            ? { ...i, quantity: i.quantity + selectedQty }
            : i
        );
      }
      return [...prev, {
        product_code:  product.product_code,
        product_name:  product.product_name,
        selling_price: product.selling_price,
        max_qty:       product.quantity,
        quantity:      selectedQty,
      }];
    });
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedQty(1);
  };

  // Update qty in cart
  const updateCartQty = (code, qty) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i =>
      i.product_code === code ? { ...i, quantity: qty } : i
    ));
  };

  // Remove from cart
  const removeFromCart = (code) => {
    setCart(prev => prev.filter(i => i.product_code !== code));
  };

  // Cart totals
  const cartTotal = cart.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);

  // Submit sale
  const submitSale = async () => {
    if (!selectedBranch) { show("error", "No branch selected"); return; }
    if (cart.length === 0) { show("error", "Cart is empty"); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/add-sales/${selectedBranch.branch_code}/${selectedBranch._id}`,
        {
          method: "POST",
          headers: authHeader(),
          body: JSON.stringify({
            items: cart.map(i => ({
              product_code: i.product_code,
              quantity:     i.quantity,
            })),
            idempotency_key: idempotencyKey,
          }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", `Sale recorded! Code: ${d?.data?.sales_code}`);
      setCart([]);
      setIKey(crypto.randomUUID()); // reset idempotency key
    } catch (e) {
      show("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "record",  label: "Record Sale" },
    { key: "history", label: "Sales History" },
  ];

  const ContextStrip = () => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"1rem", flexWrap:"wrap" }}>
      {selectedBranch && (
        <span className="badge badge-accent">
          ◆ {selectedBranch.branch_name} · {selectedBranch.branch_code}
        </span>
      )}
    </div>
  );

  return (
    <div>
      <Alert alert={alert} />
      <div className="pill-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`pill${activeTab === t.key ? " active" : ""}`}
            onClick={() => { setActiveTab(t.key); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RECORD SALE ── */}
      {activeTab === "record" && (
        <div>
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              {/* Search box */}
              <div className="card" style={{ marginBottom:"1rem" }}>
                <div className="stat-label" style={{ marginBottom:"0.6rem" }}>
                  Search product to add
                </div>
                <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                  {/* Search input with dropdown */}
                  <div style={{ flex:1, position:"relative" }} ref={searchRef}>
                    <div style={{ position:"relative" }}>
                      <input
                        style={{
                          width:"100%", padding:"9px 36px 9px 12px",
                          background:"var(--surface2)", border:"1px solid var(--border)",
                          borderRadius:"6px", color:"var(--text)",
                          fontFamily:"var(--font-body)", fontSize:"0.85rem", outline:"none",
                        }}
                        placeholder="Type product name or code..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      />
                      <div style={{
                        position:"absolute", right:"10px", top:"50%",
                        transform:"translateY(-50%)", color:"var(--faint)", fontSize:"13px"
                      }}>
                        {searchLoading ? <Spinner /> : "⌕"}
                      </div>
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{
                        position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                        background:"var(--surface2)", border:"1px solid var(--border2)",
                        borderRadius:"8px", zIndex:100, overflow:"hidden",
                        boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
                      }}>
                        {suggestions.map((p, i) => (
                          <div
                            key={i}
                            onClick={() => addToCart(p)}
                            style={{
                              padding:"10px 14px", cursor:"pointer",
                              borderBottom: i < suggestions.length - 1
                                ? "1px solid var(--border)" : "none",
                              display:"flex", alignItems:"center",
                              justifyContent:"space-between", gap:"12px",
                              transition:"background 0.1s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface3)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div>
                              {/* Highlight matching text */}
                              <div style={{ fontWeight:500, fontSize:"0.85rem" }}>
                                {p.product_name.split(new RegExp(`(${searchQuery})`, 'gi'))
                                  .map((part, j) =>
                                    part.toLowerCase() === searchQuery.toLowerCase()
                                      ? <mark key={j} style={{
                                          background:"var(--accent-dim)",
                                          color:"var(--accent)", borderRadius:"2px",
                                          padding:"0 1px"
                                        }}>{part}</mark>
                                      : part
                                  )}
                              </div>
                              <div className="mono" style={{
                                fontSize:"0.72rem", color:"var(--muted)", marginTop:"2px"
                              }}>
                                {p.product_code}
                              </div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div style={{
                                color:"var(--accent)", fontFamily:"var(--font-mono)",
                                fontSize:"0.85rem", fontWeight:600
                              }}>
                                ₹{p.selling_price}
                              </div>
                              <div style={{
                                fontSize:"0.7rem", color: p.quantity <= 10
                                  ? "var(--danger)" : "var(--muted)",
                                marginTop:"2px"
                              }}>
                                {p.quantity} in stock
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {showSuggestions && !searchLoading && searchQuery &&
                     suggestions.length === 0 && (
                      <div style={{
                        position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                        background:"var(--surface2)", border:"1px solid var(--border2)",
                        borderRadius:"8px", padding:"12px 14px", zIndex:100,
                        color:"var(--muted)", fontSize:"0.82rem",
                      }}>
                        No products found for "{searchQuery}"
                      </div>
                    )}
                  </div>

                  {/* Qty selector */}
                  <div style={{ display:"flex", alignItems:"center",
                                gap:"6px", flexShrink:0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                    >−</button>
                    <div style={{
                      minWidth:"36px", textAlign:"center",
                      fontFamily:"var(--font-mono)", fontSize:"0.9rem"
                    }}>{selectedQty}</div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedQty(q => q + 1)}
                    >+</button>
                    <div style={{
                      fontSize:"0.72rem", color:"var(--faint)",
                      fontFamily:"var(--font-mono)"
                    }}>qty</div>
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="card">
                <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"center", marginBottom:"1rem" }}>
                  <div className="section-title">
                    Cart
                    {cart.length > 0 && (
                      <span className="badge badge-accent" style={{ marginLeft:"8px" }}>
                        {cart.length} item{cart.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCart([])}
                      style={{ color:"var(--danger)" }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="empty" style={{ padding:"2rem 1rem" }}>
                    <div className="empty-icon">🛒</div>
                    Search and add products above to start recording a sale.
                  </div>
                ) : (
                  <>
                    <div className="tbl-wrap" style={{ marginBottom:"1rem" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Code</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Subtotal</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((item, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:500 }}>{item.product_name}</td>
                              <td className="mono" style={{ color:"var(--muted)" }}>
                                {item.product_code}
                              </td>
                              <td className="mono">₹{item.selling_price}</td>
                              <td>
                                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding:"2px 8px" }}
                                    onClick={() => updateCartQty(item.product_code, item.quantity - 1)}
                                  >−</button>
                                  <span className="mono">{item.quantity}</span>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding:"2px 8px" }}
                                    onClick={() => updateCartQty(item.product_code, item.quantity + 1)}
                                  >+</button>
                                </div>
                              </td>
                              <td className="mono" style={{ color:"var(--accent)" }}>
                                ₹{(item.selling_price * item.quantity).toLocaleString("en-IN")}
                              </td>
                              <td>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color:"var(--danger)", padding:"4px 8px" }}
                                  onClick={() => removeFromCart(item.product_code)}
                                >✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total + submit */}
                    <div style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"12px 0",
                      borderTop:"1px solid var(--border)"
                    }}>
                      <div>
                        <div className="stat-label">Total Amount</div>
                        <div style={{
                          fontFamily:"var(--font-head)", fontSize:"1.6rem",
                          fontWeight:700, color:"var(--accent)"
                        }}>
                          ₹{cartTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={submitSale}
                        disabled={loading}
                        style={{ padding:"10px 24px", fontSize:"0.9rem" }}
                      >
                        {loading ? <Spinner dark /> : "✓"} Confirm Sale
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SALES HISTORY ── */}
      {activeTab === "history" && (
        <div>
          <ContextStrip />
          <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginBottom:"1rem" }}>
            <div className="stat-label">Last 30 sales</div>
            <button className="btn btn-ghost btn-sm" onClick={fetchSales} disabled={logLoading}>
              {logLoading ? <Spinner /> : "↻"} Refresh
            </button>
          </div>

          {logLoading ? (
            <div className="empty"><Spinner /> Loading sales...</div>
          ) : salesLog.length > 0 ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sales Code</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLog.map((s, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ color:"var(--muted)", fontSize:"0.75rem" }}>
                        {s.sales_code}
                      </td>
                      <td style={{ color:"var(--muted)", fontSize:"0.8rem" }}>
                        {s.issueDate}
                      </td>
                      <td>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                          {s.items?.map((item, j) => (
                            <span key={j} className="badge badge-info" style={{ fontSize:"0.68rem" }}>
                              {item.product_code} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="mono" style={{ color:"var(--accent)" }}>
                        ₹{Number(s.total_sale_cost).toLocaleString("en-IN")}
                      </td>
                      <td className="mono" style={{ color:"var(--success)" }}>
                        ₹{Number(s.total_profit).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <div className="empty-icon">📈</div>
              No sales recorded yet for this branch.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Credits({ selectedBranch }) {
  const [alert, show]     = useAlert();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading]     = useState(false);

  // Overview state
  const [overview, setOverview]   = useState(null);
  const [overviewLoading, setOL]  = useState(false);

  // Add credit state
  const [cart, setCart]           = useState([]);
  const [customerCode, setCC]     = useState("");
  const [iKey, setIKey]           = useState(() => crypto.randomUUID());
  const [searchQuery, setSearch]  = useState("");
  const [suggestions, setSugg]    = useState([]);
  const [searchLoading, setSL]    = useState(false);
  const [showSugg, setShowSugg]   = useState(false);
  const [selectedQty, setQty]     = useState(1);
  const [creditResult, setCR]     = useState(null);
  const searchRef                  = useRef(null);

  // Get credit state
  const [creditCode, setCreditCode] = useState("");
  const [creditInfo, setCreditInfo] = useState(null);

  // Settle state
  const [settleCode, setSettleCode] = useState("");
  const [settleAmt, setSettleAmt]   = useState("");
  const [settleResult, setSettleRes] = useState(null);

  // Bulk settle state
  const [bulkCC, setBulkCC]       = useState("");
  const [bulkAmt, setBulkAmt]     = useState("");
  const [bulkResult, setBulkRes]  = useState(null);

  // Update credit state
  const [updateCode, setUpdateCode] = useState("");
  const [updateCart, setUpdateCart] = useState([]);
  const [updateCustCode, setUCC]    = useState("");
  const [updateResult, setUpdateRes] = useState(null);
  const [updateSearch, setUS]        = useState("");
  const [updateSugg, setUSugg]       = useState([]);
  const [showUSugg, setShowUSugg]    = useState(false);
  const [updateQty, setUQty]         = useState(1);
  const updateRef                     = useRef(null);

  const [precheckResult, setPrecheckResult] = useState(null);
const [precheckLoading, setPrecheckLoading] = useState(false);
const [precheckDone, setPrecheckDone] = useState(false);

// Customer search state
const [custSearch, setCustSearch]       = useState("");
const [custSugg, setCustSugg]           = useState([]);
const [custSuggLoading, setCustSL]      = useState(false);
const [showCustSugg, setShowCustSugg]   = useState(false);
const [selectedCust, setSelectedCust]   = useState(null);
const [custCredits, setCustCredits]     = useState(null);
const [custCreditsLoading, setCCL]      = useState(false);
const custSearchRef                      = useRef(null);

  const runPrecheck = async () => {
    if (!selectedBranch?.branch_code) { show("error", "No branch selected"); return; }
    if (!customerCode.trim()) { show("error", "Customer code required"); return; }
    if (cart.length === 0)    { show("error", "Add products first"); return; }
    setPrecheckLoading(true);
    setPrecheckResult(null);
    try {
        const total = cart.reduce((s, i) => s + i.selling_price * i.quantity, 0);
        const r = await fetch(`${ml}/credit/precheck`, {
            method:  "POST",
            headers: authHeader(),
            body:    JSON.stringify({
                branch_code:   selectedBranch.branch_code,
                customer_code: customerCode.trim(),
                creditAmount:  total,
            }),
        });
        const d = await r.json();
        // ML service response comes wrapped in data from Node.js
        // Direct FastAPI call returns flat
        const result = d?.data || d;
        setPrecheckResult(result);
        setPrecheckDone(true);
    } catch (e) {
        // If ML down, allow proceeding
        setPrecheckResult({ decision: "UNAVAILABLE",
                            recommendation: "ML service offline. Proceed at your discretion." });
        setPrecheckDone(true);
    } finally {
        setPrecheckLoading(false);
    }
};

  // ── Fetch overview ─────────────────────────────────────────
  const fetchOverview = async () => {
    if (!selectedBranch?._id) return;
    setOL(true);
    try {
      const r = await fetch(
        `${API}/get-credit-status/${selectedBranch._id}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setOverview(d);
    } catch (e) {
      show("error", e.message);
    } finally {
      setOL(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") fetchOverview();
  }, [activeTab, selectedBranch]);

  // ── Product search (shared logic) ─────────────────────────
  const useProductSearch = (query, setQuery, setSuggestions,
                             setShow, ref) => {
    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setShow(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
      if (!query.trim() || !selectedBranch?._id) {
        setSuggestions([]); setShow(false); return;
      }
      const t = setTimeout(async () => {
        setSL(true);
        try {
          const r = await fetch(
            `${API}/search-products/${selectedBranch._id}?q=${encodeURIComponent(query)}`,
            { headers: authHeader() }
          );
          const d = await r.json();
          setSuggestions(d?.products || []);
          setShow(true);
        } catch { setSuggestions([]); }
        finally { setSL(false); }
      }, 280);
      return () => clearTimeout(t);
    }, [query, selectedBranch]);
  };

  useProductSearch(searchQuery, setSearch, setSugg, setShowSugg, searchRef);
  useProductSearch(updateSearch, setUS, setUSugg, setShowUSugg, updateRef);

  // ── Cart helpers ───────────────────────────────────────────
  const addToCart = (cartSetter, product, qty) => {
    cartSetter(prev => {
      const exists = prev.find(i => i.product_code === product.product_code);
      if (exists) return prev.map(i =>
        i.product_code === product.product_code
          ? { ...i, quantity: i.quantity + qty } : i
      );
      return [...prev, {
        product_code:  product.product_code,
        product_name:  product.product_name,
        selling_price: product.selling_price,
        quantity:      qty,
        max_qty:       product.quantity,
      }];
    });
  };

  const updateQtyInCart = (cartSetter, code, qty) => {
    if (qty < 1) return;
    cartSetter(prev => prev.map(i =>
      i.product_code === code ? { ...i, quantity: qty } : i
    ));
  };

  const removeFromCart = (cartSetter, code) => {
    cartSetter(prev => prev.filter(i => i.product_code !== code));
  };

  // ── Risk badge helper ──────────────────────────────────────
  const RiskBadge = ({ decision, score }) => {
    if (!decision || decision === "UNAVAILABLE")
      return <span className="badge badge-info">ML N/A</span>;
    const map = {
      APPROVE: "badge-success",
      REVIEW:  "badge-warning",
      DENY:    "badge-danger",
    };
    return (
      <span className={`badge ${map[decision] || "badge-info"}`}>
        {decision} {score != null ? `· ${score}` : ""}
      </span>
    );
  };

  // ── Submit add credit ──────────────────────────────────────
  const submitCredit = async () => {
    if (!selectedBranch?._id) { show("error", "No branch selected"); return; }
    if (!customerCode.trim())  { show("error", "Customer code required"); return; }
    if (cart.length === 0)     { show("error", "Cart is empty"); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/add-credit/${selectedBranch._id}`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          customer_code:   customerCode.trim(),
          items:           cart.map(i => ({ product_code: i.product_code, quantity: i.quantity })),
          idempotency_key: iKey,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", `Credit issued! Code: ${d?.data?.credit_code}`);
      setCR(d);
      setCart([]);
      setCC("");
      setIKey(crypto.randomUUID());
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // ── Get credit by code ─────────────────────────────────────
  const getCredit = async () => {
    if (!creditCode.trim() || !selectedBranch?._id) {
      show("error", "Credit code and branch required"); return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/get-credit/${creditCode.trim()}/${selectedBranch._id}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setCreditInfo(d?.data);
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // ── Settle by code ─────────────────────────────────────────
  const settleCredit = async () => {
    if (!settleCode.trim() || !settleAmt) {
      show("error", "Credit code and amount required"); return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/settle-credit/${settleCode.trim()}`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ amount: Number(settleAmt) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", "Payment settled!");
      setSettleRes(d?.data);
      setSettleCode(""); setSettleAmt("");
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // ── Bulk settle ────────────────────────────────────────────
  const bulkSettle = async () => {
    if (!bulkCC.trim() || !bulkAmt) {
      show("error", "Customer code and amount required"); return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/settle-credit-chunk`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          customer_code: bulkCC.trim(),
          amount: Number(bulkAmt)
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", `Settled ₹${d.total_paid} across ${d.updated_count} credit(s)`);
      setBulkRes(d);
      setBulkCC(""); setBulkAmt("");
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // ── Update credit ──────────────────────────────────────────
  const submitUpdate = async () => {
    if (!updateCode.trim()) { show("error", "Credit code required"); return; }
    if (updateCart.length === 0) { show("error", "Cart is empty"); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/update-credit/${updateCode.trim()}`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({
          customer_code: updateCustCode.trim() || undefined,
          items: updateCart.map(i => ({ product_code: i.product_code, quantity: i.quantity })),
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      show("success", `Credit updated! New code: ${d?.new_credit?.credit_code}`);
      setUpdateRes(d);
      setUpdateCart([]); setUpdateCode(""); setUCC("");
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // Customer search debounce
useEffect(() => {
    const handler = (e) => {
        if (custSearchRef.current && !custSearchRef.current.contains(e.target))
            setShowCustSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
}, []);

useEffect(() => {
    if (!custSearch.trim()) {
        setCustSugg([]); setShowCustSugg(false); return;
    }
    const t = setTimeout(async () => {
        setCustSL(true);
        try {
            const params = new URLSearchParams({ q: custSearch });
            if (selectedBranch?.branch_code)
                params.append("business_code",
                    selectedBranch.branch_code.split("-")[0]);
            const r = await fetch(
                `${API}/search-customers?${params}`,
                { headers: authHeader() }
            );
            const d = await r.json();
            setCustSugg(d?.customers || []);
            setShowCustSugg(true);
        } catch { setCustSugg([]); }
        finally { setCustSL(false); }
    }, 280);
    return () => clearTimeout(t);
}, [custSearch]);

const fetchCustomerCredits = async (customer_code) => {
    if (!selectedBranch?._id) return;
    setCCL(true);
    setCustCredits(null);
    try {
        const r = await fetch(
            `${API}/customer-credits/${customer_code}/${selectedBranch._id}`,
            { headers: authHeader() }
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        setCustCredits(d);
    } catch (e) { show("error", e.message); }
    finally { setCCL(false); }
};

  // ── Reusable search dropdown ───────────────────────────────
  const SearchDropdown = ({ ref_, query, setQuery, sugg, showSugg,
                            setShow, qty, setQty, onSelect }) => (
    <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
      <div style={{ flex:1, position:"relative" }} ref={ref_}>
        <div style={{ position:"relative" }}>
          <input
            style={{
              width:"100%", padding:"9px 36px 9px 12px",
              background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:"6px", color:"var(--text)",
              fontFamily:"var(--font-body)", fontSize:"0.85rem", outline:"none"
            }}
            placeholder="Search product name or code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => sugg.length > 0 && setShow(true)}
          />
          <div style={{
            position:"absolute", right:"10px", top:"50%",
            transform:"translateY(-50%)", color:"var(--faint)", fontSize:"13px"
          }}>
            {searchLoading ? <Spinner /> : "⌕"}
          </div>
        </div>
        {showSugg && sugg.length > 0 && (
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
            background:"var(--surface2)", border:"1px solid var(--border2)",
            borderRadius:"8px", zIndex:100, overflow:"hidden",
            boxShadow:"0 8px 24px rgba(0,0,0,0.4)"
          }}>
            {sugg.map((p, i) => (
              <div key={i} onClick={() => onSelect(p)}
                style={{
                  padding:"10px 14px", cursor:"pointer",
                  borderBottom: i < sugg.length - 1 ? "1px solid var(--border)" : "none",
                  display:"flex", justifyContent:"space-between", gap:"12px",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight:500, fontSize:"0.85rem" }}>
                    {p.product_name.split(new RegExp(`(${query})`, 'gi'))
                      .map((part, j) =>
                        part.toLowerCase() === query.toLowerCase()
                          ? <mark key={j} style={{
                              background:"var(--accent-dim)", color:"var(--accent)",
                              borderRadius:"2px", padding:"0 1px"
                            }}>{part}</mark>
                          : part
                      )}
                  </div>
                  <div className="mono" style={{ fontSize:"0.72rem", color:"var(--muted)", marginTop:"2px" }}>
                    {p.product_code}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ color:"var(--accent)", fontFamily:"var(--font-mono)", fontSize:"0.85rem" }}>
                    ₹{p.selling_price}
                  </div>
                  <div style={{ fontSize:"0.7rem", color: p.quantity <= 10 ? "var(--danger)" : "var(--muted)", marginTop:"2px" }}>
                    {p.quantity} in stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showSugg && !searchLoading && query && sugg.length === 0 && (
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
            background:"var(--surface2)", border:"1px solid var(--border2)",
            borderRadius:"8px", padding:"12px 14px", zIndex:100,
            color:"var(--muted)", fontSize:"0.82rem"
          }}>
            No products found for "{query}"
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
        <div style={{ minWidth:"36px", textAlign:"center",
                      fontFamily:"var(--font-mono)", fontSize:"0.9rem" }}>{qty}</div>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setQty(q => q + 1)}>+</button>
        <div style={{ fontSize:"0.72rem", color:"var(--faint)",
                      fontFamily:"var(--font-mono)" }}>qty</div>
      </div>
    </div>
  );

  // ── Cart table ─────────────────────────────────────────────
  const CartTable = ({ cartData, cartSetter }) => {
    const total = cartData.reduce((s, i) => s + i.selling_price * i.quantity, 0);
    return cartData.length === 0 ? (
      <div className="empty" style={{ padding:"2rem 1rem" }}>
        <div className="empty-icon">🛒</div>
        Search and add products above.
      </div>
    ) : (
      <>
        <div className="tbl-wrap" style={{ marginBottom:"1rem" }}>
          <table>
            <thead><tr>
              <th>Product</th><th>Code</th>
              <th>Price</th><th>Qty</th>
              <th>Subtotal</th><th></th>
            </tr></thead>
            <tbody>
              {cartData.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight:500 }}>{item.product_name}</td>
                  <td className="mono" style={{ color:"var(--muted)" }}>{item.product_code}</td>
                  <td className="mono">₹{item.selling_price}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding:"2px 8px" }}
                        onClick={() => updateQtyInCart(cartSetter, item.product_code, item.quantity - 1)}>−</button>
                      <span className="mono">{item.quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding:"2px 8px" }}
                        onClick={() => updateQtyInCart(cartSetter, item.product_code, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  <td className="mono" style={{ color:"var(--accent)" }}>
                    ₹{(item.selling_price * item.quantity).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm"
                      style={{ color:"var(--danger)", padding:"4px 8px" }}
                      onClick={() => removeFromCart(cartSetter, item.product_code)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{
          display:"flex", justifyContent:"space-between",
          alignItems:"center", padding:"10px 0",
          borderTop:"1px solid var(--border)"
        }}>
          <div>
            <div className="stat-label">Total Credit Amount</div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:"1.5rem",
                          fontWeight:700, color:"var(--accent)" }}>
              ₹{total.toLocaleString("en-IN")}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => cartSetter([])}
            style={{ color:"var(--danger)" }}>
            ✕ Clear
          </button>
        </div>
      </>
    );
  };

  const ContextStrip = () => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"1rem", flexWrap:"wrap" }}>
      {selectedBranch && (
        <span className="badge badge-accent">
          ◆ {selectedBranch.branch_name} · {selectedBranch.branch_code}
        </span>
      )}
    </div>
  );

  const tabs = [
    { key:"overview", label:"Overview"      },
    { key:"add",      label:"Issue Credit"  },
    {key:"customer" , label:"Customer Credits"},
    { key:"view",     label:"View Credit"   },
    { key:"settle",   label:"Settle"        },
    { key:"bulk",     label:"Bulk Settle"   },
    { key:"update",   label:"Update Credit" },
  ];

  return (
    <div>
      <Alert alert={alert} />
      <div className="pill-tabs">
        {tabs.map(t => (
          <button key={t.key}
            className={`pill${activeTab === t.key ? " active" : ""}`}
            onClick={() => { setActiveTab(t.key); setCR(null); setCreditInfo(null);
                             setSettleRes(null); setBulkRes(null); setUpdateRes(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div>
          <ContextStrip />
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"1rem" }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchOverview} disabled={overviewLoading}>
              {overviewLoading ? <Spinner /> : "↻"} Refresh
            </button>
          </div>
          {overviewLoading ? (
            <div className="empty"><Spinner /> Loading...</div>
          ) : overview ? (
            <>
              <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                {[
                  { label:"Unsettled",        value: overview.unsettled_count ?? 0, color:"var(--danger)"  },
                  { label:"Partially Settled", value: overview.partial_count   ?? 0, color:"var(--warning)" },
                  { label:"Settled",           value: overview.settled_count   ?? 0, color:"var(--success)" },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Unsettled credits table */}
              {overview.unsettled?.length > 0 && (
                <div className="card" style={{ marginBottom:"1rem" }}>
                  <div className="section-title" style={{ marginBottom:"0.75rem" }}>
                    Unsettled Credits
                    <span className="badge badge-danger" style={{ marginLeft:"8px" }}>
                      {overview.unsettled_count}
                    </span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead><tr>
                        <th>Credit Code</th><th>Customer</th>
                        <th>Total</th><th>Remaining</th><th>Risk</th>
                      </tr></thead>
                      <tbody>
                        {overview.unsettled.map((c, i) => (
                          <tr key={i}>
                            <td className="mono" style={{ fontSize:"0.75rem", color:"var(--muted)" }}>
                              {c.credit_code}
                            </td>
                            <td className="mono">{c.customer_code}</td>
                            <td className="mono">₹{Number(c.total_amount).toLocaleString("en-IN")}</td>
                            <td className="mono" style={{ color:"var(--danger)" }}>
                              ₹{Number(c.remaining_amount).toLocaleString("en-IN")}
                            </td>
                            <td>
                              {c.risk_suggestion?.decision ? (
                                <RiskBadge decision={c.risk_suggestion.decision}
                                           score={c.risk_suggestion.risk_score} />
                              ) : <span className="badge badge-info">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Partially settled */}
              {overview.partial?.length > 0 && (
                <div className="card">
                  <div className="section-title" style={{ marginBottom:"0.75rem" }}>
                    Partially Settled
                    <span className="badge badge-warning" style={{ marginLeft:"8px" }}>
                      {overview.partial_count}
                    </span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead><tr>
                        <th>Credit Code</th><th>Customer</th>
                        <th>Total</th><th>Paid</th><th>Remaining</th>
                      </tr></thead>
                      <tbody>
                        {overview.partial.map((c, i) => (
                          <tr key={i}>
                            <td className="mono" style={{ fontSize:"0.75rem", color:"var(--muted)" }}>
                              {c.credit_code}
                            </td>
                            <td className="mono">{c.customer_code}</td>
                            <td className="mono">₹{Number(c.total_amount).toLocaleString("en-IN")}</td>
                            <td className="mono" style={{ color:"var(--success)" }}>
                              ₹{Number(c.amount_paid).toLocaleString("en-IN")}
                            </td>
                            <td className="mono" style={{ color:"var(--warning)" }}>
                              ₹{Number(c.remaining_amount).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {overview.unsettled_count === 0 && overview.partial_count === 0 && (
                <div className="empty">
                  <div className="empty-icon">✓</div>
                  All credits settled for this branch.
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <div className="empty-icon">💳</div>No data yet.
            </div>
          )}
        </div>
      )}

      {/* ── ISSUE CREDIT ── */}
     {activeTab === "add" && (
    <div>
        <ContextStrip />
        {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
        ) : (
            <>
                {/* Step 1 — Customer */}
                <div className="card" style={{ marginBottom:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center",
                                  gap:"8px", marginBottom:"0.75rem" }}>
                        <div style={{
                            width:"22px", height:"22px", borderRadius:"50%",
                            background:"var(--accent)", color:"#0d0d0d",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:"11px", fontWeight:700, flexShrink:0
                        }}>1</div>
                        <div className="section-title">Customer</div>
                    </div>
                    <div className="field">
                        <label>Customer Code</label>
                        <input
                            placeholder="e.g. CUST-san1"
                            value={customerCode}
                            onChange={e => {
                                setCC(e.target.value);
                                setPrecheckDone(false);
                                setPrecheckResult(null);
                            }}
                        />
                    </div>
                </div>

                {/* Step 2 — Products */}
                <div className="card" style={{ marginBottom:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center",
                                  gap:"8px", marginBottom:"0.75rem" }}>
                        <div style={{
                            width:"22px", height:"22px", borderRadius:"50%",
                            background:"var(--accent)", color:"#0d0d0d",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:"11px", fontWeight:700, flexShrink:0
                        }}>2</div>
                        <div className="section-title">Add Products</div>
                    </div>
                    <SearchDropdown
                        ref_={searchRef} query={searchQuery} setQuery={setSearch}
                        sugg={suggestions} showSugg={showSugg} setShow={setShowSugg}
                        qty={selectedQty} setQty={setQty}
                        onSelect={(p) => {
                            addToCart(setCart, p, selectedQty);
                            setSearch(""); setSugg([]); setShowSugg(false); setQty(1);
                            setPrecheckDone(false); setPrecheckResult(null);
                        }}
                    />
                </div>

                {/* Cart */}
                {cart.length > 0 && (
                    <div className="card" style={{ marginBottom:"1rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between",
                                      alignItems:"center", marginBottom:"1rem" }}>
                            <div className="section-title">
                                Cart
                                <span className="badge badge-accent" style={{ marginLeft:"8px" }}>
                                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                        <CartTable cartData={cart} cartSetter={setCart} />
                    </div>
                )}

                {/* Step 3 — Risk check BEFORE issuing */}
                {cart.length > 0 && customerCode.trim() && (
                    <div className="card" style={{ marginBottom:"1rem" }}>
                        <div style={{ display:"flex", alignItems:"center",
                                      gap:"8px", marginBottom:"0.75rem" }}>
                            <div style={{
                                width:"22px", height:"22px", borderRadius:"50%",
                                background: precheckDone
                                    ? (precheckResult?.decision === "APPROVE"
                                       ? "var(--success)" : precheckResult?.decision === "DENY"
                                       ? "var(--danger)" : "var(--warning)")
                                    : "var(--surface3)",
                                color: precheckDone ? "#0d0d0d" : "var(--muted)",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:"11px", fontWeight:700, flexShrink:0,
                                transition:"background 0.3s"
                            }}>3</div>
                            <div className="section-title">Risk Assessment</div>
                        </div>

                        {!precheckDone ? (
                            <div style={{ display:"flex", alignItems:"center",
                                          gap:"12px", flexWrap:"wrap" }}>
                                <div style={{ color:"var(--muted)", fontSize:"0.83rem" }}>
                                    Run a risk check before issuing credit.
                                </div>
                                <button
                                    className="btn btn-ghost"
                                    onClick={runPrecheck}
                                    disabled={precheckLoading}
                                    style={{ flexShrink:0 }}
                                >
                                    {precheckLoading ? <Spinner /> : "⚡"} Check Risk
                                </button>
                            </div>
                        ) : (
                            <div>
                                {/* Decision banner */}
                                <div style={{
                                    padding:"12px 16px", borderRadius:"8px", marginBottom:"0.75rem",
                                    background:
                                        precheckResult?.decision === "APPROVE" ? "var(--success-dim)" :
                                        precheckResult?.decision === "DENY"    ? "var(--danger-dim)"  :
                                        "var(--warning-dim)",
                                    border: `1px solid ${
                                        precheckResult?.decision === "APPROVE"
                                            ? "rgba(92,184,122,0.3)"
                                        : precheckResult?.decision === "DENY"
                                            ? "rgba(224,90,74,0.3)"
                                        : "rgba(232,168,58,0.3)"
                                    }`,
                                    display:"flex", alignItems:"center",
                                    justifyContent:"space-between", gap:"12px", flexWrap:"wrap"
                                }}>
                                    <div>
                                        <div style={{
                                            fontFamily:"var(--font-head)", fontSize:"1rem",
                                            fontWeight:700,
                                            color:
                                                precheckResult?.decision === "APPROVE" ? "var(--success)" :
                                                precheckResult?.decision === "DENY"    ? "var(--danger)"  :
                                                "var(--warning)"
                                        }}>
                                            {precheckResult?.decision === "APPROVE" ? "✓ Approved to issue" :
                                             precheckResult?.decision === "DENY"    ? "✕ High risk — Do not issue" :
                                             precheckResult?.decision === "UNAVAILABLE" ? "ML Unavailable" :
                                             "⚠ Review recommended"}
                                        </div>
                                        {precheckResult?.risk_score != null && (
                                            <div style={{ fontSize:"0.78rem",
                                                          color:"var(--muted)", marginTop:"3px",
                                                          fontFamily:"var(--font-mono)" }}>
                                                Risk score: {precheckResult.risk_score}
                                                {precheckResult.risk_label &&
                                                    ` · ${precheckResult.risk_label}`}
                                            </div>
                                        )}
                                    </div>
                                    <button className="btn btn-ghost btn-sm"
                                        onClick={runPrecheck} disabled={precheckLoading}>
                                        {precheckLoading ? <Spinner /> : "↻"} Recheck
                                    </button>
                                </div>

                                {/* Recommendation text */}
                                {precheckResult?.recommendation && (
                                    <div style={{
                                        fontSize:"0.82rem", color:"var(--muted)",
                                        lineHeight:1.6, marginBottom:"0.75rem"
                                    }}>
                                        {precheckResult.recommendation}
                                    </div>
                                )}

                                {/* History summary if available */}
                                {precheckResult?.history_summary && (
                                    <div className="stat-grid" style={{ marginBottom:"0.75rem" }}>
                                        {[
                                            { label:"Total Credits",
                                              value: precheckResult.history_summary.total_credits },
                                            { label:"Defaults",
                                              value: precheckResult.history_summary.total_defaults,
                                              color:"var(--danger)" },
                                            { label:"Late Payments",
                                              value: precheckResult.history_summary.total_late,
                                              color:"var(--warning)" },
                                            { label:"Repayment Ratio",
                                              value: `${((precheckResult.history_summary.repayment_ratio || 0) * 100).toFixed(1)}%`,
                                              color:"var(--success)" },
                                        ].map(s => (
                                            <div className="stat-card" key={s.label}>
                                                <span className="stat-label">{s.label}</span>
                                                <span className="stat-value"
                                                      style={{ fontSize:"1rem",
                                                               color: s.color || "var(--text)" }}>
                                                    {s.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4 — Issue button */}
                {cart.length > 0 && (
                    <div className="card">
                        <div style={{ display:"flex", alignItems:"center",
                                      gap:"8px", marginBottom:"1rem" }}>
                            <div style={{
                                width:"22px", height:"22px", borderRadius:"50%",
                                background:"var(--surface3)", color:"var(--muted)",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:"11px", fontWeight:700, flexShrink:0
                            }}>4</div>
                            <div className="section-title">Issue Credit</div>
                        </div>

                        {/* Warn if DENY but still allow */}
                        {precheckDone && precheckResult?.decision === "DENY" && (
                            <div className="alert alert-error" style={{ marginBottom:"1rem" }}>
                                ✕ Risk assessment recommends denying this credit.
                                You can still issue it, but proceed with caution.
                            </div>
                        )}

                        {!precheckDone && (
                            <div className="alert alert-warning" style={{ marginBottom:"1rem" }}>
                                ⚠ Risk check not completed. Consider running it before issuing.
                            </div>
                        )}

                        <div style={{
                            display:"flex", justifyContent:"space-between",
                            alignItems:"center", padding:"12px 0",
                            borderTop:"1px solid var(--border)"
                        }}>
                            <div>
                                <div className="stat-label">Total Credit Amount</div>
                                <div style={{
                                    fontFamily:"var(--font-head)", fontSize:"1.6rem",
                                    fontWeight:700, color:"var(--accent)"
                                }}>
                                    ₹{cart.reduce((s, i) =>
                                        s + i.selling_price * i.quantity, 0
                                    ).toLocaleString("en-IN")}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={submitCredit}
                                disabled={loading || !customerCode.trim()}
                                style={{ padding:"10px 24px", fontSize:"0.9rem" }}
                            >
                                {loading ? <Spinner dark /> : "◆"} Issue Credit
                            </button>
                        </div>
                    </div>
                )}

                {/* Success result */}
                {creditResult && (
                    <div className="card" style={{ marginTop:"1rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                            <div style={{
                                width:"40px", height:"40px", borderRadius:"8px",
                                background:"var(--success-dim)",
                                border:"1px solid rgba(92,184,122,0.3)",
                                display:"flex", alignItems:"center",
                                justifyContent:"center", fontSize:"18px"
                            }}>💳</div>
                            <div>
                                <div style={{ fontWeight:600, color:"var(--success)" }}>
                                    Credit Issued Successfully
                                </div>
                                <div className="mono" style={{ fontSize:"0.78rem",
                                     color:"var(--muted)", marginTop:"2px" }}>
                                    {creditResult?.data?.credit_code}
                                </div>
                                <div style={{ fontSize:"0.78rem",
                                     color:"var(--faint)", marginTop:"2px" }}>
                                    ₹{Number(creditResult?.data?.total_amount || 0)
                                        .toLocaleString("en-IN")} · {
                                        creditResult?.data?.items?.length} item(s)
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
)}

      {/* ── VIEW CREDIT ── */}
      {activeTab === "view" && (
        <div className="card">
          <ContextStrip />
          <div className="stat-label" style={{ marginBottom:"0.6rem" }}>
            Look up a credit by code
          </div>
          <div style={{ display:"flex", gap:"10px", marginBottom:"1rem" }}>
            <input
              style={{
                flex:1, padding:"9px 12px", background:"var(--surface2)",
                border:"1px solid var(--border)", borderRadius:"6px",
                color:"var(--text)", fontFamily:"var(--font-body)",
                fontSize:"0.85rem", outline:"none"
              }}
              placeholder="e.g. CUST-san1-17042026-1"
              value={creditCode}
              onChange={e => setCreditCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && getCredit()}
            />
            <button className="btn btn-primary" onClick={getCredit} disabled={loading}>
              {loading ? <Spinner dark /> : "→"} Look up
            </button>
          </div>

          {creditInfo && (
            <div>
              <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                {[
                  { label:"Credit Code",   value: creditInfo.credit_code,   mono:true },
                  { label:"Customer",      value: creditInfo.customer_code,  mono:true },
                  { label:"Total Amount",  value: `₹${Number(creditInfo.total_amount).toLocaleString("en-IN")}` },
                  { label:"Amount Paid",   value: `₹${Number(creditInfo.amount_paid || 0).toLocaleString("en-IN")}`, color:"var(--success)" },
                  { label:"Remaining",     value: `₹${Number(creditInfo.remaining_amount || 0).toLocaleString("en-IN")}`, color:"var(--danger)" },
                  { label:"Status",        value: creditInfo.status || "—" },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <span className="stat-label">{s.label}</span>
                    <span className={`stat-value${s.mono ? " mono" : ""}`}
                          style={{ fontSize: s.mono ? "0.82rem" : "1.1rem",
                                   color: s.color || "var(--text)" }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Items */}
              {creditInfo.items?.length > 0 && (
                <div className="tbl-wrap">
                  <table>
                    <thead><tr>
                      <th>Product</th><th>Qty</th>
                      <th>Price/Unit</th><th>Total</th>
                    </tr></thead>
                    <tbody>
                      {creditInfo.items.map((item, i) => (
                        <tr key={i}>
                          <td className="mono">{item.product_code}</td>
                          <td className="mono">{item.quantity}</td>
                          <td className="mono">₹{Number(item.price_per_unit).toLocaleString("en-IN")}</td>
                          <td className="mono" style={{ color:"var(--accent)" }}>
                            ₹{Number(item.total_cost).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Risk info if available */}
              {creditInfo.risk_suggestion?.decision && (
                <div className="alert alert-info" style={{ marginTop:"1rem" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                      <strong>Risk Assessment at Issuance</strong>
                      <RiskBadge decision={creditInfo.risk_suggestion.decision}
                                 score={creditInfo.risk_suggestion.risk_score} />
                    </div>
                    {creditInfo.risk_suggestion.recommendation && (
                      <div style={{ fontSize:"0.8rem" }}>
                        {creditInfo.risk_suggestion.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SETTLE BY CODE ── */}
      {activeTab === "settle" && (
        <div className="card">
          <ContextStrip />
          <div className="stat-label" style={{ marginBottom:"0.6rem" }}>
            Settle a specific credit
          </div>
          <div className="form-grid" style={{ marginBottom:"1rem" }}>
            <div className="field">
              <label>Credit Code</label>
              <input placeholder="CUST-san1-17042026-1"
                value={settleCode} onChange={e => setSettleCode(e.target.value)} />
            </div>
            <div className="field">
              <label>Amount to Pay (₹)</label>
              <input type="number" min="1" placeholder="500"
                value={settleAmt} onChange={e => setSettleAmt(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={settleCredit}
            disabled={loading || !settleCode.trim() || !settleAmt}>
            {loading ? <Spinner dark /> : "₹"} Settle Payment
          </button>

          {settleResult && (
            <div className="card-sm" style={{ marginTop:"1rem",
                 display:"flex", gap:"14px", alignItems:"center" }}>
              <div style={{
                width:"40px", height:"40px", borderRadius:"8px",
                background:"var(--success-dim)",
                border:"1px solid rgba(92,184,122,0.3)",
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:"18px"
              }}>✓</div>
              <div>
                <div style={{ fontWeight:600, color:"var(--success)" }}>Payment Recorded</div>
                <div className="mono" style={{ fontSize:"0.78rem",
                     color:"var(--muted)", marginTop:"3px" }}>
                  Status: {settleResult.status}
                </div>
                <div style={{ fontSize:"0.78rem", color:"var(--faint)", marginTop:"2px" }}>
                  Remaining: ₹{Number(settleResult.remaining_amount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BULK SETTLE ── */}
      {activeTab === "bulk" && (
        <div className="card">
          <ContextStrip />
          <div className="alert alert-info" style={{ marginBottom:"1rem" }}>
            ℹ Distributes a payment across all active credits for a customer,
            oldest first.
          </div>
          <div className="form-grid" style={{ marginBottom:"1rem" }}>
            <div className="field">
              <label>Customer Code</label>
              <input placeholder="CUST-san1"
                value={bulkCC} onChange={e => setBulkCC(e.target.value)} />
            </div>
            <div className="field">
              <label>Total Amount (₹)</label>
              <input type="number" min="1" placeholder="1000"
                value={bulkAmt} onChange={e => setBulkAmt(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={bulkSettle}
            disabled={loading || !bulkCC.trim() || !bulkAmt}>
            {loading ? <Spinner dark /> : "⚡"} Bulk Settle
          </button>

          {bulkResult && (
            <div className="stat-grid" style={{ marginTop:"1rem" }}>
              {[
                { label:"Total Paid",    value:`₹${Number(bulkResult.total_paid).toLocaleString("en-IN")}`, color:"var(--success)" },
                { label:"Credits Updated", value: bulkResult.updated_count },
                { label:"Unallocated",   value:`₹${Number(bulkResult.remaining_unallocated || 0).toLocaleString("en-IN")}`, color:"var(--warning)" },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value" style={{ color: s.color || "var(--text)", fontSize:"1.2rem" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── UPDATE CREDIT ── */}
      {activeTab === "update" && (
        <div>
          <ContextStrip />
          <div className="alert alert-warning" style={{ marginBottom:"1rem" }}>
            ⚠ Updating a credit cancels the existing one and creates a new one
            with the same code. Stock is restored then re-deducted.
          </div>
          <div className="card" style={{ marginBottom:"1rem" }}>
            <div className="form-grid">
              <div className="field">
                <label>Credit Code to Update</label>
                <input placeholder="CUST-san1-17042026-1"
                  value={updateCode} onChange={e => setUpdateCode(e.target.value)} />
              </div>
              <div className="field">
                <label>Customer Code (optional)</label>
                <input placeholder="Leave blank to keep existing"
                  value={updateCustCode} onChange={e => setUCC(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom:"1rem" }}>
            <div className="stat-label" style={{ marginBottom:"0.6rem" }}>
              New Items
            </div>
            <SearchDropdown
              ref_={updateRef} query={updateSearch} setQuery={setUS}
              sugg={updateSugg} showSugg={showUSugg} setShow={setShowUSugg}
              qty={updateQty} setQty={setUQty}
              onSelect={(p) => {
                addToCart(setUpdateCart, p, updateQty);
                setUS(""); setUSugg([]); setShowUSugg(false); setUQty(1);
              }}
            />
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom:"1rem" }}>
              New Cart
              {updateCart.length > 0 && (
                <span className="badge badge-accent" style={{ marginLeft:"8px" }}>
                  {updateCart.length} item{updateCart.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <CartTable cartData={updateCart} cartSetter={setUpdateCart} />
            {updateCart.length > 0 && (
              <button className="btn btn-primary"
                style={{ marginTop:"1rem", width:"100%", padding:"11px" }}
                onClick={submitUpdate}
                disabled={loading || !updateCode.trim()}>
                {loading ? <Spinner dark /> : "↻"} Update Credit
              </button>
            )}
          </div>

          {updateResult && (
            <div className="card-sm" style={{ marginTop:"1rem",
                 display:"flex", gap:"14px", alignItems:"center" }}>
              <div style={{
                width:"40px", height:"40px", borderRadius:"8px",
                background:"var(--accent-dim)",
                border:"1px solid rgba(232,201,122,0.3)",
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:"18px"
              }}>↻</div>
              <div>
                <div style={{ fontWeight:600, color:"var(--accent)" }}>Credit Updated</div>
                <div className="mono" style={{ fontSize:"0.78rem",
                     color:"var(--muted)", marginTop:"3px" }}>
                  {updateResult?.new_credit?.credit_code}
                </div>
                <div style={{ fontSize:"0.78rem", color:"var(--faint)", marginTop:"2px" }}>
                  ₹{Number(updateResult?.new_credit?.total_amount || 0).toLocaleString("en-IN")} total
                </div>
              </div>
            </div>
          )}
        </div>
      )}

     {activeTab === "customer" && (
    <div>
        <ContextStrip />

        {/* Customer search */}
        <div className="card" style={{ marginBottom:"1rem" }}>
            <div className="stat-label" style={{ marginBottom:"0.6rem" }}>
                Search customer by name, code, or phone
            </div>
            <div style={{ position:"relative" }} ref={custSearchRef}>
                <div style={{ position:"relative" }}>
                    <input
                        style={{
                            width:"100%", padding:"9px 36px 9px 12px",
                            background:"var(--surface2)",
                            border:"1px solid var(--border)",
                            borderRadius:"6px", color:"var(--text)",
                            fontFamily:"var(--font-body)",
                            fontSize:"0.85rem", outline:"none"
                        }}
                        placeholder="e.g. sandeep, CUST-san1, 9813..."
                        value={custSearch}
                        onChange={e => {
                            setCustSearch(e.target.value);
                            setSelectedCust(null);
                            setCustCredits(null);
                        }}
                        onFocus={() => custSugg.length > 0 && setShowCustSugg(true)}
                    />
                    <div style={{
                        position:"absolute", right:"10px", top:"50%",
                        transform:"translateY(-50%)",
                        color:"var(--faint)", fontSize:"13px"
                    }}>
                        {custSuggLoading ? <Spinner /> : "⌕"}
                    </div>
                </div>

                {/* Suggestions dropdown */}
                {showCustSugg && custSugg.length > 0 && (
                    <div style={{
                        position:"absolute", top:"calc(100% + 4px)",
                        left:0, right:0,
                        background:"var(--surface2)",
                        border:"1px solid var(--border2)",
                        borderRadius:"8px", zIndex:100, overflow:"hidden",
                        boxShadow:"0 8px 24px rgba(0,0,0,0.4)"
                    }}>
                        {custSugg.map((c, i) => (
                            <div key={i}
                                onClick={() => {
                                    setSelectedCust(c);
                                    setCustSearch(c.customer_name);
                                    setShowCustSugg(false);
                                    fetchCustomerCredits(c.customer_code);
                                }}
                                style={{
                                    padding:"10px 14px", cursor:"pointer",
                                    borderBottom: i < custSugg.length - 1
                                        ? "1px solid var(--border)" : "none",
                                    display:"flex", alignItems:"center",
                                    gap:"12px", transition:"background 0.1s"
                                }}
                                onMouseEnter={e =>
                                    e.currentTarget.style.background = "var(--surface3)"}
                                onMouseLeave={e =>
                                    e.currentTarget.style.background = "transparent"}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width:"34px", height:"34px", borderRadius:"50%",
                                    background:"var(--accent-dim)",
                                    border:"1px solid rgba(232,201,122,0.3)",
                                    display:"flex", alignItems:"center",
                                    justifyContent:"center", fontSize:"11px",
                                    color:"var(--accent)", fontWeight:600, flexShrink:0
                                }}>
                                    {(c.customer_name || "C")
                                        .split(" ").map(w => w[0]).join("")
                                        .slice(0,2).toUpperCase()}
                                </div>
                                <div style={{ flex:1 }}>
                                    {/* Highlight match */}
                                    <div style={{ fontWeight:500, fontSize:"0.85rem" }}>
                                        {(c.customer_name || "").split(
                                            new RegExp(`(${custSearch})`, 'gi'))
                                            .map((part, j) =>
                                                part.toLowerCase() ===
                                                custSearch.toLowerCase()
                                                    ? <mark key={j} style={{
                                                        background:"var(--accent-dim)",
                                                        color:"var(--accent)",
                                                        borderRadius:"2px",
                                                        padding:"0 1px"
                                                      }}>{part}</mark>
                                                    : part
                                            )}
                                    </div>
                                    <div style={{
                                        display:"flex", gap:"10px",
                                        marginTop:"2px", flexWrap:"wrap"
                                    }}>
                                        <span className="mono" style={{
                                            fontSize:"0.72rem", color:"var(--muted)"
                                        }}>
                                            {c.customer_code}
                                        </span>
                                        {c.customer_phonenumber && (
                                            <span className="mono" style={{
                                                fontSize:"0.72rem", color:"var(--faint)"
                                            }}>
                                                {c.customer_phonenumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="badge badge-info"
                                      style={{ fontSize:"0.68rem", flexShrink:0 }}>
                                    Select
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {showCustSugg && !custSuggLoading &&
                 custSearch && custSugg.length === 0 && (
                    <div style={{
                        position:"absolute", top:"calc(100% + 4px)",
                        left:0, right:0,
                        background:"var(--surface2)",
                        border:"1px solid var(--border2)",
                        borderRadius:"8px", padding:"12px 14px",
                        zIndex:100, color:"var(--muted)", fontSize:"0.82rem"
                    }}>
                        No customers found for "{custSearch}"
                    </div>
                )}
            </div>
        </div>

        {/* Selected customer info */}
        {selectedCust && (
            <div className="card-sm" style={{
                marginBottom:"1rem", display:"flex",
                alignItems:"center", gap:"12px"
            }}>
                <div style={{
                    width:"40px", height:"40px", borderRadius:"50%",
                    background:"var(--accent-dim)",
                    border:"1px solid rgba(232,201,122,0.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-head)", fontSize:"14px",
                    color:"var(--accent)", fontWeight:700, flexShrink:0
                }}>
                    {(selectedCust.customer_name || "C")
                        .split(" ").map(w => w[0]).join("")
                        .slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:"0.9rem" }}>
                        {selectedCust.customer_name}
                    </div>
                    <div style={{ display:"flex", gap:"10px",
                                  marginTop:"3px", flexWrap:"wrap" }}>
                        <span className="mono" style={{
                            fontSize:"0.75rem", color:"var(--accent)"
                        }}>
                            {selectedCust.customer_code}
                        </span>
                        {selectedCust.customer_phonenumber && (
                            <span className="mono" style={{
                                fontSize:"0.75rem", color:"var(--muted)"
                            }}>
                                📞 {selectedCust.customer_phonenumber}
                            </span>
                        )}
                        {selectedCust.customer_email && (
                            <span style={{
                                fontSize:"0.75rem", color:"var(--muted)"
                            }}>
                                ✉ {selectedCust.customer_email}
                            </span>
                        )}
                    </div>
                </div>
                <button className="btn btn-ghost btn-sm"
                    onClick={() => fetchCustomerCredits(selectedCust.customer_code)}
                    disabled={custCreditsLoading}>
                    {custCreditsLoading ? <Spinner /> : "↻"} Refresh
                </button>
            </div>
        )}

        {/* Credits result */}
        {custCreditsLoading && (
            <div className="empty"><Spinner /> Loading credits...</div>
        )}

        {custCredits && !custCreditsLoading && (
            <div>
                {/* Summary stats */}
                <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                    {[
                        { label:"Total Credited",
                          value:`₹${Number(custCredits.total_credited || 0)
                              .toLocaleString("en-IN")}`,
                          color:"var(--text)" },
                        { label:"Outstanding",
                          value:`₹${Number(custCredits.total_outstanding || 0)
                              .toLocaleString("en-IN")}`,
                          color:"var(--danger)" },
                        { label:"Unsettled",
                          value: custCredits.unsettled_count ?? 0,
                          color:"var(--danger)" },
                        { label:"Partial",
                          value: custCredits.partial_count ?? 0,
                          color:"var(--warning)" },
                        { label:"Settled",
                          value: custCredits.settled_count ?? 0,
                          color:"var(--success)" },
                    ].map(s => (
                        <div className="stat-card" key={s.label}>
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value"
                                  style={{ fontSize:"1.1rem", color: s.color }}>
                                {s.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Credit tables */}
                {[
                    { key:"unsettled", label:"Unsettled",
                      data: custCredits.unsettled,
                      badgeClass:"badge-danger", color:"var(--danger)" },
                    { key:"partial",   label:"Partially Settled",
                      data: custCredits.partial,
                      badgeClass:"badge-warning", color:"var(--warning)" },
                    { key:"settled",   label:"Settled",
                      data: custCredits.settled,
                      badgeClass:"badge-success", color:"var(--success)" },
                ].map(section => section.data?.length > 0 && (
                    <div className="card" key={section.key}
                         style={{ marginBottom:"1rem" }}>
                        <div style={{
                            display:"flex", alignItems:"center",
                            gap:"8px", marginBottom:"0.75rem"
                        }}>
                            <div className="section-title">{section.label}</div>
                            <span className={`badge ${section.badgeClass}`}>
                                {section.data.length}
                            </span>
                        </div>
                        <div className="tbl-wrap">
                            <table>
                                <thead><tr>
                                    <th>Credit Code</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Remaining</th>
                                    <th>Risk</th>
                                    <th>Issued</th>
                                    <th>Items</th>
                                </tr></thead>
                                <tbody>
                                    {section.data.map((c, i) => (
                                        <tr key={i}>
                                            <td className="mono"
                                                style={{ fontSize:"0.72rem",
                                                         color:"var(--muted)" }}>
                                                {c.credit_code}
                                            </td>
                                            <td className="mono">
                                                ₹{Number(c.total_amount || 0)
                                                    .toLocaleString("en-IN")}
                                            </td>
                                            <td className="mono"
                                                style={{ color:"var(--success)" }}>
                                                ₹{Number(c.amount_paid || 0)
                                                    .toLocaleString("en-IN")}
                                            </td>
                                            <td className="mono"
                                                style={{ color: section.color }}>
                                                ₹{Number(c.remaining_amount || 0)
                                                    .toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                {c.risk_suggestion?.decision &&
                                                 c.risk_suggestion.decision !== "UNAVAILABLE"
                                                    ? <RiskBadge
                                                        decision={c.risk_suggestion.decision}
                                                        score={c.risk_suggestion.risk_score}
                                                      />
                                                    : <span style={{
                                                        color:"var(--faint)",
                                                        fontSize:"0.75rem",
                                                        fontFamily:"var(--font-mono)"
                                                      }}>—</span>
                                                }
                                            </td>
                                                    <td style={{ color:"var(--muted)", fontSize:"0.78rem" }}>
                                                     {c.issueDate || (c.createdAt
                                                     ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                                                     day:"2-digit", month:"short", year:"numeric"
                                                      })
                                                   : "—")}
                                                         </td>
                                            <td>
                                                <div style={{
                                                    display:"flex", flexWrap:"wrap", gap:"4px"
                                                }}>
                                                    {c.items?.map((item, j) => (
                                                        <span key={j}
                                                            className="badge badge-info"
                                                            style={{ fontSize:"0.65rem" }}>
                                                            {item.product_code} ×{item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {custCredits.unsettled_count === 0 &&
                 custCredits.partial_count   === 0 &&
                 custCredits.settled_count   === 0 && (
                    <div className="empty">
                        <div className="empty-icon">💳</div>
                        No credits found for this customer in this branch.
                    </div>
                )}
            </div>
        )}
    </div>
)}

    </div>
  );
}
function MLSection({ selectedBranch }) {
  const [alert, show]     = useAlert();
  const [activeTab, setActiveTab] = useState("status");
  const [loading, setLoading]     = useState(false);

  // Status
  const [status, setStatus]   = useState(null);
  const [statusLoading, setSL] = useState(false);

  // Training
  const [trainResult, setTrainResult] = useState({ demand: null, credit: null });

  // Restock
  const [restockDays, setRestockDays]   = useState(7);
  const [restockData, setRestockData]   = useState(null);

  // High-risk credits
  const [threshold, setThreshold]   = useState(0.65);
  const [highRiskData, setHighRisk] = useState(null);

  // ── Helpers ───────────────────────────────────────────────
  const branchCode = selectedBranch?.branch_code;

  const fetchStatus = useCallback(async () => {
    if (!branchCode) { show("error", "No branch selected"); return; }
    setSL(true);
    setStatus(null);
    try {
      const r = await fetch(
        `${ml}/status?branch_code=${encodeURIComponent(branchCode)}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setStatus(d);
    } catch (e) { show("error", e.message); }
    finally { setSL(false); }
  }, [branchCode]);

  useEffect(() => {
    if (activeTab === "status") fetchStatus();
  }, [activeTab, branchCode]);

  const trainModel = async (type) => {
    if (!branchCode) { show("error", "No branch selected"); return; }
    setLoading(true);
    try {
      const r = await fetch(`${ml}/${type}/train`, {
        method:  "POST",
        headers: authHeader(),
        body:    JSON.stringify({ branch_code: branchCode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.detail);
      show("success", `${type === "demand" ? "Demand" : "Credit"} model trained!`);
      setTrainResult(prev => ({ ...prev, [type]: d }));
      // Refresh status after training
      fetchStatus();
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  const fetchRestock = async () => {
    if (!branchCode) { show("error", "No branch selected"); return; }
    setLoading(true);
    setRestockData(null);
    try {
      const r = await fetch(
        `${ml}/demand/restock?branch_code=${encodeURIComponent(branchCode)}&days=${restockDays}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.detail);
      setRestockData(d?.data || d);
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  const fetchHighRisk = async () => {
    if (!branchCode) { show("error", "No branch selected"); return; }
    setLoading(true);
    setHighRisk(null);
    try {
      const r = await fetch(
        `${ml}/credit/high-risk?branch_code=${encodeURIComponent(branchCode)}&threshold=${threshold}`,
        { headers: authHeader() }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.detail);
      setHighRisk(d?.data || d);
    } catch (e) { show("error", e.message); }
    finally { setLoading(false); }
  };

  // ── Sub-components ────────────────────────────────────────
  const ContextStrip = () => (
    <div style={{ display:"flex", gap:"10px", marginBottom:"1rem", flexWrap:"wrap" }}>
      {selectedBranch && (
        <span className="badge badge-accent">
          ⚡ {selectedBranch.branch_name} · {selectedBranch.branch_code}
        </span>
      )}
    </div>
  );

  // Model status pill
const ModelPill = ({ label, modelData }) => {
    const exists = modelData?.model_exists;
    // FastAPI returns trained_at, not last_trained
    const trained = modelData?.trained_at;
    return (
        <div className="ml-model-card">
            <div className="ml-model-title">{label}</div>
            <div style={{ display:"flex", alignItems:"center",
                          gap:"8px", marginBottom:"0.75rem" }}>
                {exists
                    ? <span className="badge badge-success">● Trained</span>
                    : <span className="badge badge-danger">○ Not trained</span>}
                {modelData?.version && (
                    <span className="mono" style={{ fontSize:"0.7rem",
                         color:"var(--faint)" }}>
                        v{modelData.version}
                    </span>
                )}
            </div>
            {trained && (
                <div className="stat-sub" style={{ marginBottom:"0.75rem" }}>
                    Last trained: {new Date(trained).toLocaleString("en-IN", {
                        dateStyle:"medium", timeStyle:"short"
                    })}
                </div>
            )}
            {modelData?.metrics && Object.keys(modelData.metrics).length > 0 && (
                <div style={{ marginTop:"0.5rem" }}>
                    {Object.entries(modelData.metrics).map(([k, v]) => (
                        <div key={k} style={{
                            display:"flex", justifyContent:"space-between",
                            fontSize:"0.78rem", marginBottom:"4px"
                        }}>
                            <span style={{ color:"var(--muted)",
                                           textTransform:"capitalize" }}>
                                {k.replace(/_/g," ")}
                            </span>
                            <span className="mono" style={{ color:"var(--accent)" }}>
                                {typeof v === "number" ? v.toFixed(4) : String(v)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {!exists && (
                <div style={{ fontSize:"0.78rem", color:"var(--faint)",
                               marginTop:"0.5rem" }}>
                    Train this model to see metrics.
                </div>
            )}
        </div>
    );
};

  // Risk badge helper
  const RiskBadge = ({ score, threshold: t }) => {
    const pct = Math.round((score || 0) * 100);
    const cls  = pct >= 80 ? "badge-danger"
               : pct >= 65 ? "badge-warning"
               : "badge-success";
    return <span className={`badge ${cls}`}>{pct}% risk</span>;
  };

  const tabs = [
    { key: "status",    label: "Model Status"   },
    { key: "train",     label: "Train Models"   },
    { key: "restock",   label: "Restock Alerts" },
    { key: "high-risk", label: "High-Risk Credits" },
  ];

  return (
    <div>
      <Alert alert={alert} />
      <div className="pill-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`pill${activeTab === t.key ? " active" : ""}`}
            onClick={() => {
              setActiveTab(t.key);
              setRestockData(null);
              setHighRisk(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STATUS ── */}
      {activeTab === "status" && (
        <div>
          <ContextStrip />
          <div style={{ display:"flex", justifyContent:"flex-end",
                         marginBottom:"1rem" }}>
            <button className="btn btn-ghost btn-sm"
              onClick={fetchStatus} disabled={statusLoading}>
              {statusLoading ? <Spinner /> : "↻"} Refresh
            </button>
          </div>
          {statusLoading ? (
            <div className="empty"><Spinner /> Checking model status...</div>
          ) : status ? (
            <div className="ml-grid">
              <ModelPill label="Demand Model"
                modelData={status.demand_model} />
              <ModelPill label="Credit Risk Model"
                modelData={status.credit_model} />
            </div>
          ) : !selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              No status data yet.
            </div>
          )}
        </div>
      )}

      {/* ── TRAIN ── */}
      {activeTab === "train" && (
        <div>
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              <div className="alert alert-info" style={{ marginBottom:"1rem" }}>
                ℹ Training uses all sales & credit history for the selected branch.
                Demand training may take up to 2 minutes. Credit training up to 2 minutes.
              </div>

              <div className="ml-grid">
                {/* Demand model card */}
                <div className="card">
                  <div style={{ display:"flex", alignItems:"center",
                                 gap:"10px", marginBottom:"0.75rem" }}>
                    <div style={{
                      width:"36px", height:"36px", borderRadius:"8px",
                      background:"var(--info-dim)",
                      border:"1px solid rgba(74,144,217,0.3)",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:"18px"
                    }}>📈</div>
                    <div>
                      <div className="section-title">Demand Model</div>
                      <div className="stat-sub">
                        Predicts restock needs & demand per product
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width:"100%" }}
                    onClick={() => trainModel("demand")}
                    disabled={loading}
                  >
                    {loading ? <Spinner dark /> : "⚡"} Train Demand Model
                  </button>
                 
{trainResult.demand && (
    <div style={{ marginTop:"1rem" }}>
        <div style={{
            padding:"10px 12px", borderRadius:"6px",
            background:"var(--success-dim)",
            border:"1px solid rgba(92,184,122,0.25)",
            marginBottom:"0.75rem"
        }}>
            <div style={{ fontWeight:600, color:"var(--success)",
                           fontSize:"0.85rem" }}>
                ✓ {trainResult.demand.message || "Model trained successfully"}
            </div>
            <div className="mono" style={{ fontSize:"0.72rem",
                 color:"var(--muted)", marginTop:"3px" }}>
                Branch: {trainResult.demand.branch_code}
            </div>
        </div>
        {/* model_metrics comes from Node.js response */}
        {(trainResult.demand.model_metrics ||
          trainResult.demand.metrics) && (
            <div>
                <div className="stat-label" style={{ marginBottom:"0.5rem" }}>
                    Performance Metrics
                </div>
                {Object.entries(
                    trainResult.demand.model_metrics ||
                    trainResult.demand.metrics || {}
                ).map(([k, v]) => (
                    <div key={k} style={{
                        display:"flex", justifyContent:"space-between",
                        fontSize:"0.78rem", marginBottom:"4px",
                        padding:"4px 0",
                        borderBottom:"1px solid var(--border)"
                    }}>
                        <span style={{ color:"var(--muted)",
                                        textTransform:"capitalize" }}>
                            {k.replace(/_/g," ")}
                        </span>
                        <span className="mono" style={{ color:"var(--success)" }}>
                            {typeof v === "number" ? v.toFixed(4) : String(v)}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
)}
                </div>

                {/* Credit model card */}
                <div className="card">
                  <div style={{ display:"flex", alignItems:"center",
                                 gap:"10px", marginBottom:"0.75rem" }}>
                    <div style={{
                      width:"36px", height:"36px", borderRadius:"8px",
                      background:"var(--warning-dim)",
                      border:"1px solid rgba(232,168,58,0.3)",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:"18px"
                    }}>💳</div>
                    <div>
                      <div className="section-title">Credit Risk Model</div>
                      <div className="stat-sub">
                        Scores customers on repayment likelihood
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width:"100%" }}
                    onClick={() => trainModel("credit")}
                    disabled={loading}
                  >
                    {loading ? <Spinner dark /> : "⚡"} Train Credit Model
                  </button>
                  {trainResult.credit && (
                    <div style={{ marginTop:"1rem" }}>
                      <div className="stat-label" style={{ marginBottom:"0.5rem" }}>
                        Training Result
                      </div>
                      {trainResult.credit.model_metrics &&
                        Object.entries(trainResult.credit.model_metrics).map(([k, v]) => (
                          <div key={k} style={{
                            display:"flex", justifyContent:"space-between",
                            fontSize:"0.78rem", marginBottom:"4px"
                          }}>
                            <span style={{ color:"var(--muted)",
                                            textTransform:"capitalize" }}>
                              {k.replace(/_/g, " ")}
                            </span>
                            <span className="mono" style={{ color:"var(--success)" }}>
                              {typeof v === "number" ? v.toFixed(4) : String(v)}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── RESTOCK ── */}
      {activeTab === "restock" && (
        <div>
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              <div className="card" style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", gap:"12px",
                               alignItems:"flex-end", flexWrap:"wrap" }}>
                  <div className="field" style={{ flex:1, minWidth:"160px" }}>
                    <label>Forecast Window (days)</label>
                    <select
                      value={restockDays}
                      onChange={e => setRestockDays(Number(e.target.value))}
                    >
                      {[3, 7, 14, 30].map(d => (
                        <option key={d} value={d}>{d} days</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={fetchRestock}
                    disabled={loading}
                  >
                    {loading ? <Spinner dark /> : "📈"} Get Restock Recommendations
                  </button>
                </div>
              </div>

              {restockData && (() => {
                // Normalise — FastAPI may return { recommendations:[...] } or array
                const items = restockData?.recommendations
                           || restockData?.products
                           || (Array.isArray(restockData) ? restockData : null);
                return items?.length > 0 ? (
                  <>
                    <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                      <div className="stat-card">
                        <span className="stat-label">Products to restock</span>
                        <span className="stat-value">{items.length}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Forecast window</span>
                        <span className="stat-value">{restockDays}d</span>
                      </div>
                    </div>
                    <div className="tbl-wrap">
                      <table>
                        <thead><tr>
                          <th>Product</th>
                          <th>Code</th>
                          <th>Current Stock</th>
                          <th>Predicted Demand</th>
                          <th>Recommended Restock</th>
                          <th>Urgency</th>
                        </tr></thead>
                        <tbody>
                          {items.map((item, i) => {
                           
const urgency = item.urgency || (
    (item.current_stock ?? 0) <= 0 ? "Out of stock"
    : (item.restock_qty ?? 0) > (item.current_stock ?? 0) * 2 ? "HIGH"
    : (item.restock_qty ?? 0) > 0 ? "MEDIUM" : "LOW"
);
const urgencyCls =
    urgency === "Out of stock" || urgency === "HIGH" ? "badge-danger"
    : urgency === "MEDIUM" ? "badge-warning"
    : "badge-success";

// And restock column — FastAPI returns restock_qty not recommended_restock:
<td className="mono" style={{ color:"var(--accent)", fontWeight:600 }}>
    {item.restock_qty ?? item.recommended_restock ?? "—"}
</td>
                            return (
                              <tr key={i}>
                                <td style={{ fontWeight:500 }}>
                                  {item.product_name || item.product_code ||"—"}
                                </td>
                                <td className="mono" style={{ color:"var(--muted)" }}>
                                  {item.product_code || "—"}
                                </td>
                                <td className="mono"
                                    style={{ color: (item.current_stock ?? 0) <= 5
                                               ? "var(--danger)" : "var(--text)" }}>
                                  {item.current_stock ?? "—"}
                                </td>
                                <td className="mono" style={{ color:"var(--info)" }}>
                                  {item.predicted_demand != null
                                    ? Math.round(item.predicted_demand)
                                    : "—"}
                                </td>
                                <td className="mono" style={{ color:"var(--accent)",
                                     fontWeight:600 }}>
                                  {item.recommended_restock != null
                                    ? Math.round(item.recommended_restock)
                                    : "—"}
                                </td>
                                <td>
                                  <span className={`badge ${urgencyCls}`}>
                                    {urgency}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <div className="empty-icon">📦</div>
                    No restock recommendations. All products look healthy
                    for the next {restockDays} days.
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── HIGH-RISK CREDITS ── */}
      {activeTab === "high-risk" && (
        <div>
          <ContextStrip />
          {!selectedBranch ? (
            <div className="alert alert-warning">⚠ No branch selected.</div>
          ) : (
            <>
              <div className="card" style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", gap:"12px",
                               alignItems:"flex-end", flexWrap:"wrap" }}>
                  <div className="field" style={{ flex:1, minWidth:"200px" }}>
                    <label>Risk Threshold ({Math.round(threshold * 100)}%)</label>
                    <input
                      type="range" min="0.1" max="0.99" step="0.01"
                      value={threshold}
                      onChange={e => setThreshold(Number(e.target.value))}
                      style={{ width:"100%", accentColor:"var(--accent)" }}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between",
                                   fontSize:"0.7rem", color:"var(--faint)",
                                   marginTop:"2px" }}>
                      <span>Low risk</span><span>High risk</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={fetchHighRisk}
                    disabled={loading}
                  >
                    {loading ? <Spinner dark /> : "⚠"} Scan High-Risk Credits
                  </button>
                </div>
              </div>

              {highRiskData && (() => {
                const credits = highRiskData?.high_risk_credits
                             || highRiskData?.credits
                             || (Array.isArray(highRiskData) ? highRiskData : null);
                return credits?.length > 0 ? (
                  <>
                    <div className="stat-grid" style={{ marginBottom:"1rem" }}>
                      <div className="stat-card">
                        <span className="stat-label">High-risk credits</span>
                        <span className="stat-value"
                              style={{ color:"var(--danger)" }}>
                          {credits.length}
                        </span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Total at risk</span>
                        <span className="stat-value"
                              style={{ color:"var(--danger)", fontSize:"1.3rem" }}>
                          ₹{credits
                              .reduce((s, c) =>
                                s + Number(c.remaining_amount || c.total_amount || 0), 0)
                              .toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="tbl-wrap">
                      <table>
                        <thead><tr>
                          <th>Credit Code</th>
                          <th>Customer</th>
                          <th>Total</th>
                          <th>Remaining</th>
                          <th>Risk Score</th>
                          <th>Label</th>
                        </tr></thead>
                        <tbody>
                         {credits
    .slice()
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .map((c, i) => {
        const pct = Math.round((c.risk_score || 0) * 100);
        const barColor =
            pct >= 80 ? "var(--danger)"
            : pct >= 65 ? "var(--warning)"
            : "var(--info)";
        return (
            <tr key={i}>
                {/* Credit code */}
                <td className="mono" style={{ fontSize:"0.72rem",
                     color:"var(--muted)" }}>
                    {c.credit_code || "—"}
                </td>

                {/* Customer */}
                <td>
                    <div style={{ fontWeight:500, fontSize:"0.83rem" }}>
                        {c.customer_name !== "—" ? c.customer_name : c.customer_code}
                    </div>
                    <div style={{ display:"flex", gap:"8px",
                                  marginTop:"2px", flexWrap:"wrap" }}>
                        <span className="mono" style={{ fontSize:"0.7rem",
                             color:"var(--muted)" }}>
                            {c.customer_code}
                        </span>
                        {c.customer_phone !== "—" && (
                            <span className="mono" style={{ fontSize:"0.7rem",
                                 color:"var(--faint)" }}>
                                📞 {c.customer_phone}
                            </span>
                        )}
                    </div>
                </td>

                {/* Total */}
                <td className="mono">
                    ₹{Number(c.total_amount || 0).toLocaleString("en-IN")}
                </td>

                {/* Remaining */}
                <td className="mono" style={{ color:"var(--danger)" }}>
                    ₹{Number(c.remaining_amount || 0).toLocaleString("en-IN")}
                </td>

                {/* Risk score bar */}
                <td style={{ minWidth:"120px" }}>
                    <div style={{ fontSize:"0.75rem", marginBottom:"3px",
                                   color: barColor,
                                   fontFamily:"var(--font-mono)" }}>
                        {pct}%
                    </div>
                    <div className="risk-bar">
                        <div className="risk-fill"
                             style={{ width:`${pct}%`,
                                      background: barColor }}/>
                    </div>
                </td>

                {/* Label */}
                <td>
                    <span className={`badge ${
                        pct >= 80 ? "badge-danger"
                        : pct >= 65 ? "badge-warning"
                        : "badge-info"
                    }`}>
                        {c.risk_label || (pct >= 80 ? "HIGH"
                            : pct >= 65 ? "MEDIUM" : "LOW")}
                    </span>
                </td>
            </tr>
        );
    })
}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <div className="empty-icon">✓</div>
                    No credits above {Math.round(threshold * 100)}% risk threshold.
                    <div style={{ fontSize:"0.75rem", marginTop:"8px",
                                   color:"var(--faint)" }}>
                      Lower the threshold to see more results.
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ SHELL ═══════════════════════════ */
const NAV = [
  { section:"Main", items:[
    { key:"overview",  label:"Overview",  icon:"◈" },
    { key:"branches",  label:"Branches",  icon:"🏢" },
    { key:"products",  label:"Products",  icon:"📦" },
    { key:"sales",     label:"Sales",     icon:"📈" },
    { key:"credits",   label:"Credits",   icon:"💳" },
  ]},
  { section:"Intelligence", items:[
    { key:"ml",        label:"ML Models", icon:"⚡" },
  ]},
];

const TITLES = {
  overview:  ["Overview",  "Your business at a glance"],
  branches:  ["Branches",  "Create & analyze branches"],
  products:  ["Products",  "Manage your inventory"],
  sales:     ["Sales",     "Record & view transactions"],
  credits:   ["Credits",   "Track credit & settlements"],
  ml:        ["ML Models", "AI-powered forecasting & risk"],
};

export default function OwnerDashboard({ onLogout }) {
  const [page, setPage] = useState("overview");
  const [owner, setOwner] = useState(null);
  const [branches,setBranches] = useState([]);
  const [selectedBranch,setSelectedBranch] = useState(null);

useEffect(() => {
  fetch(`${API}/test-payload`, { headers: authHeader() })
    .then(r => r.json())
    .then(d => {
      const o = d?.data || d;

      setOwner({
        name: o.owner_name,
        email: o.emailid,
        business_code: o.business_code,
      });
    })
    .catch(() => {});
}, []);

useEffect(()=>{
  if(!owner?.business_code) return ;
  fetch(`${API}/get-branches/${owner.business_code}`,{
    headers:authHeader(),
  })
  .then(r => r.json())
  .then(d => {
    const list = d.branch_data || [];
    setBranches(list);

    if(list.length > 0) {
      setSelectedBranch(list[0]);
    }
  })
  .catch(()=>{});
},[owner]);

  const logout = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    else window.location.reload();
  };

  const initials = owner?.name
    ? owner.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
    : "OW";

  const [title, sub] = TITLES[page] || ["Dashboard", ""];

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-mark">M</div>
            MSME Hub
          </div>

          {NAV.map(group => (
            <div key={group.section}>
              <div className="sb-section">{group.section}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`sb-item${page === item.key ? " active" : ""}`}
                  onClick={() => setPage(item.key)}
                >
                  <span className="sb-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}

          <div className="sb-bottom">
            <div className="sb-user">
              <div className="sb-avatar">{initials}</div>
              <div>
                <div style={{fontWeight:500, color:"var(--text)", fontSize:"0.8rem"}}>
                  {owner?.name || "Owner"}
                </div>
                <div style={{fontSize:"0.7rem", fontFamily:"var(--font-mono)"}}>
                  {owner?.business_code || "—"}
                </div>
              </div>
            </div>
            <button className="sb-logout" onClick={logout}>Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{title}</div>
              <div className="topbar-sub">{sub}</div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
  <select
    value={selectedBranch?._id || ""}
    onChange={(e) => {
      const b = branches.find(x => x._id === e.target.value);
      setSelectedBranch(b);
    }}
    style={{
      padding: "6px 10px",
      background: "var(--surface2)",
      color: "var(--text)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      fontSize: "0.8rem"
    }}
  >
    {branches.map(b => (
      <option key={b._id} value={b._id}>
        {b.branch_name} ({b.branch_code})
      </option>
    ))}
  </select>

  <span className="badge badge-accent">
    {selectedBranch?.branch_code || "No Branch"}
  </span>
</div>
          </div>

          <div className="content">
            <div className="section-head">
              <div className="section-title">{title}</div>
            </div>

            {page === "overview" && <Overview owner={owner} selectedBranch = {selectedBranch}/>}
            {page === "branches" && <Branches owner = {owner} selectedBranch = {selectedBranch}/>}
            {page === "products" && <Products selectedBranch = {selectedBranch}/>}
            {page === "sales" && <Sales selectedBranch = {selectedBranch}/>}
            {page === "credits" && <Credits selectedBranch = {selectedBranch}/>}
            {page === "ml" && <MLSection selectedBranch = {selectedBranch}/>}
          </div>
        </main>
      </div>
    </>
  );
}