import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE

const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

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
    const cls  = { success:"alert-success", error:"alert-error",
                   info:"alert-info", warning:"alert-warning" };
    const icon = { success:"✓", error:"✕", info:"ℹ", warning:"⚠" };
    return (
        <div className={`alert ${cls[alert.type]}`}>
            {icon[alert.type]} {alert.msg}
        </div>
    );
}

function Spinner() {
    return <span className="spinner" />;
}

// ── RISK BANNER ──────────────────────────────────────────────
function RiskBanner({ decision, score }) {
    if (!decision || decision === "UNAVAILABLE") return null;

    const config = {
        APPROVE: {
            bg:     "var(--success-dim)",
            border: "rgba(92,184,122,0.3)",
            color:  "var(--success)",
            icon:   "✓",
            title:  "Your credit score looks good",
            msg:    "You have a strong repayment history. Keep it up!",
        },
        REVIEW: {
            bg:     "var(--warning-dim)",
            border: "rgba(232,168,58,0.3)",
            color:  "var(--warning)",
            icon:   "⚠",
            title:  "Your credit score needs attention",
            msg:    "Consider clearing pending payments to improve your score.",
        },
        DENY: {
            bg:     "var(--danger-dim)",
            border: "rgba(224,90,74,0.3)",
            color:  "var(--danger)",
            icon:   "✕",
            title:  "Your risk score is high",
            msg:    "Please clear your outstanding payments as soon as possible to normalize your credit score and regain access to credit.",
        },
    };

    const c = config[decision];
    if (!c) return null;

    return (
        <div style={{
            padding:"16px 18px", borderRadius:"10px",
            background: c.bg, border:`1px solid ${c.border}`,
            marginBottom:"1.25rem",
            display:"flex", alignItems:"flex-start", gap:"12px"
        }}>
            <div style={{
                width:"36px", height:"36px", borderRadius:"50%",
                background: c.border, border:`1px solid ${c.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"16px", color: c.color, flexShrink:0, fontWeight:700
            }}>
                {c.icon}
            </div>
            <div style={{ flex:1 }}>
                <div style={{
                    fontFamily:"var(--font-head)", fontWeight:700,
                    fontSize:"0.95rem", color: c.color, marginBottom:"4px"
                }}>
                    {c.title}
                </div>
                <div style={{
                    fontSize:"0.82rem", color:"var(--muted)", lineHeight:1.6
                }}>
                    {c.msg}
                </div>
                {score != null && (
                    <div style={{
                        marginTop:"8px", display:"flex",
                        alignItems:"center", gap:"10px"
                    }}>
                        <div style={{ flex:1, height:"6px", borderRadius:"3px",
                                      background:"var(--surface3)", overflow:"hidden" }}>
                            <div style={{
                                height:"100%", borderRadius:"3px",
                                width:`${Math.round(score * 100)}%`,
                                background: c.color, transition:"width 0.4s"
                            }}/>
                        </div>
                        <span style={{
                            fontFamily:"var(--font-mono)", fontSize:"0.75rem",
                            color: c.color, flexShrink:0
                        }}>
                            {Math.round(score * 100)}% risk
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── CREDIT TABLE ─────────────────────────────────────────────
function CreditTable({ credits, label, badgeClass, color }) {
    if (!credits?.length) return null;
    return (
        <div className="card" style={{ marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center",
                          gap:"8px", marginBottom:"0.75rem" }}>
                <div className="section-title">{label}</div>
                <span className={`badge ${badgeClass}`}>{credits.length}</span>
            </div>
            <div className="tbl-wrap">
                <table>
                    <thead><tr>
                        <th>Credit Code</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Items</th>
                        <th>Date</th>
                    </tr></thead>
                    <tbody>
                        {credits.map((c, i) => (
                            <tr key={i}>
                                <td className="mono"
                                    style={{ fontSize:"0.72rem", color:"var(--muted)" }}>
                                    {c.credit_code}
                                </td>
                                <td className="mono">
                                    ₹{Number(c.total_amount || 0)
                                        .toLocaleString("en-IN")}
                                </td>
                                <td className="mono" style={{ color:"var(--success)" }}>
                                    ₹{Number(c.amount_paid || 0)
                                        .toLocaleString("en-IN")}
                                </td>
                                <td className="mono" style={{ color }}>
                                    ₹{Number(c.remaining_amount || 0)
                                        .toLocaleString("en-IN")}
                                </td>
                                <td>
                                    <div style={{ display:"flex",
                                                  flexWrap:"wrap", gap:"4px" }}>
                                        {c.items?.map((item, j) => (
                                            <span key={j}
                                                className="badge badge-info"
                                                style={{ fontSize:"0.65rem" }}>
                                                {item.product_code} ×{item.quantity}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ color:"var(--muted)",
                                             fontSize:"0.78rem" }}>
                                    {c.issueDate || (c.createdAt
                                        ? new Date(c.createdAt)
                                            .toLocaleDateString("en-IN", {
                                                day:"2-digit", month:"short",
                                                year:"numeric"
                                            })
                                        : "—")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── MAIN DASHBOARD ───────────────────────────────────────────
export default function CustomerDashboard({ onLogout }) {
    const [alert, show]   = useAlert();
    const [customer, setCustomer] = useState(null);
    const [page, setPage] = useState("overview");

    // Business subscription
    const [businesses, setBusinesses]   = useState([]);
    const [bizCode, setBizCode]          = useState("");
    const [subscribing, setSubscribing]  = useState(false);

    // Branch selection
    const [branches, setBranches]         = useState([]);
    const [selectedBiz, setSelectedBiz]   = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchLoading, setBranchLoading] = useState(false);

    // Products
    const [products, setProducts]     = useState([]);
    const [productsLoading, setPL]    = useState(false);

    // Credits
    const [credits, setCredits]       = useState(null);
    const [creditsLoading, setCL]     = useState(false);

    // ── Load customer + subscriptions on mount ────────────────
    useEffect(() => {
        fetch(`${API}/customer-payload`, { headers: authHeader() })
            .then(r => r.json())
            .then(d => setCustomer(d?.customer_data || d?.data || d))
            .catch(() => {});

        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            const r = await fetch(`${API}/my-businesses`,
                { headers: authHeader() });
            const d = await r.json();
            setBusinesses(d?.businesses || []);
        } catch {}
    };

    // ── Subscribe to business ─────────────────────────────────
    const subscribeBusiness = async () => {
        if (!bizCode.trim()) {
            show("error", "Enter a business code"); return;
        }
        setSubscribing(true);
        try {
            const r = await fetch(`${API}/subscribe-new-business`, {
                method:  "POST",
                headers: authHeader(),
                body:    JSON.stringify({ business_code: bizCode.trim() }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            show("success", `Subscribed to ${bizCode.trim()}!`);
            setBizCode("");
            fetchBusinesses();
        } catch (e) { show("error", e.message); }
        finally { setSubscribing(false); }
    };

    // ── Load branches when business selected ─────────────────
    const selectBusiness = async (biz) => {
        setSelectedBiz(biz);
        setSelectedBranch(null);
        setBranches([]);
        setProducts([]);
        setCredits(null);
        setBranchLoading(true);
        try {
            const r = await fetch(
                `${API}/get-branches/${biz.business_code}`,
                { headers: authHeader() }
            );
            const d = await r.json();
            const list = d?.branch_data || [];
            setBranches(list);
            if (list.length > 0) {
                setSelectedBranch(list[0]);
            }
        } catch (e) { show("error", e.message); }
        finally { setBranchLoading(false); }
    };

    // ── Load products for branch ──────────────────────────────
    const fetchProducts = async (branch) => {
        if (!branch?._id) return;
        setPL(true);
        setProducts([]);
        try {
            const r = await fetch(
                `${API}/branch-products/${branch._id}`,
                { headers: authHeader() }
            );
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            setProducts(d?.products || []);
        } catch (e) { show("error", e.message); }
        finally { setPL(false); }
    };

    // ── Load credits for branch ───────────────────────────────
    const fetchCredits = async (branch) => {
        if (!branch?._id) return;
        setCL(true);
        setCredits(null);
        try {
            const r = await fetch(
                `${API}/my-credits/${branch._id}`,
                { headers: authHeader() }
            );
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            setCredits(d);
        } catch (e) { show("error", e.message); }
        finally { setCL(false); }
    };

    // ── When branch changes, reload data ─────────────────────
    useEffect(() => {
        if (!selectedBranch) return;
        if (page === "products") fetchProducts(selectedBranch);
        if (page === "credits")  fetchCredits(selectedBranch);
    }, [selectedBranch, page]);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        if (onLogout) onLogout();
        else window.location.reload();
    };

    const initials = customer?.customer_name
        ? customer.customer_name.split(" ")
            .map(w => w[0]).join("").slice(0,2).toUpperCase()
        : "CU";

    const NAV = [
        { key:"overview",  label:"Overview",  icon:"◈" },
        { key:"products",  label:"Products",  icon:"📦" },
        { key:"credits",   label:"My Credits", icon:"💳" },
    ];

    // CSS — reuse same design system as owner dashboard
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
            --bg:#0d0d0d;--surface:#161616;--surface2:#1f1f1f;--surface3:#252525;
            --border:#2a2a2a;--border2:#383838;
            --text:#f0ede8;--muted:#888784;--faint:#555350;
            --accent:#e8c97a;--accent-dim:rgba(232,201,122,0.1);
            --danger:#e05a4a;--danger-dim:rgba(224,90,74,0.1);
            --success:#5cb87a;--success-dim:rgba(92,184,122,0.1);
            --warning:#e8a83a;--warning-dim:rgba(232,168,58,0.1);
            --info:#4a90d9;--info-dim:rgba(74,144,217,0.1);
            --font-head:'Syne',sans-serif;
            --font-body:'DM Sans',sans-serif;
            --font-mono:'DM Mono',monospace;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}
        .shell{display:flex;min-height:100vh;}
        .sidebar{width:220px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
        .main{flex:1;overflow:auto;background:var(--bg);}
        .sb-logo{padding:1.25rem 1rem 1rem;display:flex;align-items:center;gap:9px;font-family:var(--font-head);font-size:1rem;font-weight:700;border-bottom:1px solid var(--border);}
        .sb-mark{width:28px;height:28px;background:var(--accent);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#0d0d0d;font-weight:800;flex-shrink:0;}
        .sb-section{padding:0.6rem 0.75rem 0.2rem;font-family:var(--font-mono);font-size:9px;color:var(--faint);letter-spacing:0.1em;text-transform:uppercase;}
        .sb-item{display:flex;align-items:center;gap:10px;padding:0.55rem 1rem;margin:1px 6px;border-radius:6px;cursor:pointer;font-size:0.83rem;color:var(--muted);border:none;background:transparent;width:calc(100% - 12px);text-align:left;transition:all 0.15s;font-family:var(--font-body);}
        .sb-item:hover{background:var(--surface2);color:var(--text);}
        .sb-item.active{background:var(--accent-dim);color:var(--accent);border-left:2px solid var(--accent);padding-left:calc(1rem - 2px);}
        .sb-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
        .sb-bottom{margin-top:auto;padding:1rem;border-top:1px solid var(--border);}
        .sb-user{display:flex;align-items:center;gap:9px;font-size:0.78rem;color:var(--muted);}
        .sb-avatar{width:30px;height:30px;border-radius:50%;background:var(--accent-dim);border:1px solid rgba(232,201,122,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent);font-weight:600;flex-shrink:0;}
        .sb-logout{margin-top:8px;width:100%;padding:7px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-family:var(--font-body);font-size:0.78rem;cursor:pointer;transition:all 0.15s;}
        .sb-logout:hover{border-color:var(--danger);color:var(--danger);}
        .topbar{padding:1rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface);position:sticky;top:0;z-index:10;}
        .topbar-title{font-family:var(--font-head);font-size:1.1rem;font-weight:700;}
        .topbar-sub{font-size:0.75rem;color:var(--muted);margin-top:2px;font-family:var(--font-mono);}
        .badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:10px;padding:3px 9px;border-radius:4px;letter-spacing:0.05em;}
        .badge-success{background:var(--success-dim);color:var(--success);border:1px solid rgba(92,184,122,0.2);}
        .badge-danger{background:var(--danger-dim);color:var(--danger);border:1px solid rgba(224,90,74,0.2);}
        .badge-warning{background:var(--warning-dim);color:var(--warning);border:1px solid rgba(232,168,58,0.2);}
        .badge-info{background:var(--info-dim);color:var(--info);border:1px solid rgba(74,144,217,0.2);}
        .badge-accent{background:var(--accent-dim);color:var(--accent);border:1px solid rgba(232,201,122,0.2);}
        .content{padding:1.5rem;}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;}
        .section-title{font-family:var(--font-head);font-size:1rem;font-weight:700;}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem;margin-bottom:1rem;}
        .card-sm{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem;}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:1.25rem;}
        .stat-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1rem;display:flex;flex-direction:column;gap:4px;}
        .stat-label{font-size:0.7rem;color:var(--muted);font-family:var(--font-mono);letter-spacing:0.05em;text-transform:uppercase;}
        .stat-value{font-family:var(--font-head);font-size:1.5rem;font-weight:700;color:var(--text);}
        .stat-sub{font-size:0.72rem;color:var(--faint);}
        .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:1rem;}
        .field{display:flex;flex-direction:column;gap:5px;}
        .field label{font-size:0.72rem;color:var(--muted);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;}
        .field input,.field select{padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font-body);font-size:0.85rem;outline:none;transition:border-color 0.15s;width:100%;}
        .field input:focus,.field select:focus{border-color:var(--accent);}
        .field input::placeholder{color:var(--faint);}
        .field select option{background:var(--surface2);}
        .btn{padding:8px 16px;border-radius:6px;font-family:var(--font-body);font-size:0.83rem;font-weight:500;cursor:pointer;transition:all 0.15s;border:none;display:inline-flex;align-items:center;gap:6px;}
        .btn-primary{background:var(--accent);color:#0d0d0d;font-weight:700;}
        .btn-primary:hover{opacity:0.88;}
        .btn-primary:disabled{opacity:0.4;cursor:not-allowed;}
        .btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);}
        .btn-ghost:hover{border-color:var(--border2);color:var(--text);}
        .btn-sm{padding:5px 11px;font-size:0.78rem;}
        .tbl-wrap{overflow-x:auto;border-radius:8px;border:1px solid var(--border);}
        table{width:100%;border-collapse:collapse;font-size:0.82rem;}
        thead{background:var(--surface2);}
        th{padding:10px 14px;text-align:left;font-family:var(--font-mono);font-size:0.7rem;color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;font-weight:500;border-bottom:1px solid var(--border);}
        td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:var(--surface2);}
        .mono{font-family:var(--font-mono);font-size:0.78rem;}
        .alert{padding:10px 14px;border-radius:7px;font-size:0.82rem;margin-bottom:1rem;display:flex;align-items:flex-start;gap:8px;line-height:1.5;}
        .alert-success{background:var(--success-dim);border:1px solid rgba(92,184,122,0.25);color:var(--success);}
        .alert-error{background:var(--danger-dim);border:1px solid rgba(224,90,74,0.25);color:var(--danger);}
        .alert-info{background:var(--info-dim);border:1px solid rgba(74,144,217,0.2);color:var(--info);}
        .alert-warning{background:var(--warning-dim);border:1px solid rgba(232,168,58,0.25);color:var(--warning);}
        .spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.15);border-top-color:currentColor;border-radius:50%;animation:spin 0.7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .pill-tabs{display:flex;gap:6px;margin-bottom:1.25rem;flex-wrap:wrap;}
        .pill{padding:5px 14px;border-radius:20px;font-size:0.78rem;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:var(--font-body);transition:all 0.15s;}
        .pill.active{background:var(--accent-dim);color:var(--accent);border-color:rgba(232,201,122,0.3);}
        .pill:hover:not(.active){border-color:var(--border2);color:var(--text);}
        .empty{text-align:center;padding:3rem 1rem;color:var(--muted);font-size:0.85rem;}
        .empty-icon{font-size:2rem;margin-bottom:0.75rem;opacity:0.4;}
        .biz-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:1rem;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:12px;}
        .biz-card:hover{border-color:var(--accent);background:var(--accent-dim2);}
        .biz-card.selected{border-color:var(--accent);background:var(--accent-dim);}
        @media(max-width:768px){.shell{flex-direction:column;}.sidebar{width:100%;height:auto;position:relative;}}
    `;

    const TITLES = {
        overview: ["Overview",   "Your account at a glance"],
        products: ["Products",   "Browse branch inventory"],
        credits:  ["My Credits", "Your credit history"],
    };

    const [title, sub] = TITLES[page] || ["Dashboard", ""];

    return (
        <>
            <style>{css}</style>
            <div className="shell">
                {/* ── SIDEBAR ── */}
                <aside className="sidebar">
                    <div className="sb-logo">
                        <div className="sb-mark">M</div>
                        MSME Hub
                    </div>

                    <div className="sb-section">Menu</div>
                    {NAV.map(item => (
                        <button key={item.key}
                            className={`sb-item${page === item.key ? " active" : ""}`}
                            onClick={() => setPage(item.key)}>
                            <span className="sb-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    <div className="sb-bottom">
                        <div className="sb-user">
                            <div className="sb-avatar">{initials}</div>
                            <div>
                                <div style={{ fontWeight:500, color:"var(--text)",
                                               fontSize:"0.8rem" }}>
                                    {customer?.customer_name || "Customer"}
                                </div>
                                <div style={{ fontSize:"0.7rem",
                                               fontFamily:"var(--font-mono)" }}>
                                    {customer?.customer_code || "—"}
                                </div>
                            </div>
                        </div>
                        <button className="sb-logout" onClick={logout}>
                            Sign out
                        </button>
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main className="main">
                    {/* Topbar */}
                    <div className="topbar">
                        <div>
                            <div className="topbar-title">{title}</div>
                            <div className="topbar-sub">{sub}</div>
                        </div>
                        <div style={{ display:"flex", gap:"10px",
                                      alignItems:"center" }}>
                            {/* Business selector */}
                            {businesses.length > 0 && (
                                <select
                                    value={selectedBiz?.business_code || ""}
                                    onChange={e => {
                                        const biz = businesses.find(
                                            b => b.business_code === e.target.value
                                        );
                                        if (biz) selectBusiness(biz);
                                    }}
                                    style={{
                                        background:"var(--surface2)",
                                        border:"1px solid var(--border)",
                                        borderRadius:"6px", color:"var(--text)",
                                        padding:"5px 10px", fontSize:"0.8rem",
                                        fontFamily:"var(--font-mono)", outline:"none"
                                    }}
                                >
                                    <option value="">Select business</option>
                                    {businesses.map(b => (
                                        <option key={b._id}
                                                value={b.business_code}>
                                            {b.business_code}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Branch selector */}
                            {branches.length > 0 && (
                                <select
                                    value={selectedBranch?._id || ""}
                                    onChange={e => {
                                        const br = branches.find(
                                            b => b._id === e.target.value
                                        );
                                        if (br) setSelectedBranch(br);
                                    }}
                                    style={{
                                        background:"var(--surface2)",
                                        border:"1px solid var(--border)",
                                        borderRadius:"6px", color:"var(--text)",
                                        padding:"5px 10px", fontSize:"0.8rem",
                                        fontFamily:"var(--font-mono)", outline:"none"
                                    }}
                                >
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id}>
                                            {b.branch_name} · {b.branch_code}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <span className="badge badge-info">● Customer</span>
                        </div>
                    </div>

                    <div className="content">
                        <Alert alert={alert} />

                        {/* ── OVERVIEW ── */}
                        {page === "overview" && (
                            <div>
                                {/* Customer info */}
                                <div className="stat-grid">
                                    {[
                                        { label:"Name",
                                          value: customer?.customer_name || "—" },
                                        { label:"Customer Code",
                                          value: customer?.customer_code || "—" },
                                        { label:"Email",
                                          value: customer?.customer_email || "—" },
                                        { label:"Phone",
                                          value: customer?.customer_phonenumber || "—" },
                                    ].map(s => (
                                        <div className="stat-card" key={s.label}>
                                            <span className="stat-label">{s.label}</span>
                                            <span className="stat-value"
                                                  style={{ fontSize:"0.9rem",
                                                           wordBreak:"break-all" }}>
                                                {s.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Subscribe to business */}
                                <div className="card" style={{ marginBottom:"1rem" }}>
                                    <div className="section-title"
                                         style={{ marginBottom:"0.75rem" }}>
                                        Subscribe to a Business
                                    </div>
                                    <div style={{ display:"flex", gap:"10px" }}>
                                        <input
                                            style={{
                                                flex:1, padding:"9px 12px",
                                                background:"var(--surface2)",
                                                border:"1px solid var(--border)",
                                                borderRadius:"6px",
                                                color:"var(--text)",
                                                fontFamily:"var(--font-body)",
                                                fontSize:"0.85rem", outline:"none"
                                            }}
                                            placeholder="Enter business code e.g. SUD1"
                                            value={bizCode}
                                            onChange={e => setBizCode(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === "Enter"
                                                && subscribeBusiness()}
                                        />
                                        <button className="btn btn-primary"
                                            onClick={subscribeBusiness}
                                            disabled={subscribing || !bizCode.trim()}>
                                            {subscribing ? <Spinner /> : "+"} Subscribe
                                        </button>
                                    </div>
                                </div>

                                {/* Subscribed businesses */}
                                {businesses.length > 0 ? (
                                    <div className="card">
                                        <div className="section-title"
                                             style={{ marginBottom:"0.75rem" }}>
                                            Your Businesses
                                            <span className="badge badge-accent"
                                                  style={{ marginLeft:"8px" }}>
                                                {businesses.length}
                                            </span>
                                        </div>
                                        <div style={{ display:"flex",
                                                      flexDirection:"column",
                                                      gap:"8px" }}>
                                            {businesses.map((biz, i) => (
                                                <div key={i}
                                                    className={`biz-card${selectedBiz?.business_code === biz.business_code ? " selected" : ""}`}
                                                    onClick={() => selectBusiness(biz)}>
                                                    <div style={{
                                                        width:"38px", height:"38px",
                                                        borderRadius:"8px",
                                                        background:"var(--accent-dim)",
                                                        border:"1px solid rgba(232,201,122,0.3)",
                                                        display:"flex",
                                                        alignItems:"center",
                                                        justifyContent:"center",
                                                        fontFamily:"var(--font-head)",
                                                        fontSize:"13px",
                                                        color:"var(--accent)",
                                                        fontWeight:700, flexShrink:0
                                                    }}>
                                                        {biz.business_code?.slice(0,2)}
                                                    </div>
                                                    <div style={{ flex:1 }}>
                                                        <div style={{ fontWeight:600,
                                                                       fontSize:"0.88rem" }}>
                                                            {biz.business_code}
                                                        </div>
                                                        <div style={{ fontSize:"0.72rem",
                                                                       color:"var(--muted)",
                                                                       marginTop:"2px",
                                                                       fontFamily:"var(--font-mono)" }}>
                                                            Enrolled:{" "}
                                                            {new Date(biz.enrolled_At)
                                                                .toLocaleDateString("en-IN")}
                                                        </div>
                                                    </div>
                                                    <span className="badge badge-success">
                                                        Active
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card">
                                        <div className="empty"
                                             style={{ padding:"2rem 1rem" }}>
                                            <div className="empty-icon">🏢</div>
                                            Not subscribed to any business yet.
                                            <div style={{ fontSize:"0.75rem",
                                                           marginTop:"8px",
                                                           color:"var(--faint)" }}>
                                                Enter a business code above to subscribe.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PRODUCTS ── */}
                        {page === "products" && (
                            <div>
                                {!selectedBranch ? (
                                    <div className="alert alert-warning">
                                        ⚠ Select a business and branch from the top bar.
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            display:"flex",
                                            justifyContent:"space-between",
                                            alignItems:"center",
                                            marginBottom:"1rem"
                                        }}>
                                            <div className="stat-label">
                                                {products.length} product
                                                {products.length !== 1 ? "s" : ""} available
                                            </div>
                                            <button className="btn btn-ghost btn-sm"
                                                onClick={() => fetchProducts(selectedBranch)}
                                                disabled={productsLoading}>
                                                {productsLoading ? <Spinner /> : "↻"} Refresh
                                            </button>
                                        </div>

                                        {productsLoading ? (
                                            <div className="empty">
                                                <Spinner /> Loading...
                                            </div>
                                        ) : products.length > 0 ? (
                                            <div className="tbl-wrap">
                                                <table>
                                                    <thead><tr>
                                                        <th>Product</th>
                                                        <th>Code</th>
                                                        <th>Price</th>
                                                        <th>Availability</th>
                                                    </tr></thead>
                                                    <tbody>
                                                        {products.map((p, i) => (
                                                            <tr key={i}>
                                                                <td style={{ fontWeight:500 }}>
                                                                    {p.product_name}
                                                                </td>
                                                                <td className="mono"
                                                                    style={{ color:"var(--muted)" }}>
                                                                    {p.product_code}
                                                                </td>
                                                                <td className="mono"
                                                                    style={{ color:"var(--accent)" }}>
                                                                    ₹{Number(p.selling_price)
                                                                        .toLocaleString("en-IN")}
                                                                </td>
                                                                <td>
                                                                    {p.quantity <= 0
                                                                        ? <span className="badge badge-danger">
                                                                            Out of stock
                                                                          </span>
                                                                        : p.quantity <= 10
                                                                        ? <span className="badge badge-warning">
                                                                            Low stock
                                                                          </span>
                                                                        : <span className="badge badge-success">
                                                                            Available
                                                                          </span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="empty">
                                                <div className="empty-icon">📦</div>
                                                No products in this branch.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── CREDITS ── */}
                        {page === "credits" && (
                            <div>
                                {!selectedBranch ? (
                                    <div className="alert alert-warning">
                                        ⚠ Select a business and branch from the top bar.
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            display:"flex",
                                            justifyContent:"flex-end",
                                            marginBottom:"1rem"
                                        }}>
                                            <button className="btn btn-ghost btn-sm"
                                                onClick={() => fetchCredits(selectedBranch)}
                                                disabled={creditsLoading}>
                                                {creditsLoading ? <Spinner /> : "↻"} Refresh
                                            </button>
                                        </div>

                                        {creditsLoading ? (
                                            <div className="empty">
                                                <Spinner /> Loading credits...
                                            </div>
                                        ) : credits ? (
                                            <>
                                                {/* Risk banner */}
                                                <RiskBanner
                                                    decision={credits.overall_decision}
                                                    score={credits.overall_risk}
                                                />

                                                {/* Summary stats */}
                                                <div className="stat-grid"
                                                     style={{ marginBottom:"1rem" }}>
                                                    {[
                                                        { label:"Total Credited",
                                                          value:`₹${Number(credits.total_credited || 0).toLocaleString("en-IN")}`,
                                                          color:"var(--text)" },
                                                        { label:"Outstanding",
                                                          value:`₹${Number(credits.total_outstanding || 0).toLocaleString("en-IN")}`,
                                                          color:"var(--danger)" },
                                                        { label:"Unsettled",
                                                          value: credits.unsettled_count ?? 0,
                                                          color:"var(--danger)" },
                                                        { label:"Partial",
                                                          value: credits.partial_count ?? 0,
                                                          color:"var(--warning)" },
                                                        { label:"Settled",
                                                          value: credits.settled_count ?? 0,
                                                          color:"var(--success)" },
                                                    ].map(s => (
                                                        <div className="stat-card"
                                                             key={s.label}>
                                                            <span className="stat-label">
                                                                {s.label}
                                                            </span>
                                                            <span className="stat-value"
                                                                  style={{ fontSize:"1.1rem",
                                                                           color: s.color }}>
                                                                {s.value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Credit tables */}
                                                <CreditTable
                                                    credits={credits.unsettled}
                                                    label="Unsettled"
                                                    badgeClass="badge-danger"
                                                    color="var(--danger)"
                                                />
                                                <CreditTable
                                                    credits={credits.partial}
                                                    label="Partially Settled"
                                                    badgeClass="badge-warning"
                                                    color="var(--warning)"
                                                />
                                                <CreditTable
                                                    credits={credits.settled}
                                                    label="Settled"
                                                    badgeClass="badge-success"
                                                    color="var(--success)"
                                                />

                                                {credits.unsettled_count === 0 &&
                                                 credits.partial_count   === 0 &&
                                                 credits.settled_count   === 0 && (
                                                    <div className="empty">
                                                        <div className="empty-icon">💳</div>
                                                        No credits found for this branch.
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="empty">
                                                <div className="empty-icon">💳</div>
                                                Select a branch to view credits.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}