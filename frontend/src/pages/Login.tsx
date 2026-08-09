import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <h1 style={{ display: 'flex', alignItems: 'center', margin: '0 0 40px 0' }}>
            <div style={{ width: '48px', height: '48px', overflow: 'hidden', position: 'relative', borderRadius: '6px' }}>
              <img src="https://idurar-prod.ams3.digitaloceanspaces.com/public/uploads/setting/cloud/idurar-app-large-3brl7.png" alt="Logo" style={{ position: 'absolute', top: 0, left: 0, height: '48px' }} />
            </div>
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#0056D2', marginLeft: '16px' }}>OpsFlow ERP</span>
          </h1>
          <h2>Manage Your Company With :</h2>
          
          <ul className="feature-list">
            <li>
              <h3>
                <svg width="20" height="20" fill="none" stroke="#0056D2" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                All In One Tool
              </h3>
              <p>Run And Scale Your Erp Crm Apps</p>
            </li>
            <li>
              <h3>
                <svg width="20" height="20" fill="none" stroke="#0056D2" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                Easily Add And Manage Your Services
              </h3>
              <p>It Brings Together Your Invoice Clients And Leads</p>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}
            
            <div className="form-group">
              <label>
                <span className="req">*</span> Email
              </label>
              <input 
                type="email" 
                placeholder="Email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>
                <span className="req">*</span> Password
              </label>
              <input 
                type="password" 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <div className="login-options">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', margin: 0 }}>
                <input type="checkbox" style={{ width: 'auto', margin: 0 }} /> Remember Me
              </label>
              <a href="#">Forgot Password</a>
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
            
            <div className="login-footer">
              Don't have an account? <a href="#">Register Now</a>
            </div>
            
            <div className="test-accounts" style={{ marginTop: '32px', padding: '16px', background: '#f8f9fc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Test Accounts (Password: opsflow2026)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Admin</span>
                  <strong>admin@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Sales</span>
                  <strong>sales@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Warehouse</span>
                  <strong>warehouse@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Accounts</span>
                  <strong>accounts@opsflow.com</strong>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
