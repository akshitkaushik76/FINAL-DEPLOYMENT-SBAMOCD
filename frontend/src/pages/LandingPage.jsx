import { useState } from "react";
import { useNavigate } from "react-router-dom";



const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0d;
    --surface: #161616;
    --surface2: #1f1f1f;
    --border: #2a2a2a;
    --border-hover: #3d3d3d;
    --text: #f0ede8;
    --muted: #888784;
    --accent: #e8c97a;
    --accent-dim: rgba(232,201,122,0.12);
    --accent-dim2: rgba(232,201,122,0.06);
    --danger: #e05a4a;
    --success: #5cb87a;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

  .page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* LEFT PANEL */
  .left {
    background: var(--bg);
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .left::before {
    content: '';
    position: absolute;
    top: -120px; left: -120px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(232,201,122,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-head);
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .logo-mark {
    width: 32px; height: 32px;
    background: var(--accent);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    color: #0d0d0d;
    font-weight: 800;
  }

  .hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3rem 0;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent);
    background: var(--accent-dim);
    border: 1px solid rgba(232,201,122,0.2);
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    width: fit-content;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .tag-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .hero h1 {
    font-family: var(--font-head);
    font-size: clamp(2.2rem, 3.5vw, 3.2rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 1.2rem;
    color: var(--text);
  }

  .hero h1 span {
    color: var(--accent);
  }

  .hero p {
    font-size: 0.95rem;
    color: var(--muted);
    line-height: 1.7;
    max-width: 400px;
    margin-bottom: 2.5rem;
  }

  .stats {
    display: flex;
    gap: 2rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-num {
    font-family: var(--font-head);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  .stat-divider {
    width: 1px;
    background: var(--border);
    align-self: stretch;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.82rem;
    color: var(--muted);
  }

  .feature-icon {
    width: 20px; height: 20px;
    border: 1px solid var(--border);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* RIGHT PANEL */
  .right {
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
  }

  .form-card {
    width: 100%;
    max-width: 420px;
  }

  .tab-row {
    display: flex;
    gap: 0;
    margin-bottom: 2rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .tab-btn {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: none;
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .tab-btn.active {
    background: var(--accent);
    color: #0d0d0d;
    font-weight: 600;
  }

  .tab-btn:not(.active):hover {
    background: var(--surface2);
    color: var(--text);
  }

  .form-title {
    font-family: var(--font-head);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.4rem;
    color: var(--text);
  }

  .form-sub {
    font-size: 0.82rem;
    color: var(--muted);
    margin-bottom: 1.75rem;
    line-height: 1.5;
  }

  .role-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 1.5rem;
  }

  .role-btn {
    flex: 1;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .role-btn.active {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent);
  }

  .role-btn:not(.active):hover {
    border-color: var(--border-hover);
    color: var(--text);
  }

  .role-icon { font-size: 18px; }
  .role-label { font-size: 11px; font-weight: 500; letter-spacing: 0.04em; font-family: var(--font-mono); }

  .field {
    margin-bottom: 1rem;
  }

  .field label {
    display: block;
    font-size: 0.78rem;
    color: var(--muted);
    margin-bottom: 6px;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .field input {
    width: 100%;
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.9rem;
    transition: border-color 0.2s;
    outline: none;
  }

  .field input:focus {
    border-color: var(--accent);
    background: var(--bg);
  }

  .field input::placeholder {
    color: #444;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .submit-btn {
    width: 100%;
    padding: 12px;
    background: var(--accent);
    color: #0d0d0d;
    border: none;
    border-radius: 6px;
    font-family: var(--font-head);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.01em;
  }

  .submit-btn:hover { opacity: 0.9; }
  .submit-btn:active { transform: scale(0.99); }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 1.25rem 0;
    color: var(--muted);
    font-size: 0.75rem;
    font-family: var(--font-mono);
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .footer-link {
    text-align: center;
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 1.25rem;
  }

  .footer-link a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
  }

  .footer-link a:hover { text-decoration: underline; }

  .alert {
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.82rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert.success {
    background: rgba(92,184,122,0.1);
    border: 1px solid rgba(92,184,122,0.3);
    color: var(--success);
  }

  .alert.error {
    background: rgba(224,90,74,0.1);
    border: 1px solid rgba(224,90,74,0.3);
    color: var(--danger);
  }

  .api-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--accent-dim2);
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 3px 8px;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(13,13,13,0.3);
    border-top-color: #0d0d0d;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .page { grid-template-columns: 1fr; }
    .left { display: none; }
  }
`;

const API_BASE = "http://localhost:9500/msme";

export default function LandingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "", email: "", password: "", confirm_password:"",phone: "", business_name: "", business_code: ""
  });

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const endpoint = role === "owner" ? "/login-owner" : "/login-customer";

    const payload =
      role === "owner"
        ? { emailid: loginForm.email, password: loginForm.password }
        : { customer_email: loginForm.email, password: loginForm.password };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    /* ✅ STORE AUTH */
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);

    /* ✅ REDIRECT */
    if (role === "owner") {
      navigate("/dashboard");
    } else {
      // optional (if you build customer UI later)
      navigate("/customer");
    }

  } catch (err) {
    showAlert("error", err.message);
  } finally {
    setLoading(false);
  }
};

//   const handleLogin = async (e) => {
//   e.preventDefault();
//   setLoading(true);

//   try {
//     const endpoint = role === "owner" ? "/login-owner" : "/login-customer";

//     // ✅ FIX: match backend field names
//     const payload =
//       role === "owner"
//         ? {
//             emailid: loginForm.email,
//             password: loginForm.password,
//           }
//         : {
//             customer_email: loginForm.email,
//             password: loginForm.password,
//           };

//     const res = await fetch(`${API_BASE}${endpoint}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const data = await res.json();

//     if (!res.ok) throw new Error(data.message || "Login failed");

//     if (data.token) {
//       localStorage.setItem("token", data.token);
//     }

//     showAlert("success", `Welcome back! Logged in as ${role}.`);
//   } catch (err) {
//     showAlert("error", err.message);
//   } finally {
//     setLoading(false);
//   }
// };
  // const handleRegister = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   try {
  //     const endpoint = role === "owner" ? "/register-owner" : "/register-customer";
  //     const res = await fetch(`${API_BASE}${endpoint}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(regForm),
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || "Registration failed");
  //     showAlert("success", "Account created! You can now log in.");
  //     setTab("login");
  //   } catch (err) {
  //     showAlert("error", err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const endpoint =
      role === "owner" ? "/register-owner" : "/register-customer";

    const payload =
      role === "owner"
        ? {
            owner_name: regForm.name,
            emailid: regForm.email,
            phone_number: regForm.phone,
            password: regForm.password,
            confirm_password: regForm.password, // same value required
          }
        : {
            customer_name: regForm.name,
            customer_email: regForm.email,
            customer_phonenumber: regForm.phone,
            password: regForm.password,
            confirm_password: regForm.password,
            business_code: regForm.business_code,
          };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Registration failed");

    showAlert("success", "Account created! You can now log in.");
    setTab("login");
  } catch (err) {
    showAlert("error", err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        {/* LEFT */}
        <div className="left">
          <div className="logo">
            <div className="logo-mark">M</div>
            MSME Hub
          </div>

          <div className="hero">
            <div className="tag">
              <div className="tag-dot" />
              Business Intelligence Platform
            </div>
            <h1>
              Run smarter.<br />
              Grow <span>faster.</span>
            </h1>
            <p>
              Full-stack MSME management — track branches, credits, inventory,
              sales, and ML-powered demand forecasting, all in one place.
            </p>
            <div className="stats">
              <div className="stat">
                <span className="stat-num">∞</span>
                <span className="stat-label">Branches</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">ML</span>
                <span className="stat-label">Forecasting</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>

          <div className="features">
            {[
              ["📊", "Branch profit & investment analytics"],
              ["💳", "Credit risk scoring with ML"],
              ["📦", "Demand forecasting & restock alerts"],
              ["🔒", "JWT-secured owner & customer auth"],
            ].map(([icon, label]) => (
              <div className="feature" key={label}>
                <div className="feature-icon">{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="form-card">
            <div className="api-badge">
              ◆ REST · {API_BASE}
            </div>

            <div className="tab-row">
              <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setAlert(null); }}>
                Sign In
              </button>
              <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setAlert(null); }}>
                Register
              </button>
            </div>

            <div className="form-title">
              {tab === "login" ? "Welcome back" : "Create account"}
            </div>
            <div className="form-sub">
              {tab === "login"
                ? "Sign in to your MSME Hub account to continue."
                : "Set up your account to get started with MSME Hub."}
            </div>

            {alert && (
              <div className={`alert ${alert.type}`}>
                {alert.type === "success" ? "✓" : "✕"} {alert.msg}
              </div>
            )}

            <div className="role-toggle">
              {["owner", "customer"].map((r) => (
                <button
                  key={r}
                  className={`role-btn ${role === r ? "active" : ""}`}
                  onClick={() => setRole(r)}
                >
                  <span className="role-icon">{r === "owner" ? "🏢" : "👤"}</span>
                  <span className="role-label">{r}</span>
                </button>
              ))}
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? "Signing in…" : `Sign in as ${role}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="field-row">
                  <div className="field">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765..."
                      value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
  <label>Confirm Password</label>
  <input
    type="password"
    placeholder="Re-enter password"
    value={regForm.confirm_password}
    onChange={e =>
      setRegForm({ ...regForm, confirm_password: e.target.value })
    }
    required
  />
</div>
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? "Creating account…" : `Register as ${role}`}
                </button>
              </form>
            )}

            <div className="footer-link">
              {tab === "login"
                ? <>Don't have an account? <a onClick={() => { setTab("register"); setAlert(null); }}>Register here</a></>
                : <>Already have an account? <a onClick={() => { setTab("login"); setAlert(null); }}>Sign in</a></>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}